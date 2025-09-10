const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { authenticateToken } = require('../middleware/auth');

// Create a new room
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { name, description, isPublic, maxParticipants, language } = req.body;
    
    const room = new Room({
      name,
      description,
      createdBy: req.user.userId,
      isPublic: isPublic || false,
      maxParticipants: maxParticipants || 10,
      language: language || 'javascript'
    });

    const result = await room.save();
    
    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Room created successfully',
        roomId: result.roomId,
        room: await Room.getRoomWithParticipants(result.roomId)
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Room creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Join a room
router.post('/join/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const result = await Room.addParticipant(roomId, req.user.userId);
    
    if (result.success) {
      const room = await Room.getRoomWithParticipants(roomId);
      res.json({
        success: true,
        message: 'Joined room successfully',
        room
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Room join error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Leave a room
router.post('/leave/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const result = await Room.removeParticipant(roomId, req.user.userId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Left room successfully'
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Room leave error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get room details
router.get('/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await Room.getRoomWithParticipants(roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    // Check if user is a participant
    const isParticipant = room.participants.some(id => id.equals(req.user.userId));
    
    if (!room.isPublic && !isParticipant) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to private room'
      });
    }

    res.json({
      success: true,
      room
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update room code
router.put('/:roomId/code', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { code } = req.body;
    
    const result = await Room.updateCode(roomId, code, req.user.userId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Code updated successfully'
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Update code error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update room settings
router.put('/:roomId/settings', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const settings = req.body;
    
    const result = await Room.updateSettings(roomId, settings, req.user.userId);
    
    if (result.success) {
      const room = await Room.getRoomWithParticipants(roomId);
      res.json({
        success: true,
        message: 'Room settings updated successfully',
        room
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get user's rooms
router.get('/user/my-rooms', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const createdRooms = await Room.findByCreator(req.user.userId, page, limit);
    const participatingRooms = await Room.findByParticipant(req.user.userId, page, limit);
    
    res.json({
      success: true,
      createdRooms,
      participatingRooms
    });
  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get public rooms
router.get('/public/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const rooms = await Room.findPublicRooms(page, limit);
    
    res.json({
      success: true,
      ...rooms
    });
  } catch (error) {
    console.error('Get public rooms error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Search rooms
router.get('/search/:searchTerm', async (req, res) => {
  try {
    const { searchTerm } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const rooms = await Room.search(searchTerm, page, limit);
    
    res.json({
      success: true,
      ...rooms
    });
  } catch (error) {
    console.error('Search rooms error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete/deactivate room
router.delete('/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const result = await Room.deactivate(roomId, req.user.userId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Room deactivated successfully'
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
