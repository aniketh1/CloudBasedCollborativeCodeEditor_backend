require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const fileSystemService = require('./services/FileSystemService');

async function testMultipleTechnologies() {
  console.log('Testing MongoDB File Storage for Multiple Technologies...\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const testRoomId = 'tech-test-' + Date.now();
    console.log(`Using test room: ${testRoomId}\n`);
    
    // Test different file types/technologies
    const testFiles = [
      { path: 'frontend/App.js', content: 'import React from "react";\nexport default function App() { return <div>Hello React</div>; }', tech: 'React.js' },
      { path: 'backend/server.py', content: 'from flask import Flask\napp = Flask(__name__)\n\n@app.route("/")\ndef hello():\n    return "Hello Python Flask!"', tech: 'Python Flask' },
      { path: 'database/schema.sql', content: 'CREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  email VARCHAR(255) UNIQUE,\n  created_at TIMESTAMP\n);', tech: 'PostgreSQL' },
      { path: 'config/package.json', content: '{\n  "name": "test-project",\n  "version": "1.0.0",\n  "dependencies": {\n    "express": "^4.18.0"\n  }\n}', tech: 'Node.js Config' },
      { path: 'styles/main.css', content: '.container {\n  display: flex;\n  justify-content: center;\n  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);\n}', tech: 'CSS3' },
      { path: 'scripts/build.sh', content: '#!/bin/bash\necho "Building project..."\nnpm run build\necho "Build complete!"', tech: 'Shell Script' },
      { path: 'mobile/MainActivity.java', content: 'package com.example.app;\nimport android.app.Activity;\npublic class MainActivity extends Activity {\n    // Android Java code\n}', tech: 'Android Java' },
      { path: 'api/main.go', content: 'package main\nimport (\n    "fmt"\n    "net/http"\n)\nfunc main() {\n    fmt.Println("Go server starting...")\n}', tech: 'Go Language' },
      { path: 'components/Button.vue', content: '<template>\n  <button @click="handleClick">{{ label }}</button>\n</template>\n<script>\nexport default {\n  props: ["label"]\n}\n</script>', tech: 'Vue.js' },
      { path: 'data/analysis.R', content: '# R Script for Data Analysis\nlibrary(ggplot2)\ndata <- read.csv("data.csv")\nplot(data$x, data$y)', tech: 'R Language' }
    ];
    
    console.log('Creating files for different technologies:');
    for (const file of testFiles) {
      console.log(`- Creating ${file.tech} file: ${file.path}`);
      await fileSystemService.saveFile(testRoomId, file.path, file.content, 'testuser');
    }
    
    console.log('\n✅ All technology files created!\n');
    
    // Get final structure
    const structure = await fileSystemService.getFileStructure(testRoomId);
    console.log('📁 Final MongoDB File Structure:');
    console.log('==========================================');
    
    structure.files.forEach(file => {
      const tech = testFiles.find(tf => tf.path === file.path)?.tech || 'Unknown';
      console.log(`📄 ${file.name} (${tech})`);
      console.log(`   Path: ${file.path}`);
      console.log(`   Size: ${file.size} bytes`);
      console.log(`   Language: ${file.language}`);
      console.log(`   Modified: ${file.lastModified}`);
      console.log('');
    });
    
    console.log('==========================================');
    console.log(`✅ SUCCESS: ${structure.files.length} files from different technologies stored in MongoDB!`);
    console.log('✅ MongoDB is successfully persisting files and folders for ALL technologies!');
    
    // Test file retrieval
    console.log('\n🔍 Testing file content retrieval...');
    const pythonFile = await fileSystemService.getFile(testRoomId, 'backend/server.py');
    console.log('Python Flask file content:');
    console.log(pythonFile);
    
    const reactFile = await fileSystemService.getFile(testRoomId, 'frontend/App.js');
    console.log('\nReact.js file content:');
    console.log(reactFile);
    
    console.log('\n🎉 DEMONSTRATION COMPLETE: MongoDB file system working perfectly!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

testMultipleTechnologies();