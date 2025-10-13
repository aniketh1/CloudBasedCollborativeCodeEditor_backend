/**
 * Migration Script: Move existing files from MongoDB to S3
 * 
 * This script migrates file content from MongoDB storage to AWS S3.
 * Run this after setting up S3 to move existing project files to cloud storage.
 * 
 * Usage: node migrate-to-s3.js [--dry-run] [--projectId=PROJECT_ID]
 */

require('dotenv').config();
const { getDatabase, connectDatabase, disconnectDatabase } = require('./config/database');
const s3Service = require('./services/S3Service');

const DRY_RUN = process.argv.includes('--dry-run');
const PROJECT_ID_ARG = process.argv.find(arg => arg.startsWith('--projectId='));
const SPECIFIC_PROJECT_ID = PROJECT_ID_ARG ? PROJECT_ID_ARG.split('=')[1] : null;

async function migrateFilesToS3() {
  console.log('🚀 Starting S3 migration...\n');
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  try {
    // Connect to database
    await connectDatabase();
    const db = getDatabase();
    const filesCollection = db.collection('files');
    
    // Build query
    const query = {
      type: 'file',
      storageType: { $ne: 's3' } // Only migrate files not already in S3
    };
    
    if (SPECIFIC_PROJECT_ID) {
      query.projectId = SPECIFIC_PROJECT_ID;
      console.log(`📁 Migrating files for project: ${SPECIFIC_PROJECT_ID}\n`);
    } else {
      console.log(`📁 Migrating ALL project files\n`);
    }
    
    // Get files to migrate
    const files = await filesCollection.find(query).toArray();
    
    if (files.length === 0) {
      console.log('✅ No files to migrate!');
      return;
    }
    
    console.log(`Found ${files.length} files to migrate\n`);
    
    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;
    
    // Migrate each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = `[${i + 1}/${files.length}]`;
      
      try {
        // Skip if no content
        if (!file.content) {
          console.log(`${progress} ⏭️  Skipped (no content): ${file.path}`);
          skippedCount++;
          continue;
        }
        
        if (DRY_RUN) {
          console.log(`${progress} 🔍 Would migrate: ${file.path} (${file.size} bytes)`);
          successCount++;
        } else {
          // Upload to S3
          const s3Result = await s3Service.uploadFile(
            file.projectId,
            file.path,
            file.content,
            file.language ? `text/${file.language}` : 'text/plain'
          );
          
          // Update database record
          await filesCollection.updateOne(
            { fileId: file.fileId },
            {
              $set: {
                storageType: 's3',
                s3Key: s3Result.s3Key,
                s3Bucket: s3Result.bucket,
                s3ETag: s3Result.etag,
                updatedAt: new Date()
              },
              $unset: { content: '' } // Remove content from MongoDB
            }
          );
          
          console.log(`${progress} ✅ Migrated: ${file.path} → ${s3Result.s3Key}`);
          successCount++;
        }
      } catch (error) {
        console.error(`${progress} ❌ Failed: ${file.path}`, error.message);
        failCount++;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`📦 Total: ${files.length}`);
    console.log('='.repeat(60));
    
    if (DRY_RUN) {
      console.log('\n💡 Run without --dry-run to perform actual migration');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await disconnectDatabase();
  }
}

// Run migration
if (require.main === module) {
  migrateFilesToS3()
    .then(() => {
      console.log('\n✅ Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateFilesToS3 };
