const { MongoClient, ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

let db;

// Initialize database connection
const initDB = async () => {
  if (!db) {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
  }
  return db;
};

class Project {
  constructor(data) {
    this.projectId = data.projectId || uuidv4();
    this.roomId = data.roomId || uuidv4();
    this.name = data.name;
    this.description = data.description || '';
    this.template = data.template || 'blank';
    this.userId = data.userId;
    this.collaborators = data.collaborators || [];
    this.isPublic = data.isPublic || false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.lastOpenedAt = data.lastOpenedAt || new Date();
    this.settings = data.settings || {
      language: 'javascript',
      theme: 'vs-dark',
      fontSize: 14,
      autoSave: true
    };
  }

  static async create(projectData) {
    const database = await initDB();
    const project = new Project(projectData);
    
    const result = await database.collection('projects').insertOne({
      ...project,
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return {
      ...project,
      _id: result.insertedId
    };
  }

  static async findByProjectId(projectId) {
    const database = await initDB();
    return await database.collection('projects').findOne({ projectId });
  }

  static async findByRoomId(roomId) {
    const database = await initDB();
    return await database.collection('projects').findOne({ roomId });
  }

  static async getUserProjects(userId) {
    const database = await initDB();
    return await database.collection('projects').find({
      $or: [
        { userId },
        { collaborators: userId }
      ]
    }).sort({ lastOpenedAt: -1 }).toArray();
  }

  static async updateLastOpened(projectId) {
    const database = await initDB();
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
    const database = await initDB();
    return await database.collection('projects').updateOne(
      { projectId },
      { 
        $addToSet: { collaborators: userId },
        $set: { updatedAt: new Date() }
      }
    );
  }

  static async removeCollaborator(projectId, userId) {
    const database = await initDB();
    return await database.collection('projects').updateOne(
      { projectId },
      { 
        $pull: { collaborators: userId },
        $set: { updatedAt: new Date() }
      }
    );
  }

  static async updateSettings(projectId, settings) {
    const database = await initDB();
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
    const database = await initDB();
    
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