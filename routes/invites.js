const express = require('express');
const router = express.Router();
const Invitation = require('../models/Invitation');
const RoomMember = require('../models/RoomMember');
const User = require('../models/User');
const Project = require('../models/Project');
const EmailService = require('../services/EmailService');

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

// POST /api/invites/send - Send email invitation to join a room
router.post('/send', authenticateUser, async (req, res) => {
  try {
    const { recipientEmail, recipientName, roomId, senderName } = req.body;
    const { userId: senderId } = req;

    // Validate required fields
    if (!recipientEmail || !roomId || !senderName) {
      return res.status(400).json({
        success: false,
        error: 'recipientEmail, roomId, and senderName are required'
      });
    }

    // Check if sender has permission to invite to this room
    const senderAccess = await RoomMember.hasAccess(roomId, senderId);
    if (!senderAccess.hasAccess || (senderAccess.role !== 'owner' && senderAccess.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        error: 'Only room owners can send invitations'
      });
    }

    // Check if there's already a pending invitation
    const existingInvite = await Invitation.findByRoomAndEmail(roomId, recipientEmail);
    if (existingInvite) {
      return res.status(400).json({
        success: false,
        error: 'An invitation is already pending for this user'
      });
    }

    // Check if user is already a member
    const recipientUser = await User.findByEmail(recipientEmail);
    if (recipientUser) {
      const existingMember = await RoomMember.findByRoomAndUser(roomId, recipientUser._id.toString());
      if (existingMember) {
        return res.status(400).json({
          success: false,
          error: 'User is already a member of this room'
        });
      }
    }

    // Create invitation
    const invitation = new Invitation({
      roomId,
      invitedBy: senderId,
      recipientEmail,
      recipientName
    });

    const inviteResult = await invitation.save();

    if (!inviteResult.success) {
      return res.status(500).json({
        success: false,
        error: inviteResult.error
      });
    }

    // Generate join link
    const frontendUrl = process.env.FRONTEND_URL || 'https://cloud-based-collborative-code-editor.vercel.app';
    const joinLink = `${frontendUrl}/editor/${roomId}?invite=${inviteResult.token}`;

    // Send email invitation
    const emailResult = await EmailService.sendInviteEmail({
      recipientEmail,
      recipientName,
      senderName,
      roomId,
      joinLink
    });

    if (emailResult.success) {
      res.json({
        success: true,
        message: 'Invitation sent successfully',
        invitationId: inviteResult.invitationId,
        token: inviteResult.token,
        joinLink
      });
    } else {
      // Invitation was created but email failed
      res.status(500).json({
        success: false,
        error: `Invitation created but email failed: ${emailResult.error}`,
        invitationId: inviteResult.invitationId,
        token: inviteResult.token,
        joinLink
      });
    }

  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send invitation'
    });
  }
});

// POST /api/invites/accept/:token - Accept an invitation
router.post('/accept/:token', authenticateUser, async (req, res) => {
  try {
    const { token } = req.params;
    const { userId } = req;

    // Accept the invitation
    const acceptResult = await Invitation.acceptInvitation(token, userId);

    if (!acceptResult.success) {
      return res.status(400).json({
        success: false,
        error: acceptResult.error
      });
    }

    // Add user to room as member
    const roomMember = new RoomMember({
      roomId: acceptResult.roomId,
      userId,
      role: 'member',
      invitedBy: acceptResult.invitedBy
    });

    const memberResult = await roomMember.save();

    if (memberResult.success) {
      res.json({
        success: true,
        message: 'Invitation accepted successfully',
        roomId: acceptResult.roomId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to add user to room'
      });
    }

  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept invitation'
    });
  }
});

// GET /api/invites/validate/:token - Validate invitation token
router.get('/validate/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findByToken(token);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired invitation'
      });
    }

    // Get room/project information
    const project = await Project.findByRoomId(invitation.roomId);

    res.json({
      success: true,
      invitation: {
        roomId: invitation.roomId,
        invitedBy: invitation.invitedBy,
        recipientEmail: invitation.recipientEmail,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt
      },
      room: {
        id: invitation.roomId,
        project: project ? {
          name: project.name,
          description: project.description,
          projectType: project.projectType
        } : null
      }
    });

  } catch (error) {
    console.error('Error validating invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate invitation'
    });
  }
});

// GET /api/invites/room/:roomId - Get all invitations for a room
router.get('/room/:roomId', authenticateUser, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req;

    // Check if user has access to the room
    const userAccess = await RoomMember.hasAccess(roomId, userId);
    if (!userAccess.hasAccess || userAccess.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Only room owners can view invitations'
      });
    }

    const invitations = await Invitation.getRoomInvitations(roomId);

    res.json({
      success: true,
      invitations: invitations.map(invite => ({
        id: invite.id,
        recipientEmail: invite.recipientEmail,
        recipientName: invite.recipientName,
        status: invite.status,
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
        token: invite.token
      }))
    });

  } catch (error) {
    console.error('Error getting room invitations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get room invitations'
    });
  }
});

// GET /api/invites/user - Get all invitations for current user
router.get('/user', authenticateUser, async (req, res) => {
  try {
    const { userId } = req;

    // Get user's email
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const invitations = await Invitation.getUserInvitations(user.email);

    res.json({
      success: true,
      invitations: invitations.map(invite => ({
        id: invite.id,
        roomId: invite.roomId,
        invitedBy: invite.invitedBy,
        status: invite.status,
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
        token: invite.token
      }))
    });

  } catch (error) {
    console.error('Error getting user invitations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user invitations'
    });
  }
});

// DELETE /api/invites/:invitationId - Cancel/revoke an invitation
router.delete('/:invitationId', authenticateUser, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { userId } = req;

    // Find the invitation
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
    }

    // Check if user has permission to cancel this invitation
    if (invitation.invitedBy !== userId) {
      const userAccess = await RoomMember.hasAccess(invitation.roomId, userId);
      if (!userAccess.hasAccess || userAccess.role !== 'owner') {
        return res.status(403).json({
          success: false,
          error: 'Only the sender or room owner can cancel invitations'
        });
      }
    }

    // Mark invitation as expired/cancelled
    const db = require('../config/database').getDatabase();
    const result = await db.collection('invitations').updateOne(
      { id: invitationId },
      { $set: { status: 'cancelled', cancelledAt: new Date(), cancelledBy: userId } }
    );

    if (result.modifiedCount > 0) {
      res.json({
        success: true,
        message: 'Invitation cancelled successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to cancel invitation'
      });
    }

  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel invitation'
    });
  }
});

// POST /api/invites/cleanup - Cleanup expired invitations (admin only)
router.post('/cleanup', authenticateUser, async (req, res) => {
  try {
    const expiredCount = await Invitation.expireOldInvitations();

    res.json({
      success: true,
      message: `Cleaned up ${expiredCount} expired invitations`
    });

  } catch (error) {
    console.error('Error cleaning up invitations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup invitations'
    });
  }
});

module.exports = router;
