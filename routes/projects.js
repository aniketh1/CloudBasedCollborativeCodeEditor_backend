const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const File = require('../models/File');
const ProjectTemplateService = require('../services/ProjectTemplateService');
const { auth } = require('../middleware/auth');

// Get user's projects
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const projects = await Project.getUserProjects(userId);

    res.json({
      success: true,
      projects: projects.map(project => ({
        projectId: project.projectId,
        name: project.name,
        description: project.description,
        template: project.template,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        lastOpenedAt: project.lastOpenedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    });
  }
});

// Get project by ID
router.get('/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    const project = await Project.findByProjectId(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user has access to this project
    if (project.userId !== userId && !project.collaborators.some(c => c.userId === userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get project files
    const files = await File.findByProjectId(projectId);
    const fileTree = await File.getFileTree(projectId);
    const stats = await File.getProjectStats(projectId);

    res.json({
      success: true,
      project: {
        projectId: project.projectId,
        name: project.name,
        description: project.description,
        template: project.template,
        userId: project.userId,
        collaborators: project.collaborators,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        lastOpenedAt: project.lastOpenedAt,
        settings: project.settings,
        files: files.map(file => ({
          fileId: file.fileId,
          name: file.name,
          path: file.path,
          content: file.content,
          language: file.language,
          size: file.size,
          type: file.type
        })),
        fileTree,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project'
    });
  }
});

// Get available project templates
router.get('/templates/list', async (req, res) => {
  try {
    const templates = ProjectTemplateService.getAvailableTemplates();

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates'
    });
  }
});

// Create new project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description = '', template = 'javascript', isPublic = false } = req.body;
    const userId = req.user.userId;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Project name is required'
      });
    }

    // Create project in database with schema-compliant data
    const projectData = {
      name: name.trim(),
      description: description.trim(),
      userId,
      template,
      projectType: template === 'python' ? 'python' : template === 'react' ? 'react' : 'nodejs',
      isActive: true,
      settings: {
        allowTerminal: true,
        allowFileOperations: true,
        restrictedPaths: []
      }
    };

    const project = await Project.create(projectData);

    // Create default template files
    try {
      const defaultFiles = await ProjectTemplateService.createDefaultFiles(
        project.projectId,
        userId,
        template
      );

      console.log(`✅ Created ${defaultFiles.length} default files for project ${project.name}`);
    } catch (fileError) {
      console.error('Error creating default files:', fileError);
      // Don't fail project creation if files fail
    }

    // Get the complete project with files
    const files = await File.findByProjectId(project.projectId);
    const fileTree = await File.getFileTree(project.projectId);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: {
        projectId: project.projectId,
        name: project.name,
        description: project.description,
        template: project.template,
        userId: project.userId,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        files: files.map(file => ({
          fileId: file.fileId,
          name: file.name,
          path: file.path,
          content: file.content,
          language: file.language,
          type: file.type
        })),
        fileTree
      }
    });
  } catch (error) {
    console.error('Error creating project:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: 'A project with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
});

// Update project
router.put('/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, settings } = req.body;
    const userId = req.user.userId;

    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user owns the project
    if (project.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only project owner can update project settings'
      });
    }

    // Update project
    if (name) project.name = name.trim();
    if (description !== undefined) project.description = description.trim();
    if (settings) {
      project.settings = { ...project.settings, ...settings };
    }

    await project.save();

    res.json({
      success: true,
      message: 'Project updated successfully',
      project: project.toJSON()
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project'
    });
  }
});

// Delete project
router.delete('/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user owns the project
    if (project.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only project owner can delete the project'
      });
    }

    // Delete all project files first
    const files = await File.findByProjectId(projectId);
    for (const file of files) {
      await file.delete();
    }

    // Delete the project
    await project.delete();

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project'
    });
  }
});

// Add collaborator to project
router.post('/:projectId/collaborators', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId: collaboratorId, role = 'editor' } = req.body;
    const userId = req.user.userId;

    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user owns the project
    if (project.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only project owner can add collaborators'
      });
    }

    await project.addCollaborator(collaboratorId, role);

    res.json({
      success: true,
      message: 'Collaborator added successfully',
      project: project.toJSON()
    });
  } catch (error) {
    console.error('Error adding collaborator:', error);
    
    if (error.message.includes('already a collaborator')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to add collaborator'
    });
  }
});

// Remove collaborator from project
router.delete('/:projectId/collaborators/:collaboratorId', auth, async (req, res) => {
  try {
    const { projectId, collaboratorId } = req.params;
    const userId = req.user.userId;

    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user owns the project
    if (project.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only project owner can remove collaborators'
      });
    }

    await project.removeCollaborator(collaboratorId);

    res.json({
      success: true,
      message: 'Collaborator removed successfully',
      project: project.toJSON()
    });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to remove collaborator'
    });
  }
});

// Get project collaborators
router.get('/:projectId/collaborators', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user has access to this project
    if (project.userId !== userId && !project.collaborators.some(c => c.userId === userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      collaborators: project.collaborators,
      owner: project.userId
    });
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collaborators'
    });
  }
});

// Clone project
router.post('/:projectId/clone', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name } = req.body;
    const userId = req.user.userId;

    const originalProject = await Project.findById(projectId);
    
    if (!originalProject) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user has access to the original project
    if (originalProject.userId !== userId && 
        !originalProject.collaborators.some(c => c.userId === userId) &&
        !originalProject.settings.isPublic) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Create cloned project
    const clonedProjectData = {
      name: name || `${originalProject.name} (Copy)`,
      description: `Cloned from: ${originalProject.name}`,
      userId,
      settings: { ...originalProject.settings }
    };

    const clonedProject = await Project.create(clonedProjectData);

    // Clone all files
    const originalFiles = await File.findByProjectId(projectId);
    const clonedFiles = [];

    for (const originalFile of originalFiles) {
      const clonedFileData = {
        projectId: clonedProject.projectId,
        name: originalFile.name,
        path: originalFile.path,
        content: originalFile.content,
        language: originalFile.language,
        type: originalFile.type,
        createdBy: userId
      };

      const clonedFile = await File.create(clonedFileData);
      clonedFiles.push(clonedFile);
    }

    const fileTree = await File.getFileTree(clonedProject.projectId);

    res.status(201).json({
      success: true,
      message: 'Project cloned successfully',
      project: {
        ...clonedProject.toJSON(),
        files: clonedFiles.map(file => file.toJSON()),
        fileTree
      }
    });
  } catch (error) {
    console.error('Error cloning project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clone project'
    });
  }
});

module.exports = router;