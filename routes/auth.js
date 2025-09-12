const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Session = require('../models/Session');
const jwt = require('jsonwebtoken');

// JWT secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email, username, and password are required'
      });
    }

    // Check if user already exists
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({
        success: false,
        error: 'Username already taken'
      });
    }

    // Create new user
    const user = new User({
      email,
      username,
      password,
      firstName,
      lastName
    });

    const result = await user.save();
    
    if (result.success) {
      // Create session
      const session = new Session({
        userId: result.userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      const sessionResult = await session.save();
      
      if (sessionResult.success) {
        // Generate JWT token
        const token = jwt.sign(
          { 
            userId: result.userId, 
            sessionId: sessionResult.sessionId 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          user: {
            id: result.userId,
            email,
            username,
            firstName,
            lastName
          },
          token,
          sessionId: sessionResult.sessionId
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create session'
        });
      }
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Update last login
    await User.updateLastLogin(user._id);

    // Create session
    const session = new Session({
      userId: user._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    const sessionResult = await session.save();
    
    if (sessionResult.success) {
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id, 
          sessionId: sessionResult.sessionId 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          lastLogin: user.lastLogin
        },
        token,
        sessionId: sessionResult.sessionId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create session'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        await Session.deactivate(decoded.sessionId);
      } catch (error) {
        console.error('Error deactivating session:', error);
      }
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Validate session
    const sessionValidation = await Session.validateSession(decoded.sessionId);
    if (!sessionValidation.valid) {
      return res.status(401).json({
        success: false,
        error: sessionValidation.reason
      });
    }

    // Get user details
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Validate session
    const sessionValidation = await Session.validateSession(decoded.sessionId);
    if (!sessionValidation.valid) {
      return res.status(401).json({
        success: false,
        error: sessionValidation.reason
      });
    }

    const { firstName, lastName, profilePicture } = req.body;
    const updateData = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    const result = await User.updateById(decoded.userId, updateData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Validate token endpoint
router.get('/validate', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Validate session
    const sessionValidation = await Session.validateSession(decoded.sessionId);
    if (!sessionValidation.valid) {
      return res.status(401).json({
        success: false,
        error: sessionValidation.reason
      });
    }

    res.json({
      success: true,
      valid: true,
      userId: decoded.userId,
      sessionId: decoded.sessionId
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      valid: false,
      error: 'Invalid token'
    });
  }
});

module.exports = router;
