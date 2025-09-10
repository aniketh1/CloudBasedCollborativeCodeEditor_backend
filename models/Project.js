const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

class Project {
  constructor(projectData) {
    this.name = projectData.name;
    this.description = projectData.description || '';
    this.localPath = projectData.localPath;
    this.createdBy = projectData.createdBy;
    this.participants = projectData.participants || [];
    this.roomId = projectData.roomId;
    this.projectType = projectData.projectType || 'general'; // 'nodejs', 'react', 'python', etc.
    this.isActive = projectData.isActive !== undefined ? projectData.isActive : true;
    this.settings = projectData.settings || {
      allowTerminal: true,
      allowFileOperations: true,
      restrictedPaths: []
    };
    this.createdAt = projectData.createdAt || new Date();
    this.updatedAt = projectData.updatedAt || new Date();
  }

  // Create a new project
  async save() {
    try {
      const db = getDB();
      const collection = db.collection('projects');

      // Validate local path exists
      if (this.localPath) {
        try {
          await fs.access(this.localPath);
        } catch (error) {
          throw new Error(`Local path does not exist: ${this.localPath}`);
        }
      }

      // Convert createdBy to ObjectId if it's a valid ObjectId string, otherwise use as string
      let createdByQuery;
      if (ObjectId.isValid(this.createdBy)) {
        createdByQuery = new ObjectId(this.createdBy);
      } else {
        createdByQuery = this.createdBy;
      }

      // Check if project name already exists for this user
      const existingProject = await collection.findOne({
        name: this.name,
        createdBy: createdByQuery
      });

      if (existingProject) {
        throw new Error('Project with this name already exists');
      }

      const result = await collection.insertOne({
        name: this.name,
        description: this.description,
        localPath: this.localPath,
        createdBy: createdByQuery,
        participants: this.participants.map(id => ObjectId.isValid(id) ? new ObjectId(id) : id),
        roomId: this.roomId,
        projectType: this.projectType,
        isActive: this.isActive,
        settings: this.settings,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      });

      return { success: true, projectId: result.insertedId };
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  // Find project by ID
  static async findById(projectId) {
    try {
      const db = getDB();
      const collection = db.collection('projects');
      
      // Convert projectId to ObjectId if valid, otherwise use as string
      const projectQuery = ObjectId.isValid(projectId) ? new ObjectId(projectId) : projectId;
      const project = await collection.findOne({ _id: projectQuery });
      return project;
    } catch (error) {
      console.error('Error finding project by ID:', error);
      return null;
    }
  }

  // Find project by room ID
  static async findByRoomId(roomId) {
    try {
      const db = getDB();
      const collection = db.collection('projects');
      
      const project = await collection.findOne({ roomId: roomId });
      return project;
    } catch (error) {
      console.error('Error finding project by room ID:', error);
      return null;
    }
  }

  // Get user's projects
  static async getUserProjects(userId) {
    try {
      const db = getDB();
      const collection = db.collection('projects');
      
      // Convert userId to ObjectId if it's a valid ObjectId string, otherwise use as string
      const userQuery = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
      
      const projects = await collection.find({
        $or: [
          { createdBy: userQuery },
          { participants: userQuery }
        ],
        isActive: true
      }).sort({ updatedAt: -1 }).toArray();

      return projects;
    } catch (error) {
      console.error('Error getting user projects:', error);
      return [];
    }
  }

  // Update project
  static async updateProject(projectId, updateData) {
    try {
      const db = getDB();
      const collection = db.collection('projects');

      // Convert projectId to ObjectId if valid, otherwise use as string
      const projectQuery = ObjectId.isValid(projectId) ? new ObjectId(projectId) : projectId;

      const result = await collection.updateOne(
        { _id: projectQuery },
        { 
          $set: { 
            ...updateData, 
            updatedAt: new Date() 
          } 
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error updating project:', error);
      return false;
    }
  }

  // Delete project
  static async deleteProject(projectId) {
    try {
      const db = getDB();
      const collection = db.collection('projects');

      // Convert projectId to ObjectId if valid, otherwise use as string
      const projectQuery = ObjectId.isValid(projectId) ? new ObjectId(projectId) : projectId;

      const result = await collection.updateOne(
        { _id: projectQuery },
        { 
          $set: { 
            isActive: false,
            updatedAt: new Date() 
          } 
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }

  // Add participant to project
  static async addParticipant(projectId, userId) {
    try {
      const db = getDB();
      const collection = db.collection('projects');

      // Convert inputs to ObjectId if valid, otherwise use as string
      const projectQuery = ObjectId.isValid(projectId) ? new ObjectId(projectId) : projectId;
      const userQuery = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

      const result = await collection.updateOne(
        { _id: projectQuery },
        { 
          $addToSet: { participants: userQuery },
          $set: { updatedAt: new Date() }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error adding participant:', error);
      return false;
    }
  }

  // Remove participant from project
  static async removeParticipant(projectId, userId) {
    try {
      const db = getDB();
      const collection = db.collection('projects');

      // Convert inputs to ObjectId if valid, otherwise use as string
      const projectQuery = ObjectId.isValid(projectId) ? new ObjectId(projectId) : projectId;
      const userQuery = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

      const result = await collection.updateOne(
        { _id: projectQuery },
        { 
          $pull: { participants: userQuery },
          $set: { updatedAt: new Date() }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Error removing participant:', error);
      return false;
    }
  }

  // Get project statistics
  static async getProjectStats() {
    try {
      const db = getDB();
      const collection = db.collection('projects');

      const stats = await collection.aggregate([
        {
          $group: {
            _id: null,
            totalProjects: { $sum: 1 },
            activeProjects: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            projectsByType: {
              $push: '$projectType'
            }
          }
        }
      ]).toArray();

      if (stats.length === 0) {
        return {
          totalProjects: 0,
          activeProjects: 0,
          projectsByType: {}
        };
      }

      const typeCount = {};
      stats[0].projectsByType.forEach(type => {
        typeCount[type] = (typeCount[type] || 0) + 1;
      });

      return {
        totalProjects: stats[0].totalProjects,
        activeProjects: stats[0].activeProjects,
        projectsByType: typeCount
      };
    } catch (error) {
      console.error('Error getting project statistics:', error);
      return {
        totalProjects: 0,
        activeProjects: 0,
        projectsByType: {}
      };
    }
  }

  // Validate project path access
  static async validatePathAccess(projectId, requestedPath) {
    try {
      const project = await this.findById(projectId);
      if (!project) {
        return { valid: false, reason: 'Project not found' };
      }

      const normalizedProjectPath = path.resolve(project.localPath);
      const normalizedRequestedPath = path.resolve(requestedPath);

      // Check if requested path is within project directory
      if (!normalizedRequestedPath.startsWith(normalizedProjectPath)) {
        return { valid: false, reason: 'Path outside project directory' };
      }

      // Check restricted paths
      const restrictedPaths = project.settings.restrictedPaths || [];
      for (const restrictedPath of restrictedPaths) {
        const normalizedRestrictedPath = path.resolve(path.join(normalizedProjectPath, restrictedPath));
        if (normalizedRequestedPath.startsWith(normalizedRestrictedPath)) {
          return { valid: false, reason: 'Access to restricted path denied' };
        }
      }

      return { valid: true };
    } catch (error) {
      console.error('Error validating path access:', error);
      return { valid: false, reason: 'Path validation error' };
    }
  }
}

module.exports = Project;
