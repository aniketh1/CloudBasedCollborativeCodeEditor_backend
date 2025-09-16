// Simple in-memory file system service for deployed backend
class FileSystemService {
  constructor() {
    this.files = new Map();
  }

  getFile(roomId, fileName) {
    const roomFiles = this.files.get(roomId) || {};
    return roomFiles[fileName] || '';
  }

  saveFile(roomId, fileName, content) {
    if (!this.files.has(roomId)) {
      this.files.set(roomId, {});
    }
    const roomFiles = this.files.get(roomId);
    roomFiles[fileName] = content;
    return true;
  }

  createDefaultStructure(roomId) {
    const defaultFiles = {
      'untitled.js': `// Welcome to collaborative coding!
console.log('Real-time collaboration active!');`
    };
    this.files.set(roomId, defaultFiles);
    return defaultFiles;
  }
}

module.exports = new FileSystemService();
