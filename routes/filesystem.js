const express = require('express');
const router = express.Router();
const File = require('../models/File');
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');

// Get file structure for a room (used by FileExplorer)
router.get('/structure/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    console.log(`📂 Getting file structure for room: ${roomId}`);
    
    // Find project by roomId
    const project = await Project.findByRoomId(roomId);
    if (!project) {
      console.log(`⚠️ Project not found for roomId: ${roomId}`);
      return res.status(404).json({ 
        success: false,
        error: 'Project not found for this room' 
      });
    }
    
    console.log(`✅ Found project: ${project.projectId}`);
    
    // Get all files for this project (without loading content)
    const files = await File.findByProjectId(project.projectId);
    
    console.log(`📄 Found ${files.length} files for project ${project.projectId}`);
    console.log(`📝 File types:`, files.map(f => `${f.name} (${f.type})`));
    
    // Build file structure
    const filesList = files
      .filter(f => f.type === 'file')
      .map(f => ({
        id: f.fileId,
        name: f.name,
        path: f.path,
        type: 'file',
        language: f.language,
        size: f.size,
        parentFolderId: f.parentId,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt
      }));
      
    const foldersList = files
      .filter(f => f.type === 'directory')
      .map(f => ({
        id: f.fileId,
        name: f.name,
        path: f.path,
        type: 'folder',
        parentFolderId: f.parentId,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt
      }));
    
    const structure = {
      files: filesList,
      folders: foldersList
    };
    
    console.log(`📊 Returning structure: ${filesList.length} files, ${foldersList.length} folders`);
    
    res.json({
      success: true,
      structure
    });
  } catch (error) {
    console.error('❌ Error fetching file structure:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch file structure' 
    });
  }
});

// Get project file structure
router.get('/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Verify project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get file tree structure
    const fileTree = await File.getFileTree(projectId);
    const files = await File.findByProjectId(projectId);
    const stats = await File.getProjectStats(projectId);
    
    res.json({
      projectId,
      fileTree,
      files: files.map(file => file.toJSON()),
      stats
    });
  } catch (error) {
    console.error('Error fetching file system:', error);
    res.status(500).json({ error: 'Failed to fetch file system' });
  }
});

// Get specific file content
router.get('/:projectId/file/:fileId', auth, async (req, res) => {
  try {
    const { projectId, fileId } = req.params;
    
    const file = await File.findById(fileId);
    
    if (!file || file.projectId !== projectId) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json(file.toJSON());
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Get file by path
router.get('/:projectId/path/*', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const filePath = req.params[0]; // Everything after /path/
    
    const file = await File.findByPath(projectId, filePath);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found at path' });
    }
    
    res.json(file.toJSON());
  } catch (error) {
    console.error('Error fetching file by path:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Create new file
router.post('/:projectId/file', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, path, content = '', language = 'javascript', parentId } = req.body;
    const userId = req.user.userId;
    
    // Verify project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const fileData = {
      projectId,
      name,
      path,
      content,
      language,
      parentId,
      createdBy: userId,
      type: 'file'
    };
    
    const file = await File.create(fileData);
    
    res.status(201).json({
      message: 'File created successfully',
      file: file.toJSON()
    });
  } catch (error) {
    console.error('Error creating file:', error);
    if (error.message === 'File already exists at this path') {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create file' });
  }
});

// Create new directory
router.post('/:projectId/directory', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, path, parentId } = req.body;
    const userId = req.user.userId;
    
    // Verify project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const directory = await File.createDirectory(projectId, path, userId, parentId);
    
    res.status(201).json({
      message: 'Directory created successfully',
      directory: directory.toJSON()
    });
  } catch (error) {
    console.error('Error creating directory:', error);
    if (error.message === 'File already exists at this path') {
      return res.status(409).json({ error: 'Directory already exists at this path' });
    }
    res.status(500).json({ error: 'Failed to create directory' });
  }
});

// Update file content
router.put('/:projectId/file/:fileId', auth, async (req, res) => {
  try {
    const { projectId, fileId } = req.params;
    const { content, versionNote = 'Content update' } = req.body;
    const userId = req.user.userId;
    
    const file = await File.findById(fileId);
    
    if (!file || file.projectId !== projectId) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    await file.updateContent(content, userId, versionNote);
    
    res.json({
      message: 'File updated successfully',
      file: file.toJSON()
    });
  } catch (error) {
    console.error('Error updating file:', error);
    if (error.message === 'File is locked by another user') {
      return res.status(423).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// Lock file for editing
router.post('/:projectId/file/:fileId/lock', auth, async (req, res) => {
  try {
    const { projectId, fileId } = req.params;
    const userId = req.user.userId;
    
    const file = await File.findById(fileId);
    
    if (!file || file.projectId !== projectId) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    await file.lock(userId);
    
    res.json({
      message: 'File locked successfully',
      file: file.toJSON()
    });
  } catch (error) {
    console.error('Error locking file:', error);
    if (error.message === 'File is already locked by another user') {
      return res.status(423).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to lock file' });
  }
});

// Unlock file
router.post('/:projectId/file/:fileId/unlock', auth, async (req, res) => {
  try {
    const { projectId, fileId } = req.params;
    const userId = req.user.userId;
    
    const file = await File.findById(fileId);
    
    if (!file || file.projectId !== projectId) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    await file.unlock(userId);
    
    res.json({
      message: 'File unlocked successfully',
      file: file.toJSON()
    });
  } catch (error) {
    console.error('Error unlocking file:', error);
    if (error.message === 'You can only unlock files you have locked') {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to unlock file' });
  }
});

// Delete file or directory
router.delete('/:projectId/file/:fileId', auth, async (req, res) => {
  try {
    const { projectId, fileId } = req.params;
    
    const file = await File.findById(fileId);
    
    if (!file || file.projectId !== projectId) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    await file.delete();
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get file versions
router.get('/:projectId/file/:fileId/versions', auth, async (req, res) => {
  try {
    const { projectId, fileId } = req.params;
    
    const file = await File.findById(fileId);
    
    if (!file || file.projectId !== projectId) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const versions = await File.getVersions(fileId);
    
    res.json({ versions });
  } catch (error) {
    console.error('Error fetching file versions:', error);
    res.status(500).json({ error: 'Failed to fetch file versions' });
  }
});

// Get specific version content
router.get('/:projectId/file/:fileId/version/:versionId', auth, async (req, res) => {
  try {
    const { projectId, fileId, versionId } = req.params;
    
    const file = await File.findById(fileId);
    
    if (!file || file.projectId !== projectId) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const content = await File.getVersionContent(fileId, versionId);
    
    if (!content) {
      return res.status(404).json({ error: 'Version not found' });
    }
    
    res.json({ content });
  } catch (error) {
    console.error('Error fetching version content:', error);
    res.status(500).json({ error: 'Failed to fetch version content' });
  }
});

// Search files
router.get('/:projectId/search', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { q: query, content = false } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const files = await File.search(projectId, query, content === 'true');
    
    res.json({
      query,
      results: files.map(file => file.toJSON())
    });
  } catch (error) {
    console.error('Error searching files:', error);
    res.status(500).json({ error: 'Failed to search files' });
  }
});

// Get directory contents
router.get('/:projectId/directory', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { path = '' } = req.query;
    
    const contents = await File.getDirectoryContents(projectId, path);
    
    res.json({
      path,
      contents: contents.map(file => file.toJSON())
    });
  } catch (error) {
    console.error('Error fetching directory contents:', error);
    res.status(500).json({ error: 'Failed to fetch directory contents' });
  }
});

module.exports = router;