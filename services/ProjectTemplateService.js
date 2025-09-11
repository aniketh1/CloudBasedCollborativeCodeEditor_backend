const fs = require('fs').promises;
const path = require('path');

class ProjectTemplateService {
  constructor() {
    this.templates = {
      react: {
        name: 'React App',
        description: 'A modern React application with hooks',
        icon: '‚öõÔ∏è',
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

.counter p {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.counter button {
  margin: 0 10px;
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  background: #61dafb;
  color: #282c34;
  cursor: pointer;
  transition: all 0.3s ease;
}

.counter button:hover {
  background: #21a9c7;
  transform: translateY(-2px);
}`,

          'src/index.js': `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);

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
- ‚öõÔ∏è Modern React with Hooks
- Ì¥• Hot Reload
- Ìæ® CSS Styling
- Ì¥ù Real-time Collaboration

## Getting Started

1. Install dependencies: \`npm install\`
2. Start development: \`npm start\`
3. Build for production: \`npm run build\`

Happy coding! Ì∫Ä`
        }
      },

      nodejs: {
        name: 'Node.js API',
        description: 'Express.js REST API with modern features',
        icon: 'Ì∫Ä',
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
    message: 'Ì∫Ä Welcome to your Node.js API!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/users - Get all users',
      'POST /api/users - Create user',
      'GET /api/users/:id - Get user by ID',
      'PUT /api/users/:id - Update user',
      'DELETE /api/users/:id - Delete user'
    ]
  });
});

// Get all users
app.get('/api/users', (req, res) => {
  res.json({ success: true, data: users });
});

// Get user by ID
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, data: user });
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
    role,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  res.status(201).json({ success: true, data: newUser });
});

// Update user
app.put('/api/users/:id', (req, res) => {
  const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  users[userIndex] = { ...users[userIndex], ...req.body };
  res.json({ success: true, data: users[userIndex] });
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  users.splice(userIndex, 1);
  res.json({ success: true, message: 'User deleted successfully' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString() 
  });
});

app.listen(PORT, () => {
  console.log(\`Ì∫Ä Server running on port \${PORT}\`);
  console.log(\`Ì≥ù API docs available at http://localhost:\${PORT}\`);
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
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "keywords": ["nodejs", "express", "api", "rest"],
  "author": "Collaborative Code Editor",
  "license": "MIT"
}`,

          'README.md': `# Node.js Collaborative API

A powerful Express.js REST API with full CRUD operations.

## Ì∫Ä Features
- RESTful API endpoints
- CORS enabled
- Error handling
- JSON responses
- Health checks

## Ì≥ã API Endpoints

### Users
- \`GET /api/users\` - Get all users
- \`POST /api/users\` - Create new user
- \`GET /api/users/:id\` - Get user by ID
- \`PUT /api/users/:id\` - Update user
- \`DELETE /api/users/:id\` - Delete user

### System
- \`GET /\` - API documentation
- \`GET /health\` - Health check

## Ìª†Ô∏è Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Start production server:
   \`\`\`bash
   npm start
   \`\`\`

## Ì≥ù Usage Examples

### Create User
\`\`\`bash
curl -X POST http://localhost:3000/api/users \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Alice Cooper", "email": "alice@example.com"}'
\`\`\`

### Get All Users
\`\`\`bash
curl http://localhost:3000/api/users
\`\`\`

Happy coding! Ìæâ`
        }
      },

      html: {
        name: 'HTML Website',
        description: 'Modern responsive website with animations',
        icon: 'Ìºê',
        files: {
          'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Collaborative Website</title>
    <link rel="stylesheet" href="styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <h1 class="nav-brand">‚ú® My Website</h1>
            <ul class="nav-menu">
                <li><a href="#home">Home</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
            <div class="hamburger">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </nav>

    <main>
        <section id="home" class="hero">
            <div class="hero-content">
                <h1 class="hero-title">Welcome to the Future</h1>
                <p class="hero-subtitle">Built with the Collaborative Code Editor</p>
                <button class="cta-button" onclick="celebrateClick()">
                    Ì∫Ä Get Started
                </button>
            </div>
            <div class="hero-animation">
                <div class="floating-shape shape-1"></div>
                <div class="floating-shape shape-2"></div>
                <div class="floating-shape shape-3"></div>
            </div>
        </section>

        <section id="features" class="features">
            <div class="container">
                <h2 class="section-title">Amazing Features</h2>
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">‚ö°</div>
                        <h3>Lightning Fast</h3>
                        <p>Optimized for performance and speed</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">Ìæ®</div>
                        <h3>Beautiful Design</h3>
                        <p>Modern and clean user interface</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">Ì≥±</div>
                        <h3>Responsive</h3>
                        <p>Works perfectly on all devices</p>
                    </div>
                </div>
            </div>
        </section>

        <section id="about" class="about">
            <div class="container">
                <div class="about-content">
                    <h2>About This Project</h2>
                    <p>This website demonstrates modern web development techniques using HTML5, CSS3, and JavaScript. It was created with the Collaborative Code Editor, enabling real-time collaboration between developers.</p>
                    <div class="stats">
                        <div class="stat">
                            <span class="stat-number" data-count="100">0</span>
                            <span class="stat-label">% Awesome</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number" data-count="24">0</span>
                            <span class="stat-label">Hours Support</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number" data-count="1000">0</span>
                            <span class="stat-label">+ Happy Users</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section id="contact" class="contact">
            <div class="container">
                <h2>Get In Touch</h2>
                <form class="contact-form" onsubmit="handleSubmit(event)">
                    <div class="form-group">
                        <input type="text" id="name" placeholder="Your Name" required>
                        <label for="name">Name</label>
                    </div>
                    <div class="form-group">
                        <input type="email" id="email" placeholder="your@email.com" required>
                        <label for="email">Email</label>
                    </div>
                    <div class="form-group">
                        <textarea id="message" placeholder="Your message..." rows="5" required></textarea>
                        <label for="message">Message</label>
                    </div>
                    <button type="submit" class="submit-btn">
                        Send Message ‚ú®
                    </button>
                </form>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 My Collaborative Website. Made with ‚ù§Ô∏è and Collaborative Code Editor.</p>
        </div>
    </footer>

    <script src="script.js"></script>
</body>
</html>`,

          'styles.css': `/* Reset and base styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    line-height: 1.6;
    color: #333;
    overflow-x: hidden;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
}

/* Navigation */
.navbar {
    position: fixed;
    top: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    z-index: 1000;
    transition: all 0.3s ease;
}

.nav-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.nav-brand {
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-menu a {
    text-decoration: none;
    color: #333;
    font-weight: 500;
    transition: color 0.3s ease;
}

.nav-menu a:hover {
    color: #667eea;
}

.hamburger {
    display: none;
    flex-direction: column;
    cursor: pointer;
}

.hamburger span {
    width: 25px;
    height: 3px;
    background: #333;
    margin: 3px 0;
    transition: 0.3s;
}

/* Hero Section */
.hero {
    min-height: 100vh;
    display: flex;
    align-items: center;
    position: relative;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    overflow: hidden;
}

.hero-content {
    max-width: 600px;
    padding: 0 2rem;
    z-index: 2;
}

.hero-title {
    font-size: 4rem;
    font-weight: 700;
    margin-bottom: 1rem;
    opacity: 0;
    animation: fadeInUp 1s ease forwards 0.5s;
}

.hero-subtitle {
    font-size: 1.5rem;
    margin-bottom: 2rem;
    opacity: 0;
    animation: fadeInUp 1s ease forwards 0.7s;
}

.cta-button {
    background: white;
    color: #667eea;
    border: none;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s ease;
    opacity: 0;
    animation: fadeInUp 1s ease forwards 0.9s;
}

.cta-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

/* Floating Animation */
.floating-shape {
    position: absolute;
    border-radius: 50%;
    background: rgba(255,255,255,0.1);
    animation: float 6s ease-in-out infinite;
}

.shape-1 {
    width: 100px;
    height: 100px;
    top: 20%;
    right: 20%;
    animation-delay: 0s;
}

.shape-2 {
    width: 150px;
    height: 150px;
    top: 60%;
    right: 10%;
    animation-delay: 2s;
}

.shape-3 {
    width: 80px;
    height: 80px;
    top: 40%;
    right: 40%;
    animation-delay: 4s;
}

/* Features Section */
.features {
    padding: 5rem 0;
    background: #f8f9fa;
}

.section-title {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #333;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.feature-card {
    background: white;
    padding: 2rem;
    border-radius: 15px;
    text-align: center;
    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
}

.feature-card:hover {
    transform: translateY(-10px);
}

.feature-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

/* About Section */
.about {
    padding: 5rem 0;
}

.about-content h2 {
    font-size: 2.5rem;
    margin-bottom: 2rem;
    text-align: center;
}

.about-content p {
    font-size: 1.2rem;
    text-align: center;
    max-width: 800px;
    margin: 0 auto 3rem;
}

.stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
    text-align: center;
}

.stat-number {
    display: block;
    font-size: 3rem;
    font-weight: 700;
    color: #667eea;
}

.stat-label {
    font-size: 1rem;
    color: #666;
}

/* Contact Section */
.contact {
    padding: 5rem 0;
    background: #f8f9fa;
}

.contact h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
}

.contact-form {
    max-width: 600px;
    margin: 0 auto;
}

.form-group {
    position: relative;
    margin-bottom: 2rem;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 1rem;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
    background: white;
}

.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #667eea;
}

.form-group label {
    position: absolute;
    top: -0.5rem;
    left: 1rem;
    background: white;
    padding: 0 0.5rem;
    color: #667eea;
    font-size: 0.9rem;
    font-weight: 500;
}

.submit-btn {
    width: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 1rem;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

/* Footer */
.footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 2rem 0;
}

/* Animations */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
}

/* Responsive Design */
@media (max-width: 768px) {
    .hamburger {
        display: flex;
    }

    .nav-menu {
        display: none;
    }

    .hero-title {
        font-size: 2.5rem;
    }

    .hero-subtitle {
        font-size: 1.2rem;
    }

    .container {
        padding: 0 1rem;
    }
}`,

          'script.js': `// Enhanced JavaScript for interactive website

// Smooth scrolling for navigation
document.addEventListener('DOMContentLoaded', function() {
    // Initialize page
    console.log('Ì∫Ä Website loaded successfully!');
    console.log('Ì≤° Created with Collaborative Code Editor');
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Animated counter for stats
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counters = entry.target.querySelectorAll('.stat-number');
                counters.forEach(counter => {
                    animateCounter(counter);
                });
            }
        });
    }, observerOptions);

    const statsSection = document.querySelector('.stats');
    if (statsSection) {
        observer.observe(statsSection);
    }

    // Navbar background on scroll
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        }
    });
});

// Celebrate button click with particles
function celebrateClick() {
    const button = event.target;
    
    // Visual feedback
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 150);

    // Create celebration particles
    createParticles(button);
    
    // Success message
    setTimeout(() => {
        alert('Ìæâ Welcome to the future of web development!\\n\\n‚ú® Built with Collaborative Code Editor\\nÌ∫Ä Real-time collaboration enabled\\nÌ≤° Modern web technologies');
    }, 300);
}

// Create particle animation
function createParticles(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.innerHTML = ['‚ú®', 'Ì∫Ä', 'Ì≤´', '‚≠ê'][Math.floor(Math.random() * 4)];
        particle.style.position = 'fixed';
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';
        particle.style.fontSize = '20px';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '9999';
        
        document.body.appendChild(particle);

        // Animate particle
        const angle = (i / 12) * Math.PI * 2;
        const distance = 100 + Math.random() * 50;
        const targetX = centerX + Math.cos(angle) * distance;
        const targetY = centerY + Math.sin(angle) * distance;

        particle.animate([
            {
                transform: 'translate(0, 0) scale(1)',
                opacity: 1
            },
            {
                transform: \`translate(\${targetX - centerX}px, \${targetY - centerY}px) scale(0)\`,
                opacity: 0
            }
        ], {
            duration: 1000 + Math.random() * 500,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }).onfinish = () => particle.remove();
    }
}

// Animate counter numbers
function animateCounter(counter) {
    const target = parseInt(counter.dataset.count);
    const duration = 2000; // 2 seconds
    const start = performance.now();

    function updateCounter(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(target * easeOutCubic);
        
        counter.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            counter.textContent = target;
        }
    }

    requestAnimationFrame(updateCounter);
}

// Enhanced form submission
function handleSubmit(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    if (!name || !email || !message) {
        alert('‚ùå Please fill in all fields!');
        return;
    }

    // Simulate form submission
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '‚è≥ Sending...';
    submitBtn.disabled = true;

    setTimeout(() => {
        submitBtn.innerHTML = '‚úÖ Message Sent!';
        
        setTimeout(() => {
            alert(\`Ìæâ Thank you, \${name}!\\n\\nÌ≥ß We'll get back to you at \${email}\\nÌ≤¨ Your message: "\${message.substring(0, 50)}..."\`);
            
            // Reset form
            document.getElementById('name').value = '';
            document.getElementById('email').value = '';
            document.getElementById('message').value = '';
            
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 1000);
    }, 2000);
}

// Add some interactive hover effects
document.addEventListener('mousemove', function(e) {
    const shapes = document.querySelectorAll('.floating-shape');
    
    shapes.forEach((shape, index) => {
        const speed = (index + 1) * 0.5;
        const x = (e.clientX * speed) / 100;
        const y = (e.clientY * speed) / 100;
        
        shape.style.transform = \`translate(\${x}px, \${y}px) rotate(\${x}deg)\`;
    });
});`,

          'README.md': `# Ìºê Modern HTML Website

A stunning, interactive website built with HTML5, CSS3, and JavaScript.

## ‚ú® Features

- ÔøΩÔøΩ **Modern Design** - Clean, professional layout
- Ì≥± **Fully Responsive** - Works on all devices
- ‚ö° **Interactive Animations** - Smooth transitions and effects
- ÌæØ **Particle Effects** - Engaging user interactions
- Ì≥ä **Animated Counters** - Dynamic statistics display
- Ìæ≠ **Smooth Scrolling** - Enhanced navigation experience

## Ì∫Ä Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with Flexbox/Grid
- **JavaScript (ES6+)** - Interactive functionality
- **CSS Animations** - Smooth transitions
- **Intersection Observer API** - Scroll animations
- **Google Fonts** - Typography (Inter)

## Ìª†Ô∏è Getting Started

1. **Clone or download** the project files
2. **Open \`index.html\`** in your web browser
3. **Or serve locally**:
   \`\`\`bash
   python -m http.server 8000
   # Open http://localhost:8000
   \`\`\`

## Ì≥Å File Structure

\`\`\`
‚îú‚îÄ‚îÄ index.html      # Main HTML structure
‚îú‚îÄ‚îÄ styles.css      # All styling and animations
‚îú‚îÄ‚îÄ script.js       # Interactive functionality
‚îî‚îÄ‚îÄ README.md       # This file
\`\`\`

## ÌæØ Key Features Explained

### Navigation
- Fixed navbar with blur effect
- Smooth scroll to sections
- Responsive hamburger menu

### Hero Section
- Gradient background
- Floating animated shapes
- Call-to-action with particles

### Features Grid
- Responsive card layout
- Hover animations
- Icon-based design

### Stats Section
- Animated counters
- Intersection Observer
- Smooth number transitions

### Contact Form
- Modern form design
- Floating labels
- Submission animation

## Ìæ® Customization

### Colors
The main color scheme uses:
- Primary: \`#667eea\` to \`#764ba2\`
- Background: \`#f8f9fa\`
- Text: \`#333\`

### Fonts
Uses Google Fonts Inter for clean typography.

### Animations
- CSS keyframes for floating elements
- JavaScript for counter animations
- Intersection Observer for scroll triggers

## Ì≥± Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

## Ìæâ Interactive Elements

- **Particle celebration** on button click
- **Mouse-following shapes** in hero section
- **Hover effects** on cards and buttons
- **Form validation** and submission feedback

## Ì∫Ä Performance

- Optimized animations
- Minimal JavaScript
- Efficient CSS selectors
- Progressive enhancement

Built with ‚ù§Ô∏è using the Collaborative Code Editor!`
        }
      },

      python: {
        name: 'Python Flask',
        description: 'Modern Flask web application',
        icon: 'Ì∞ç',
        files: {
          'app.py': `#!/usr/bin/env python3
"""
Flask Collaborative Web Application
Created with Collaborative Code Editor
"""

from flask import Flask, jsonify, request, render_template
from datetime import datetime
import os

app = Flask(__name__)

# Sample data
users = [
    {"id": 1, "name": "Alice Johnson", "email": "alice@example.com", "role": "admin"},
    {"id": 2, "name": "Bob Smith", "email": "bob@example.com", "role": "user"},
    {"id": 3, "name": "Carol Davis", "email": "carol@example.com", "role": "user"}
]

@app.route('/')
def home():
    """Home page with API documentation"""
    return jsonify({
        "message": "Ì∞ç Welcome to Flask Collaborative API!",
        "timestamp": datetime.now().isoformat(),
        "endpoints": [
            "GET / - This documentation",
            "GET /api/users - Get all users",
            "POST /api/users - Create new user",
            "GET /api/users/<id> - Get user by ID",
            "PUT /api/users/<id> - Update user",
            "DELETE /api/users/<id> - Delete user",
            "GET /health - Health check"
        ],
        "features": [
            "RESTful API design",
            "JSON responses",
            "Error handling",
            "CORS support",
            "Real-time collaboration ready"
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
    user = next((u for u in users if u['id'] == user_id), None)
    
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
    
    if not data or 'name' not in data or 'email' not in data:
        return jsonify({
            "success": False,
            "message": "Name and email are required"
        }), 400
    
    # Generate new ID
    new_id = max(u['id'] for u in users) + 1 if users else 1
    
    new_user = {
        "id": new_id,
        "name": data['name'],
        "email": data['email'],
        "role": data.get('role', 'user'),
        "created_at": datetime.now().isoformat()
    }
    
    users.append(new_user)
    
    return jsonify({
        "success": True,
        "message": "User created successfully",
        "data": new_user
    }), 201

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user"""
    user = next((u for u in users if u['id'] == user_id), None)
    
    if not user:
        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404
    
    data = request.get_json()
    if not data:
        return jsonify({
            "success": False,
            "message": "No data provided"
        }), 400
    
    # Update user data
    user.update({k: v for k, v in data.items() if k in ['name', 'email', 'role']})
    user['updated_at'] = datetime.now().isoformat()
    
    return jsonify({
        "success": True,
        "message": "User updated successfully",
        "data": user
    })

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete user"""
    global users
    
    user = next((u for u in users if u['id'] == user_id), None)
    
    if not user:
        return jsonify({
            "success": False,
            "message": "User not found"
        }), 404
    
    users = [u for u in users if u['id'] != user_id]
    
    return jsonify({
        "success": True,
        "message": f"User {user['name']} deleted successfully"
    })

@app.route('/health')
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
    
    print(f"Ì∫Ä Starting Flask server on port {port}")
    print(f"Ì∞ç Python Flask Collaborative Application")
    print(f"‚ú® Created with Collaborative Code Editor")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )`,

          'requirements.txt': `Flask==2.3.3
python-dotenv==1.0.0
gunicorn==21.2.0`,

          'README.md': `# Ì∞ç Python Flask Collaborative API

A modern Flask web application with RESTful API design.

## ‚ú® Features

- Ì∫Ä **RESTful API** - Full CRUD operations
- Ì¥í **Error Handling** - Comprehensive error responses
- Ì≥ù **JSON Responses** - Clean, structured data
- Ìø• **Health Checks** - System monitoring
- ÌæØ **Real-time Ready** - Built for collaboration

## Ìª†Ô∏è Installation

1. **Create virtual environment:**
   \`\`\`bash
   python -m venv venv
   \`\`\`

2. **Activate virtual environment:**
   \`\`\`bash
   # Windows
   venv\\Scripts\\activate
   
   # macOS/Linux
   source venv/bin/activate
   \`\`\`

3. **Install dependencies:**
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

4. **Run the application:**
   \`\`\`bash
   python app.py
   \`\`\`

## Ì≥ã API Endpoints

### Users Management
- **GET /api/users** - Get all users
- **POST /api/users** - Create new user  
- **GET /api/users/<id>** - Get specific user
- **PUT /api/users/<id>** - Update user
- **DELETE /api/users/<id>** - Delete user

### System
- **GET /** - API documentation
- **GET /health** - Health check

## ÌæØ Usage Examples

### Get All Users
\`\`\`bash
curl http://localhost:5000/api/users
\`\`\`

### Create User
\`\`\`bash
curl -X POST http://localhost:5000/api/users \\
  -H "Content-Type: application/json" \\
  -d '{"name": "John Doe", "email": "john@example.com", "role": "user"}'
\`\`\`

### Update User
\`\`\`bash
curl -X PUT http://localhost:5000/api/users/1 \\
  -H "Content-Type: application/json" \\
  -d '{"name": "John Updated", "role": "admin"}'
\`\`\`

### Delete User
\`\`\`bash
curl -X DELETE http://localhost:5000/api/users/1
\`\`\`

## Ì≥ä Response Format

### Success Response
\`\`\`json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
\`\`\`

### Error Response
\`\`\`json
{
  "success": false,
  "message": "Error description"
}
\`\`\`

## Ì∫Ä Production Deployment

### Using Gunicorn
\`\`\`bash
gunicorn app:app
\`\`\`

### Environment Variables
- \`PORT\` - Server port (default: 5000)
- \`FLASK_ENV\` - Environment (development/production)

## Ì∑™ Development

### Project Structure
\`\`\`
‚îú‚îÄ‚îÄ app.py              # Main Flask application
‚îú‚îÄ‚îÄ requirements.txt    # Python dependencies
‚îî‚îÄ‚îÄ README.md          # This documentation
\`\`\`

### Adding Features
1. **New endpoints** - Add routes in \`app.py\`
2. **Database** - Add SQLAlchemy for persistence
3. **Authentication** - Implement JWT or session auth
4. **Validation** - Add input validation with Marshmallow

## Ìæâ Features to Add

- [ ] Database integration (SQLAlchemy)
- [ ] User authentication (JWT)
- [ ] Input validation
- [ ] API rate limiting  
- [ ] Swagger documentation
- [ ] Unit tests
- [ ] Docker support

Built with ‚ù§Ô∏è and Flask! Ready for real-time collaboration. Ì∫Ä`
        }
      }
    };
  }

  async createProject(projectType, projectName, targetPath) {
    try {
      console.log(\`Creating \${projectType} project: \${projectName} at \${targetPath}\`);
      
      const template = this.templates[projectType];
      if (!template) {
        throw new Error(\`Template for \${projectType} not found\`);
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
        message: \`\${template.name} project "\${projectName}" created successfully!\`,
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
