const express = require('express');
const router = express.Router();
const fileSystemService = require('../services/FileSystemService');
const NativeFile = require('../models/File');

// Error handling wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Get file structure for a room
router.get('/structure/:roomId', asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  
  if (!roomId) {
    return res.status(400).json({
      success: false,
      error: 'Room ID is required'
    });
  }

  console.log(`Getting file structure for room: ${roomId}`);
  const structure = await fileSystemService.getFileStructure(roomId);
  
  res.json({
    success: true,
    structure
  });
}));

// Get file content by fileId (supports S3 files)
router.get('/file/:fileId', asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  
  if (!fileId) {
    return res.status(400).json({
      success: false,
      error: 'File ID is required'
    });
  }

  console.log(`📄 Getting file content for fileId: ${fileId}`);
  
  // Use native File model to get content (handles S3 automatically)
  const file = await NativeFile.findById(fileId);
  
  if (!file) {
    console.log(`⚠️ File not found: ${fileId}`);
    return res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }
  
  console.log(`✅ Found file: ${file.name} (storage: ${file.storageType})`);
  
  res.json({
    success: true,
    file: {
      id: file.fileId,
      name: file.name,
      path: file.path,
      content: file.content,
      language: file.language,
      type: file.type,
      size: file.size,
      updatedAt: file.updatedAt
    }
  });
}));

// Update file content by fileId (supports S3 files)
router.put('/file/:fileId', asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  const { content } = req.body;
  
  if (!fileId) {
    return res.status(400).json({
      success: false,
      error: 'File ID is required'
    });
  }
  
  if (content === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Content is required'
    });
  }

  console.log(`💾 Saving file content for fileId: ${fileId} (${content?.length || 0} chars)`);
  
  // Use native File model to update content (handles S3 automatically)
  const updatedFile = await NativeFile.updateContent(fileId, content);
  
  if (!updatedFile) {
    console.log(`⚠️ Failed to update file: ${fileId}`);
    return res.status(404).json({
      success: false,
      error: 'File not found or update failed'
    });
  }
  
  console.log(`✅ Saved file: ${updatedFile.name} to ${updatedFile.storageType}`);
  
  res.json({
    success: true,
    file: {
      id: updatedFile.fileId,
      name: updatedFile.name,
      path: updatedFile.path,
      size: updatedFile.size,
      updatedAt: updatedFile.updatedAt,
      storageType: updatedFile.storageType
    }
  });
}));

// Get file content using POST to send path in body
router.post('/get-file/:roomId', asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { filePath } = req.body;
  
  if (!roomId || !filePath) {
    return res.status(400).json({
      success: false,
      error: 'Room ID and file path are required'
    });
  }

  console.log(`Getting file content: ${roomId}${filePath}`);
  const content = await fileSystemService.getFile(roomId, filePath);
  
  res.json({
    success: true,
    content,
    path: filePath
  });
}));

// Create or update file
router.post('/save-file/:roomId', asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { filePath, content, userId } = req.body;
  
  if (!roomId || !filePath || !userId) {
    return res.status(400).json({
      success: false,
      error: 'Room ID, file path, and user ID are required'
    });
  }

  console.log(`Creating/updating file: ${roomId}${filePath}`);
  const file = await fileSystemService.saveFile(roomId, filePath, content || '', userId);
  
  if (file) {
    res.json({
      success: true,
      file: {
        id: file._id,
        name: file.name,
        path: file.path,
        type: 'file',
        language: file.language,
        size: file.size,
        lastModified: file.updatedAt
      }
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'Failed to save file'
    });
  }
}));

// Create folder
router.post('/create-folder/:roomId', asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { folderPath, userId } = req.body;
  
  if (!roomId || !folderPath || !userId) {
    return res.status(400).json({
      success: false,
      error: 'Room ID, folder path, and user ID are required'
    });
  }

  console.log(`Creating folder: ${roomId}${folderPath}`);
  const folder = await fileSystemService.createFolder(roomId, folderPath, userId);
  
  if (folder) {
    res.json({
      success: true,
      folder: {
        id: folder._id,
        name: folder.name,
        path: folder.path,
        type: 'folder',
        parentFolderId: folder.parentFolderId,
        createdBy: folder.createdBy
      }
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'Failed to create folder'
    });
  }
}));

// Delete file
router.post('/delete-file/:roomId', asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { filePath } = req.body;
  
  if (!roomId || !filePath) {
    return res.status(400).json({
      success: false,
      error: 'Room ID and file path are required'
    });
  }

  console.log(`Deleting file: ${roomId}${filePath}`);
  const deleted = await fileSystemService.deleteFile(roomId, filePath);
  
  if (deleted) {
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }
}));

// Delete folder
router.post('/delete-folder/:roomId', asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { folderPath } = req.body;
  
  if (!roomId || !folderPath) {
    return res.status(400).json({
      success: false,
      error: 'Room ID and folder path are required'
    });
  }

  console.log(`Deleting folder: ${roomId}${folderPath}`);
  const deleted = await fileSystemService.deleteFolder(roomId, folderPath);
  
  if (deleted) {
    res.json({
      success: true,
      message: 'Folder deleted successfully'
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Folder not found'
    });
  }
}));

// Initialize default structure for a room
router.post('/init/:roomId', asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { userId } = req.body;
  
  if (!roomId || !userId) {
    return res.status(400).json({
      success: false,
      error: 'Room ID and user ID are required'
    });
  }

  console.log(`Initializing room structure for: ${roomId}`);
  const structure = await fileSystemService.createDefaultStructure(roomId, userId);
  
  res.json({
    success: true,
    structure
  });
}));

// Global error handler for this router
router.use((error, req, res, next) => {
  console.error('Filesystem API Error:', error);
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

module.exports = router;