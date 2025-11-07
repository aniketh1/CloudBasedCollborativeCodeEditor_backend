const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { connectDB: connectMongoDB } = require('./config/database');
const fileSystemService = require('./services/FileSystemService');
require('dotenv').config();

const app = express();

// MongoDB Connection (both Mongoose and native MongoDB driver)
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb+srv://aniketkorwa:colabDev@cluster0.e7xcg8n.mongodb.net/collaborative-editor?retryWrites=true&w=majority&appName=Cluster0";
    
    // Connect with Mongoose for file system
    await mongoose.connect(mongoURI);
    console.log('✅ Mongoose connected successfully');
    
    // Connect with native driver for projects
    await connectMongoDB();
    console.log('✅ Native MongoDB driver connected successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize database connection
connectDB();

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "https://cloud-based-collborative-code-editor.vercel.app",
  "https://collaborative-code-editor-frontend.vercel.app"
];

// Add environment-specific origins
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization",
    "Cache-Control",
    "cache-control",
    "If-None-Match",
    "if-none-match",
    "ETag",
    "etag"
  ],
  exposedHeaders: [
    "ETag",
    "etag",
    "Cache-Control",
    "cache-control"
  ],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests
app.use(express.json());

// Error handling middleware for JSON parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid JSON in request body' 
    });
  }
  next();
});

// API Routes
const filesystemRoutes = require('./routes/filesystem-mongo');
const projectRoutes = require('./routes/projects');
const roomRoutes = require('./routes/rooms');

app.use('/api/filesystem', filesystemRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/rooms', roomRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 404 handler for API routes - use regex pattern instead of wildcard
app.use(/^\/api\//, (req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint ${req.originalUrl} not found`
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Enhanced Socket.IO server for real-time collaboration
const activeRooms = new Map(); // roomId -> { users: Map, files: Map, fileEditors: Map }

io.on('connection', async (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  
  // Enhanced join-room handler with real user tracking
  socket.on('join-room', async (data) => {
    try {
      // Handle both old format (string) and new format (object with user data)
      let roomId, user;
      
      if (typeof data === 'string') {
        roomId = data;
        user = { id: socket.id, name: `User-${socket.id.slice(-4)}`, color: '#3b82f6' };
      } else if (data && data.roomId && data.user) {
        roomId = data.roomId;
        user = data.user;
      } else {
        socket.emit('error', { message: 'Invalid room data' });
        return;
      }

      console.log(`👥 User ${user.name} (${user.id}) joining room ${roomId}`);
      
      // Join socket room
      socket.join(roomId);
      
      // Store user info on socket
      socket.userId = user.id;
      socket.roomId = roomId;
      socket.user = user;
      
      // Initialize room if doesn't exist
      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, {
          users: new Map(),
          files: new Map(), // fileName -> { content, lastModified, version }
          fileEditors: new Map(), // fileName -> Set of userIds
          cursors: new Map() // userId -> { fileName, position, line, column }
        });
      }
      
      const room = activeRooms.get(roomId);
      
      // Add user to room
      room.users.set(user.id, {
        ...user,
        socketId: socket.id,
        joinedAt: Date.now()
      });
      
      // Send current room state to new user
      const roomUsers = Array.from(room.users.values());
      socket.emit('room-users', roomUsers);
      
      // Notify other users in room
      socket.to(roomId).emit('room-users', roomUsers);
      
      // Send file editors state
      const fileEditorsState = {};
      const editPermissions = {};
      room.fileEditors.forEach((editors, fileName) => {
        fileEditorsState[fileName] = Array.from(editors);
        editPermissions[fileName] = editors.size < 5;
      });
      
      socket.emit('file-editors', { fileEditors: fileEditorsState, editPermissions });
      
      console.log(`✅ Room ${roomId} now has ${room.users.size} users`);
      
    } catch (error) {
      console.error('❌ Error in join-room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Real-time code changes (character-by-character)
  socket.on('code-change', async (data) => {
    try {
      const { roomId, fileName, content, userId, user } = data;
      
      if (!roomId || !fileName || content === undefined || !userId) {
        return;
      }

      const room = activeRooms.get(roomId);
      if (!room) return;

      // Update file content
      room.files.set(fileName, {
        content,
        lastModified: Date.now(),
        lastModifiedBy: userId,
        version: (room.files.get(fileName)?.version || 0) + 1
      });

      // Broadcast to all other users in room (instant sync)
      socket.to(roomId).emit('code-update', {
        fileName,
        content,
        userId,
        user,
        timestamp: Date.now()
      });

      console.log(`📝 Code updated in ${roomId}/${fileName} by ${user.name} (length: ${content.length})`);
      
    } catch (error) {
      console.error('❌ Error in code-change:', error);
    }
  });

  // Cursor position tracking
  socket.on('cursor-change', async (data) => {
    try {
      const { roomId, fileName, position, line, column, userId, user } = data;
      
      if (!roomId || !fileName || !userId) return;

      const room = activeRooms.get(roomId);
      if (!room) return;

      // Update cursor position
      room.cursors.set(userId, {
        fileName,
        position,
        line,
        column,
        user,
        timestamp: Date.now()
      });

      // Broadcast cursor position to other users
      socket.to(roomId).emit('cursor-update', {
        fileName,
        position,
        line,
        column,
        userId,
        user,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('❌ Error in cursor-change:', error);
    }
  });

  // File edit permission requests
  socket.on('request-edit-permission', async (data) => {
    try {
      const { roomId, fileName, userId, user } = data;
      
      if (!roomId || !fileName || !userId) return;

      const room = activeRooms.get(roomId);
      if (!room) return;

      // Initialize file editors set if doesn't exist
      if (!room.fileEditors.has(fileName)) {
        room.fileEditors.set(fileName, new Set());
      }

      const editors = room.fileEditors.get(fileName);
      
      // Check if user can edit (max 5 editors per file)
      if (editors.size < 5 && !editors.has(userId)) {
        editors.add(userId);
        
        console.log(`✏️ User ${user.name} granted edit permission for ${fileName} (${editors.size}/5)`);
        
        // Broadcast updated file editors state
        const fileEditorsState = {};
        const editPermissions = {};
        room.fileEditors.forEach((eds, fname) => {
          fileEditorsState[fname] = Array.from(eds);
          editPermissions[fname] = eds.size < 5;
        });
        
        io.to(roomId).emit('file-editors', { fileEditors: fileEditorsState, editPermissions });
      } else {
        // Permission denied
        socket.emit('edit-permission-denied', { fileName, reason: 'Maximum editors reached' });
      }

    } catch (error) {
      console.error('❌ Error in request-edit-permission:', error);
    }
  });

  // Release edit permission
  socket.on('release-edit-permission', async (data) => {
    try {
      const { roomId, fileName, userId } = data;
      
      if (!roomId || !fileName || !userId) return;

      const room = activeRooms.get(roomId);
      if (!room) return;

      const editors = room.fileEditors.get(fileName);
      if (editors && editors.has(userId)) {
        editors.delete(userId);
        
        console.log(`📤 User ${userId} released edit permission for ${fileName}`);
        
        // Broadcast updated state
        const fileEditorsState = {};
        const editPermissions = {};
        room.fileEditors.forEach((eds, fname) => {
          fileEditorsState[fname] = Array.from(eds);
          editPermissions[fname] = eds.size < 5;
        });
        
        io.to(roomId).emit('file-editors', { fileEditors: fileEditorsState, editPermissions });
      }

    } catch (error) {
      console.error('❌ Error in release-edit-permission:', error);
    }
  });

  // Auto-save functionality
  socket.on('auto-save', async (data) => {
    try {
      const { roomId, fileName, content, userId } = data;
      
      if (!roomId || !fileName || content === undefined || !userId) return;

      const room = activeRooms.get(roomId);
      if (!room) return;

      // Save to memory (could extend to database/filesystem)
      room.files.set(fileName, {
        ...room.files.get(fileName),
        content,
        lastSaved: Date.now(),
        savedBy: userId
      });

      socket.emit('auto-save', { fileName, success: true, timestamp: Date.now() });
      
      console.log(`💾 Auto-saved ${fileName} in room ${roomId}`);

    } catch (error) {
      console.error('❌ Error in auto-save:', error);
      socket.emit('auto-save', { fileName: data.fileName, success: false, error: error.message });
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    try {
      const userId = socket.userId;
      const roomId = socket.roomId;
      
      if (!userId || !roomId) return;

      console.log(`🔌 User ${userId} disconnected from room ${roomId}`);
      
      const room = activeRooms.get(roomId);
      if (!room) return;

      // Remove user from room
      const user = room.users.get(userId);
      room.users.delete(userId);

      // Remove from all file editors
      room.fileEditors.forEach((editors, fileName) => {
        if (editors.has(userId)) {
          editors.delete(userId);
        }
      });

      // Remove cursor
      room.cursors.delete(userId);

      // Notify other users
      const remainingUsers = Array.from(room.users.values());
      socket.to(roomId).emit('room-users', remainingUsers);

      // Update file editors state
      const fileEditorsState = {};
      const editPermissions = {};
      room.fileEditors.forEach((eds, fname) => {
        fileEditorsState[fname] = Array.from(eds);
        editPermissions[fname] = eds.size < 5;
      });
      
      socket.to(roomId).emit('file-editors', { fileEditors: fileEditorsState, editPermissions });

      // Clean up empty room
      if (room.users.size === 0) {
        activeRooms.delete(roomId);
        console.log(`🗑️ Cleaned up empty room ${roomId}`);
      }

      if (user) {
        console.log(`👋 User ${user.name} left room ${roomId}`);
      }

    } catch (error) {
      console.error('❌ Error in disconnect:', error);
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Frontend URL: http://localhost:3000`);
  console.log(`🔌 Socket.IO ready for real-time collaboration`);
  console.log(`✨ Features: Character-level sync, Live cursors, Auto-save, 5-user limit`);
});