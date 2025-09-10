const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const crypto = require('crypto');

class Room {
  constructor(roomData) {
    this.roomId = roomData.roomId || this.generateRoomId();
    this.name = roomData.name || `Room ${this.roomId.slice(0, 8)}`;
    this.description = roomData.description || '';
    this.createdBy = new ObjectId(roomData.createdBy);
    this.participants = roomData.participants ? roomData.participants.map(id => new ObjectId(id)) : [];
    this.isPublic = roomData.isPublic !== undefined ? roomData.isPublic : false;
    this.maxParticipants = roomData.maxParticipants || 10;
    this.code = roomData.code || '';
    this.language = roomData.language || 'javascript';
    this.isActive = roomData.isActive !== undefined ? roomData.isActive : true;
    this.createdAt = roomData.createdAt || new Date();
    this.updatedAt = roomData.updatedAt || new Date();
  }

  // Generate a unique room ID
  generateRoomId() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Create a new room
  async save() {
    try {
      const db = getDB();
      
      // Add creator to participants if not already included
      if (!this.participants.some(id => id.equals(this.createdBy))) {
        this.participants.push(this.createdBy);
      }

      const result = await db.collection('rooms').insertOne(this);
      return { success: true, roomId: this.roomId, insertedId: result.insertedId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Find room by room ID
  static async findByRoomId(roomId) {
    try {
      const db = getDB();
      const room = await db.collection('rooms').findOne({ 
        roomId,
        isActive: true
      });
      return room;
    } catch (error) {
      throw new Error(`Error finding room: ${error.message}`);
    }
  }

  // Find rooms created by user
  static async findByCreator(userId, page = 1, limit = 10) {
    try {
      const db = getDB();
      const skip = (page - 1) * limit;
      
      const rooms = await db.collection('rooms')
        .find({ 
          createdBy: new ObjectId(userId),
          isActive: true
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      const total = await db.collection('rooms').countDocuments({ 
        createdBy: new ObjectId(userId),
        isActive: true
      });
      
      return {
        rooms,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error finding rooms by creator: ${error.message}`);
    }
  }

  // Find rooms where user is a participant
  static async findByParticipant(userId, page = 1, limit = 10) {
    try {
      const db = getDB();
      const skip = (page - 1) * limit;
      
      const rooms = await db.collection('rooms')
        .find({ 
          participants: new ObjectId(userId),
          isActive: true
        })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      const total = await db.collection('rooms').countDocuments({ 
        participants: new ObjectId(userId),
        isActive: true
      });
      
      return {
        rooms,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error finding rooms by participant: ${error.message}`);
    }
  }

  // Find public rooms
  static async findPublicRooms(page = 1, limit = 10) {
    try {
      const db = getDB();
      const skip = (page - 1) * limit;
      
      const rooms = await db.collection('rooms')
        .find({ 
          isPublic: true,
          isActive: true
        })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      const total = await db.collection('rooms').countDocuments({ 
        isPublic: true,
        isActive: true
      });
      
      return {
        rooms,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error finding public rooms: ${error.message}`);
    }
  }

  // Add participant to room
  static async addParticipant(roomId, userId) {
    try {
      const db = getDB();
      
      // Check if room exists and get current participant count
      const room = await this.findByRoomId(roomId);
      if (!room) {
        return { success: false, error: 'Room not found' };
      }

      // Check if user is already a participant
      if (room.participants.some(id => id.equals(new ObjectId(userId)))) {
        return { success: false, error: 'User is already a participant' };
      }

      // Check if room is at capacity
      if (room.participants.length >= room.maxParticipants) {
        return { success: false, error: 'Room is at maximum capacity' };
      }

      const result = await db.collection('rooms').updateOne(
        { roomId },
        { 
          $addToSet: { participants: new ObjectId(userId) },
          $set: { updatedAt: new Date() }
        }
      );
      
      return { success: result.modifiedCount > 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Remove participant from room
  static async removeParticipant(roomId, userId) {
    try {
      const db = getDB();
      const result = await db.collection('rooms').updateOne(
        { roomId },
        { 
          $pull: { participants: new ObjectId(userId) },
          $set: { updatedAt: new Date() }
        }
      );
      
      return { success: result.modifiedCount > 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update room code
  static async updateCode(roomId, code, userId) {
    try {
      const db = getDB();
      
      // Verify user is a participant
      const room = await this.findByRoomId(roomId);
      if (!room) {
        return { success: false, error: 'Room not found' };
      }

      if (!room.participants.some(id => id.equals(new ObjectId(userId)))) {
        return { success: false, error: 'User is not a participant in this room' };
      }

      const result = await db.collection('rooms').updateOne(
        { roomId },
        { 
          $set: { 
            code,
            updatedAt: new Date()
          }
        }
      );
      
      return { success: result.modifiedCount > 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update room settings
  static async updateSettings(roomId, settings, userId) {
    try {
      const db = getDB();
      
      // Verify user is the creator
      const room = await this.findByRoomId(roomId);
      if (!room) {
        return { success: false, error: 'Room not found' };
      }

      if (!room.createdBy.equals(new ObjectId(userId))) {
        return { success: false, error: 'Only room creator can update settings' };
      }

      const allowedSettings = ['name', 'description', 'isPublic', 'maxParticipants', 'language'];
      const updateData = {};
      
      for (const [key, value] of Object.entries(settings)) {
        if (allowedSettings.includes(key)) {
          updateData[key] = value;
        }
      }

      updateData.updatedAt = new Date();

      const result = await db.collection('rooms').updateOne(
        { roomId },
        { $set: updateData }
      );
      
      return { success: result.modifiedCount > 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get room with participant details
  static async getRoomWithParticipants(roomId) {
    try {
      const db = getDB();
      
      const pipeline = [
        { $match: { roomId, isActive: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'participants',
            foreignField: '_id',
            as: 'participantDetails',
            pipeline: [
              {
                $project: {
                  username: 1,
                  firstName: 1,
                  lastName: 1,
                  profilePicture: 1,
                  lastLogin: 1
                }
              }
            ]
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'creatorDetails',
            pipeline: [
              {
                $project: {
                  username: 1,
                  firstName: 1,
                  lastName: 1,
                  profilePicture: 1
                }
              }
            ]
          }
        },
        {
          $addFields: {
            creator: { $arrayElemAt: ['$creatorDetails', 0] }
          }
        },
        {
          $project: {
            creatorDetails: 0
          }
        }
      ];

      const result = await db.collection('rooms').aggregate(pipeline).toArray();
      return result[0] || null;
    } catch (error) {
      throw new Error(`Error getting room with participants: ${error.message}`);
    }
  }

  // Deactivate room
  static async deactivate(roomId, userId) {
    try {
      const db = getDB();
      
      // Verify user is the creator
      const room = await this.findByRoomId(roomId);
      if (!room) {
        return { success: false, error: 'Room not found' };
      }

      if (!room.createdBy.equals(new ObjectId(userId))) {
        return { success: false, error: 'Only room creator can deactivate room' };
      }

      const result = await db.collection('rooms').updateOne(
        { roomId },
        { 
          $set: { 
            isActive: false,
            updatedAt: new Date()
          }
        }
      );
      
      return { success: result.modifiedCount > 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Search rooms
  static async search(searchTerm, page = 1, limit = 10) {
    try {
      const db = getDB();
      const skip = (page - 1) * limit;
      
      const searchRegex = new RegExp(searchTerm, 'i');
      const query = {
        $and: [
          { isActive: true },
          { isPublic: true },
          {
            $or: [
              { name: searchRegex },
              { description: searchRegex },
              { language: searchRegex }
            ]
          }
        ]
      };
      
      const rooms = await db.collection('rooms')
        .find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      const total = await db.collection('rooms').countDocuments(query);
      
      return {
        rooms,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error searching rooms: ${error.message}`);
    }
  }

  // Get room statistics
  static async getRoomStats() {
    try {
      const db = getDB();
      
      const pipeline = [
        {
          $group: {
            _id: null,
            totalRooms: { $sum: 1 },
            activeRooms: {
              $sum: {
                $cond: [{ $eq: ['$isActive', true] }, 1, 0]
              }
            },
            publicRooms: {
              $sum: {
                $cond: [
                  { 
                    $and: [
                      { $eq: ['$isActive', true] },
                      { $eq: ['$isPublic', true] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            totalParticipants: {
              $sum: { $size: '$participants' }
            }
          }
        }
      ];

      const result = await db.collection('rooms').aggregate(pipeline).toArray();
      return result[0] || { totalRooms: 0, activeRooms: 0, publicRooms: 0, totalParticipants: 0 };
    } catch (error) {
      throw new Error(`Error getting room statistics: ${error.message}`);
    }
  }
}

module.exports = Room;
