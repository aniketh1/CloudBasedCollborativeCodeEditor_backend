const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// Get available workspace/project folders for browsing
router.get('/browse', async (req, res) => {
  try {
    const { path: requestedPath } = req.query;

    if (!requestedPath || requestedPath === '') {
      // Return safe default workspace locations for web environment
      const workspaceDir = process.env.WORKSPACE_DIR || '/tmp/workspace';
      
      // Ensure workspace directory exists
      try {
        await fs.mkdir(workspaceDir, { recursive: true });
      } catch (error) {
        console.log('Workspace directory already exists or created');
      }

      const defaultPaths = [
        { path: workspaceDir, name: 'Workspace', type: 'directory', description: 'Your project workspace' },
        { path: path.join(workspaceDir, 'projects'), name: 'Projects', type: 'directory', description: 'Uploaded projects' },
        { path: path.join(workspaceDir, 'templates'), name: 'Templates', type: 'directory', description: 'Project templates' },
      ];

      // Create default directories if they don't exist
      for (const dir of defaultPaths) {
        try {
          await fs.mkdir(dir.path, { recursive: true });
        } catch (error) {
          // Directory already exists or permission issue
        }
      }

      return res.json({
        success: true,
        currentPath: '',
        items: defaultPaths,
        isWebEnvironment: true,
        message: 'Upload projects using the file upload feature'
      });
    }

    // Validate path is within workspace for security
    const workspaceDir = process.env.WORKSPACE_DIR || '/tmp/workspace';
    const resolvedPath = path.resolve(requestedPath);
    const resolvedWorkspace = path.resolve(workspaceDir);
    
    if (!resolvedPath.startsWith(resolvedWorkspace)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Path outside workspace'
      });
    }

    // Browse the requested path
    let items;
    try {
      const dirItems = await fs.readdir(requestedPath, { withFileTypes: true });
      
      items = dirItems
        .filter(item => item.isDirectory() || item.isFile())
        .map(item => ({
          path: path.join(requestedPath, item.name),
          name: item.name,
          type: item.isDirectory() ? 'directory' : 'file',
          size: item.isFile() ? 0 : undefined // Will be populated later if needed
        }))
        .sort((a, b) => {
          // Sort directories first, then files
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });

      // Add parent directory option if not at workspace root
      const parentDir = path.dirname(requestedPath);
      if (parentDir !== requestedPath && resolvedPath !== resolvedWorkspace) {
        items.unshift({
          path: parentDir,
          name: '..',
          type: 'parent'
        });
      }
    } catch (error) {
      console.error('Error reading directory:', error);
      return res.status(500).json({
        success: false,
        error: 'Unable to read directory'
      });
    }

    res.json({
      success: true,
      currentPath: requestedPath,
      items: items
    });

  } catch (error) {
    console.error('Error browsing path:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to access the requested path'
    });
  }
});

// Upload project folder (for local file access)
router.post('/upload-project', async (req, res) => {
  try {
    const { projectName, files } = req.body;
    
    if (!projectName || !files) {
      return res.status(400).json({
        success: false,
        error: 'Project name and files are required'
      });
    }

    const workspaceDir = process.env.WORKSPACE_DIR || '/tmp/workspace';
    const projectDir = path.join(workspaceDir, 'projects', projectName);

    // Create project directory
    await fs.mkdir(projectDir, { recursive: true });

    // Save uploaded files
    for (const file of files) {
      const filePath = path.join(projectDir, file.path);
      const fileDir = path.dirname(filePath);
      
      // Ensure directory exists
      await fs.mkdir(fileDir, { recursive: true });
      
      // Write file content (assuming base64 encoded)
      const content = Buffer.from(file.content, 'base64');
      await fs.writeFile(filePath, content);
    }

    res.json({
      success: true,
      message: `Project "${projectName}" uploaded successfully`,
      projectPath: projectDir
    });

  } catch (error) {
    console.error('Error uploading project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload project'
    });
  }
});

// Get file content
router.get('/file/:projectPath', async (req, res) => {
  try {
    const { projectPath } = req.params;
    const { filePath } = req.query;

    const workspaceDir = process.env.WORKSPACE_DIR || '/tmp/workspace';
    const fullFilePath = path.join(workspaceDir, projectPath, filePath);

    // Security check
    const resolvedPath = path.resolve(fullFilePath);
    const resolvedWorkspace = path.resolve(workspaceDir);
    
    if (!resolvedPath.startsWith(resolvedWorkspace)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const content = await fs.readFile(fullFilePath, 'utf8');
    const stats = await fs.stat(fullFilePath);

    res.json({
      success: true,
      content: content,
      size: stats.size,
      lastModified: stats.mtime
    });

  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to read file'
    });
  }
});

module.exports = router;
