const { MongoClient } = require('mongodb');
require('dotenv').config();

async function cleanDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log('Found collections:', collections.map(c => c.name));
    
    // Drop all collections
    for (const collection of collections) {
      await db.collection(collection.name).drop();
      console.log(`Dropped collection: ${collection.name}`);
    }
    
    console.log('✅ Database cleaned successfully!');
    
    // Create new collections with proper schema
    console.log('Creating new collections...');
    
    // Users collection
    const users = db.collection('users');
    await users.createIndex({ userId: 1 }, { unique: true });
    await users.createIndex({ email: 1 }, { unique: true });
    console.log('✅ Users collection created');
    
    // Projects collection
    const projects = db.collection('projects');
    await projects.createIndex({ projectId: 1 }, { unique: true });
    await projects.createIndex({ roomId: 1 }, { unique: true });
    await projects.createIndex({ userId: 1 });
    console.log('✅ Projects collection created');
    
    // Files collection
    const files = db.collection('files');
    await files.createIndex({ fileId: 1 }, { unique: true });
    await files.createIndex({ projectId: 1 });
    await files.createIndex({ filePath: 1, projectId: 1 }, { unique: true });
    console.log('✅ Files collection created');
    
    // Collaboration sessions collection
    const sessions = db.collection('collaborationSessions');
    await sessions.createIndex({ roomId: 1 });
    await sessions.createIndex({ userId: 1 });
    await sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours
    console.log('✅ Collaboration sessions collection created');
    
    // File versions collection for collaboration history
    const versions = db.collection('fileVersions');
    await versions.createIndex({ fileId: 1 });
    await versions.createIndex({ version: 1 });
    await versions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days
    console.log('✅ File versions collection created');
    
    console.log('🎉 Database schema created successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run the cleanup
cleanDatabase().catch(console.error);