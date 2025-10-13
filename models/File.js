const { ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const s3Service = require('../services/S3Service');

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
    
    // S3 storage fields
    this.storageType = data.storageType || (process.env.AWS_S3_BUCKET_NAME ? 's3' : 'mongodb');
    this.s3Key = data.s3Key || null;
    this.s3Bucket = data.s3Bucket || null;
    this.s3ETag = data.s3ETag || null;
  }

  // Get database connection
  static getDatabase() {
    return getDB();
  }

  // Create a new file
  static async create(fileData) {
    const db = getDatabase();
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
    
    // Upload to S3 if it's a file (not directory) and S3 is configured
    if (file.type === 'file' && file.storageType === 's3' && file.content) {
      try {
        const s3Result = await s3Service.uploadFile(
          file.projectId,
          file.path,
          file.content,
          file.language ? `text/${file.language}` : 'text/plain'
        );
        
        file.s3Key = s3Result.s3Key;
        file.s3Bucket = s3Result.bucket;
        file.s3ETag = s3Result.etag;
        
        // Don't store content in MongoDB when using S3
        file.content = '';
        
        console.log(`✅ File uploaded to S3: ${file.path}`);
      } catch (error) {
        console.error(`❌ S3 upload failed, falling back to MongoDB:`, error);
        // Fallback to MongoDB if S3 fails
        file.storageType = 'mongodb';
      }
    }
    
    const result = await filesCollection.insertOne(file);
    file._id = result.insertedId;
    
    // Create initial version (store in S3 or MongoDB depending on storage type)
    await this.createVersion(file.fileId, fileData.content || '', file.createdBy, 'Initial version', file.storageType);
    
    return file;
  }

  // Get file by ID
  static async findById(fileId, includeContent = true) {
    const db = getDatabase();
    const filesCollection = db.collection('files');
    
    const fileData = await filesCollection.findOne({ fileId });
    if (!fileData) return null;
    
    const file = new File(fileData);
    
    // Fetch content from S3 if stored there
    if (includeContent && file.storageType === 's3' && file.s3Key && file.type === 'file') {
      try {
        file.content = await s3Service.downloadFile(file.s3Key);
      } catch (error) {
        console.error(`❌ Failed to fetch content from S3 for ${file.path}:`, error);
        file.content = '// Error loading file content from S3';
      }
    }
    
    return file;
  }

  // Get files by project ID
  static async findByProjectId(projectId) {
    const db = getDatabase();
    const filesCollection = db.collection('files');
    
    const files = await filesCollection.find({ projectId }).sort({ path: 1 }).toArray();
    return files.map(file => new File(file));
  }

  // Get file by path within project
  static async findByPath(projectId, path, includeContent = true) {
    const db = getDatabase();
    const filesCollection = db.collection('files');
    
    const fileData = await filesCollection.findOne({ projectId, path });
    if (!fileData) return null;
    
    const file = new File(fileData);
    
    // Fetch content from S3 if stored there
    if (includeContent && file.storageType === 's3' && file.s3Key && file.type === 'file') {
      try {
        file.content = await s3Service.downloadFile(file.s3Key);
      } catch (error) {
        console.error(`❌ Failed to fetch content from S3 for ${file.path}:`, error);
        file.content = '// Error loading file content from S3';
      }
    }
    
    return file;
  }

  // Update file content
  async updateContent(content, updatedBy, versionNote = 'Content update') {
    const db = getDatabase();
    const filesCollection = db.collection('files');
    
    // Check if file is locked by another user
    if (this.isLocked && this.lockedBy !== updatedBy) {
      throw new Error('File is locked by another user');
    }
    
    const oldContent = this.content;
    this.content = content;
    this.size = Buffer.byteLength(content, 'utf8');
    this.updatedAt = new Date();
    this.version += 1;
    
    // Update in S3 if using S3 storage
    if (this.storageType === 's3' && this.type === 'file') {
      try {
        const s3Result = await s3Service.uploadFile(
          this.projectId,
          this.path,
          content,
          this.language ? `text/${this.language}` : 'text/plain'
        );
        
        this.s3Key = s3Result.s3Key;
        this.s3ETag = s3Result.etag;
        
        // Don't store content in MongoDB
        await filesCollection.updateOne(
          { fileId: this.fileId },
          {
            $set: {
              size: this.size,
              updatedAt: this.updatedAt,
              version: this.version,
              s3Key: this.s3Key,
              s3ETag: this.s3ETag
            },
            $unset: { content: '' }
          }
        );
      } catch (error) {
        console.error(`❌ S3 update failed, using MongoDB:`, error);
        // Fallback to MongoDB
        this.storageType = 'mongodb';
        await filesCollection.updateOne(
          { fileId: this.fileId },
          {
            $set: {
              content: this.content,
              size: this.size,
              updatedAt: this.updatedAt,
              version: this.version,
              storageType: 'mongodb'
            }
          }
        );
      }
    } else {
      // MongoDB storage
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
    }
    
    // Create new version
    await File.createVersion(this.fileId, content, updatedBy, versionNote, this.storageType);
    
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
    const db = getDatabase();
    const filesCollection = db.collection('files');
    const versionsCollection = db.collection('fileVersions');
    
    // Delete from S3 if stored there
    if (this.storageType === 's3' && this.s3Key && this.type === 'file') {
      try {
        await s3Service.deleteFile(this.s3Key);
        console.log(`✅ Deleted file from S3: ${this.s3Key}`);
      } catch (error) {
        console.error(`❌ Failed to delete from S3:`, error);
        // Continue with database deletion even if S3 fails
      }
    }
    
    // Delete all versions
    await versionsCollection.deleteMany({ fileId: this.fileId });
    
    // Delete file from MongoDB
    await filesCollection.deleteOne({ fileId: this.fileId });
    
    return true;
  }

  // Create a new file version
  static async createVersion(fileId, content, createdBy, note = '', storageType = 'mongodb') {
    const db = getDatabase();
    const versionsCollection = db.collection('fileVersions');
    
    const versionId = uuidv4();
    const version = {
      versionId,
      fileId,
      content: storageType === 'mongodb' ? content : '', // Don't store content for S3 versions
      size: Buffer.byteLength(content, 'utf8'),
      createdBy,
      createdAt: new Date(),
      note,
      storageType,
      s3Key: null,
      s3ETag: null
    };
    
    // Upload version to S3 if using S3 storage
    if (storageType === 's3' && content) {
      try {
        const s3Result = await s3Service.uploadFile(
          fileId, // Use fileId as project identifier for versions
          `versions/${versionId}`,
          content,
          'text/plain'
        );
        
        version.s3Key = s3Result.s3Key;
        version.s3ETag = s3Result.etag;
      } catch (error) {
        console.error(`❌ Failed to upload version to S3, storing in MongoDB:`, error);
        version.storageType = 'mongodb';
        version.content = content;
      }
    }
    
    await versionsCollection.insertOne(version);
    return version;
  }

  // Get file versions
  static async getVersions(fileId) {
    const db = getDatabase();
    const versionsCollection = db.collection('fileVersions');
    
    const versions = await versionsCollection
      .find({ fileId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return versions;
  }

  // Get specific version content
  static async getVersionContent(fileId, versionId) {
    const db = getDatabase();
    const versionsCollection = db.collection('fileVersions');
    
    const version = await versionsCollection.findOne({ fileId, versionId });
    if (!version) return null;
    
    // Fetch from S3 if stored there
    if (version.storageType === 's3' && version.s3Key) {
      try {
        return await s3Service.downloadFile(version.s3Key);
      } catch (error) {
        console.error(`❌ Failed to fetch version from S3:`, error);
        return '// Error loading version content from S3';
      }
    }
    
    return version.content;
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
    const db = getDatabase();
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
    const db = getDatabase();
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
    const db = getDatabase();
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