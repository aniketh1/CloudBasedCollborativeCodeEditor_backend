const jwt = require('jsonwebtoken');
// const Session = require('../models/Session');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Simple auth middleware for testing (without Clerk)
const auth = async (req, res, next) => {
  try {
    // For testing purposes, create a mock user
    // In production, this would validate Clerk tokens or JWT
    req.user = {
      userId: req.headers['x-user-id'] || 'test-user-' + Math.random().toString(36).substr(2, 9),
      sessionId: 'test-session-' + Math.random().toString(36).substr(2, 9),
      name: req.headers['x-user-name'] || 'Test User',
      email: req.headers['x-user-email'] || 'test@example.com'
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Middleware to authenticate JWT token (legacy - for reference)
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // For now, skip session validation since we're restructuring
    // const sessionValidation = await Session.validateSession(decoded.sessionId);
    // if (!sessionValidation.valid) {
    //   return res.status(401).json({
    //     success: false,
    //     error: sessionValidation.reason
    //   });
    // }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      sessionId: decoded.sessionId || 'mock-session',
      // session: sessionValidation.session
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Middleware to authenticate socket connections
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Access token required'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Validate session
    const sessionValidation = await Session.validateSession(decoded.sessionId);
    if (!sessionValidation.valid) {
      return next(new Error(sessionValidation.reason));
    }

    // Update session with socket ID
    await Session.updateSocketId(decoded.sessionId, socket.id);

    // Add user info to socket
    socket.user = {
      userId: decoded.userId,
      sessionId: decoded.sessionId,
      session: sessionValidation.session
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Invalid token'));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Token has expired'));
    }

    console.error('Socket authentication error:', error);
    return next(new Error('Authentication failed'));
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Validate session
      const sessionValidation = await Session.validateSession(decoded.sessionId);
      if (sessionValidation.valid) {
        req.user = {
          userId: decoded.userId,
          sessionId: decoded.sessionId,
          session: sessionValidation.session
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

// Middleware to check if user is room participant
const checkRoomParticipant = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const Room = require('../models/Room');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const room = await Room.findByRoomId(roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }

    const isParticipant = room.participants.some(id => id.equals(req.user.userId));
    const isCreator = room.createdBy.equals(req.user.userId);
    
    if (!isParticipant && !isCreator && !room.isPublic) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this room'
      });
    }

    req.room = room;
    req.isRoomCreator = isCreator;
    req.isRoomParticipant = isParticipant;
    
    next();
  } catch (error) {
    console.error('Room participant check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Rate limiting middleware
const createRateLimit = (windowMs, maxRequests) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this IP
    let userRequests = requests.get(key) || [];
    
    // Filter out old requests
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.'
      });
    }

    // Add current request
    userRequests.push(now);
    requests.set(key, userRequests);

    // Cleanup old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      for (const [ip, timestamps] of requests.entries()) {
        const filteredTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
        if (filteredTimestamps.length === 0) {
          requests.delete(ip);
        } else {
          requests.set(ip, filteredTimestamps);
        }
      }
    }

    next();
  };
};
module.exports = {
  auth,
  authenticateToken,
  authenticateSocket,
  optionalAuth,
  checkRoomParticipant,
  createRateLimit
};