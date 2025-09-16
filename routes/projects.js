const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const FileSystemService = require('../services/FileSystemService');
const ProjectTemplateService = require('../services/ProjectTemplateService');
const { createNodeTemplate, createPythonTemplate, createVueTemplate, createAngularTemplate } = require('./project-templates');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const os = require('os');

// Create an instance of ProjectTemplateService
const templateService = new ProjectTemplateService();

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

    console.log(`Creating ${projectType || 'general'} project: ${name} in room ${roomId}`);

    // Create project metadata
    const project = new Project({
      name,
      description,
      localPath: `/projects/${roomId}`, // Virtual path for MongoDB storage
      createdBy: userId,
      roomId,
      projectType: projectType || 'general'
    });

    const result = await project.save();
    console.log(`Project metadata saved: ${result.projectId}`);

    // Create file structure in MongoDB based on template
    let templateResult = { success: true, filesCreated: 0 };
    
    if (projectType && projectType !== 'general') {
      console.log(`Creating ${projectType} template files in MongoDB...`);
      templateResult = await createProjectTemplate(projectType, roomId, userId);
    } else {
      // Create basic general project structure in MongoDB
      console.log('Creating general project files in MongoDB...');
      templateResult = await createGeneralTemplate(roomId, userId, name, description);
    }

    console.log(`Template result:`, templateResult);

    res.json({
      success: true,
      projectId: result.projectId,
      roomId: roomId,
      projectPath: `/projects/${roomId}`,
      filesCreated: templateResult.filesCreated,
      templateCreated: templateResult.success,
      message: templateResult.success ?
        `${projectType || 'general'} project "${name}" created successfully with ${templateResult.filesCreated} files!` :
        'Project created but template creation failed'
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to create general project template
async function createGeneralTemplate(roomId, userId, name, description) {
  try {
    let filesCreated = 0;

    // Create README.md
    const readmeContent = `# ${name}

${description || 'A new CodeDev project'}

## Getting Started

Welcome to your collaborative coding project! Start building something amazing.

## Features

- Real-time collaborative editing
- Multiple file support
- Live cursor tracking
- Auto-save functionality

Happy coding! 🚀
`;
    
    await FileSystemService.saveFile(roomId, 'README.md', readmeContent, userId);
    filesCreated++;

    // Create main entry file
    const indexContent = `// Welcome to ${name}
// Start coding here!

console.log("Hello, CodeDev!");
console.log("Project: ${name}");

// Your code goes here
function main() {
    // Start building your application
    console.log("Application started!");
}

main();
`;
    
    await FileSystemService.saveFile(roomId, 'index.js', indexContent, userId);
    filesCreated++;

    return { success: true, filesCreated };
  } catch (error) {
    console.error('Error creating general template:', error);
    return { success: false, error: error.message, filesCreated: 0 };
  }
}

// Helper function to create project templates
async function createProjectTemplate(projectType, roomId, userId) {
  try {
    let filesCreated = 0;

    switch (projectType) {
      case 'react':
        filesCreated = await createReactTemplate(roomId, userId);
        break;
      case 'node':
        filesCreated = await createNodeTemplate(roomId, userId);
        break;
      case 'python':
        filesCreated = await createPythonTemplate(roomId, userId);
        break;
      case 'vue':
        filesCreated = await createVueTemplate(roomId, userId);
        break;
      case 'angular':
        filesCreated = await createAngularTemplate(roomId, userId);
        break;
      default:
        return await createGeneralTemplate(roomId, userId, 'Project', '');
    }

    return { success: true, filesCreated };
  } catch (error) {
    console.error(`Error creating ${projectType} template:`, error);
    return { success: false, error: error.message, filesCreated: 0 };
  }
}

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

// Template creation functions
async function createReactTemplate(roomId, userId) {
  let filesCreated = 0;

  // Create package.json
  const packageJson = {
    "name": "react-codedev-project",
    "version": "0.1.0",
    "private": true,
    "dependencies": {
      "@testing-library/jest-dom": "^5.16.4",
      "@testing-library/react": "^13.3.0",
      "@testing-library/user-event": "^13.5.0",
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "react-scripts": "5.0.1",
      "web-vitals": "^2.1.4"
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
  };

  await FileSystemService.saveFile(roomId, 'package.json', JSON.stringify(packageJson, null, 2), userId);
  filesCreated++;

  // Create public/index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="React app created with CodeDev" />
    <title>React CodeDev App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`;

  await FileSystemService.saveFile(roomId, 'public/index.html', indexHtml, userId);
  filesCreated++;

  // Create src/index.js
  const srcIndex = `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;

  await FileSystemService.saveFile(roomId, 'src/index.js', srcIndex, userId);
  filesCreated++;

  // Create src/App.js
  const appJs = `import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('Welcome to React!');

  useEffect(() => {
    document.title = \`CodeDev React App - Count: \${count}\`;
  }, [count]);

  const handleIncrement = () => {
    setCount(prevCount => prevCount + 1);
    setMessage(\`You clicked \${count + 1} times!\`);
  };

  const handleDecrement = () => {
    setCount(prevCount => prevCount - 1);
    setMessage(\`You clicked \${count - 1} times!\`);
  };

  const resetCounter = () => {
    setCount(0);
    setMessage('Counter reset!');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 CodeDev React Project</h1>
        <div className="counter-section">
          <h2>{message}</h2>
          <div className="counter-display">
            <span className="count">{count}</span>
          </div>
          <div className="button-group">
            <button className="btn btn-increment" onClick={handleIncrement}>
              ➕ Increment
            </button>
            <button className="btn btn-decrement" onClick={handleDecrement}>
              ➖ Decrement
            </button>
            <button className="btn btn-reset" onClick={resetCounter}>
              🔄 Reset
            </button>
          </div>
        </div>
        <div className="info-section">
          <p>Edit <code>src/App.js</code> and save to reload.</p>
          <p>Start building your amazing React application!</p>
        </div>
      </header>
    </div>
  );
}

export default App;`;

  await FileSystemService.saveFile(roomId, 'src/App.js', appJs, userId);
  filesCreated++;

  // Create src/App.css
  const appCss = `.App {
  text-align: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.App-header {
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
}

.counter-section {
  margin: 30px 0;
  padding: 30px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.counter-display {
  margin: 20px 0;
}

.count {
  font-size: 4rem;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.button-group {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 20px;
}

.btn {
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.btn-increment {
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
}

.btn-decrement {
  background: linear-gradient(45deg, #f44336, #da190b);
  color: white;
}

.btn-reset {
  background: linear-gradient(45deg, #2196F3, #0b7dda);
  color: white;
}

.info-section {
  margin-top: 30px;
  font-size: 1.1rem;
  opacity: 0.9;
}

.info-section code {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

@media (max-width: 768px) {
  .button-group {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 200px;
  }
  
  .count {
    font-size: 3rem;
  }
}`;

  await FileSystemService.saveFile(roomId, 'src/App.css', appCss, userId);
  filesCreated++;

  // Create src/index.css
  const indexCss = `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

* {
  box-sizing: border-box;
}`;

  await FileSystemService.saveFile(roomId, 'src/index.css', indexCss, userId);
  filesCreated++;

  // Create README.md
  const readme = `# React CodeDev Project

Welcome to your React application created with CodeDev! 🚀

## Features

- ⚡ Modern React 18 with Hooks
- 🎨 Beautiful responsive UI
- 🔄 Interactive counter component
- 📱 Mobile-friendly design
- 🎯 Real-time collaborative editing

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the development server:
   \`\`\`bash
   npm start
   \`\`\`

3. Open [http://localhost:3000](http://localhost:3000) to view in browser

## Available Scripts

- \`npm start\` - Runs the app in development mode
- \`npm test\` - Launches the test runner
- \`npm run build\` - Builds the app for production
- \`npm run eject\` - Ejects from Create React App (one-way operation)

## Project Structure

\`\`\`
src/
├── App.js          # Main application component
├── App.css         # Application styles
├── index.js        # Application entry point
└── index.css       # Global styles
public/
└── index.html      # HTML template
\`\`\`

## Learn More

- [React Documentation](https://reactjs.org/docs)
- [Create React App Documentation](https://create-react-app.dev/docs)

Happy coding with CodeDev! 🎉`;

  await FileSystemService.saveFile(roomId, 'README.md', readme, userId);
  filesCreated++;

  return filesCreated;
}

module.exports = router;
