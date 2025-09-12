const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware to validate user authentication (Clerk userId from headers)
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  const userId = authHeader.substring(7); // Remove 'Bearer ' prefix
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token'
    });
  }
  
  req.userId = userId;
  next();
};

// GET /api/users/search?q=<query> - Search users alphabetically by name or email
router.get('/search', authenticateUser, async (req, res) => {
  try {
    const { q: query, limit = 20 } = req.query;
    const { userId } = req;

    if (!query || query.length < 1) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required (minimum 1 character)'
      });
    }

    // Search users alphabetically, excluding current user
    const users = await User.searchUsersAlphabetically(query, userId, parseInt(limit));

    res.json({
      success: true,
      users: users,
      total: users.length,
      query: query
    });

  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users'
    });
  }
});

// GET /api/users/profile/:userId - Get user profile information
router.get('/profile/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;

    const user = await User.findById(targetUserId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Return public profile information
    res.json({
      success: true,
      user: {
        id: user._id ? user._id.toString() : user.clerkId,
        name: `${user.firstName} ${user.lastName}`.trim() || user.username,
        email: user.email,
        avatar: user.profilePicture,
        username: user.username,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

// POST /api/users/sync - Sync user data from Clerk
router.post('/sync', authenticateUser, async (req, res) => {
  try {
    const { userInfo } = req.body;
    const { userId } = req;

    if (!userInfo) {
      return res.status(400).json({
        success: false,
        error: 'User information is required'
      });
    }

    // Upsert user from Clerk data
    const result = await User.upsertFromClerk({
      id: userId,
      emailAddresses: [{ emailAddress: userInfo.email }],
      firstName: userInfo.firstName || '',
      lastName: userInfo.lastName || '',
      username: userInfo.username || `${userInfo.firstName}${userInfo.lastName}`.toLowerCase(),
      profileImageUrl: userInfo.avatar || ''
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'User data synchronized successfully',
        userId: result.userId
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error syncing user data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync user data'
    });
  }
});

// GET /api/users/me - Get current user information
router.get('/me', authenticateUser, async (req, res) => {
  try {
    const { userId } = req;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id ? user._id.toString() : user.clerkId,
        name: `${user.firstName} ${user.lastName}`.trim() || user.username,
        email: user.email,
        avatar: user.profilePicture,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user information'
    });
  }
});

module.exports = router;
