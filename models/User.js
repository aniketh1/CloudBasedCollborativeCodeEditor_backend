const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  constructor(userData) {
    this.email = userData.email;
    this.username = userData.username;
    this.password = userData.password;
    this.firstName = userData.firstName || '';
    this.lastName = userData.lastName || '';
    this.profilePicture = userData.profilePicture || '';
    this.isActive = userData.isActive !== undefined ? userData.isActive : true;
    this.lastLogin = userData.lastLogin || null;
    this.createdAt = userData.createdAt || new Date();
    this.updatedAt = userData.updatedAt || new Date();
  }

  // Create a new user
  async save() {
    try {
      const db = getDatabase();
      
      // Hash password before saving
      if (this.password) {
        this.password = await bcrypt.hash(this.password, 12);
      }

      const result = await db.collection('users').insertOne(this);
      return { success: true, userId: result.insertedId };
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return { success: false, error: `${field} already exists` };
      }
      return { success: false, error: error.message };
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const db = getDatabase();
      const user = await db.collection('users').findOne({ email });
      return user;
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  // Find user by username
  static async findByUsername(username) {
    try {
      const db = getDatabase();
      const user = await db.collection('users').findOne({ username });
      return user;
    } catch (error) {
      throw new Error(`Error finding user by username: ${error.message}`);
    }
  }

  // Find user by ID
  static async findById(userId) {
    try {
      const db = getDatabase();
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
      return user;
    } catch (error) {
      throw new Error(`Error finding user by ID: ${error.message}`);
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw new Error(`Error verifying password: ${error.message}`);
    }
  }

  // Update user
  static async updateById(userId, updateData) {
    try {
      const db = getDatabase();
      updateData.updatedAt = new Date();
      
      // Hash password if it's being updated
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 12);
      }

      const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData }
      );
      
      return { success: result.modifiedCount > 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update last login
  static async updateLastLogin(userId) {
    try {
      const db = getDatabase();
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            lastLogin: new Date(),
            updatedAt: new Date()
          }
        }
      );
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  // Get all users (for admin purposes)
  static async findAll(page = 1, limit = 10) {
    try {
      const db = getDatabase();
      const skip = (page - 1) * limit;
      
      const users = await db.collection('users')
        .find({}, { 
          projection: { 
            password: 0 // Exclude password from results
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      const total = await db.collection('users').countDocuments();
      
      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  // Delete user
  static async deleteById(userId) {
    try {
      const db = getDatabase();
      const result = await db.collection('users').deleteOne({ _id: new ObjectId(userId) });
      return { success: result.deletedCount > 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Search users by username or email
  static async search(searchTerm, page = 1, limit = 10) {
    try {
      const db = getDatabase();
      const skip = (page - 1) * limit;
      
      const searchRegex = new RegExp(searchTerm, 'i');
      const query = {
        $or: [
          { username: searchRegex },
          { email: searchRegex },
          { firstName: searchRegex },
          { lastName: searchRegex }
        ]
      };
      
      const users = await db.collection('users')
        .find(query, { 
          projection: { 
            password: 0 
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      const total = await db.collection('users').countDocuments(query);
      
      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error searching users: ${error.message}`);
    }
  }

  // Search users alphabetically by name or email for collaboration
  static async searchUsersAlphabetically(query, excludeUserId = null, limit = 20) {
    try {
      const db = getDatabase();
      
      // Create case-insensitive search regex
      const searchRegex = new RegExp(query, 'i');
      
      // Build query
      const searchQuery = {
        $and: [
          {
            $or: [
              { firstName: { $regex: searchRegex } },
              { lastName: { $regex: searchRegex } },
              { username: { $regex: searchRegex } },
              { email: { $regex: searchRegex } }
            ]
          }
        ]
      };

      // Exclude current user if specified
      if (excludeUserId) {
        searchQuery.$and.push({ _id: { $ne: new ObjectId(excludeUserId) } });
      }

      const users = await db.collection('users')
        .find(searchQuery, { 
          projection: { 
            _id: 1,
            firstName: 1,
            lastName: 1, 
            username: 1,
            email: 1, 
            profilePicture: 1,
            password: 0 
          }
        })
        .sort({ firstName: 1, lastName: 1 }) // Sort alphabetically by name
        .limit(limit)
        .toArray();
      
      // Transform to match expected format
      return users.map(user => ({
        id: user._id.toString(),
        name: `${user.firstName} ${user.lastName}`.trim() || user.username,
        email: user.email,
        avatar: user.profilePicture
      }));
    } catch (error) {
      console.error('Error searching users alphabetically:', error);
      return [];
    }
  }

  // Find user by ID (for Clerk integration)
  static async findById(id) {
    try {
      const db = getDatabase();
      const user = await db.collection('users').findOne({ 
        $or: [
          { _id: new ObjectId(id) },
          { clerkId: id } // Support Clerk user IDs
        ]
      });
      return user;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  // Update or create user from Clerk data
  static async upsertFromClerk(clerkUser) {
    try {
      const db = getDatabase();
      
      const userData = {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        username: clerkUser.username || `${clerkUser.firstName}${clerkUser.lastName}`.toLowerCase(),
        profilePicture: clerkUser.profileImageUrl || '',
        lastLogin: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('users').updateOne(
        { $or: [{ clerkId: clerkUser.id }, { email: userData.email }] },
        { 
          $set: userData,
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      );

      return {
        success: true,
        userId: result.upsertedId || result.matchedCount > 0 ? 'updated' : 'created'
      };
    } catch (error) {
      console.error('Error upserting user from Clerk:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = User;
