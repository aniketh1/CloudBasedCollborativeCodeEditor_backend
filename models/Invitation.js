const { getDatabase } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Invitation {
  constructor({ roomId, invitedBy, recipientEmail, recipientName = null }) {
    this.id = uuidv4();
    this.roomId = roomId;
    this.invitedBy = invitedBy;
    this.recipientEmail = recipientEmail;
    this.recipientName = recipientName;
    this.token = uuidv4(); // Secure token for invite link
    this.status = 'pending'; // 'pending', 'accepted', 'expired'
    this.createdAt = new Date();
    this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  }

  async save() {
    try {
      const db = getDatabase();
      const collection = db.collection('invitations');
      
      const result = await collection.insertOne(this);
      return {
        success: true,
        invitationId: this.id,
        token: this.token,
        ...this
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async findByToken(token) {
    try {
      const db = getDatabase();
      const collection = db.collection('invitations');
      
      const invitation = await collection.findOne({ token, status: 'pending' });
      
      // Check if invitation is expired
      if (invitation && new Date() > new Date(invitation.expiresAt)) {
        await collection.updateOne(
          { token },
          { $set: { status: 'expired' } }
        );
        return null;
      }
      
      return invitation;
    } catch (error) {
      console.error('Error finding invitation by token:', error);
      return null;
    }
  }

  static async findByRoomAndEmail(roomId, recipientEmail) {
    try {
      const db = getDatabase();
      const collection = db.collection('invitations');
      
      const invitation = await collection.findOne({ 
        roomId, 
        recipientEmail, 
        status: 'pending' 
      });
      return invitation;
    } catch (error) {
      console.error('Error finding invitation:', error);
      return null;
    }
  }

  static async acceptInvitation(token, userId) {
    try {
      const db = getDatabase();
      const collection = db.collection('invitations');
      
      const invitation = await this.findByToken(token);
      if (!invitation) {
        return { success: false, error: 'Invalid or expired invitation' };
      }

      // Mark invitation as accepted
      await collection.updateOne(
        { token },
        { $set: { status: 'accepted', acceptedBy: userId, acceptedAt: new Date() } }
      );

      return {
        success: true,
        roomId: invitation.roomId,
        invitedBy: invitation.invitedBy
      };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return { success: false, error: error.message };
    }
  }

  static async getRoomInvitations(roomId) {
    try {
      const db = getDatabase();
      const collection = db.collection('invitations');
      
      const invitations = await collection.find({ roomId }).sort({ createdAt: -1 }).toArray();
      return invitations;
    } catch (error) {
      console.error('Error getting room invitations:', error);
      return [];
    }
  }

  static async getUserInvitations(recipientEmail) {
    try {
      const db = getDatabase();
      const collection = db.collection('invitations');
      
      const invitations = await collection.find({ 
        recipientEmail, 
        status: 'pending',
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 }).toArray();
      
      return invitations;
    } catch (error) {
      console.error('Error getting user invitations:', error);
      return [];
    }
  }

  static async expireOldInvitations() {
    try {
      const db = getDatabase();
      const collection = db.collection('invitations');
      
      const result = await collection.updateMany(
        { 
          status: 'pending',
          expiresAt: { $lt: new Date() }
        },
        { $set: { status: 'expired' } }
      );
      
      return result.modifiedCount;
    } catch (error) {
      console.error('Error expiring old invitations:', error);
      return 0;
    }
  }
}

module.exports = Invitation;
