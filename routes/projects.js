const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const FileSystemService = require('../services/FileSystemService');
const ProjectTemplateService = require('../services/ProjectTemplateService');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const os = require('os');

// Get user's projects
router.get('/', async (req, res) => {
  try {
    // For now, using a mock user ID since auth is not fully implemented
    const userId = req.query.userId || 'mock-user-id';

    const projects = await Project.getUserProjects(userId);

    res.json({
      success: true,
      projects: projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get available project templates
router.get('/templates', async (req, res) => {
  try {
    const templateService = new ProjectTemplateService();
    const templates = templateService.getAvailableTemplates();

    res.json({
      success: true,
      templates: templates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const { name, description, projectType } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required'
      });
    }

    const roomId = uuidv4();
    const userId = req.body.userId || 'mock-user-id'; // Mock user for now

    // Create a temporary project directory for the session
    const tempDir = path.join(os.tmpdir(), 'codedev-projects', roomId);
    const projectPath = path.join(tempDir, name);

    console.log(`Creating project directory: ${projectPath}`);
    
    // Ensure the temp directory exists
    await fs.mkdir(tempDir, { recursive: true });

    // Create project using our template system
    let templateResult = null;
    const templateService = new ProjectTemplateService();

    if (projectType && projectType !== 'general') {
      console.log(`Creating ${projectType} template project: ${name}`);
      templateResult = await templateService.createProject(projectType, name, tempDir);
      
      if (!templateResult.success) {
        return res.status(400).json({
          success: false,
          error: `Failed to create ${projectType} project: ${templateResult.error}`
        });
      }
      console.log(`Template project created at: ${templateResult.projectPath}`);
    } else {
      // Create a basic project structure for general projects
      await fs.mkdir(projectPath, { recursive: true });
      
      // Create a simple README file
      const readmeContent = `# ${name}\n\n${description || 'A new CodeDev project'}\n\nStart coding!`;
      await fs.writeFile(path.join(projectPath, 'README.md'), readmeContent);
      
      // Create a basic index file
      const indexContent = `// Welcome to ${name}\n// Start coding here!\n\nconsole.log("Hello, CodeDev!");`;
      await fs.writeFile(path.join(projectPath, 'index.js'), indexContent);
      
      templateResult = {
        success: true,
        projectPath: projectPath,
        files: ['README.md', 'index.js']
      };
    }

    const project = new Project({
      name,
      description,
      localPath: templateResult.projectPath,
      createdBy: userId,
      roomId,
      projectType: projectType || 'general'
    });

    const result = await project.save();

    res.json({
      success: true,
      projectId: result.projectId,
      roomId: roomId,
      projectPath: templateResult.projectPath,
      templateCreated: !!templateResult,
      message: templateResult ?
        `${projectType} project "${name}" created successfully with template!` :
        'Project created successfully'
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get project by ID
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      project: project
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete project
router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.query.userId || req.body.userId || 'mock-user-id';

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user owns the project
    if (project.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to delete this project'
      });
    }

    // Delete the project record
    await Project.delete(projectId);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
