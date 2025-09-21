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

class File {
  constructor(data) {
    this.fileId = data.fileId || uuidv4();
    this.projectId = data.projectId;
    this.filePath = data.filePath;
    this.fileName = data.fileName;
    this.content = data.content || '';
    this.language = data.language || 'plaintext';
    this.size = data.size || 0;
    this.isDirectory = data.isDirectory || false;
    this.parentPath = data.parentPath || '';
    this.createdBy = data.createdBy;
    this.lastModifiedBy = data.lastModifiedBy;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.version = data.version || 1;
    this.isLocked = data.isLocked || false;
    this.lockedBy = data.lockedBy || null;
    this.lockExpiry = data.lockExpiry || null;
  }

  static async create(fileData) {
    const database = await initDB();
    const file = new File(fileData);
    
    // Set file size
    file.size = Buffer.byteLength(file.content, 'utf8');
    
    const result = await database.collection('files').insertOne({
      ...file,
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create initial version
    await database.collection('fileVersions').insertOne({
      fileId: file.fileId,
      projectId: file.projectId,
      version: 1,
      content: file.content,
      createdBy: file.createdBy,
      createdAt: new Date(),
      changeNote: 'Initial version'
    });

    return {
      ...file,
      _id: result.insertedId
    };
  }

  static async findByFileId(fileId) {
    const database = await initDB();
    return await database.collection('files').findOne({ fileId });
  }

  static async findByPath(projectId, filePath) {
    const database = await initDB();
    return await database.collection('files').findOne({ projectId, filePath });
  }

  static async getProjectFiles(projectId) {
    const database = await initDB();
    return await database.collection('files').find({ projectId }).sort({ filePath: 1 }).toArray();
  }

  static async getDirectoryContents(projectId, parentPath = '') {
    const database = await initDB();
    return await database.collection('files').find({ 
      projectId, 
      parentPath 
    }).sort({ isDirectory: -1, fileName: 1 }).toArray();
  }

  static async updateContent(fileId, content, userId) {
    const database = await initDB();
    
    // Get current file
    const file = await database.collection('files').findOne({ fileId });
    if (!file) {
      throw new Error('File not found');
    }

    // Create new version
    const newVersion = file.version + 1;
    await database.collection('fileVersions').insertOne({
      fileId,
      projectId: file.projectId,
      version: newVersion,
      content,
      createdBy: userId,
      createdAt: new Date(),
      changeNote: `Update by ${userId}`
    });

    // Update file
    return await database.collection('files').updateOne(
      { fileId },
      { 
        $set: { 
          content,
          size: Buffer.byteLength(content, 'utf8'),
          lastModifiedBy: userId,
          updatedAt: new Date(),
          version: newVersion
        }
      }
    );
  }

  static async lockFile(fileId, userId, duration = 30000) { // 30 seconds default
    const database = await initDB();
    const lockExpiry = new Date(Date.now() + duration);
    
    return await database.collection('files').updateOne(
      { fileId, $or: [{ isLocked: false }, { lockExpiry: { $lt: new Date() } }] },
      { 
        $set: { 
          isLocked: true,
          lockedBy: userId,
          lockExpiry,
          updatedAt: new Date()
        }
      }
    );
  }

  static async unlockFile(fileId, userId) {
    const database = await initDB();
    
    return await database.collection('files').updateOne(
      { fileId, lockedBy: userId },
      { 
        $set: { 
          isLocked: false,
          lockedBy: null,
          lockExpiry: null,
          updatedAt: new Date()
        }
      }
    );
  }

  static async deleteFile(fileId) {
    const database = await initDB();
    
    // Delete file versions
    await database.collection('fileVersions').deleteMany({ fileId });
    
    // Delete the file
    return await database.collection('files').deleteOne({ fileId });
  }

  static async getFileVersions(fileId, limit = 10) {
    const database = await initDB();
    return await database.collection('fileVersions').find({ fileId })
      .sort({ version: -1 })
      .limit(limit)
      .toArray();
  }

  static async createDirectory(projectId, dirPath, userId) {
    const database = await initDB();
    
    const pathParts = dirPath.split('/').filter(part => part !== '');
    const dirName = pathParts[pathParts.length - 1];
    const parentPath = pathParts.slice(0, -1).join('/');

    const directory = new File({
      projectId,
      filePath: dirPath,
      fileName: dirName,
      content: '',
      isDirectory: true,
      parentPath,
      createdBy: userId,
      lastModifiedBy: userId
    });

    return await File.create(directory);
  }

  static async getFileTree(projectId) {
    const database = await initDB();
    const files = await database.collection('files').find({ projectId }).toArray();
    
    // Build tree structure
    const tree = {};
    
    files.forEach(file => {
      const pathParts = file.filePath.split('/').filter(part => part !== '');
      let current = tree;
      
      pathParts.forEach((part, index) => {
        if (index === pathParts.length - 1) {
          // This is the file/directory itself
          current[part] = {
            ...file,
            type: file.isDirectory ? 'directory' : 'file',
            children: file.isDirectory ? {} : undefined
          };
        } else {
          // This is a parent directory
          if (!current[part]) {
            current[part] = {
              type: 'directory',
              children: {}
            };
          }
          current = current[part].children;
        }
      });
    });
    
    return tree;
  }
}

module.exports = File;