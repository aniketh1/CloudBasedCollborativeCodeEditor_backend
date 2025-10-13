const mongoose = require('mongoose');

// File Schema
const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  path: {
    type: String,
    required: true,
    unique: true
  },
  content: {
    type: String,
    default: ''
  },
  // S3 storage fields
  s3Key: {
    type: String,
    default: null // S3 object key (e.g., "projects/{projectId}/files/{path}")
  },
  s3Bucket: {
    type: String,
    default: null // S3 bucket name
  },
  s3ETag: {
    type: String,
    default: null // S3 ETag for version tracking
  },
  storageType: {
    type: String,
    enum: ['mongodb', 's3'],
    default: 'mongodb' // Default to MongoDB for backward compatibility
  },
  language: {
    type: String,
    default: 'javascript'
  },
  size: {
    type: Number,
    default: 0
  },
  roomId: {
    type: String,
    required: true,
    index: true
  },
  parentFolderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  createdBy: {
    type: String,
    required: true
  },
  lastModifiedBy: {
    type: String,
    required: true
  },
  collaborators: [{
    userId: String,
    permission: {
      type: String,
      enum: ['read', 'write', 'admin'],
      default: 'write'
    }
  }],
  version: {
    type: Number,
    default: 1
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Folder Schema
const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  path: {
    type: String,
    required: true,
    unique: true
  },
  roomId: {
    type: String,
    required: true,
    index: true
  },
  parentFolderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  createdBy: {
    type: String,
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Room Schema
const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  owner: {
    type: String,
    required: true
  },
  collaborators: [{
    userId: String,
    name: String,
    email: String,
    role: {
      type: String,
      enum: ['owner', 'admin', 'editor', 'viewer'],
      default: 'editor'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    maxCollaborators: {
      type: Number,
      default: 5
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    allowGuestAccess: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add indexes for better performance
fileSchema.index({ roomId: 1, path: 1 });
fileSchema.index({ roomId: 1, parentFolderId: 1 });
folderSchema.index({ roomId: 1, path: 1 });
folderSchema.index({ roomId: 1, parentFolderId: 1 });
roomSchema.index({ roomId: 1 });

// Pre-save middleware to update file size
fileSchema.pre('save', function(next) {
  // Update size if content is modified and stored in MongoDB
  if (this.isModified('content') && this.storageType === 'mongodb') {
    this.size = Buffer.byteLength(this.content, 'utf8');
  }
  next();
});

// Virtual for getting file extension
fileSchema.virtual('extension').get(function() {
  const parts = this.name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
});

// Virtual for getting folder children
folderSchema.virtual('children', {
  ref: 'File',
  localField: '_id',
  foreignField: 'parentFolderId'
});

// Virtual for getting folder subfolders
folderSchema.virtual('subfolders', {
  ref: 'Folder',
  localField: '_id',
  foreignField: 'parentFolderId'
});

const File = mongoose.model('File', fileSchema);
const Folder = mongoose.model('Folder', folderSchema);
const Room = mongoose.model('Room', roomSchema);

module.exports = { File, Folder, Room };