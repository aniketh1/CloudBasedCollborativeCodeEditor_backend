const { File, Folder, Room } = require('../models/FileSystem');
const path = require('path');

// MongoDB-based file system service for collaborative editing
class FileSystemService {
  constructor() {
    // Initialize any required connections or configurations
  }

  // Get file content by roomId and file path
  async getFile(roomId, filePath) {
    try {
      const file = await File.findOne({ 
        roomId, 
        path: filePath, 
        isDeleted: false 
      });
      return file ? file.content : '';
    } catch (error) {
      console.error('Error getting file:', error);
      return '';
    }
  }

  // Save file content
  async saveFile(roomId, filePath, content, userId) {
    try {
      const existingFile = await File.findOne({ 
        roomId, 
        path: filePath, 
        isDeleted: false 
      });

      if (existingFile) {
        // Update existing file
        existingFile.content = content;
        existingFile.lastModifiedBy = userId;
        existingFile.version += 1;
        existingFile.size = Buffer.byteLength(content, 'utf8');
        await existingFile.save();
        return existingFile;
      } else {
        // Create new file
        const fileName = path.basename(filePath);
        const parentPath = path.dirname(filePath);
        
        // Find parent folder if not root
        let parentFolderId = null;
        if (parentPath !== '.' && parentPath !== '/') {
          const parentFolder = await Folder.findOne({ 
            roomId, 
            path: parentPath, 
            isDeleted: false 
          });
          parentFolderId = parentFolder ? parentFolder._id : null;
        }

        const newFile = new File({
          name: fileName,
          path: filePath,
          content,
          roomId,
          parentFolderId,
          createdBy: userId,
          lastModifiedBy: userId,
          size: Buffer.byteLength(content, 'utf8'),
          language: this.getLanguageFromExtension(fileName)
        });

        await newFile.save();
        return newFile;
      }
    } catch (error) {
      console.error('Error saving file:', error);
      return null;
    }
  }

  // Create default project structure for a room
  async createDefaultStructure(roomId, userId) {
    try {
      // Check if room already has files
      const existingFiles = await File.find({ roomId, isDeleted: false });
      if (existingFiles.length > 0) {
        return this.getFileStructure(roomId);
      }

      // Create default file
      const defaultFile = {
        name: 'index.js',
        path: '/index.js',
        content: `// Welcome to collaborative coding!
console.log('Real-time collaboration active!');

// Start building your project here
function main() {
    console.log('Hello, World!');
}

main();`,
        roomId,
        createdBy: userId,
        lastModifiedBy: userId,
        language: 'javascript',
        size: 0
      };

      const file = new File(defaultFile);
      file.size = Buffer.byteLength(file.content, 'utf8');
      await file.save();

      return { [defaultFile.name]: defaultFile.content };
    } catch (error) {
      console.error('Error creating default structure:', error);
      return {};
    }
  }

  // Get complete file structure for a room
  async getFileStructure(roomId) {
    try {
      const [files, folders] = await Promise.all([
        File.find({ roomId, isDeleted: false }).sort({ path: 1 }),
        Folder.find({ roomId, isDeleted: false }).sort({ path: 1 })
      ]);

      return {
        files: files.map(file => ({
          id: file._id,
          name: file.name,
          path: file.path,
          type: 'file',
          language: file.language,
          size: file.size,
          parentFolderId: file.parentFolderId,
          lastModified: file.updatedAt,
          lastModifiedBy: file.lastModifiedBy
        })),
        folders: folders.map(folder => ({
          id: folder._id,
          name: folder.name,
          path: folder.path,
          type: 'folder',
          parentFolderId: folder.parentFolderId,
          createdBy: folder.createdBy
        }))
      };
    } catch (error) {
      console.error('Error getting file structure:', error);
      return { files: [], folders: [] };
    }
  }

  // Create a new folder
  async createFolder(roomId, folderPath, userId) {
    try {
      const folderName = path.basename(folderPath);
      const parentPath = path.dirname(folderPath);
      
      // Find parent folder if not root
      let parentFolderId = null;
      if (parentPath !== '.' && parentPath !== '/') {
        const parentFolder = await Folder.findOne({ 
          roomId, 
          path: parentPath, 
          isDeleted: false 
        });
        parentFolderId = parentFolder ? parentFolder._id : null;
      }

      const newFolder = new Folder({
        name: folderName,
        path: folderPath,
        roomId,
        parentFolderId,
        createdBy: userId
      });

      await newFolder.save();
      return newFolder;
    } catch (error) {
      console.error('Error creating folder:', error);
      return null;
    }
  }

  // Delete a file
  async deleteFile(roomId, filePath) {
    try {
      const file = await File.findOne({ 
        roomId, 
        path: filePath, 
        isDeleted: false 
      });
      
      if (file) {
        file.isDeleted = true;
        await file.save();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Delete a folder and all its contents
  async deleteFolder(roomId, folderPath) {
    try {
      // Mark folder as deleted
      const folder = await Folder.findOne({ 
        roomId, 
        path: folderPath, 
        isDeleted: false 
      });
      
      if (folder) {
        folder.isDeleted = true;
        await folder.save();

        // Mark all files in folder as deleted
        await File.updateMany(
          { roomId, path: { $regex: `^${folderPath}/` }, isDeleted: false },
          { isDeleted: true }
        );

        // Mark all subfolders as deleted
        await Folder.updateMany(
          { roomId, path: { $regex: `^${folderPath}/` }, isDeleted: false },
          { isDeleted: true }
        );

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting folder:', error);
      return false;
    }
  }

  // Helper method to determine language from file extension
  getLanguageFromExtension(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const languageMap = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.json': 'json',
      '.xml': 'xml',
      '.md': 'markdown',
      '.txt': 'plaintext'
    };
    return languageMap[ext] || 'plaintext';
  }
}

module.exports = new FileSystemService();
