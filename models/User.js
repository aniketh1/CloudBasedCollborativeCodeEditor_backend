const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
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
      const db = getDB();
      
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
      const db = getDB();
      const user = await db.collection('users').findOne({ email });
      return user;
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  // Find user by username
  static async findByUsername(username) {
    try {
      const db = getDB();
      const user = await db.collection('users').findOne({ username });
      return user;
    } catch (error) {
      throw new Error(`Error finding user by username: ${error.message}`);
    }
  }

  // Find user by ID
  static async findById(userId) {
    try {
      const db = getDB();
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
      const db = getDB();
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
      const db = getDB();
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
      const db = getDB();
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
      const db = getDB();
      const result = await db.collection('users').deleteOne({ _id: new ObjectId(userId) });
      return { success: result.deletedCount > 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Search users by username or email
  static async search(searchTerm, page = 1, limit = 10) {
    try {
      const db = getDB();
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
}

module.exports = User;
