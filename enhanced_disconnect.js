  socket.on('disconnect', () => {
    console.log(`‚ùå User disconnected: ${socket.id}`);

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
      
      console.log(`Ì∑π Cleaned up collaboration data for user ${disconnectedUserId} in room ${disconnectedRoomId}`);
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
          console.log(`Ìø† Cleaning up empty room: ${roomId}`);
          activeRooms.delete(roomId);
          
          // Clean up all collaboration data for empty room
          roomUsers.delete(roomId);
          userCursors.delete(roomId);
          activeFiles.delete(roomId);
        }
      }
    }
  });
