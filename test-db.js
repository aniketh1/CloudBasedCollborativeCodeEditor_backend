// Simple test to check database connection
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || "mongodb+srv://aniketkorwa:colabDev@cluster0.e7xcg8n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

console.log('Testing database connection...');
console.log('URI:', uri.replace(/:[^:@]*@/, ':****@')); // Hide password

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function testConnection() {
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB!');
    
    const db = client.db("collaborative_code_editor");
    console.log('✅ Database selected');
    
    await client.db("admin").command({ ping: 1 });
    console.log('✅ Ping successful');
    
    console.log('✅ Database connection test completed successfully!');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

testConnection();
