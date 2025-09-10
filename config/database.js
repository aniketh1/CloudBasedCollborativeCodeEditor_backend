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
    // Create users collection with validation
    await db.createCollection("users", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["email", "username", "password", "createdAt"],
          properties: {
            email: {
              bsonType: "string",
              pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
              description: "Must be a valid email address"
            },
            username: {
              bsonType: "string",
              minLength: 3,
              maxLength: 30,
              description: "Username must be between 3 and 30 characters"
            },
            password: {
              bsonType: "string",
              description: "Hashed password"
            },
            firstName: {
              bsonType: "string",
              maxLength: 50
            },
            lastName: {
              bsonType: "string",
              maxLength: 50
            },
            profilePicture: {
              bsonType: "string"
            },
            isActive: {
              bsonType: "bool"
            },
            lastLogin: {
              bsonType: "date"
            },
            createdAt: {
              bsonType: "date"
            },
            updatedAt: {
              bsonType: "date"
            }
          }
        }
      }
    });

    // Create sessions collection
    await db.createCollection("sessions", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["sessionId", "userId", "createdAt"],
          properties: {
            sessionId: {
              bsonType: "string",
              description: "Unique session identifier"
            },
            userId: {
              bsonType: "objectId",
              description: "Reference to user ID"
            },
            socketId: {
              bsonType: "string",
              description: "Socket.io connection ID"
            },
            ipAddress: {
              bsonType: "string"
            },
            userAgent: {
              bsonType: "string"
            },
            isActive: {
              bsonType: "bool"
            },
            lastActivity: {
              bsonType: "date"
            },
            createdAt: {
              bsonType: "date"
            },
            expiresAt: {
              bsonType: "date"
            }
          }
        }
      }
    });

    // Create rooms collection for collaborative sessions
    await db.createCollection("rooms", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["roomId", "createdBy", "createdAt"],
          properties: {
            roomId: {
              bsonType: "string",
              description: "Unique room identifier"
            },
            name: {
              bsonType: "string",
              maxLength: 100
            },
            description: {
              bsonType: "string",
              maxLength: 500
            },
            createdBy: {
              bsonType: "objectId",
              description: "User ID who created the room"
            },
            participants: {
              bsonType: "array",
              items: {
                bsonType: "objectId"
              }
            },
            isPublic: {
              bsonType: "bool"
            },
            maxParticipants: {
              bsonType: "int",
              minimum: 1,
              maximum: 50
            },
            code: {
              bsonType: "string",
              description: "Current code content"
            },
            language: {
              bsonType: "string",
              enum: ["javascript", "python", "java", "cpp", "html", "css", "typescript", "go", "rust"]
            },
            isActive: {
              bsonType: "bool"
            },
            createdAt: {
              bsonType: "date"
            },
            updatedAt: {
              bsonType: "date"
            }
          }
        }
      }
    });

    // Create projects collection - FIXED VERSION
    await db.createCollection("projects", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["name", "createdBy", "roomId", "createdAt", "updatedAt"],
          properties: {
            name: {
              bsonType: "string",
              minLength: 1,
              maxLength: 100,
              description: "Project name"
            },
            description: {
              bsonType: "string",
              maxLength: 500,
              description: "Project description - optional"
            },
            localPath: {
              bsonType: ["string", "null"],
              description: "Local file system path to project directory - can be null"
            },
            createdBy: {
              bsonType: ["objectId", "string"],
              description: "User ID who created the project"
            },
            participants: {
              bsonType: "array",
              items: {
                bsonType: ["objectId", "string"]
              },
              description: "Array of user IDs who have access to this project"
            },
            roomId: {
              bsonType: "string",
              minLength: 1,
              description: "Associated room ID for collaboration"
            },
            projectType: {
              bsonType: "string",
              enum: ["general", "nodejs", "react", "vue", "angular", "python", "java", "cpp", "go", "rust", "php", "ruby"],
              description: "Type of project for better tooling support"
            },
            isActive: {
              bsonType: "bool",
              description: "Whether the project is active"
            },
            settings: {
              bsonType: "object",
              required: ["allowTerminal", "allowFileOperations", "restrictedPaths"],
              properties: {
                allowTerminal: {
                  bsonType: "bool",
                  description: "Whether terminal access is allowed"
                },
                allowFileOperations: {
                  bsonType: "bool",
                  description: "Whether file operations are allowed"
                },
                restrictedPaths: {
                  bsonType: "array",
                  items: {
                    bsonType: "string"
                  },
                  description: "Paths that are restricted from access"
                }
              }
            },
            createdAt: {
              bsonType: "date",
              description: "Creation timestamp"
            },
            updatedAt: {
              bsonType: "date",
              description: "Last update timestamp"
            }
          }
        }
      }
    });

    // Create indexes for better performance
    await createIndexes();
    
    console.log("✅ Collections created successfully");
  } catch (error) {
    if (error.codeName === 'NamespaceExists') {
      console.log("📝 Collections already exist, updating validation and creating indexes...");
      
      // Update validation for existing projects collection
      await updateProjectsValidation();
      await createIndexes();
    } else {
      console.error("❌ Error creating collections:", error);
      throw error;
    }
  }
}

// Function to update projects collection validation
async function updateProjectsValidation() {
  try {
    await db.command({
      collMod: "projects",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["name", "createdBy", "roomId", "createdAt", "updatedAt"],
          properties: {
            name: {
              bsonType: "string",
              minLength: 1,
              maxLength: 100,
              description: "Project name"
            },
            description: {
              bsonType: "string",
              maxLength: 500,
              description: "Project description - optional"
            },
            localPath: {
              bsonType: ["string", "null"],
              description: "Local file system path to project directory - can be null"
            },
            createdBy: {
              bsonType: ["objectId", "string"],
              description: "User ID who created the project"
            },
            participants: {
              bsonType: "array",
              items: {
                bsonType: ["objectId", "string"]
              },
              description: "Array of user IDs who have access to this project"
            },
            roomId: {
              bsonType: "string",
              minLength: 1,
              description: "Associated room ID for collaboration"
            },
            projectType: {
              bsonType: "string",
              enum: ["general", "nodejs", "react", "vue", "angular", "python", "java", "cpp", "go", "rust", "php", "ruby"],
              description: "Type of project for better tooling support"
            },
            isActive: {
              bsonType: "bool",
              description: "Whether the project is active"
            },
            settings: {
              bsonType: "object",
              required: ["allowTerminal", "allowFileOperations", "restrictedPaths"],
              properties: {
                allowTerminal: {
                  bsonType: "bool",
                  description: "Whether terminal access is allowed"
                },
                allowFileOperations: {
                  bsonType: "bool",
                  description: "Whether file operations are allowed"
                },
                restrictedPaths: {
                  bsonType: "array",
                  items: {
                    bsonType: "string"
                  },
                  description: "Paths that are restricted from access"
                }
              }
            },
            createdAt: {
              bsonType: "date",
              description: "Creation timestamp"
            },
            updatedAt: {
              bsonType: "date",
              description: "Last update timestamp"
            }
          }
        }
      },
      validationLevel: "strict",
      validationAction: "error"
    });
    
    console.log("✅ Projects collection validation updated");
  } catch (error) {
    console.error("❌ Error updating projects validation:", error);
    throw error;
  }
}

async function createIndexes() {
  try {
    // Users collection indexes
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ username: 1 }, { unique: true });
    await db.collection("users").createIndex({ createdAt: 1 });

    // Sessions collection indexes
    await db.collection("sessions").createIndex({ sessionId: 1 }, { unique: true });
    await db.collection("sessions").createIndex({ userId: 1 });
    await db.collection("sessions").createIndex({ socketId: 1 });
    await db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await db.collection("sessions").createIndex({ lastActivity: 1 });

    // Rooms collection indexes
    await db.collection("rooms").createIndex({ roomId: 1 }, { unique: true });
    await db.collection("rooms").createIndex({ createdBy: 1 });
    await db.collection("rooms").createIndex({ participants: 1 });
    await db.collection("rooms").createIndex({ createdAt: 1 });
    await db.collection("rooms").createIndex({ isActive: 1 });

    // Projects collection indexes
    await db.collection("projects").createIndex({ roomId: 1 }, { unique: true });
    await db.collection("projects").createIndex({ createdBy: 1 });
    await db.collection("projects").createIndex({ participants: 1 });
    await db.collection("projects").createIndex({ name: 1, createdBy: 1 }, { unique: true });
    await db.collection("projects").createIndex({ projectType: 1 });
    await db.collection("projects").createIndex({ isActive: 1 });
    await db.collection("projects").createIndex({ createdAt: 1 });

    console.log("✅ Indexes created successfully");
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
  }
}

// Function to temporarily disable validation for debugging
async function disableProjectsValidation() {
  try {
    await db.command({
      collMod: "projects",
      validator: {},
      validationLevel: "off"
    });
    console.log("✅ Projects validation disabled");
  } catch (error) {
    console.error("❌ Error disabling validation:", error);
  }
}

// Function to get current validation rules
async function getValidationRules(collectionName) {
  try {
    const collections = await db.listCollections({ name: collectionName }).toArray();
    
    if (collections.length > 0 && collections[0].options && collections[0].options.validator) {
      return collections[0].options.validator;
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting validation rules for ${collectionName}:`, error);
    return null;
  }
}

function getDB() {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }
  return db;
}

async function closeDB() {
  try {
    await client.close();
    console.log("✅ MongoDB connection closed");
  } catch (error) {
    console.error("❌ Error closing MongoDB connection:", error);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  await closeDB();
  process.exit(0);
});

module.exports = {
  connectDB,
  getDB,
  closeDB,
  disableProjectsValidation,
  getValidationRules,
  updateProjectsValidation
};