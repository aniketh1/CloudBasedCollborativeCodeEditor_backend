// Additional template creation functions for projects

const FileSystemService = require('../services/FileSystemService');

// Node.js Template
async function createNodeTemplate(roomId, userId) {
  let filesCreated = 0;

  // Create package.json
  const packageJson = {
    "name": "node-codedev-project",
    "version": "1.0.0",
    "description": "Node.js Express application created with CodeDev",
    "main": "server.js",
    "scripts": {
      "start": "node server.js",
      "dev": "nodemon server.js",
      "test": "jest"
    },
    "keywords": ["nodejs", "express", "codedev"],
    "author": "",
    "license": "ISC",
    "dependencies": {
      "express": "^4.18.2",
      "cors": "^2.8.5",
      "dotenv": "^16.3.1",
      "helmet": "^7.0.0",
      "morgan": "^1.10.0"
    },
    "devDependencies": {
      "nodemon": "^3.0.1",
      "jest": "^29.6.2"
    }
  };

  await FileSystemService.saveFile(roomId, 'package.json', JSON.stringify(packageJson, null, 2), userId);
  filesCreated++;

  // Create server.js
  const serverJs = `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Welcome to your Node.js CodeDev App!',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      users: '/api/users'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api', require('./routes/api'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
  console.log(\`📝 Environment: \${process.env.NODE_ENV || 'development'}\`);
  console.log(\`🌐 URL: http://localhost:\${PORT}\`);
});

module.exports = app;`;

  await FileSystemService.saveFile(roomId, 'server.js', serverJs, userId);
  filesCreated++;

  // Create routes/api.js
  const apiJs = `const express = require('express');
const router = express.Router();

// Sample data
let users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com' }
];

// GET /api - API info
router.get('/', (req, res) => {
  res.json({
    message: 'CodeDev API v1.0',
    endpoints: [
      'GET /api/users - Get all users',
      'GET /api/users/:id - Get user by ID',
      'POST /api/users - Create new user',
      'PUT /api/users/:id - Update user',
      'DELETE /api/users/:id - Delete user'
    ]
  });
});

// GET /api/users - Get all users
router.get('/users', (req, res) => {
  res.json({
    success: true,
    count: users.length,
    data: users
  });
});

// GET /api/users/:id - Get user by ID
router.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  res.json({
    success: true,
    data: user
  });
});

// POST /api/users - Create new user
router.post('/users', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      error: 'Name and email are required'
    });
  }
  
  const newUser = {
    id: users.length + 1,
    name,
    email
  };
  
  users.push(newUser);
  
  res.status(201).json({
    success: true,
    data: newUser
  });
});

// PUT /api/users/:id - Update user
router.put('/users/:id', (req, res) => {
  const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  const { name, email } = req.body;
  
  if (name) users[userIndex].name = name;
  if (email) users[userIndex].email = email;
  
  res.json({
    success: true,
    data: users[userIndex]
  });
});

// DELETE /api/users/:id - Delete user
router.delete('/users/:id', (req, res) => {
  const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  const deletedUser = users.splice(userIndex, 1)[0];
  
  res.json({
    success: true,
    message: 'User deleted successfully',
    data: deletedUser
  });
});

module.exports = router;`;

  await FileSystemService.saveFile(roomId, 'routes/api.js', apiJs, userId);
  filesCreated++;

  // Create .env
  const envFile = `# Environment variables
NODE_ENV=development
PORT=3000

# Database (if needed)
# DATABASE_URL=mongodb://localhost:27017/codedev-app
# DATABASE_URL=postgresql://username:password@localhost:5432/codedev-app

# API Keys (if needed)
# JWT_SECRET=your-super-secret-jwt-key
# API_KEY=your-api-key

# Other settings
# CORS_ORIGIN=http://localhost:3000`;

  await FileSystemService.saveFile(roomId, '.env', envFile, userId);
  filesCreated++;

  // Create README.md
  const readme = `# Node.js CodeDev Project

Welcome to your Node.js Express application created with CodeDev! 🚀

## Features

- ⚡ Express.js web framework
- 🔒 Security with Helmet
- 🌐 CORS enabled
- 📝 Request logging with Morgan
- 🎯 RESTful API structure
- 🔧 Environment variables support
- 🔄 Real-time collaborative editing

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Or start production server:
   \`\`\`bash
   npm start
   \`\`\`

4. Open [http://localhost:3000](http://localhost:3000) to view the API

## API Endpoints

- \`GET /\` - Welcome message
- \`GET /health\` - Health check
- \`GET /api\` - API information
- \`GET /api/users\` - Get all users
- \`GET /api/users/:id\` - Get user by ID
- \`POST /api/users\` - Create new user
- \`PUT /api/users/:id\` - Update user
- \`DELETE /api/users/:id\` - Delete user

## Project Structure

\`\`\`
├── server.js          # Main application file
├── package.json       # Dependencies and scripts
├── .env              # Environment variables
├── routes/
│   └── api.js        # API routes
└── README.md         # This file
\`\`\`

## Environment Variables

Copy \`.env\` and configure your environment variables:

- \`NODE_ENV\` - Environment (development/production)
- \`PORT\` - Server port (default: 3000)
- Add database URLs, API keys, etc. as needed

## Example Usage

### Create a new user:
\`\`\`bash
curl -X POST http://localhost:3000/api/users \\
  -H "Content-Type: application/json" \\
  -d '{"name": "John Doe", "email": "john@example.com"}'
\`\`\`

### Get all users:
\`\`\`bash
curl http://localhost:3000/api/users
\`\`\`

## Learn More

- [Express.js Documentation](https://expressjs.com/)
- [Node.js Documentation](https://nodejs.org/docs/)

Happy coding with CodeDev! 🎉`;

  await FileSystemService.saveFile(roomId, 'README.md', readme, userId);
  filesCreated++;

  return filesCreated;
}

// Python/Flask template
async function createPythonTemplate(roomId, userId, FileSystemService) {
  let filesCreated = 0;

  // Create app.py
  const appPy = `from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from datetime import datetime

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Sample data
users = [
    {"id": 1, "name": "Alice Johnson", "email": "alice@example.com"},
    {"id": 2, "name": "Bob Smith", "email": "bob@example.com"},
    {"id": 3, "name": "Charlie Brown", "email": "charlie@example.com"}
]

@app.route('/')
def home():
    """Welcome endpoint"""
    return jsonify({
        "message": "🚀 Welcome to your Python Flask CodeDev App!",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "api": "/api",
            "users": "/api/users"
        }
    })

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "OK",
        "timestamp": datetime.now().isoformat(),
        "python_version": os.sys.version
    })

@app.route('/api')
def api_info():
    """API information"""
    return jsonify({
        "message": "CodeDev Flask API v1.0",
        "endpoints": [
            "GET /api/users - Get all users",
            "GET /api/users/<id> - Get user by ID",
            "POST /api/users - Create new user",
            "PUT /api/users/<id> - Update user",
            "DELETE /api/users/<id> - Delete user"
        ]
    })

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all users"""
    return jsonify({
        "success": True,
        "count": len(users),
        "data": users
    })

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get user by ID"""
    user = next((u for u in users if u["id"] == user_id), None)
    
    if not user:
        return jsonify({
            "success": False,
            "error": "User not found"
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
            "error": "Name and email are required"
        }), 400
    
    new_user = {
        "id": len(users) + 1,
        "name": data['name'],
        "email": data['email']
    }
    
    users.append(new_user)
    
    return jsonify({
        "success": True,
        "data": new_user
    }), 201

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user"""
    user = next((u for u in users if u["id"] == user_id), None)
    
    if not user:
        return jsonify({
            "success": False,
            "error": "User not found"
        }), 404
    
    data = request.get_json()
    
    if data.get('name'):
        user['name'] = data['name']
    if data.get('email'):
        user['email'] = data['email']
    
    return jsonify({
        "success": True,
        "data": user
    })

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete user"""
    user_index = next((i for i, u in enumerate(users) if u["id"] == user_id), None)
    
    if user_index is None:
        return jsonify({
            "success": False,
            "error": "User not found"
        }), 404
    
    deleted_user = users.pop(user_index)
    
    return jsonify({
        "success": True,
        "message": "User deleted successfully",
        "data": deleted_user
    })

@app.errorhandler(404)
def not_found(error):
    """404 handler"""
    return jsonify({
        "error": "Route not found",
        "path": request.path
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """500 handler"""
    return jsonify({
        "error": "Internal server error",
        "message": str(error)
    }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"🚀 Flask server starting on port {port}")
    print(f"📝 Environment: {os.environ.get('FLASK_ENV', 'production')}")
    print(f"🌐 URL: http://localhost:{port}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)`;

  await FileSystemService.saveFile(roomId, 'app.py', appPy, userId);
  filesCreated++;

  // Create requirements.txt
  const requirements = `Flask==2.3.3
Flask-CORS==4.0.0
python-dotenv==1.0.0
gunicorn==21.2.0`;

  await FileSystemService.saveFile(roomId, 'requirements.txt', requirements, userId);
  filesCreated++;

  // Create .env
  const envFile = `# Flask environment variables
FLASK_APP=app.py
FLASK_ENV=development
PORT=5000

# Database (if needed)
# DATABASE_URL=postgresql://username:password@localhost:5432/codedev-app
# MONGODB_URI=mongodb://localhost:27017/codedev-app

# Secret key for sessions
SECRET_KEY=your-super-secret-key-here

# API Keys (if needed)
# API_KEY=your-api-key`;

  await FileSystemService.saveFile(roomId, '.env', envFile, userId);
  filesCreated++;

  // Create README.md
  const readme = `# Python Flask CodeDev Project

Welcome to your Python Flask application created with CodeDev! 🐍🚀

## Features

- ⚡ Flask web framework
- 🌐 CORS enabled
- 🎯 RESTful API structure
- 🔧 Environment variables support
- 📦 Production-ready with Gunicorn
- 🔄 Real-time collaborative editing

## Getting Started

1. Create a virtual environment:
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

3. Start the development server:
   \`\`\`bash
   python app.py
   \`\`\`

4. Or run with Flask CLI:
   \`\`\`bash
   flask run
   \`\`\`

5. Open [http://localhost:5000](http://localhost:5000) to view the API

Happy coding with CodeDev! 🎉`;

  await FileSystemService.saveFile(roomId, 'README.md', readme, userId);
  filesCreated++;

  return filesCreated;
}

// Vue.js Template
async function createVueTemplate(roomId, userId) {
    console.log(`Creating Vue.js template for project ${roomId}`);
    
    // package.json for Vue.js
    await FileSystemService.saveFile(roomId, 'package.json', JSON.stringify({
        name: 'vue-project',
        version: '0.1.0',
        private: true,
        scripts: {
            serve: 'vue-cli-service serve',
            build: 'vue-cli-service build',
            lint: 'vue-cli-service lint'
        },
        dependencies: {
            'core-js': '^3.8.3',
            vue: '^3.2.13',
            'vue-router': '^4.0.3'
        },
        devDependencies: {
            '@babel/core': '^7.12.16',
            '@babel/eslint-parser': '^7.12.16',
            '@vue/cli-plugin-babel': '~5.0.0',
            '@vue/cli-plugin-eslint': '~5.0.0',
            '@vue/cli-plugin-router': '~5.0.0',
            '@vue/cli-service': '~5.0.0',
            eslint: '^7.32.0',
            'eslint-plugin-vue': '^8.0.3'
        }
    }, null, 2));

    // vue.config.js
    await FileSystemService.saveFile(roomId, 'vue.config.js', `const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true
})
`);

    // public/index.html
    await FileSystemService.saveFile(roomId, 'public/index.html', `<!DOCTYPE html>
<html lang="">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <link rel="icon" href="<%= BASE_URL %>favicon.ico">
    <title><%= htmlWebpackPlugin.options.title %></title>
  </head>
  <body>
    <noscript>
      <strong>We're sorry but <%= htmlWebpackPlugin.options.title %> doesn't work properly without JavaScript enabled. Please enable it to continue.</strong>
    </noscript>
    <div id="app"></div>
    <!-- built files will be auto injected -->
  </body>
</html>
`);

    // src/main.js
    await FileSystemService.saveFile(roomId, 'src/main.js', `import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
`);

    // src/App.vue
    await FileSystemService.saveFile(roomId, 'src/App.vue', `<template>
  <div id="app">
    <nav>
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </nav>
    <router-view/>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>
`);

    // src/router/index.js
    await FileSystemService.saveFile(roomId, 'src/router/index.js', `import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
`);

    // src/views/HomeView.vue
    await FileSystemService.saveFile(roomId, 'src/views/HomeView.vue', `<template>
  <div class="home">
    <h1>Welcome to Vue Project</h1>
    <p>This is a Vue.js application</p>
  </div>
</template>

<script>
export default {
  name: 'HomeView'
}
</script>
`);

    // src/views/AboutView.vue
    await FileSystemService.saveFile(roomId, 'src/views/AboutView.vue', `<template>
  <div class="about">
    <h1>About</h1>
    <p>This is an about page for your Vue.js application.</p>
  </div>
</template>
`);

    // src/components/HelloWorld.vue
    await FileSystemService.saveFile(roomId, 'src/components/HelloWorld.vue', `<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <p>
      Welcome to your Vue.js application!
    </p>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  props: {
    msg: String
  }
}
</script>

<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
`);

    // README.md for Vue.js
    await FileSystemService.saveFile(roomId, 'README.md', `# Vue Project

Vue.js application with Vue Router.

## Project setup
\`\`\`
npm install
\`\`\`

### Compiles and hot-reloads for development
\`\`\`
npm run serve
\`\`\`

### Compiles and minifies for production
\`\`\`
npm run build
\`\`\`

### Lints and fixes files
\`\`\`
npm run lint
\`\`\`

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
`);

    console.log(`Created Vue.js template for project ${roomId}`);
}

// Angular Template
async function createAngularTemplate(roomId, userId) {
    console.log(`Creating Angular template for project ${roomId}`);
    
    // package.json for Angular
    await FileSystemService.saveFile(roomId, 'package.json', JSON.stringify({
        name: 'angular-project',
        version: '0.0.0',
        scripts: {
            ng: 'ng',
            start: 'ng serve',
            build: 'ng build',
            watch: 'ng build --watch --configuration development',
            test: 'ng test'
        },
        private: true,
        dependencies: {
            '@angular/animations': '^16.0.0',
            '@angular/common': '^16.0.0',
            '@angular/compiler': '^16.0.0',
            '@angular/core': '^16.0.0',
            '@angular/forms': '^16.0.0',
            '@angular/platform-browser': '^16.0.0',
            '@angular/platform-browser-dynamic': '^16.0.0',
            '@angular/router': '^16.0.0',
            rxjs: '~7.8.0',
            tslib: '^2.3.0',
            'zone.js': '~0.13.0'
        },
        devDependencies: {
            '@angular-devkit/build-angular': '^16.0.0',
            '@angular/cli': '~16.0.0',
            '@angular/compiler-cli': '^16.0.0',
            '@types/jasmine': '~4.3.0',
            jasmine: '~4.6.0',
            karma: '~6.4.0',
            'karma-chrome-launcher': '~3.2.0',
            'karma-coverage': '~2.2.0',
            'karma-jasmine': '~5.1.0',
            'karma-jasmine-html-reporter': '~2.1.0',
            typescript: '~5.0.2'
        }
    }, null, 2));

    // angular.json
    await FileSystemService.saveFile(roomId, 'angular.json', JSON.stringify({
        "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
        version: 1,
        newProjectRoot: "projects",
        projects: {
            "angular-project": {
                projectType: "application",
                schematics: {},
                root: "",
                sourceRoot: "src",
                prefix: "app",
                architect: {
                    build: {
                        builder: "@angular-devkit/build-angular:browser",
                        options: {
                            outputPath: "dist",
                            index: "src/index.html",
                            main: "src/main.ts",
                            polyfills: ["zone.js"],
                            tsConfig: "tsconfig.app.json",
                            assets: ["src/favicon.ico", "src/assets"],
                            styles: ["src/styles.css"],
                            scripts: []
                        }
                    },
                    serve: {
                        builder: "@angular-devkit/build-angular:dev-server"
                    }
                }
            }
        }
    }, null, 2));

    // tsconfig.json
    await FileSystemService.saveFile(roomId, 'tsconfig.json', JSON.stringify({
        compileOnSave: false,
        compilerOptions: {
            baseUrl: "./",
            outDir: "./dist/out-tsc",
            forceConsistentCasingInFileNames: true,
            strict: true,
            noImplicitOverride: true,
            noPropertyAccessFromIndexSignature: true,
            noImplicitReturns: true,
            noFallthroughCasesInSwitch: true,
            sourceMap: true,
            declaration: false,
            downlevelIteration: true,
            experimentalDecorators: true,
            moduleResolution: "node",
            importHelpers: true,
            target: "ES2022",
            module: "ES2022",
            useDefineForClassFields: false,
            lib: ["ES2022", "dom"]
        },
        angularCompilerOptions: {
            enableI18nLegacyMessageIdFormat: false,
            strictInjectionParameters: true,
            strictInputAccessModifiers: true,
            strictTemplates: true
        }
    }, null, 2));

    // tsconfig.app.json
    await FileSystemService.saveFile(roomId, 'tsconfig.app.json', JSON.stringify({
        extends: "./tsconfig.json",
        compilerOptions: {
            outDir: "./out-tsc/app",
            types: []
        },
        files: ["src/main.ts"],
        include: ["src/**/*.d.ts"]
    }, null, 2));

    // src/index.html
    await FileSystemService.saveFile(roomId, 'src/index.html', `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Angular Project</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>
`);

    // src/main.ts
    await FileSystemService.saveFile(roomId, 'src/main.ts', `import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
`);

    // src/styles.css
    await FileSystemService.saveFile(roomId, 'src/styles.css', `/* You can add global styles to this file, and also import other style files */
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
}
`);

    // src/app/app.module.ts
    await FileSystemService.saveFile(roomId, 'src/app/app.module.ts', `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
`);

    // src/app/app-routing.module.ts
    await FileSystemService.saveFile(roomId, 'src/app/app-routing.module.ts', `import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
`);

    // src/app/app.component.ts
    await FileSystemService.saveFile(roomId, 'src/app/app.component.ts', `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Angular Project';
}
`);

    // src/app/app.component.html
    await FileSystemService.saveFile(roomId, 'src/app/app.component.html', `<div class="container">
  <h1>Welcome to {{ title }}!</h1>
  <p>This is your Angular application.</p>
  <router-outlet></router-outlet>
</div>
`);

    // src/app/app.component.css
    await FileSystemService.saveFile(roomId, 'src/app/app.component.css', `.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
}

h1 {
  color: #333;
  margin-bottom: 20px;
}
`);

    // README.md for Angular
    await FileSystemService.saveFile(roomId, 'README.md', `# Angular Project

This project was generated with [Angular CLI](https://github.com/angular/angular-cli).

## Development server

Run \`ng serve\` for a dev server. Navigate to \`http://localhost:4200/\`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run \`ng generate component component-name\` to generate a new component. You can also use \`ng generate directive|pipe|service|class|guard|interface|enum|module\`.

## Build

Run \`ng build\` to build the project. The build artifacts will be stored in the \`dist/\` directory.

## Running unit tests

Run \`ng test\` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use \`ng help\` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
`);

    console.log(`Created Angular template for project ${roomId}`);
}

module.exports = {
  createNodeTemplate,
  createPythonTemplate,
  createVueTemplate,
  createAngularTemplate
};