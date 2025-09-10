const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const crypto = require('crypto');

class Session {
  constructor(sessionData) {
    this.sessionId = sessionData.sessionId || this.generateSessionId();
    this.userId = new ObjectId(sessionData.userId);
    this.socketId = sessionData.socketId || null;
    this.ipAddress = sessionData.ipAddress || null;
    this.userAgent = sessionData.userAgent || null;
    this.isActive = sessionData.isActive !== undefined ? sessionData.isActive : true;
    this.lastActivity = sessionData.lastActivity || new Date();
    this.createdAt = sessionData.createdAt || new Date();
    this.expiresAt = sessionData.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }

  // Generate a unique session ID
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Create a new session
  async save() {
    try {
      const db = getDB();
      const result = await db.collection('sessions').insertOne(this);
      return { success: true, sessionId: this.sessionId, insertedId: result.insertedId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Find session by session ID
  static async findBySessionId(sessionId) {
    try {
      const db = getDB();
      const session = await db.collection('sessions').findOne({ 
        sessionId,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });
      return session;
    } catch (error) {
      throw new Error(`Error finding session: ${error.message}`);
    }
  }

  // Find sessions by user ID
  static async findByUserId(userId) {
    try {
      const db = getDB();
      const sessions = await db.collection('sessions')
        .find({ 
          userId: new ObjectId(userId),
          isActive: true,
          expiresAt: { $gt: new Date() }
        })
        .sort({ lastActivity: -1 })
        .toArray();
      return sessions;
    } catch (error) {
      throw new Error(`Error finding user sessions: ${error.message}`);
    }
  }

  // Find session by socket ID
  static async findBySocketId(socketId) {
    try {
      const db = getDB();
      const session = await db.collection('sessions').findOne({ 
        socketId,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });
      return session;
    } catch (error) {
      throw new Error(`Error finding session by socket ID: ${error.message}`);
    }
  }

  // Update session activity
  static async updateActivity(sessionId, socketId = null) {
    try {
      const db = getDB();
      const updateData = {
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Extend expiry
      };

      if (socketId) {
        updateData.socketId = socketId;
      }

      const result = await db.collection('sessions').updateOne(
        { sessionId, isActive: true },
        { $set: updateData }
      );
      
      return { success: result.modifiedCount > 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update socket ID for session
  static async updateSocketId(sessionId, socketId) {
    try {
      const db = getDB();
      const result = await db.collection('sessions').updateOne(
        { sessionId, isActive: true },
        { 
          $set: { 
            socketId,
            lastActivity: new Date()
          }
        }
      );
      
      return { success: result.modifiedCount > 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Deactivate session
  static async deactivate(sessionId) {
    try {
      const db = getDB();
      const result = await db.collection('sessions').updateOne(
        { sessionId },
        { 
          $set: { 
            isActive: false,
            socketId: null,
            lastActivity: new Date()
          }
        }
      );
      
      return { success: result.modifiedCount > 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Deactivate session by socket ID
  static async deactivateBySocketId(socketId) {
    try {
      const db = getDB();
      const result = await db.collection('sessions').updateOne(
        { socketId, isActive: true },
        { 
          $set: { 
            isActive: false,
            socketId: null,
            lastActivity: new Date()
          }
        }
      );
      
      return { success: result.modifiedCount > 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Deactivate all sessions for a user
  static async deactivateAllUserSessions(userId) {
    try {
      const db = getDB();
      const result = await db.collection('sessions').updateMany(
        { userId: new ObjectId(userId), isActive: true },
        { 
          $set: { 
            isActive: false,
            socketId: null,
            lastActivity: new Date()
          }
        }
      );
      
      return { success: true, deactivatedCount: result.modifiedCount };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Clean up expired sessions
  static async cleanupExpiredSessions() {
    try {
      const db = getDB();
      const result = await db.collection('sessions').deleteMany({
        expiresAt: { $lt: new Date() }
      });
      
      console.log(`🧹 Cleaned up ${result.deletedCount} expired sessions`);
      return { success: true, deletedCount: result.deletedCount };
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      return { success: false, error: error.message };
    }
  }

  // Get active sessions count
  static async getActiveSessionsCount() {
    try {
      const db = getDB();
      const count = await db.collection('sessions').countDocuments({
        isActive: true,
        expiresAt: { $gt: new Date() }
      });
      return count;
    } catch (error) {
      throw new Error(`Error getting active sessions count: ${error.message}`);
    }
  }

  // Get session statistics
  static async getSessionStats() {
    try {
      const db = getDB();
      
      const pipeline = [
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            activeSessions: {
              $sum: {
                $cond: [
                  { 
                    $and: [
                      { $eq: ['$isActive', true] },
                      { $gt: ['$expiresAt', new Date()] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            expiredSessions: {
              $sum: {
                $cond: [
                  { $lt: ['$expiresAt', new Date()] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ];

      const result = await db.collection('sessions').aggregate(pipeline).toArray();
      return result[0] || { totalSessions: 0, activeSessions: 0, expiredSessions: 0 };
    } catch (error) {
      throw new Error(`Error getting session statistics: ${error.message}`);
    }
  }

  // Validate session
  static async validateSession(sessionId) {
    try {
      const session = await this.findBySessionId(sessionId);
      if (!session) {
        return { valid: false, reason: 'Session not found' };
      }

      if (!session.isActive) {
        return { valid: false, reason: 'Session is inactive' };
      }

      if (session.expiresAt < new Date()) {
        return { valid: false, reason: 'Session has expired' };
      }

      // Update last activity
      await this.updateActivity(sessionId);

      return { valid: true, session };
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  }
}

module.exports = Session;
