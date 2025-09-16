const express = require('express');
const router = express.Router();
const fileSystemService = require('../services/FileSystemService');

// Get file structure for a room
router.get('/structure/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    if (!roomId) {
      return res.status(400).json({
        success: false,
        error: 'Room ID is required'
      });
    }

    const structure = await fileSystemService.getFileStructure(roomId);
    
    res.json({
      success: true,
      structure
    });
  } catch (error) {
    console.error('Error getting file structure:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file structure'
    });
  }
});

// Get file content
router.get('/file/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const filePath = req.query.path || '/';
    
    if (!roomId || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'Room ID and file path are required'
      });
    }

    const content = await fileSystemService.getFile(roomId, filePath);
    
    res.json({
      success: true,
      content,
      path: filePath
    });
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file content'
    });
  }
});

// Create or update file
router.post('/file/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { path: filePath, content, userId } = req.body;
    
    if (!roomId || !filePath || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Room ID, file path, and user ID are required'
      });
    }

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
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save file'
    });
  }
});

// Create folder
router.post('/folder/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { path: folderPath, userId } = req.body;
    
    if (!roomId || !folderPath || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Room ID, folder path, and user ID are required'
      });
    }

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
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create folder'
    });
  }
});

// Delete file
router.delete('/file/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const filePath = req.query.path;
    
    if (!roomId || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'Room ID and file path are required'
      });
    }

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
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    });
  }
});

// Delete folder
router.delete('/folder/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const folderPath = req.query.path;
    
    if (!roomId || !folderPath) {
      return res.status(400).json({
        success: false,
        error: 'Room ID and folder path are required'
      });
    }

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
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete folder'
    });
  }
});

// Initialize default structure for a room
router.post('/init/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;
    
    if (!roomId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Room ID and user ID are required'
      });
    }

    const structure = await fileSystemService.createDefaultStructure(roomId, userId);
    
    res.json({
      success: true,
      structure
    });
  } catch (error) {
    console.error('Error initializing room structure:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize room structure'
    });
  }
});

module.exports = router;