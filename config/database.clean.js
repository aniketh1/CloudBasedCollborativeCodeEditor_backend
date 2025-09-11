const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || "mongodb+srv://aniketkorwa:colabDev@cluster0.e7xcg8n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;

async function connectDB() {
  try {
    // Connect the client to the server
    await client.connect();
    
    // Get the database instance
    db = client.db("collaborative_code_editor");
    
    // Create collections with validation schemas
    await createCollections();
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB!");
    
    return db;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

async function createCollections() {
  try {
    console.log('📝 Checking collections and creating indexes...');
    
    // Check if collections exist and create indexes instead of recreating collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    // Create projects collection if it doesn't exist
    if (!collectionNames.includes('projects')) {
      await db.createCollection("projects");
      console.log('✅ Projects collection created');
    }
    
    // Create users collection if it doesn't exist  
    if (!collectionNames.includes('users')) {
      await db.createCollection("users");
      console.log('✅ Users collection created');
    }
    
    // Create sessions collection if it doesn't exist
    if (!collectionNames.includes('sessions')) {
      await db.createCollection("sessions");
      console.log('✅ Sessions collection created');
    }
    
    // Create rooms collection if it doesn't exist
    if (!collectionNames.includes('rooms')) {
      await db.createCollection("rooms");
      console.log('✅ Rooms collection created');
    }
    
    // Create indexes for better performance
    await createIndexes();
    
    console.log('✅ Collections setup completed');
  } catch (error) {
    console.log('📝 Collections may already exist, continuing...');
    // Don't throw error for existing collections
  }
}

async function createIndexes() {
  try {
    // Create indexes for projects collection
    await db.collection('projects').createIndex({ "userId": 1 });
    await db.collection('projects').createIndex({ "name": 1 });
    await db.collection('projects').createIndex({ "createdAt": -1 });
    
    // Create indexes for users collection
    await db.collection('users').createIndex({ "email": 1 }, { unique: true });
    await db.collection('users').createIndex({ "username": 1 }, { unique: true });
    
    // Create indexes for sessions collection
    await db.collection('sessions').createIndex({ "sessionId": 1 }, { unique: true });
    await db.collection('sessions').createIndex({ "userId": 1 });
    
    // Create indexes for rooms collection
    await db.collection('rooms').createIndex({ "roomId": 1 }, { unique: true });
    await db.collection('rooms').createIndex({ "projectId": 1 });
    
    console.log('✅ Indexes created successfully');
  } catch (error) {
    console.log('📝 Some indexes may already exist, continuing...');
  }
}

async function getDatabase() {
  return db;
}

function closeConnection() {
  return client.close();
}

module.exports = {
  connectDB,
  getDatabase,
  closeConnection
};
