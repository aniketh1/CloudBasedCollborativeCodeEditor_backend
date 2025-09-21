const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');

class Project {
  constructor(data) {
    this.projectId = data.projectId || uuidv4();
    this.roomId = data.roomId || uuidv4();
    this.name = data.name;
    this.description = data.description || '';
    this.template = data.template || 'blank';
    this.createdBy = data.userId || data.createdBy; // Map userId to createdBy for schema compliance
    this.participants = data.collaborators || data.participants || [];
    this.projectType = data.projectType || 'general';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.lastOpenedAt = data.lastOpenedAt || new Date();
    this.settings = data.settings || {
      allowTerminal: true,
      allowFileOperations: true,
      restrictedPaths: []
    };
    
    // Keep userId for backward compatibility in API responses
    this.userId = data.userId || data.createdBy;
    this.collaborators = data.collaborators || data.participants || [];
  }

  static async create(projectData) {
    const database = getDatabase();
    const project = new Project(projectData);
    
    // Create document that matches the schema
    const documentToInsert = {
      projectId: project.projectId,
      name: project.name,
      description: project.description,
      roomId: project.roomId,
      createdBy: project.createdBy,
      participants: project.participants,
      projectType: project.projectType,
      isActive: project.isActive,
      settings: project.settings,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await database.collection('projects').insertOne(documentToInsert);

    return {
      ...project,
      _id: result.insertedId
    };
  }

  static async findByProjectId(projectId) {
    const database = getDatabase();
    return await database.collection('projects').findOne({ projectId });
  }

  static async findByRoomId(roomId) {
    const database = getDatabase();
    return await database.collection('projects').findOne({ roomId });
  }

  static async getUserProjects(userId) {
    const database = getDatabase();
    return await database.collection('projects').find({
      $or: [
        { createdBy: userId },
        { participants: userId }
      ]
    }).sort({ updatedAt: -1 }).toArray();
  }

  static async updateLastOpened(projectId) {
    const database = getDatabase();
    return await database.collection('projects').updateOne(
      { projectId },
      { 
        $set: { 
          lastOpenedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );
  }

  static async addCollaborator(projectId, userId) {
    const database = getDatabase();
    return await database.collection('projects').updateOne(
      { projectId },
      { 
        $addToSet: { collaborators: userId },
        $set: { updatedAt: new Date() }
      }
    );
  }

  static async removeCollaborator(projectId, userId) {
    const database = getDatabase();
    return await database.collection('projects').updateOne(
      { projectId },
      { 
        $pull: { collaborators: userId },
        $set: { updatedAt: new Date() }
      }
    );
  }

  static async updateSettings(projectId, settings) {
    const database = getDatabase();
    return await database.collection('projects').updateOne(
      { projectId },
      { 
        $set: { 
          settings: { ...settings },
          updatedAt: new Date()
        }
      }
    );
  }

  static async delete(projectId) {
    const database = getDatabase();
    
    // Delete all files associated with the project
    await database.collection('files').deleteMany({ projectId });
    
    // Delete file versions
    await database.collection('fileVersions').deleteMany({ projectId });
    
    // Delete collaboration sessions
    await database.collection('collaborationSessions').deleteMany({ projectId });
    
    // Delete the project
    return await database.collection('projects').deleteOne({ projectId });
  }
}

module.exports = Project;