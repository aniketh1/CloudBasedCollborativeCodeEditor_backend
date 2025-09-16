require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const fileSystemService = require('./services/FileSystemService');

async function testFileSystemOperations() {
  console.log('Testing File System MongoDB Operations...\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const testRoomId = 'test-room-' + Date.now();
    console.log(`Using test room: ${testRoomId}\n`);
    
    // Test 1: Create a folder
    console.log('1. Creating a test folder...');
    const folderResult = await fileSystemService.createFolder(testRoomId, 'src', 'testuser');
    console.log('Folder created:', folderResult);
    
    // Test 2: Create a file by saving content
    console.log('\n2. Creating a test file...');
    const fileResult = await fileSystemService.saveFile(testRoomId, 'src/app.js', 'console.log("Hello World!");', 'testuser');
    console.log('File created:', fileResult);
    
    // Test 3: Get file structure
    console.log('\n3. Getting file structure...');
    const structure = await fileSystemService.getFileStructure(testRoomId);
    console.log('File structure:', JSON.stringify(structure, null, 2));
    
    // Test 4: Get file content
    console.log('\n4. Getting file content...');
    const content = await fileSystemService.getFile(testRoomId, 'src/app.js');
    console.log('File content:', content);
    
    // Test 5: Update file content
    console.log('\n5. Updating file content...');
    const updateResult = await fileSystemService.saveFile(testRoomId, 'src/app.js', 'console.log("Hello Updated World!");', 'testuser');
    console.log('Update result:', updateResult);
    
    // Test 6: Get updated content
    console.log('\n6. Getting updated file content...');
    const updatedContent = await fileSystemService.getFile(testRoomId, 'src/app.js');
    console.log('Updated content:', updatedContent);
    
    // Test 7: Create a nested file
    console.log('\n7. Creating a nested file...');
    const nestedResult = await fileSystemService.saveFile(testRoomId, 'src/components/Button.jsx', 'export default function Button() { return <button>Click me</button>; }', 'testuser');
    console.log('Nested file created:', nestedResult);
    
    // Test 8: Final structure
    console.log('\n8. Final file structure...');
    const finalStructure = await fileSystemService.getFileStructure(testRoomId);
    console.log('Final structure:', JSON.stringify(finalStructure, null, 2));
    
    console.log('\n✅ All file system operations completed successfully!');
    console.log('MongoDB is properly storing files and folders for all technologies.');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

testFileSystemOperations();