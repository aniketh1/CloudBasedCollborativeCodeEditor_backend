
  // Enhanced collaboration events for real-time coding
  
  // Handle user joining with identity
  socket.on('user-join', ({ roomId, userId, userName, userAvatar }) => {
    console.log(`í±¥ User ${userName} (${userId}) joining room ${roomId}`);
    
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
    
    console.log(`âœ… ${userName} joined room ${roomId} with color ${userColor}`);
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
    console.log(`í´„ Code operation from ${userId} in ${filePath}: ${operation}`);
    
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
    
    const operationData = {
      userId,
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
    console.log(`í³„ ${userId} selected file: ${filePath}`);
    
    // Update user presence
    if (userPresence.has(userId)) {
      userPresence.get(userId).currentFile = filePath;
      userPresence.get(userId).lastActivity = Date.now();
    }
    
    // Notify other users about file selection
    socket.to(roomId).emit('user-file-selected', { userId, filePath });
  });

  // Handle typing indicators
  socket.on('typing-start', ({ roomId, userId, filePath }) => {
    socket.to(roomId).emit('user-typing', { userId, filePath, isTyping: true });
  });

  socket.on('typing-stop', ({ roomId, userId, filePath }) => {
    socket.to(roomId).emit('user-typing', { userId, filePath, isTyping: false });
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

