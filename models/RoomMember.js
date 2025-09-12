const { getDatabase } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class RoomMember {
  constructor({ roomId, userId, role = 'member', invitedBy = null }) {
    this.roomId = roomId;
    this.userId = userId;
    this.role = role; // 'owner', 'member', 'viewer'
    this.joinedAt = new Date();
    this.invitedBy = invitedBy;
  }

  async save() {
    try {
      const db = getDatabase();
      const collection = db.collection('roomMembers');
      
      const result = await collection.insertOne(this);
      return {
        success: true,
        id: result.insertedId,
        ...this
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async findByRoomAndUser(roomId, userId) {
    try {
      const db = getDatabase();
      const collection = db.collection('roomMembers');
      
      const member = await collection.findOne({ roomId, userId });
      return member;
    } catch (error) {
      console.error('Error finding room member:', error);
      return null;
    }
  }

  static async findByRoom(roomId) {
    try {
      const db = getDatabase();
      const collection = db.collection('roomMembers');
      
      const members = await collection.find({ roomId }).toArray();
      return members;
    } catch (error) {
      console.error('Error finding room members:', error);
      return [];
    }
  }

  static async getUserRooms(userId) {
    try {
      const db = getDatabase();
      const collection = db.collection('roomMembers');
      
      const userRooms = await collection.find({ userId }).toArray();
      return userRooms;
    } catch (error) {
      console.error('Error finding user rooms:', error);
      return [];
    }
  }

  static async hasAccess(roomId, userId) {
    try {
      const member = await this.findByRoomAndUser(roomId, userId);
      return {
        hasAccess: !!member,
        role: member ? member.role : null
      };
    } catch (error) {
      console.error('Error checking room access:', error);
      return { hasAccess: false, role: null };
    }
  }

  static async removeFromRoom(roomId, userId) {
    try {
      const db = getDatabase();
      const collection = db.collection('roomMembers');
      
      const result = await collection.deleteOne({ roomId, userId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error removing from room:', error);
      return false;
    }
  }
}

module.exports = RoomMember;
