const fs = require('fs').promises;
const path = require('path');

class ProjectTemplateService {
  constructor() {
    this.templates = {
      react: {
        name: 'React App',
        description: 'A modern React application with hooks',
        icon: 'React',
        files: {
          'src/App.js': `import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to React!</h1>
        <div className="counter">
          <p>Count: {count}</p>
          <button onClick={() => setCount(count + 1)}>
            Increment
          </button>
          <button onClick={() => setCount(count - 1)}>
            Decrement
          </button>
        </div>
        <p>Edit src/App.js and collaborate in real-time!</p>
      </header>
    </div>
  );
}

export default App;`,

          'src/App.css': `.App {
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

.counter {
  margin: 20px 0;
}

.counter button {
  margin: 0 10px;
  padding: 10px 20px;
  font-size: 16px;
  background-color: #61dafb;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  color: #282c34;
  font-weight: bold;
}

.counter button:hover {
  background-color: #21b7d4;
}

.counter p {
  font-size: 18px;
  margin: 10px 0;
}`,

          'src/index.js': `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,

          'src/index.css': `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`,

          'public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="React App created with Collaborative Code Editor" />
    <title>React Collaborative Project</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`,

          'package.json': `{
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
}`,

          'README.md': `# React Collaborative Project

This project was created with the Collaborative Code Editor.

## Features
- Modern React with Hooks
- Hot Reload
- CSS Styling
- Real-time Collaboration

## Getting Started

1. Install dependencies: npm install
2. Start development: npm start
3. Build for production: npm run build

Happy coding!`
        }
      },

      nodejs: {
        name: 'Node.js API',
        description: 'Express.js REST API with modern features',
        icon: 'Node',
        files: {
          'server.js': `const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Sample data
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'user' }
];

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Collaborative API!',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      health: '/health'
    }
  });
});

// Get all users
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: users,
    count: users.length
  });
});

// Get user by ID
app.get('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.json({
    success: true,
    data: user
  });
});

// Create new user
app.post('/api/users', (req, res) => {
  const { name, email, role = 'user' } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name and email are required'
    });
  }
  
  const newUser = {
    id: Math.max(...users.map(u => u.id)) + 1,
    name,
    email,
    role
  };
  
  users.push(newUser);
  
  res.status(201).json({
    success: true,
    data: newUser,
    message: 'User created successfully'
  });
});

// Update user
app.put('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  const { name, email, role } = req.body;
  
  if (name) users[userIndex].name = name;
  if (email) users[userIndex].email = email;
  if (role) users[userIndex].role = role;
  
  res.json({
    success: true,
    data: users[userIndex],
    message: 'User updated successfully'
  });
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  users.splice(userIndex, 1);
  
  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    users_count: users.length
  });
});

// Error handling middleware
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    available_endpoints: [
      '/',
      '/api/users',
      '/health'
    ]
  });
});

app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
  console.log(\`API docs available at http://localhost:\${PORT}\`);
});`,

          'package.json': `{
  "name": "nodejs-collaborative-api",
  "version": "1.0.0",
  "description": "Express.js API created with Collaborative Code Editor",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "keywords": ["nodejs", "express", "api", "collaborative", "rest"],
  "author": "Collaborative Code Editor",
  "license": "MIT"
}`,

          'README.md': `# Node.js Collaborative API

A modern Express.js REST API with CRUD operations.

## Features

- RESTful API endpoints
- CORS enabled
- JSON responses
- Error handling
- Health checks
- Real-time ready

## Installation

1. Install dependencies:
   npm install

2. Start development server:
   npm run dev

3. Start production server:
   npm start

## API Endpoints

### Users Management
- GET /api/users - Get all users
- POST /api/users - Create new user
- GET /api/users/:id - Get specific user
- PUT /api/users/:id - Update user
- DELETE /api/users/:id - Delete user

### System
- GET / - API documentation
- GET /health - Health check

## Usage Examples

### Get All Users
curl http://localhost:3000/api/users

### Create User
curl -X POST http://localhost:3000/api/users \\
  -H "Content-Type: application/json" \\
  -d '{"name": "John Doe", "email": "john@example.com", "role": "user"}'

### Update User
curl -X PUT http://localhost:3000/api/users/1 \\
  -H "Content-Type: application/json" \\
  -d '{"name": "John Updated", "role": "admin"}'

### Delete User
curl -X DELETE http://localhost:3000/api/users/1

Built with Express.js for real-time collaboration!`
        }
      },

      python: {
        name: 'Python Flask API',
        description: 'Flask web application with RESTful API',
        icon: 'Python',
        files: {
          'app.py': `from flask import Flask, request, jsonify
import os
from datetime import datetime

app = Flask(__name__)

# Sample data
users = [
    {"id": 1, "name": "John Doe", "email": "john@example.com", "role": "admin"},
    {"id": 2, "name": "Jane Smith", "email": "jane@example.com", "role": "user"},
    {"id": 3, "name": "Bob Johnson", "email": "bob@example.com", "role": "user"}
]

@app.route('/')
def home():
    """API documentation endpoint"""
    return jsonify({
        "message": "Welcome to the Flask Collaborative API!",
        "version": "1.0.0",
        "endpoints": {
            "users": "/api/users",
            "health": "/health"
        }
    })

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all users"""
    return jsonify({
        "success": True,
        "data": users,
        "count": len(users)
    })

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get specific user by ID"""
    user = next((u for u in users if u["id"] == user_id), None)
    
    if not user:
        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404
    
    return jsonify({
        "success": True,
        "data": user
    })

@app.route('/api/users', methods=['POST'])
def create_user():
    """Create new user"""
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('email'):
        return jsonify({
            "success": False,
            "message": "Name and email are required"
        }), 400
    
    new_user = {
        "id": max(u["id"] for u in users) + 1 if users else 1,
        "name": data["name"],
        "email": data["email"],
        "role": data.get("role", "user")
    }
    
    users.append(new_user)
    
    return jsonify({
        "success": True,
        "data": new_user,
        "message": "User created successfully"
    }), 201

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user by ID"""
    user = next((u for u in users if u["id"] == user_id), None)
    
    if not user:
        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404
    
    data = request.get_json()
    
    if data.get('name'):
        user['name'] = data['name']
    if data.get('email'):
        user['email'] = data['email']
    if data.get('role'):
        user['role'] = data['role']
    
    return jsonify({
        "success": True,
        "data": user,
        "message": "User updated successfully"
    })

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete user by ID"""
    global users
    user = next((u for u in users if u["id"] == user_id), None)
    
    if not user:
        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404
    
    users = [u for u in users if u["id"] != user_id]
    
    return jsonify({
        "success": True,
        "message": "User deleted successfully"
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "users_count": len(users)
    })

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        "success": False,
        "message": "Endpoint not found",
        "available_endpoints": [
            "/",
            "/api/users",
            "/health"
        ]
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        "success": False,
        "message": "Internal server error"
    }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"Starting Flask server on port {port}")
    print(f"Python Flask Collaborative Application")
    print(f"Created with Collaborative Code Editor")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )`,

          'requirements.txt': `Flask==2.3.3
python-dotenv==1.0.0
gunicorn==21.2.0`,

          'README.md': `# Python Flask Collaborative API

A modern Flask web application with RESTful API design.

## Features

- RESTful API - Full CRUD operations
- Error Handling - Comprehensive error responses
- JSON Responses - Clean, structured data
- Health Checks - System monitoring
- Real-time Ready - Built for collaboration

## Installation

1. Create virtual environment:
   python -m venv venv

2. Activate virtual environment:
   # Windows
   venv\\Scripts\\activate
   # macOS/Linux
   source venv/bin/activate

3. Install dependencies:
   pip install -r requirements.txt

4. Run the application:
   python app.py

## API Endpoints

### Users Management
- GET /api/users - Get all users
- POST /api/users - Create new user
- GET /api/users/<id> - Get specific user
- PUT /api/users/<id> - Update user
- DELETE /api/users/<id> - Delete user

### System
- GET / - API documentation
- GET /health - Health check

## Usage Examples

### Get All Users
curl http://localhost:5000/api/users

### Create User
curl -X POST http://localhost:5000/api/users \\
  -H "Content-Type: application/json" \\
  -d '{"name": "John Doe", "email": "john@example.com", "role": "user"}'

### Update User
curl -X PUT http://localhost:5000/api/users/1 \\
  -H "Content-Type: application/json" \\
  -d '{"name": "John Updated", "role": "admin"}'

### Delete User
curl -X DELETE http://localhost:5000/api/users/1

## Response Format

### Success Response
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}

### Error Response
{
  "success": false,
  "message": "Error description"
}

## Production Deployment

### Using Gunicorn
gunicorn app:app

### Environment Variables
- PORT - Server port (default: 5000)
- FLASK_ENV - Environment (development/production)

## Development

### Project Structure
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
└── README.md          # This documentation

### Adding Features
1. New endpoints - Add routes in app.py
2. Database - Add SQLAlchemy for persistence
3. Authentication - Implement JWT or session auth
4. Validation - Add input validation with Marshmallow

## Features to Add

- [ ] Database integration (SQLAlchemy)
- [ ] User authentication (JWT)
- [ ] Input validation
- [ ] API rate limiting
- [ ] Swagger documentation
- [ ] Unit tests
- [ ] Docker support

Built with love and Flask! Ready for real-time collaboration.`
        }
      }
    };
  }

  async createProject(projectType, projectName, targetPath) {
    try {
      console.log(`Creating ${projectType} project: ${projectName} at ${targetPath}`);
      
      const template = this.templates[projectType];
      if (!template) {
        throw new Error(`Template for ${projectType} not found`);
      }

      const projectPath = path.join(targetPath, projectName);
      
      // Create project directory
      await fs.mkdir(projectPath, { recursive: true });
      
      // Create all files from template
      for (const [filePath, content] of Object.entries(template.files)) {
        const fullFilePath = path.join(projectPath, filePath);
        const fileDir = path.dirname(fullFilePath);
        
        // Ensure directory exists
        await fs.mkdir(fileDir, { recursive: true });
        
        // Replace placeholders in content
        let processedContent = content
          .replace(/{PROJECT_NAME}/g, projectName)
          .replace(/{PROJECT_NAME_LOWER}/g, projectName.toLowerCase());
        
        // Write file
        await fs.writeFile(fullFilePath, processedContent, 'utf8');
      }

      return {
        success: true,
        projectPath,
        message: `${template.name} project "${projectName}" created successfully!`,
        filesCreated: Object.keys(template.files).length
      };

    } catch (error) {
      console.error('Error creating project:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getAvailableTemplates() {
    return Object.keys(this.templates).map(key => ({
      value: key,
      name: this.templates[key].name,
      description: this.templates[key].description,
      icon: this.templates[key].icon,
      filesCount: Object.keys(this.templates[key].files).length
    }));
  }

  getTemplate(templateType) {
    return this.templates[templateType] || null;
  }
}

module.exports = new ProjectTemplateService();
