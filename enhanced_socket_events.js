// Enhanced Socket.IO server for real-time collaboration

// Store active rooms, users, and file states
const activeRooms = new Map(); // roomId -> { users: Map, files: Map, fileEditors: Map }

io.on('connection', async (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  
  // Enhanced join-room handler with real user tracking
  socket.on('join-room', async (data) => {
    try {
      const { roomId, user } = data;
      
      if (!roomId || !user) {
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

      // Save to database or file system here
      // For now, just acknowledge the save
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

module.exports = { io, activeRooms };