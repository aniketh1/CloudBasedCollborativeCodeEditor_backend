// backend/index.js

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { spawn } = require('child_process');
// Clerk integration commented out for now - will add later
// const { clerkMiddleware, requireAuth } = require('@clerk/clerk-sdk-node');
require('dotenv').config();

// Database connection
const { connectDB } = require('./config/database');

// Models (commented out temporarily to get basic server running)
// const User = require('./models/User');
// const Session = require('./models/Session');
// const Room = require('./models/Room');
const Project = require('./models/Project');
const RoomMember = require('./models/RoomMember');

// Services
const FileSystemService = require('./services/FileSystemService');

// Routes (commented out temporarily)
// const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const projectRoutes = require('./routes/projects');
const filesystemRoutes = require('./routes/filesystem');
const userRoutes = require('./routes/users');
const inviteRoutes = require('./routes/invites');

// Middleware (commented out temporarily)
// const { authenticateSocket, createRateLimit } = require('./middleware/auth');

const app = express();

// Initialize Clerk (commented out for now)
// app.use(clerkMiddleware());

// Middleware
const corsOptions = {
  origin: [
    process.env.CORS_ORIGIN || "http://localhost:3000",
    process.env.FRONTEND_URL || "https://cloud-based-collborative-code-editor.vercel.app",
    "https://cloud-based-collborative-code-editor.vercel.app",
    "http://localhost:3000", // For development
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (commented out temporarily)
// app.use('/api/auth/register', createRateLimit(15 * 60 * 1000, 5)); // 5 requests per 15 minutes
// app.use('/api/auth/login', createRateLimit(15 * 60 * 1000, 10)); // 10 requests per 15 minutes

// Routes (commented out temporarily)
// app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/filesystem', filesystemRoutes);
app.use('/api/users', userRoutes);
app.use('/api/invites', inviteRoutes);

// Health check endpoint (simplified)
app.get('/api/health', async (req, res) => {
  try {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Server is running'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Simple health check for Render monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      process.env.CORS_ORIGIN || "http://localhost:3000",
      process.env.FRONTEND_URL || "https://cloud-based-collborative-code-editor.vercel.app",
      "https://cloud-based-collborative-code-editor.vercel.app",
      "http://localhost:3000"
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Add these for better production performance
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB
  allowEIO3: true
});

// Store active room sessions (simplified structure)
const activeRooms = new Map(); // roomId -> { participants: Set, code: '', files: [], project: null }
const userSockets = new Map(); // userId -> socketId
const terminalSessions = new Map(); // socketId -> { process: childProcess, projectId: string, cwd: string }
// Enhanced collaboration tracking
const roomUsers = new Map(); // roomId -> Map(userId -> { name, avatar, color, lastSeen })
const userCursors = new Map(); // roomId -> Map(userId -> { line, column, selection })
const activeFiles = new Map(); // roomId -> Map(filePath -> { content, lastModified, editingUsers: Set })
const userPresence = new Map(); // userId -> { roomId, currentFile, isActive, lastActivity }

// Generate user colors for cursors
const userColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];
let colorIndex = 0;

// Helper function to assign user color
function assignUserColor() {
  const color = userColors[colorIndex % userColors.length];
  colorIndex++;
  return color;
}


// Helper function to get mock file content for demo purposes
function getMockFileContent(filePath) {
  const templates = {
    'src/App.jsx': `import React from 'react';
import './style.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Collab Dev!</h1>
        <p>This is a collaborative code editor.</p>
        <p>Start editing to see real-time collaboration in action.</p>
      </header>
    </div>
  );
}

export default App;`,
    
    'src/index.js': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,

    'src/style.css': `.App {
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.App-header {
  background-color: #282c34;
  padding: 40px;
  color: white;
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

p {
  font-size: 1.2rem;
  margin: 0.5rem 0;
}`,

    'public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Collaborative Code Editor" />
    <title>Collab Dev</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`,

    'package.json': `{
  "name": "collab-dev-project",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`,

    'README.md': `# Collab Dev Project

This is a collaborative coding project created with Collab Dev.

## Available Scripts

In the project directory, you can run:

### \`npm start\`

Runs the app in development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### \`npm test\`

Launches the test runner in interactive watch mode.

### \`npm run build\`

Builds the app for production to the \`build\` folder.

## Features

- Real-time collaborative editing
- Integrated terminal
- File explorer
- Syntax highlighting
- Live preview

Start editing any file to see the magic happen!`,

    'components/Navbar.jsx': `import React from 'react';

function Navbar() {
  return (
    <nav style={{ 
      padding: '1rem', 
      backgroundColor: '#282c34', 
      color: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <h2>Collab Dev</h2>
      <div>
        <button style={{ marginRight: '1rem' }}>Save</button>
        <button>Share</button>
      </div>
    </nav>
  );
}

export default Navbar;`,

    'components/Editor.jsx': `import React, { useState } from 'react';

function Editor() {
  const [code, setCode] = useState('// Start coding here...');

  return (
    <div style={{ padding: '1rem' }}>
      <h3>Code Editor</h3>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{
          width: '100%',
          height: '300px',
          fontFamily: 'monospace',
          fontSize: '14px',
          padding: '1rem',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}
      />
    </div>
  );
}

export default Editor;`
  };

  return templates[filePath] || `// ${filePath}
// This is a demo file in the collaborative editor
// Start editing to see real-time collaboration!

console.log('Hello from ${filePath}');`;
}

// Helper function to detect file language
function getFileLanguage(filePath) {
  const extension = filePath.split('.').pop()?.toLowerCase();
  const languageMap = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    css: 'css',
    html: 'html',
    json: 'json',
    md: 'markdown',
    txt: 'plaintext',
  };
  return languageMap[extension] || 'plaintext';
}

io.on('connection', async (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  
  // V2: Enhanced join-room handler with access validation
  socket.on('join-room', async (data) => {
    try {
      // Handle both string roomId and object formats
      let roomId, userId, userName;
      
      if (typeof data === 'string') {
        // Frontend sends just roomId as string
        roomId = data;
        userId = null;
        userName = null;
        console.log(`📝 V2: User ${socket.id} joining room ${roomId} (string format)`);
      } else if (typeof data === 'object' && data.roomId) {
        // Object format with roomId, userId, userName
        ({ roomId, userId, userName } = data);
        console.log(`📝 V2: User ${socket.id} (${userName}) joining room ${roomId} (object format)`);
      } else {
        console.error(`❌ V2: Invalid join-room data format:`, data);
        socket.emit('room-error', { error: 'Invalid room data format' });
        return;
      }
      
      // Validate room access if userId provided
      if (userId) {
        const accessInfo = await RoomMember.hasAccess(roomId, userId);
        if (!accessInfo.hasAccess) {
          console.log(`❌ V2: Access denied for user ${userId} to room ${roomId}`);
          socket.emit('room-error', { 
            error: 'Access denied. You do not have permission to join this room.',
            code: 'ACCESS_DENIED'
          });
          return;
        }
        console.log(`✅ V2: Access granted for user ${userId} as ${accessInfo.role}`);
      }
      
      // Join socket to room
      socket.join(roomId);
      
      // Store user info for this socket
      socket.userId = userId;
      socket.userName = userName;
      socket.roomId = roomId;
      
      // Try to find associated project
      let project = null;
      try {
        project = await Project.findByRoomId(roomId);
        console.log(`🔍 V2: Project lookup result:`, project ? `Found: ${project.name}` : 'Not found');
      } catch (error) {
        console.log(`⚠️ V2: No project found for room ${roomId}, creating basic room`);
      }
      
      // Initialize room if it doesn't exist
      if (!activeRooms.has(roomId)) {
        let initialFiles = [];
        let initialCode = '// Welcome to CodeDev V2!\n// This is a simpler, cleaner approach\n// Start coding...';
        
        if (project) {
          // Load actual project files recursively
          try {
            console.log(`📂 V2: Loading files for project: ${project.name} at ${project.localPath}`);
            initialFiles = await FileSystemService.getDirectoryStructureRecursive(project._id.toString());
            console.log(`📁 V2: Successfully loaded ${initialFiles.length} root items with full nested structure`);
            console.log(`📋 V2: File structure:`, JSON.stringify(initialFiles, null, 2));
            initialCode = `// Project: ${project.name}\n// Path: ${project.localPath}\n// Files loaded: ${initialFiles.length} (with nested contents)\n// Ready to code!`;
          } catch (error) {
            console.error('❌ V2: Error loading project files:', error);
            // Fallback to default structure
            initialFiles = [
              { 
                name: 'src', 
                type: 'directory', 
                path: 'src',
                children: [
                  { name: 'App.js', type: 'file', path: 'src/App.js' },
                  { name: 'index.js', type: 'file', path: 'src/index.js' },
                ]
              },
              { name: 'package.json', type: 'file', path: 'package.json' },
              { name: 'README.md', type: 'file', path: 'README.md' },
            ];
          }
        } else {
          // Default files for non-project rooms
          console.log(`📂 V2: No project found for room ${roomId}, using default file structure`);
          initialFiles = [
            { 
              name: 'src', 
              type: 'directory', 
              path: 'src',
              children: [
                { name: 'App.jsx', type: 'file', path: 'src/App.jsx' },
                { name: 'index.js', type: 'file', path: 'src/index.js' },
                { name: 'style.css', type: 'file', path: 'src/style.css' },
              ]
            },
            { 
              name: 'public', 
              type: 'directory', 
              path: 'public',
              children: [
                { name: 'index.html', type: 'file', path: 'public/index.html' },
                { name: 'favicon.ico', type: 'file', path: 'public/favicon.ico' },
              ]
            },
            { name: 'package.json', type: 'file', path: 'package.json' },
            { name: 'README.md', type: 'file', path: 'README.md' },
          ];
        }
        
        activeRooms.set(roomId, {
          participants: new Set(),
          code: initialCode,
          files: initialFiles,
          project: project
        });
        
        console.log(`🏠 V2: Room ${roomId} initialized with ${initialFiles.length} files`);
      }
      
      // Add user to room
      const room = activeRooms.get(roomId);
      room.participants.add(socket.id);
      
      // Update room users map for enhanced collaboration
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Map());
      }
      
      if (userId && userName) {
        roomUsers.get(roomId).set(userId, {
          name: userName,
          socketId: socket.id,
          lastSeen: new Date(),
          color: userColors[roomUsers.get(roomId).size % userColors.length]
        });
      }
      
      // Send ONLY the project-loaded event (no duplicates)
      console.log(`📤 V2: Sending project data to ${socket.id}:`);
      console.log(`  - Project: ${room.project ? room.project.name : 'none'}`);
      console.log(`  - Files: ${room.files.length} items`);
      console.log(`  - File names: ${room.files.map(f => f.name).join(', ')}`);
      
      socket.emit('project-loaded', {
        project: room.project,
        files: room.files
      });
      
      // Notify all participants about updated user list with enhanced data
      const participantList = Array.from(room.participants);
      const roomUsersList = roomUsers.has(roomId) ? 
        Array.from(roomUsers.get(roomId).values()) : [];
      
      io.to(roomId).emit('room-users', {
        participants: participantList,
        users: roomUsersList,
        totalUsers: roomUsersList.length
      });
      io.to(roomId).emit('update-user-list', participantList);
      
            io.to(roomId).emit('update-user-list', participantList);
      
      console.log(`✅ V2: User ${socket.id} joined room ${roomId}. Active participants: ${participantList.length}`);
    } catch (error) {
      console.error('❌ V2: Join room error:', error);
      socket.emit('room-error', { error: 'Failed to join room' });
    }
  });

  // Handle terminal session start with project context
  socket.on('start-terminal', async (data = {}) => {
    console.log(`🖥️  Starting terminal for socket: ${socket.id}`);
    
    try {
      const { roomId } = data;
      let workingDirectory = process.cwd();
      let projectId = null;
      let room = null;
      
      console.log(`🏠 Room ID: ${roomId}`);
      
      // Wait for room to be initialized if needed
      let attempts = 0;
      while (attempts < 10 && roomId && !activeRooms.has(roomId)) {
        console.log(`⏳ Waiting for room ${roomId} to be initialized (attempt ${attempts + 1})`);
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      // If room has a project, use project's local path as working directory
      if (roomId && activeRooms.has(roomId)) {
        room = activeRooms.get(roomId);
        if (room.project) {
          workingDirectory = room.project.localPath;
          projectId = room.project._id.toString();
        }
      }
      
      console.log(`📁 Terminal working directory: ${workingDirectory}`);
      console.log(`📂 Project path: ${room && room.project ? room.project.localPath : 'No project'}`);
      
      // Start a shell session using child_process - Try PowerShell for better Windows compatibility
      const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
      const terminalProcess = spawn(shell, process.platform === 'win32' ? ['-NoProfile', '-NoLogo'] : [], {
        cwd: workingDirectory,
        env: { ...process.env, FORCE_COLOR: '1' },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Store terminal session
      terminalSessions.set(socket.id, {
        process: terminalProcess,
        projectId: projectId,
        cwd: workingDirectory
      });

      // Send output to client
      terminalProcess.stdout.on('data', (data) => {
        console.log('📺 STDOUT data received:', data.toString());
        socket.emit('terminal-output', data.toString());
      });

      terminalProcess.stderr.on('data', (data) => {
        console.log('📺 STDERR data received:', data.toString());
        socket.emit('terminal-output', data.toString());
      });

      terminalProcess.on('close', (code) => {
        console.log('📺 Process closed with code:', code);
        socket.emit('terminal-output', `\r\nProcess exited with code ${code}\r\n`);
        terminalSessions.delete(socket.id);
      });

      terminalProcess.on('error', (error) => {
        console.error('📺 Terminal process error:', error);
        socket.emit('terminal-output', `Error: ${error.message}\r\n`);
      });

      socket.emit('terminal-ready', { 
        status: 'connected',
        message: 'Terminal is ready for commands',
        workingDirectory: workingDirectory,
        projectPath: room && room.project ? room.project.name : 'No project'
      });
      socket.emit('terminal-output', `Terminal ready! Working directory: ${workingDirectory}\r\n`);
      if (room && room.project) {
        socket.emit('terminal-output', `Project: ${room.project.name}\r\n`);
      }
      socket.emit('terminal-output', `Type your commands below:\r\n\r\n`);
    } catch (error) {
      console.error('Terminal start error:', error);
      socket.emit('terminal-output', 'Error starting terminal\r\n');
    }
  });

      // Receive input from client and write to shell
  socket.on('terminal-input', (input) => {
    console.log('📤 Terminal input received:', input);
    console.log('📤 Input type:', typeof input, 'Socket ID:', socket.id);
    const session = terminalSessions.get(socket.id);
    if (session && session.process && session.process.stdin.writable) {
      // Extract the actual data string from the input object
      let data = typeof input === 'object' ? input.data : input;
      
      // Additional PowerShell key handling
      if (data === '\x7F') {
        data = '\b'; // Convert DEL to Backspace for PowerShell
        console.log('🔄 Backend: Converted DEL to Backspace');
      }
      
      console.log('📝 Writing to terminal:', data, 'Code:', data.charCodeAt(0));
      session.process.stdin.write(data);
      
      // If it's Enter key, also flush
      if (data === '\r' || data === '\n') {
        console.log('🔄 Flushing stdin after Enter key');
        // Try to flush stdout as well
        setTimeout(() => {
          console.log('⏰ Checking for delayed output...');
        }, 100);
      }
    } else {
      console.log('❌ No terminal session or stdin not writable for socket:', socket.id);
      console.log('❌ Session exists:', !!session);
      if (session) {
        console.log('❌ Process exists:', !!session.process);
        console.log('❌ Stdin writable:', session.process?.stdin?.writable);
      }
    }
  });

  // Debug: Log all events being received
  socket.onAny((eventName, ...args) => {
    if (eventName !== 'join-room-v2' && eventName !== 'terminal-output') {
      console.log('🔍 Received event:', eventName, 'from socket:', socket.id);
    }
  });

  // Handle file operations with project integration
  socket.on('read-file', async (data) => {
    try {
      const { roomId, filePath } = data;
      console.log(`📄 Read file request: ${filePath} in room ${roomId}`);
      
      // CRITICAL: Wait for room to be established (fixes race condition)
      let attempts = 0;
      while (attempts < 5 && !activeRooms.has(roomId)) {
        console.log(`⏳ Waiting for room ${roomId} to be initialized (attempt ${attempts + 1})`);
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }
      
      if (!activeRooms.has(roomId)) {
        console.error(`❌ Room ${roomId} not found after waiting`);
        socket.emit('file-error', { error: 'Room not found' });
        return;
      }

      const room = activeRooms.get(roomId);
      
      if (room.project) {
        // Try to read actual project file
        try {
          console.log(`📝 Reading project file: ${filePath}`);
          const fileData = await FileSystemService.readFile(room.project._id.toString(), filePath);
          socket.emit('file-content', {
            path: filePath,
            content: fileData.content,
            language: FileSystemService.getFileLanguage(filePath)
          });
        } catch (error) {
          console.error('Read file error:', error);
          socket.emit('file-error', { error: error.message });
        }
      } else {
        // For demo/non-project rooms, return mock content
        console.log(`📝 Returning mock content for: ${filePath}`);
        const mockContent = getMockFileContent(filePath);
        socket.emit('file-content', {
          path: filePath,
          content: mockContent,
          language: getFileLanguage(filePath)
        });
      }
    } catch (error) {
      console.error('Read file error:', error);
      socket.emit('file-error', { error: error.message });
    }
  });

  // Handle folder content requests
  socket.on('read-folder', async (data) => {
    try {
      const { roomId, folderPath } = data;
      console.log('📁 V2: Read folder request:', { roomId, folderPath });
      
      // CRITICAL: Wait for room to be established (fixes race condition)
      let attempts = 0;
      while (attempts < 5 && !activeRooms.has(roomId)) {
        console.log(`⏳ V2: Waiting for room ${roomId} to be initialized (attempt ${attempts + 1})`);
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }
      
      if (!activeRooms.has(roomId)) {
        console.error(`❌ V2: Room ${roomId} not found after waiting`);
        socket.emit('folder-error', { error: 'Room not found' });
        return;
      }

      const room = activeRooms.get(roomId);
      
      if (room.project) {
        try {
          const folderContents = await FileSystemService.readFolder(room.project._id.toString(), folderPath);
          console.log('📁 V2: Folder contents loaded:', folderPath, folderContents.length, 'items');
          socket.emit('folder-content', {
            path: folderPath,
            children: folderContents
          });
        } catch (error) {
          console.error('📁 V2: Read folder error:', error);
          socket.emit('folder-error', { error: error.message });
        }
      } else {
        // For demo/non-project rooms, return empty
        console.log('📁 V2: Returning empty folder for demo room');
        socket.emit('folder-content', {
          path: folderPath,
          children: []
        });
      }
    } catch (error) {
      console.error('📁 V2: Read folder error:', error);
      socket.emit('folder-error', { error: error.message });
    }
  });

  socket.on('write-file', async (data) => {
    try {
      const { roomId, filePath, content } = data;
      console.log(`💾 Write file request: ${filePath} in room ${roomId}`);
      
      // CRITICAL: Wait for room to be established (fixes race condition)
      let attempts = 0;
      while (attempts < 5 && !activeRooms.has(roomId)) {
        console.log(`⏳ Waiting for room ${roomId} to be initialized (attempt ${attempts + 1})`);
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }
      
      if (!activeRooms.has(roomId)) {
        console.error(`❌ Room ${roomId} not found after waiting`);
        socket.emit('file-error', { error: 'Room not found' });
        return;
      }

      const room = activeRooms.get(roomId);
      if (!room.project) {
        console.log(`✅ Successfully wrote file: ${filePath} (demo mode)`);
        // Broadcast file change to all participants in demo mode
        socket.to(roomId).emit('file-updated', { filePath, content });
        socket.emit('file-saved', { filePath });
        return;
      }

      await FileSystemService.writeFile(room.project._id.toString(), filePath, content);
      console.log(`✅ Successfully wrote file: ${filePath}`);
      
      // Broadcast file change to all participants
      socket.to(roomId).emit('file-updated', { filePath, content });
      
      socket.emit('file-saved', { filePath });
    } catch (error) {
      console.error('Write file error:', error);
      socket.emit('file-error', { error: error.message });
    }
  });

  socket.on('refresh-files', async (data) => {
    try {
      const { roomId } = data;
      console.log(`📁 Refresh files request for room: ${roomId}`);
      
      // CRITICAL: Wait for room to be established (fixes race condition)
      let attempts = 0;
      while (attempts < 5 && !activeRooms.has(roomId)) {
        console.log(`⏳ Waiting for room ${roomId} to be initialized (attempt ${attempts + 1})`);
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }
      
      if (!activeRooms.has(roomId)) {
        console.error(`❌ Room ${roomId} not found after waiting`);
        socket.emit('file-error', { error: 'Room not found' });
        return;
      }

      const room = activeRooms.get(roomId);
      if (!room.project) {
        console.log('📁 Returning current file structure for demo room');
        socket.emit('project-loaded', {
          project: room.project,
          files: room.files
        });
        return;
      }

      const files = await FileSystemService.getDirectoryStructureRecursive(room.project._id.toString());
      room.files = files;
      
      // Broadcast updated file structure to all participants
      io.to(roomId).emit('file-structure-update', files);
    } catch (error) {
      console.error('Refresh files error:', error);
      socket.emit('file-error', { error: error.message });
    }
  });

  // Handle code changes
  socket.on('code-change', ({ roomId, code }) => {
    if (activeRooms.has(roomId)) {
      // Update room's code
      activeRooms.get(roomId).code = code;
      
      // Broadcast to other users in the room
      socket.to(roomId).emit('code-update', code);
    }
  });

  // Enhanced collaboration events for real-time coding
  
  // Handle user joining with identity
  socket.on('user-join', ({ roomId, userId, userName, userAvatar }) => {
    console.log(`��� User ${userName} (${userId}) joining room ${roomId}`);
    
    // Initialize room users if not exists
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Map());
    }
    
    const userColor = assignUserColor();
    const userData = {
      id: userId,
      name: userName || `User${userId.slice(-4)}`,
      avatar: userAvatar || `https://ui-avatars.com/api/?name=${userName || 'User'}&background=random`,
      color: userColor,
      socketId: socket.id,
      lastSeen: Date.now(),
      isActive: true
    };
    
    // Store user data
    roomUsers.get(roomId).set(userId, userData);
    userPresence.set(userId, { roomId, currentFile: null, isActive: true, lastActivity: Date.now() });
    
    // Initialize cursor tracking for this room
    if (!userCursors.has(roomId)) {
      userCursors.set(roomId, new Map());
    }
    
    // Notify other users in room about new user
    socket.to(roomId).emit('user-joined', userData);
    
    // Send current room users to the joining user
    const roomUsersList = Array.from(roomUsers.get(roomId).values());
    socket.emit('room-users', roomUsersList);
    
    console.log(`✅ ${userName} joined room ${roomId} with color ${userColor}`);
  });

  // Handle user heartbeat for presence management
  socket.on('user-heartbeat', (data) => {
    const { roomId, userId } = data;
    console.log(`💗 Heartbeat from user ${userId} in room ${roomId}`);
    
    if (userPresence.has(userId)) {
      userPresence.get(userId).lastActivity = Date.now();
      userPresence.get(userId).isActive = true;
    }
    
    if (roomUsers.has(roomId) && roomUsers.get(roomId).has(userId)) {
      roomUsers.get(roomId).get(userId).lastSeen = Date.now();
      roomUsers.get(roomId).get(userId).isActive = true;
    }
    
    // Broadcast heartbeat response to room
    socket.to(roomId).emit('user-heartbeat-response', {
      userId,
      timestamp: Date.now(),
      isActive: true
    });
  });

  // Handle user leaving
  socket.on('user-leave', (data) => {
    const { roomId, userId } = data;
    console.log(`👋 User ${userId} leaving room ${roomId}`);
    
    // Update user presence
    if (userPresence.has(userId)) {
      userPresence.get(userId).isActive = false;
    }
    
    // Update room users
    if (roomUsers.has(roomId) && roomUsers.get(roomId).has(userId)) {
      roomUsers.get(roomId).get(userId).isActive = false;
      roomUsers.get(roomId).get(userId).lastSeen = Date.now();
    }
    
    // Notify other users
    socket.to(roomId).emit('user-left', {
      userId,
      timestamp: Date.now()
    });
  });

  // Handle cursor position updates
  socket.on('cursor-position', ({ roomId, userId, filePath, position, selection }) => {
    if (!userCursors.has(roomId)) {
      userCursors.set(roomId, new Map());
    }
    
    const cursorData = {
      userId,
      filePath,
      position, // { line, column }
      selection, // { start: { line, column }, end: { line, column } }
      timestamp: Date.now()
    };
    
    userCursors.get(roomId).set(userId, cursorData);
    
    // Broadcast cursor position to other users
    socket.to(roomId).emit('cursor-update', cursorData);
    
    // Update user presence
    if (userPresence.has(userId)) {
      userPresence.get(userId).currentFile = filePath;
      userPresence.get(userId).lastActivity = Date.now();
    }
  });

  // Handle collaborative code changes with operational transform
  socket.on('code-operation', ({ roomId, userId, filePath, operation, position, content }) => {
    console.log(`��� Code operation from ${userId} in ${filePath}: ${operation}`);
    
    if (!activeFiles.has(roomId)) {
      activeFiles.set(roomId, new Map());
    }
    
    // Track file editing
    if (!activeFiles.get(roomId).has(filePath)) {
      activeFiles.get(roomId).set(filePath, {
        content: '',
        lastModified: Date.now(),
        editingUsers: new Set()
      });
    }
    
    const fileData = activeFiles.get(roomId).get(filePath);
    fileData.editingUsers.add(userId);
    fileData.lastModified = Date.now();
    
    // Get user name from presence data
    const userName = userPresence.has(userId) ? userPresence.get(userId).name : userId;
    
    const operationData = {
      userId,
      userName,
      filePath,
      operation, // 'insert', 'delete', 'replace'
      position,
      content,
      timestamp: Date.now()
    };
    
    // Broadcast operation to other users
    socket.to(roomId).emit('code-operation', operationData);
    
    // Update room code if it's the main file
    if (activeRooms.has(roomId)) {
      const room = activeRooms.get(roomId);
      if (room.currentFile === filePath || !room.currentFile) {
        room.code = content;
        room.currentFile = filePath;
      }
    }
  });

  // Handle file selection changes
  socket.on('file-selected', ({ roomId, userId, filePath }) => {
    console.log(`��� ${userId} selected file: ${filePath}`);
    
    // Update user presence
    if (userPresence.has(userId)) {
      userPresence.get(userId).currentFile = filePath;
      userPresence.get(userId).lastActivity = Date.now();
    }
    
    // Notify other users about file selection
    socket.to(roomId).emit('user-file-selected', { userId, filePath });
  });

  // Enhanced typing indicators with user information
  socket.on('typing-start', ({ roomId, userId, userName, filePath }) => {
    socket.to(roomId).emit('user-typing', { 
      userId, 
      userName, 
      filePath, 
      type: 'typing-start',
      timestamp: Date.now()
    });
  });

  socket.on('typing-stop', ({ roomId, userId, userName, filePath }) => {
    socket.to(roomId).emit('user-typing', { 
      userId, 
      userName, 
      filePath, 
      type: 'typing-stop',
      timestamp: Date.now()
    });
  });

  // Handle user going away/coming back
  socket.on('user-away', ({ roomId, userId }) => {
    if (roomUsers.has(roomId) && roomUsers.get(roomId).has(userId)) {
      roomUsers.get(roomId).get(userId).isActive = false;
      socket.to(roomId).emit('user-status-changed', { userId, isActive: false });
    }
  });

  socket.on('user-back', ({ roomId, userId }) => {
    if (roomUsers.has(roomId) && roomUsers.get(roomId).has(userId)) {
      roomUsers.get(roomId).get(userId).isActive = true;
      roomUsers.get(roomId).get(userId).lastSeen = Date.now();
      socket.to(roomId).emit('user-status-changed', { userId, isActive: true });
    }
  });


  // Handle file structure changes (for non-project rooms)
  socket.on('file-structure-change', ({ roomId, files }) => {
    if (activeRooms.has(roomId)) {
      const room = activeRooms.get(roomId);
      if (!room.project) { // Only allow manual file structure changes for non-project rooms
        room.files = files;
        socket.to(roomId).emit('file-structure-update', files);
      }
    }
  });

  // Handle real-time file updates with content persistence
  socket.on('file-updated', (data) => {
    const { roomId, filePath, content, userId, userName } = data;
    
    console.log(`📝 File updated: ${filePath} by ${userName}`);
    
    // Store latest file content in active files map
    if (!activeFiles.has(roomId)) {
      activeFiles.set(roomId, new Map());
    }
    
    activeFiles.get(roomId).set(filePath, {
      content,
      lastModified: Date.now(),
      editingUsers: new Set([userId])
    });
    
    // Broadcast to all other users in the room
    socket.to(roomId).emit('file-updated', {
      filePath,
      content,
      userId,
      userName,
      timestamp: Date.now()
    });
  });

  // Handle project structure updates (files/folders added/deleted)
  socket.on('project-structure-updated', (data) => {
    const { roomId, fileTree, deletedFiles, userId, userName, operation } = data;
    
    console.log(`🏗️ Project structure updated by ${userName}: ${operation}`);
    
    // Update room file structure
    if (activeRooms.has(roomId)) {
      const room = activeRooms.get(roomId);
      room.files = fileTree;
    }
    
    // Broadcast to all other users in the room
    socket.to(roomId).emit('project-structure-updated', {
      fileTree,
      deletedFiles: deletedFiles || [],
      userId,
      userName,
      operation, // 'create', 'delete', 'rename', 'move'
      timestamp: Date.now()
    });
  });

  // ================== ENHANCED COLLABORATIVE FEATURES ==================
  
  // Real-time content synchronization (without saving)
  socket.on('realtime-content-sync', ({ roomId, userId, filePath, content, selection, cursor, userName }) => {
    console.log(`🔄 Real-time content sync from ${userName || userId} in ${filePath} (${content?.length || 0} chars)`);
    
    // Immediate broadcast without waiting - speed is crucial for real-time collaboration
    if (activeRooms.has(roomId)) {
      // Track real-time content
      if (!activeFiles.has(roomId)) {
        activeFiles.set(roomId, new Map());
      }
      
      if (!activeFiles.get(roomId).has(filePath)) {
        activeFiles.get(roomId).set(filePath, {
          content: '',
          lastModified: Date.now(),
          editingUsers: new Set()
        });
      }
      
      const fileData = activeFiles.get(roomId).get(filePath);
      fileData.content = content;
      fileData.editingUsers.add(userId);
      fileData.lastModified = Date.now();
      
      // Get user name
      const roomUser = roomUsers.has(roomId) && roomUsers.get(roomId).has(userId) 
        ? roomUsers.get(roomId).get(userId) 
        : null;
      const finalUserName = userName || roomUser?.name || 
                           (userPresence.has(userId) ? userPresence.get(userId).name : userId);
      
      // IMMEDIATE broadcast to all other users in the room
      console.log(`📡 Broadcasting real-time content to room ${roomId} (excluding ${userId})`);
      socket.to(roomId).emit('realtime-content-sync', {
        userId,
        userName: finalUserName,
        filePath,
        content,
        selection,
        cursor,
        timestamp: Date.now()
      });
    } else {
      console.warn(`⚠️ Room ${roomId} not active for real-time sync`);
    }
  });

  // Enhanced typing indicators with line information
  socket.on('enhanced-typing-start', ({ roomId, userId, userName, filePath, lineNumber, position }) => {
    console.log(`⌨️ ${userName} started typing at line ${lineNumber} in ${filePath}`);
    
    socket.to(roomId).emit('user-enhanced-typing', { 
      userId, 
      userName, 
      filePath, 
      lineNumber,
      position,
      type: 'typing-start',
      timestamp: Date.now()
    });
  });

  socket.on('enhanced-typing-stop', ({ roomId, userId, userName, filePath }) => {
    console.log(`⌨️ ${userName} stopped typing in ${filePath}`);
    
    socket.to(roomId).emit('user-enhanced-typing', { 
      userId, 
      userName, 
      filePath, 
      type: 'typing-stop',
      timestamp: Date.now()
    });
  });

  // File operation handlers for CRUD operations
  socket.on('create-file', async ({ roomId, filePath, initialContent = '' }) => {
    console.log(`📄 Creating file: ${filePath} in room ${roomId}`);
    
    // Wait for room to be established
    let attempts = 0;
    while (attempts < 5 && !activeRooms.has(roomId)) {
      console.log(`⏳ Waiting for room ${roomId} for file creation (attempt ${attempts + 1})`);
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }
    
    if (!activeRooms.has(roomId)) {
      console.error(`❌ Room ${roomId} not found for file creation`);
      socket.emit('file-operation-error', { error: 'Room not found' });
      return;
    }

    try {
      const room = activeRooms.get(roomId);
      
      if (!room.project) {
        // Demo mode - just update files array
        socket.emit('file-created', { filePath, success: true });
        socket.to(roomId).emit('file-created', { filePath, success: true });
      } else {
        // Real project - use FileSystemService
        await FileSystemService.writeFile(room.project._id.toString(), filePath, initialContent);
        console.log(`✅ File created: ${filePath}`);
        
        // Update file tree
        const updatedFiles = await FileSystemService.getDirectoryStructureRecursive(room.project._id.toString());
        room.files = updatedFiles;
        
        // Broadcast file creation
        socket.emit('file-created', { filePath, success: true });
        socket.to(roomId).emit('file-structure-update', updatedFiles);
      }
    } catch (error) {
      console.error(`❌ File creation error for ${filePath}:`, error);
      socket.emit('file-operation-error', { error: error.message, operation: 'create-file' });
    }
  });

  socket.on('create-folder', async ({ roomId, folderPath }) => {
    console.log(`📁 Creating folder: ${folderPath} in room ${roomId}`);
    
    // Wait for room to be established
    let attempts = 0;
    while (attempts < 5 && !activeRooms.has(roomId)) {
      console.log(`⏳ Waiting for room ${roomId} for folder creation (attempt ${attempts + 1})`);
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }
    
    if (!activeRooms.has(roomId)) {
      console.error(`❌ Room ${roomId} not found for folder creation`);
      socket.emit('file-operation-error', { error: 'Room not found' });
      return;
    }

    try {
      const room = activeRooms.get(roomId);
      
      if (!room.project) {
        // Demo mode - just update files array
        socket.emit('folder-created', { folderPath, success: true });
        socket.to(roomId).emit('folder-created', { folderPath, success: true });
      } else {
        // Real project - use FileSystemService
        await FileSystemService.createDirectory(room.project._id.toString(), folderPath);
        console.log(`✅ Folder created: ${folderPath}`);
        
        // Update file tree
        const updatedFiles = await FileSystemService.getDirectoryStructureRecursive(room.project._id.toString());
        room.files = updatedFiles;
        
        // Broadcast folder creation
        socket.emit('folder-created', { folderPath, success: true });
        socket.to(roomId).emit('file-structure-update', updatedFiles);
      }
    } catch (error) {
      console.error(`❌ Folder creation error for ${folderPath}:`, error);
      socket.emit('file-operation-error', { error: error.message, operation: 'create-folder' });
    }
  });

  socket.on('delete-file', async ({ roomId, filePath }) => {
    console.log(`🗑️ Deleting file: ${filePath} in room ${roomId}`);
    
    // Wait for room to be established
    let attempts = 0;
    while (attempts < 5 && !activeRooms.has(roomId)) {
      console.log(`⏳ Waiting for room ${roomId} for file deletion (attempt ${attempts + 1})`);
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }
    
    if (!activeRooms.has(roomId)) {
      console.error(`❌ Room ${roomId} not found for file deletion`);
      socket.emit('file-operation-error', { error: 'Room not found' });
      return;
    }

    try {
      const room = activeRooms.get(roomId);
      
      if (!room.project) {
        // Demo mode - just update files array
        socket.emit('file-deleted', { filePath, success: true });
        socket.to(roomId).emit('file-deleted', { filePath, success: true });
      } else {
        // Real project - use FileSystemService
        await FileSystemService.deleteFile(room.project._id.toString(), filePath);
        console.log(`✅ File deleted: ${filePath}`);
        
        // Update file tree
        const updatedFiles = await FileSystemService.getDirectoryStructureRecursive(room.project._id.toString());
        room.files = updatedFiles;
        
        // Broadcast file deletion
        socket.emit('file-deleted', { filePath, success: true });
        socket.to(roomId).emit('file-structure-update', updatedFiles);
      }
    } catch (error) {
      console.error(`❌ File deletion error for ${filePath}:`, error);
      socket.emit('file-operation-error', { error: error.message, operation: 'delete-file' });
    }
  });

  socket.on('delete-folder', async ({ roomId, folderPath }) => {
    console.log(`🗑️ Deleting folder: ${folderPath} in room ${roomId}`);
    
    // Wait for room to be established
    let attempts = 0;
    while (attempts < 5 && !activeRooms.has(roomId)) {
      console.log(`⏳ Waiting for room ${roomId} for folder deletion (attempt ${attempts + 1})`);
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }
    
    if (!activeRooms.has(roomId)) {
      console.error(`❌ Room ${roomId} not found for folder deletion`);
      socket.emit('file-operation-error', { error: 'Room not found' });
      return;
    }

    try {
      const room = activeRooms.get(roomId);
      
      if (!room.project) {
        // Demo mode - just update files array
        socket.emit('folder-deleted', { folderPath, success: true });
        socket.to(roomId).emit('folder-deleted', { folderPath, success: true });
      } else {
        // Real project - use FileSystemService
        await FileSystemService.deleteDirectory(room.project._id.toString(), folderPath);
        console.log(`✅ Folder deleted: ${folderPath}`);
        
        // Update file tree
        const updatedFiles = await FileSystemService.getDirectoryStructureRecursive(room.project._id.toString());
        room.files = updatedFiles;
        
        // Broadcast folder deletion
        socket.emit('folder-deleted', { folderPath, success: true });
        socket.to(roomId).emit('file-structure-update', updatedFiles);
      }
    } catch (error) {
      console.error(`❌ Folder deletion error for ${folderPath}:`, error);
      socket.emit('file-operation-error', { error: error.message, operation: 'delete-folder' });
    }
  });

  // ================== END ENHANCED FEATURES ==================

  // Handle resize event (simplified - no actual resize for child_process)
  socket.on('resize', ({ cols, rows }) => {
    console.log(`Terminal resize requested: ${cols}x${rows}`);
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);

    // Clean up terminal process
    const session = terminalSessions.get(socket.id);
    if (session && session.process) {
      session.process.kill();
      terminalSessions.delete(socket.id);
    }

    // Find and clean up user collaboration data
    let disconnectedUserId = null;
    let disconnectedRoomId = null;
    
    // Find user by socket ID
    for (const [roomId, users] of roomUsers.entries()) {
      for (const [userId, userData] of users.entries()) {
        if (userData.socketId === socket.id) {
          disconnectedUserId = userId;
          disconnectedRoomId = roomId;
          break;
        }
      }
      if (disconnectedUserId) break;
    }

    // Clean up collaboration data
    if (disconnectedUserId && disconnectedRoomId) {
      // Remove from room users
      if (roomUsers.has(disconnectedRoomId)) {
        roomUsers.get(disconnectedRoomId).delete(disconnectedUserId);
        if (roomUsers.get(disconnectedRoomId).size === 0) {
          roomUsers.delete(disconnectedRoomId);
        }
      }
      
      // Remove cursor data
      if (userCursors.has(disconnectedRoomId)) {
        userCursors.get(disconnectedRoomId).delete(disconnectedUserId);
        if (userCursors.get(disconnectedRoomId).size === 0) {
          userCursors.delete(disconnectedRoomId);
        }
      }
      
      // Clean up file editing tracking
      if (activeFiles.has(disconnectedRoomId)) {
        for (const [filePath, fileData] of activeFiles.get(disconnectedRoomId).entries()) {
          fileData.editingUsers.delete(disconnectedUserId);
        }
      }
      
      // Remove user presence
      userPresence.delete(disconnectedUserId);
      
      // Notify other users in the room
      socket.to(disconnectedRoomId).emit('user-left', { userId: disconnectedUserId });
      
      console.log(`��� Cleaned up collaboration data for user ${disconnectedUserId} in room ${disconnectedRoomId}`);
    }

    // Remove user from all active rooms (existing logic)
    for (const [roomId, room] of activeRooms.entries()) {
      if (room.participants.has(socket.id)) {
        room.participants.delete(socket.id);

        // Notify other participants
        const participantList = Array.from(room.participants);
        socket.to(roomId).emit('update-user-list', participantList);

        // Clean up empty rooms
        if (room.participants.size === 0) {
          console.log(`��� Cleaning up empty room: ${roomId}`);
          activeRooms.delete(roomId);
          
          // Clean up all collaboration data for empty room
          roomUsers.delete(roomId);
          userCursors.delete(roomId);
          activeFiles.delete(roomId);
        }
      }
    }
});
});

const PORT = process.env.PORT || 3001;

// Initialize database connection and start server
async function startServer() {
  try {
    // Connect to database (won't throw error if fails)
    const dbConnection = await connectDB();
    if (dbConnection) {
      console.log('✅ Database connected successfully');
    } else {
      console.log('⚠️ Server starting without database connection');
    }
    
    // Start the server regardless of database connection
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Frontend URL: ${process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'https://cloud-based-collborative-code-editor.vercel.app'}`);
      console.log(`🔌 Socket.IO ready for connections`);
      if (!dbConnection) {
        console.log('⚠️ Note: Database features may be limited until connection is restored');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
