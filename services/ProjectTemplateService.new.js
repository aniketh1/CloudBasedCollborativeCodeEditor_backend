const File = require('../models/File');

class ProjectTemplateService {
  // Create default files for a new project
  static async createDefaultFiles(projectId, userId, templateType = 'javascript') {
    const defaultFiles = this.getTemplateFiles(templateType);
    const createdFiles = [];

    try {
      for (const fileTemplate of defaultFiles) {
        const fileData = {
          projectId,
          name: fileTemplate.name,
          path: fileTemplate.path,
          content: fileTemplate.content,
          language: fileTemplate.language,
          type: fileTemplate.type,
          createdBy: userId
        };

        const file = await File.create(fileData);
        createdFiles.push(file);
      }

      return createdFiles;
    } catch (error) {
      console.error('Error creating default files:', error);
      throw error;
    }
  }

  // Get template files based on project type
  static getTemplateFiles(templateType) {
    const templates = {
      javascript: [
        {
          name: 'index.js',
          path: 'index.js',
          type: 'file',
          language: 'javascript',
          content: `// Welcome to your new JavaScript project!
// Start coding here...

console.log('Hello, World! 🎉');

// Example function
function greet(name) {
  return \`Hello, \${name}! Welcome to collaborative coding.\`;
}

// Example usage
const message = greet('Developer');
console.log(message);

// TODO: Add your amazing code here!
`
        },
        {
          name: 'README.md',
          path: 'README.md',
          type: 'file',
          language: 'markdown',
          content: `# My Awesome Project

Welcome to your collaborative coding project! 🚀

## Getting Started

This project is set up for real-time collaboration. You can:

- ✅ Share this link with teammates
- ✅ Code together in real-time
- ✅ See live cursors and typing indicators
- ✅ Track file versions and changes

## Project Structure

\`\`\`
├── index.js          # Main application file
├── README.md         # Project documentation
├── src/              # Source code directory
│   └── components/   # Reusable components
└── tests/            # Test files
\`\`\`

## Features

- Real-time collaborative editing
- File versioning and history
- Live user presence indicators
- Advanced Monaco editor with IntelliSense
- Cross-platform compatibility

## Getting Started

1. Start editing files in the editor
2. Share the collaboration link with your team
3. Code together in real-time!

Happy coding! 🎉
`
        },
        {
          name: 'src',
          path: 'src',
          type: 'directory',
          language: '',
          content: ''
        },
        {
          name: 'main.js',
          path: 'src/main.js',
          type: 'file',
          language: 'javascript',
          content: `// Main application logic
// This file contains the core functionality of your app

class App {
  constructor() {
    this.name = 'Collaborative Code Editor';
    this.version = '1.0.0';
    this.init();
  }

  init() {
    console.log(\`\${this.name} v\${this.version} initialized!\`);
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Add your event listeners here
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOM fully loaded');
    });
  }

  // Add your methods here
  render() {
    // Render your app
  }
}

// Initialize the app
const app = new App();

export default app;
`
        },
        {
          name: 'components',
          path: 'src/components',
          type: 'directory',
          language: '',
          content: ''
        },
        {
          name: 'utils.js',
          path: 'src/utils.js',
          type: 'file',
          language: 'javascript',
          content: `// Utility functions for your project

/**
 * Debounce function to limit the rate of function calls
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to wait
 * @returns {Function} The debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit the rate of function calls
 * @param {Function} func - The function to throttle
 * @param {number} limit - The number of milliseconds to wait
 * @returns {Function} The throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Generate a random ID
 * @param {number} length - The length of the ID
 * @returns {string} A random ID
 */
export function generateId(length = 8) {
  return Math.random().toString(36).substring(2, length + 2);
}

/**
 * Format date to readable string
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
`
        },
        {
          name: 'tests',
          path: 'tests',
          type: 'directory',
          language: '',
          content: ''
        },
        {
          name: 'app.test.js',
          path: 'tests/app.test.js',
          type: 'file',
          language: 'javascript',
          content: `// Test file for your application
// Add your tests here

describe('App Tests', () => {
  test('should initialize correctly', () => {
    // Add your test logic here
    expect(true).toBe(true);
  });

  test('should handle user input', () => {
    // Add your test logic here
    expect(true).toBe(true);
  });
});

// Example test for utils
describe('Utils Tests', () => {
  test('generateId should return string of correct length', () => {
    // Test your utility functions
    expect(true).toBe(true);
  });
});
`
        }
      ],

      react: [
        {
          name: 'package.json',
          path: 'package.json',
          type: 'file',
          language: 'json',
          content: `{
  "name": "react-collaborative-project",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
`
        },
        {
          name: 'App.js',
          path: 'src/App.js',
          type: 'file',
          language: 'javascript',
          content: `import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [collaborators, setCollaborators] = useState([]);

  useEffect(() => {
    setMessage('Welcome to Collaborative React Development! 🎉');
  }, []);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 Collaborative React Project</h1>
        <p>{message}</p>
        
        <div className="features">
          <h2>Features:</h2>
          <ul>
            <li>✅ Real-time collaboration</li>
            <li>✅ Live cursor tracking</li>
            <li>✅ File versioning</li>
            <li>✅ Team presence indicators</li>
          </ul>
        </div>

        <div className="input-section">
          <input
            type="text"
            placeholder="Type something collaborative..."
            value={message}
            onChange={handleInputChange}
            className="collaborative-input"
          />
        </div>

        <div className="collaborators">
          <h3>Online Collaborators: {collaborators.length}</h3>
          {collaborators.map((user, index) => (
            <span key={index} className="collaborator-badge">
              {user.name}
            </span>
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;
`
        },
        {
          name: 'App.css',
          path: 'src/App.css',
          type: 'file',
          language: 'css',
          content: `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.features {
  margin: 20px 0;
  text-align: left;
}

.features ul {
  list-style: none;
  padding: 0;
}

.features li {
  margin: 10px 0;
  font-size: 1.1em;
}

.input-section {
  margin: 20px 0;
}

.collaborative-input {
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid #61dafb;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  min-width: 300px;
}

.collaborative-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.collaborators {
  margin-top: 20px;
}

.collaborator-badge {
  display: inline-block;
  background: #61dafb;
  color: #282c34;
  padding: 4px 8px;
  margin: 4px;
  border-radius: 16px;
  font-size: 0.8em;
  font-weight: bold;
}

/* Animation for real-time feel */
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.collaborative-input:focus {
  animation: pulse 1s infinite;
  outline: none;
  box-shadow: 0 0 10px rgba(97, 218, 251, 0.5);
}
`
        }
      ],

      python: [
        {
          name: 'main.py',
          path: 'main.py',
          type: 'file',
          language: 'python',
          content: `"""
Welcome to your collaborative Python project! 🐍

This is your main application file where you can start building
amazing things with your team in real-time.
"""

import sys
from datetime import datetime


def greet(name="World"):
    """
    A simple greeting function to get you started.
    
    Args:
        name (str): The name to greet
        
    Returns:
        str: A formatted greeting message
    """
    return f"Hello, {name}! Welcome to collaborative Python development! 🎉"


def get_system_info():
    """Get basic system information."""
    return {
        "python_version": sys.version,
        "timestamp": datetime.now().isoformat(),
        "platform": sys.platform
    }


class CollaborativeProject:
    """Main project class for collaborative development."""
    
    def __init__(self, project_name="My Awesome Project"):
        self.project_name = project_name
        self.collaborators = []
        self.created_at = datetime.now()
        
    def add_collaborator(self, name):
        """Add a new collaborator to the project."""
        self.collaborators.append({
            "name": name,
            "joined_at": datetime.now()
        })
        print(f"✅ {name} joined the project!")
        
    def get_project_info(self):
        """Get project information."""
        return {
            "name": self.project_name,
            "collaborators": len(self.collaborators),
            "created": self.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }


if __name__ == "__main__":
    # Welcome message
    print("🚀 Starting collaborative Python project...")
    print(greet())
    
    # Create project instance
    project = CollaborativeProject("Collaborative Code Editor")
    
    # Add some example collaborators
    project.add_collaborator("Developer 1")
    
    # Display project info
    info = project.get_project_info()
    print(f"\\n📊 Project: {info['name']}")
    print(f"👥 Collaborators: {info['collaborators']}")
    print(f"📅 Created: {info['created']}")
    
    # System info
    sys_info = get_system_info()
    print(f"\\n🐍 Python: {sys_info['python_version'].split()[0]}")
    print(f"⚡ Platform: {sys_info['platform']}")
    
    print("\\n✨ Happy collaborative coding! ✨")
`
        },
        {
          name: 'requirements.txt',
          path: 'requirements.txt',
          type: 'file',
          language: 'text',
          content: `# Project dependencies
# Add your Python packages here

# Development tools
pytest>=7.0.0
black>=22.0.0
flake8>=4.0.0

# Common useful packages
requests>=2.28.0
python-dotenv>=0.19.0

# Example data science packages (uncomment if needed)
# numpy>=1.21.0
# pandas>=1.4.0
# matplotlib>=3.5.0

# Example web framework (uncomment if needed)
# flask>=2.0.0
# fastapi>=0.75.0
`
        },
        {
          name: 'utils.py',
          path: 'src/utils.py',
          type: 'file',
          language: 'python',
          content: `"""
Utility functions for the collaborative project.

This module contains helper functions that can be used
throughout your project.
"""

import json
import time
from datetime import datetime
from typing import Dict, List, Any


def timestamp():
    """Get current timestamp in ISO format."""
    return datetime.now().isoformat()


def load_json_file(file_path: str) -> Dict[str, Any]:
    """
    Load and parse a JSON file.
    
    Args:
        file_path (str): Path to the JSON file
        
    Returns:
        Dict[str, Any]: Parsed JSON data
    """
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ File not found: {file_path}")
        return {}
    except json.JSONDecodeError:
        print(f"❌ Invalid JSON in file: {file_path}")
        return {}


def save_json_file(data: Dict[str, Any], file_path: str) -> bool:
    """
    Save data to a JSON file.
    
    Args:
        data (Dict[str, Any]): Data to save
        file_path (str): Path to save the file
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"❌ Error saving file: {e}")
        return False


def format_file_size(size_bytes: int) -> str:
    """
    Format file size in human readable format.
    
    Args:
        size_bytes (int): File size in bytes
        
    Returns:
        str: Formatted file size
    """
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"


def timer(func):
    """
    Decorator to measure function execution time.
    
    Args:
        func: Function to time
        
    Returns:
        Function wrapper
    """
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        execution_time = end_time - start_time
        print(f"⏱️  {func.__name__} executed in {execution_time:.4f} seconds")
        return result
    return wrapper


class Logger:
    """Simple logger for collaborative projects."""
    
    def __init__(self, name: str = "CollabProject"):
        self.name = name
        
    def log(self, message: str, level: str = "INFO"):
        """Log a message with timestamp."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {self.name}: {message}")
        
    def info(self, message: str):
        """Log info message."""
        self.log(message, "INFO")
        
    def error(self, message: str):
        """Log error message."""
        self.log(message, "ERROR")
        
    def warning(self, message: str):
        """Log warning message."""
        self.log(message, "WARNING")


# Example usage
if __name__ == "__main__":
    logger = Logger("Utils")
    logger.info("Utils module loaded successfully! 🎉")
    
    # Test timer decorator
    @timer
    def example_function():
        time.sleep(0.1)
        return "Function completed"
    
    result = example_function()
    logger.info(f"Result: {result}")
`
        }
      ]
    };

    return templates[templateType] || templates.javascript;
  }

  // Get available template types
  static getAvailableTemplates() {
    return [
      {
        id: 'javascript',
        name: 'JavaScript Project',
        description: 'Basic JavaScript project with examples and utilities',
        icon: '📄'
      },
      {
        id: 'react',
        name: 'React Application',
        description: 'React project with components and collaborative features',
        icon: '⚛️'
      },
      {
        id: 'python',
        name: 'Python Project',
        description: 'Python project with utilities and best practices',
        icon: '🐍'
      }
    ];
  }
}

module.exports = ProjectTemplateService;