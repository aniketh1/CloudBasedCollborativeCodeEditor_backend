const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const Project = require('../models/Project');

class FileSystemService {
  constructor() {
    this.allowedExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss', '.sass',
      '.json', '.md', '.txt', '.yml', '.yaml', '.xml', '.env',
      '.py', '.java', '.cpp', '.c', '.h', '.cs', '.php', '.rb',
      '.go', '.rs', '.vue', '.svelte', '.sql', '.sh', '.bat'
    ];
  }

  // Get project directory structure
  async getDirectoryStructure(projectId, relativePath = '') {
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const fullPath = path.join(project.localPath, relativePath);
      
      // Validate path access
      const pathValidation = await Project.validatePathAccess(projectId, fullPath);
      if (!pathValidation.valid) {
        throw new Error(pathValidation.reason);
      }

      const items = await fs.readdir(fullPath, { withFileTypes: true });
      const structure = [];

      for (const item of items) {
        const itemPath = path.join(fullPath, item.name);
        const relativItemPath = path.join(relativePath, item.name);

        if (item.isDirectory()) {
          structure.push({
            name: item.name,
            type: 'folder',
            path: relativItemPath,
            children: [] // Will be loaded on demand
          });
        } else if (item.isFile() && this.isAllowedFile(item.name)) {
          const stats = await fs.stat(itemPath);
          structure.push({
            name: item.name,
            type: 'file',
            path: relativItemPath,
            size: stats.size,
            lastModified: stats.mtime,
            extension: path.extname(item.name)
          });
        }
      }

      // Sort: folders first, then files, both alphabetically
      structure.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      return structure;
    } catch (error) {
      console.error('Error getting directory structure:', error);
      throw error;
    }
  }

  // Get project directory structure recursively (loads all nested folders)
  async getDirectoryStructureRecursive(projectId, relativePath = '', maxDepth = 5, currentDepth = 0) {
    try {
      if (currentDepth >= maxDepth) {
        console.log(`📁 Max depth ${maxDepth} reached for path: ${relativePath}`);
        return [];
      }

      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const fullPath = path.join(project.localPath, relativePath);
      
      // Validate path access
      const pathValidation = await Project.validatePathAccess(projectId, fullPath);
      if (!pathValidation.valid) {
        throw new Error(pathValidation.reason);
      }

      const items = await fs.readdir(fullPath, { withFileTypes: true });
      const structure = [];

      for (const item of items) {
        const itemPath = path.join(fullPath, item.name);
        const relativItemPath = path.join(relativePath, item.name);

        if (item.isDirectory()) {
          // Recursively load folder contents
          const children = await this.getDirectoryStructureRecursive(
            projectId, 
            relativItemPath, 
            maxDepth, 
            currentDepth + 1
          );
          
          structure.push({
            name: item.name,
            type: 'folder',
            path: relativItemPath,
            children: children
          });
        } else if (item.isFile() && this.isAllowedFile(item.name)) {
          const stats = await fs.stat(itemPath);
          structure.push({
            name: item.name,
            type: 'file',
            path: relativItemPath,
            size: stats.size,
            lastModified: stats.mtime,
            extension: path.extname(item.name)
          });
        }
      }

      // Sort: folders first, then files, both alphabetically
      structure.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      return structure;
    } catch (error) {
      console.error(`Error getting directory structure for ${relativePath}:`, error);
      // Return empty array instead of throwing to prevent breaking the entire structure
      return [];
    }
  }

  // Read file content
  async readFile(projectId, filePath) {
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const fullPath = path.join(project.localPath, filePath);
      
      // Validate path access
      const pathValidation = await Project.validatePathAccess(projectId, fullPath);
      if (!pathValidation.valid) {
        throw new Error(pathValidation.reason);
      }

      // Check if file exists and is a file
      const stats = await fs.stat(fullPath);
      if (!stats.isFile()) {
        throw new Error('Path is not a file');
      }

      // Check file size (limit to 1MB for safety)
      if (stats.size > 1024 * 1024) {
        throw new Error('File too large to read');
      }

      const content = await fs.readFile(fullPath, 'utf8');
      return {
        content,
        size: stats.size,
        lastModified: stats.mtime,
        extension: path.extname(fullPath)
      };
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }

  // Read folder contents
  async readFolder(projectId, folderPath) {
    try {
      console.log('📁 FileSystemService: Reading folder:', folderPath);
      const structure = await this.getDirectoryStructure(projectId, folderPath);
      console.log('📁 FileSystemService: Folder contents:', structure.length, 'items');
      return structure;
    } catch (error) {
      console.error('📁 FileSystemService: Error reading folder:', error);
      throw error;
    }
  }

  // Write file content
  async writeFile(projectId, filePath, content) {
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const fullPath = path.join(project.localPath, filePath);
      
      // Validate path access
      const pathValidation = await Project.validatePathAccess(projectId, fullPath);
      if (!pathValidation.valid) {
        throw new Error(pathValidation.reason);
      }

      // Ensure directory exists
      const dirPath = path.dirname(fullPath);
      await fs.mkdir(dirPath, { recursive: true });

      await fs.writeFile(fullPath, content, 'utf8');
      
      const stats = await fs.stat(fullPath);
      return {
        success: true,
        size: stats.size,
        lastModified: stats.mtime
      };
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  }

  // Create new file
  async createFile(projectId, filePath, content = '') {
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const fullPath = path.join(project.localPath, filePath);
      
      // Validate path access
      const pathValidation = await Project.validatePathAccess(projectId, fullPath);
      if (!pathValidation.valid) {
        throw new Error(pathValidation.reason);
      }

      // Check if file already exists
      try {
        await fs.access(fullPath);
        throw new Error('File already exists');
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      // Ensure directory exists
      const dirPath = path.dirname(fullPath);
      await fs.mkdir(dirPath, { recursive: true });

      await fs.writeFile(fullPath, content, 'utf8');
      
      const stats = await fs.stat(fullPath);
      return {
        success: true,
        name: path.basename(fullPath),
        path: filePath,
        size: stats.size,
        lastModified: stats.mtime,
        extension: path.extname(fullPath)
      };
    } catch (error) {
      console.error('Error creating file:', error);
      throw error;
    }
  }

  // Create new directory
  async createDirectory(projectId, dirPath) {
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const fullPath = path.join(project.localPath, dirPath);
      
      // Validate path access
      const pathValidation = await Project.validatePathAccess(projectId, fullPath);
      if (!pathValidation.valid) {
        throw new Error(pathValidation.reason);
      }

      await fs.mkdir(fullPath, { recursive: true });
      
      return {
        success: true,
        name: path.basename(fullPath),
        path: dirPath,
        type: 'folder'
      };
    } catch (error) {
      console.error('Error creating directory:', error);
      throw error;
    }
  }

  // Delete file or directory
  async deleteItem(projectId, itemPath) {
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const fullPath = path.join(project.localPath, itemPath);
      
      // Validate path access
      const pathValidation = await Project.validatePathAccess(projectId, fullPath);
      if (!pathValidation.valid) {
        throw new Error(pathValidation.reason);
      }

      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        await fs.rmdir(fullPath, { recursive: true });
      } else {
        await fs.unlink(fullPath);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  // Rename file or directory
  async renameItem(projectId, oldPath, newPath) {
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const fullOldPath = path.join(project.localPath, oldPath);
      const fullNewPath = path.join(project.localPath, newPath);
      
      // Validate both paths
      const oldPathValidation = await Project.validatePathAccess(projectId, fullOldPath);
      const newPathValidation = await Project.validatePathAccess(projectId, fullNewPath);
      
      if (!oldPathValidation.valid) {
        throw new Error(oldPathValidation.reason);
      }
      if (!newPathValidation.valid) {
        throw new Error(newPathValidation.reason);
      }

      await fs.rename(fullOldPath, fullNewPath);
      
      return { success: true };
    } catch (error) {
      console.error('Error renaming item:', error);
      throw error;
    }
  }

  // Execute terminal command in project directory
  async executeCommand(projectId, command, workingDirectory = '') {
    return new Promise(async (resolve, reject) => {
      try {
        const project = await Project.findById(projectId);
        if (!project) {
          reject(new Error('Project not found'));
          return;
        }

        if (!project.settings.allowTerminal) {
          reject(new Error('Terminal access disabled for this project'));
          return;
        }

        const cwd = workingDirectory ? 
          path.join(project.localPath, workingDirectory) : 
          project.localPath;

        // Validate working directory
        const pathValidation = await Project.validatePathAccess(projectId, cwd);
        if (!pathValidation.valid) {
          reject(new Error(pathValidation.reason));
          return;
        }

        // Determine shell based on platform
        const shell = process.platform === 'win32' ? 'cmd.exe' : 'bash';
        const args = process.platform === 'win32' ? ['/c', command] : ['-c', command];

        const childProcess = spawn(shell, args, {
          cwd: cwd,
          env: process.env,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        childProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        childProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        childProcess.on('close', (code) => {
          resolve({
            exitCode: code,
            stdout: stdout,
            stderr: stderr,
            success: code === 0
          });
        });

        childProcess.on('error', (error) => {
          reject(error);
        });

        // Timeout after 30 seconds
        setTimeout(() => {
          childProcess.kill();
          reject(new Error('Command timeout'));
        }, 30000);

      } catch (error) {
        reject(error);
      }
    });
  }

  // Check if file extension is allowed
  isAllowedFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    return this.allowedExtensions.includes(ext) || filename.startsWith('.');
  }

  // Get file language for Monaco Editor
  getFileLanguage(filename) {
    const ext = path.extname(filename).toLowerCase();
    const languageMap = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.json': 'json',
      '.md': 'markdown',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.h': 'c',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.vue': 'vue',
      '.xml': 'xml',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.sql': 'sql',
      '.sh': 'shell',
      '.bat': 'bat'
    };
    return languageMap[ext] || 'plaintext';
  }
}

module.exports = new FileSystemService();
