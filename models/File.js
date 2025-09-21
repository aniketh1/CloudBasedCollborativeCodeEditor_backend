const { MongoClient, ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

class File {
  constructor(data) {
    this.fileId = data.fileId || uuidv4();
    this.projectId = data.projectId;
    this.name = data.name;
    this.path = data.path;
    this.content = data.content || '';
    this.language = data.language || 'javascript';
    this.size = data.size || 0;
    this.type = data.type || 'file'; // 'file' or 'directory'
    this.parentId = data.parentId || null;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.version = data.version || 1;
    this.isLocked = data.isLocked || false;
    this.lockedBy = data.lockedBy || null;
    this.lockedAt = data.lockedAt || null;
  }

  // Get database connection
  static async getDatabase() {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    return client.db('codedev');
  }

  // Create a new file
  static async create(fileData) {
    const db = await this.getDatabase();
    const filesCollection = db.collection('files');
    
    const file = new File(fileData);
    
    // Ensure unique path within project
    const existingFile = await filesCollection.findOne({
      projectId: file.projectId,
      path: file.path
    });
    
    if (existingFile) {
      throw new Error('File already exists at this path');
    }
    
    const result = await filesCollection.insertOne(file);
    file._id = result.insertedId;
    
    // Create initial version
    await this.createVersion(file.fileId, file.content, file.createdBy, 'Initial version');
    
    return file;
  }

  // Get file by ID
  static async findById(fileId) {
    const db = await this.getDatabase();
    const filesCollection = db.collection('files');
    
    const file = await filesCollection.findOne({ fileId });
    return file ? new File(file) : null;
  }

  // Get files by project ID
  static async findByProjectId(projectId) {
    const db = await this.getDatabase();
    const filesCollection = db.collection('files');
    
    const files = await filesCollection.find({ projectId }).sort({ path: 1 }).toArray();
    return files.map(file => new File(file));
  }

  // Get file by path within project
  static async findByPath(projectId, path) {
    const db = await this.getDatabase();
    const filesCollection = db.collection('files');
    
    const file = await filesCollection.findOne({ projectId, path });
    return file ? new File(file) : null;
  }

  // Update file content
  async updateContent(content, updatedBy, versionNote = 'Content update') {
    const db = await File.getDatabase();
    const filesCollection = db.collection('files');
    
    // Check if file is locked by another user
    if (this.isLocked && this.lockedBy !== updatedBy) {
      throw new Error('File is locked by another user');
    }
    
    this.content = content;
    this.size = Buffer.byteLength(content, 'utf8');
    this.updatedAt = new Date();
    this.version += 1;
    
    await filesCollection.updateOne(
      { fileId: this.fileId },
      {
        $set: {
          content: this.content,
          size: this.size,
          updatedAt: this.updatedAt,
          version: this.version
        }
      }
    );
    
    // Create new version
    await File.createVersion(this.fileId, content, updatedBy, versionNote);
    
    return this;
  }

  // Lock file for editing
  async lock(userId) {
    const db = await File.getDatabase();
    const filesCollection = db.collection('files');
    
    if (this.isLocked && this.lockedBy !== userId) {
      throw new Error('File is already locked by another user');
    }
    
    this.isLocked = true;
    this.lockedBy = userId;
    this.lockedAt = new Date();
    
    await filesCollection.updateOne(
      { fileId: this.fileId },
      {
        $set: {
          isLocked: this.isLocked,
          lockedBy: this.lockedBy,
          lockedAt: this.lockedAt
        }
      }
    );
    
    return this;
  }

  // Unlock file
  async unlock(userId) {
    const db = await File.getDatabase();
    const filesCollection = db.collection('files');
    
    // Only the user who locked it or admin can unlock
    if (this.lockedBy !== userId) {
      throw new Error('You can only unlock files you have locked');
    }
    
    this.isLocked = false;
    this.lockedBy = null;
    this.lockedAt = null;
    
    await filesCollection.updateOne(
      { fileId: this.fileId },
      {
        $set: {
          isLocked: this.isLocked,
          lockedBy: this.lockedBy,
          lockedAt: this.lockedAt
        }
      }
    );
    
    return this;
  }

  // Delete file
  async delete() {
    const db = await File.getDatabase();
    const filesCollection = db.collection('files');
    const versionsCollection = db.collection('fileVersions');
    
    // Delete all versions
    await versionsCollection.deleteMany({ fileId: this.fileId });
    
    // Delete file
    await filesCollection.deleteOne({ fileId: this.fileId });
    
    return true;
  }

  // Create a new file version
  static async createVersion(fileId, content, createdBy, note = '') {
    const db = await this.getDatabase();
    const versionsCollection = db.collection('fileVersions');
    
    const version = {
      versionId: uuidv4(),
      fileId,
      content,
      size: Buffer.byteLength(content, 'utf8'),
      createdBy,
      createdAt: new Date(),
      note
    };
    
    await versionsCollection.insertOne(version);
    return version;
  }

  // Get file versions
  static async getVersions(fileId) {
    const db = await this.getDatabase();
    const versionsCollection = db.collection('fileVersions');
    
    const versions = await versionsCollection
      .find({ fileId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return versions;
  }

  // Get specific version content
  static async getVersionContent(fileId, versionId) {
    const db = await this.getDatabase();
    const versionsCollection = db.collection('fileVersions');
    
    const version = await versionsCollection.findOne({ fileId, versionId });
    return version ? version.content : null;
  }

  // Create directory
  static async createDirectory(projectId, path, createdBy, parentId = null) {
    const directoryData = {
      projectId,
      name: path.split('/').pop(),
      path,
      type: 'directory',
      parentId,
      createdBy,
      content: '',
      size: 0
    };
    
    return await this.create(directoryData);
  }

  // Get directory contents
  static async getDirectoryContents(projectId, directoryPath = '') {
    const db = await this.getDatabase();
    const filesCollection = db.collection('files');
    
    // Get immediate children of the directory
    const query = {
      projectId,
      path: new RegExp(`^${directoryPath}[^/]+/?$`)
    };
    
    const files = await filesCollection.find(query).sort({ type: 1, name: 1 }).toArray();
    return files.map(file => new File(file));
  }

  // Generate file tree structure
  static async getFileTree(projectId) {
    const files = await this.findByProjectId(projectId);
    
    const tree = {
      name: 'root',
      type: 'directory',
      children: []
    };
    
    // Sort files by path
    files.sort((a, b) => a.path.localeCompare(b.path));
    
    files.forEach(file => {
      const pathParts = file.path.split('/').filter(part => part);
      let currentLevel = tree.children;
      
      pathParts.forEach((part, index) => {
        const existingNode = currentLevel.find(node => node.name === part);
        
        if (existingNode) {
          currentLevel = existingNode.children = existingNode.children || [];
        } else {
          const isFile = index === pathParts.length - 1 && file.type === 'file';
          const newNode = {
            name: part,
            type: isFile ? 'file' : 'directory',
            path: file.path,
            fileId: isFile ? file.fileId : undefined,
            language: isFile ? file.language : undefined,
            size: isFile ? file.size : undefined,
            children: isFile ? undefined : []
          };
          
          currentLevel.push(newNode);
          if (!isFile) {
            currentLevel = newNode.children;
          }
        }
      });
    });
    
    return tree;
  }

  // Search files by content or name
  static async search(projectId, query, searchContent = false) {
    const db = await this.getDatabase();
    const filesCollection = db.collection('files');
    
    const searchQuery = {
      projectId,
      $or: [
        { name: new RegExp(query, 'i') },
        { path: new RegExp(query, 'i') }
      ]
    };
    
    // Add content search if requested
    if (searchContent) {
      searchQuery.$or.push({ content: new RegExp(query, 'i') });
    }
    
    const files = await filesCollection.find(searchQuery).sort({ path: 1 }).toArray();
    return files.map(file => new File(file));
  }

  // Get project statistics
  static async getProjectStats(projectId) {
    const db = await this.getDatabase();
    const filesCollection = db.collection('files');
    
    const stats = await filesCollection.aggregate([
      { $match: { projectId } },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: { $cond: [{ $eq: ['$type', 'file'] }, 1, 0] } },
          totalDirectories: { $sum: { $cond: [{ $eq: ['$type', 'directory'] }, 1, 0] } },
          totalSize: { $sum: '$size' },
          languages: { $addToSet: '$language' }
        }
      }
    ]).toArray();
    
    return stats[0] || {
      totalFiles: 0,
      totalDirectories: 0,
      totalSize: 0,
      languages: []
    };
  }

  // Convert to JSON (for API responses)
  toJSON() {
    return {
      fileId: this.fileId,
      projectId: this.projectId,
      name: this.name,
      path: this.path,
      content: this.content,
      language: this.language,
      size: this.size,
      type: this.type,
      parentId: this.parentId,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
      isLocked: this.isLocked,
      lockedBy: this.lockedBy,
      lockedAt: this.lockedAt
    };
  }
}

module.exports = File;