/**
 * Test S3 Integration
 * 
 * This script tests AWS S3 connectivity and basic operations.
 * Run this to verify your S3 setup is working correctly.
 */

require('dotenv').config();
const s3Service = require('./services/S3Service');

async function testS3Integration() {
  console.log('🧪 Testing AWS S3 Integration\n');
  console.log('Configuration:');
  console.log(`  Bucket: ${process.env.AWS_S3_BUCKET_NAME}`);
  console.log(`  Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log(`  Access Key ID: ${process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 8) + '...' : 'NOT SET'}`);
  console.log(`  Secret Key: ${process.env.AWS_SECRET_ACCESS_KEY ? '***' : 'NOT SET'}\n`);

  try {
    // Test 1: Upload a test file
    console.log('Test 1: Upload file to S3');
    const testContent = `// Test file created at ${new Date().toISOString()}\nconsole.log('Hello from S3!');`;
    const testProjectId = 'test-project-' + Date.now();
    const testFilePath = 'test-file.js';
    
    const uploadResult = await s3Service.uploadFile(
      testProjectId,
      testFilePath,
      testContent,
      'text/javascript'
    );
    
    console.log('✅ Upload successful!');
    console.log(`   S3 Key: ${uploadResult.s3Key}`);
    console.log(`   ETag: ${uploadResult.etag}\n`);
    
    // Test 2: Download the file
    console.log('Test 2: Download file from S3');
    const downloadedContent = await s3Service.downloadFile(uploadResult.s3Key);
    
    if (downloadedContent === testContent) {
      console.log('✅ Download successful! Content matches.\n');
    } else {
      console.error('❌ Download failed! Content mismatch.');
      console.log(`Expected: ${testContent}`);
      console.log(`Got: ${downloadedContent}\n`);
    }
    
    // Test 3: Check file existence
    console.log('Test 3: Check file existence');
    const exists = await s3Service.fileExists(uploadResult.s3Key);
    
    if (exists) {
      console.log('✅ File exists check successful!\n');
    } else {
      console.error('❌ File exists check failed!\n');
    }
    
    // Test 4: Get file metadata
    console.log('Test 4: Get file metadata');
    const metadata = await s3Service.getFileMetadata(uploadResult.s3Key);
    console.log('✅ Metadata retrieved:');
    console.log(`   Content Type: ${metadata.contentType}`);
    console.log(`   Content Length: ${metadata.contentLength} bytes`);
    console.log(`   Last Modified: ${metadata.lastModified}\n`);
    
    // Test 5: Generate presigned URL
    console.log('Test 5: Generate presigned URL');
    const presignedUrl = await s3Service.getPresignedUrl(uploadResult.s3Key, 3600);
    console.log('✅ Presigned URL generated:');
    console.log(`   ${presignedUrl.substring(0, 100)}...\n`);
    
    // Test 6: Delete the file
    console.log('Test 6: Delete file from S3');
    await s3Service.deleteFile(uploadResult.s3Key);
    console.log('✅ Delete successful!\n');
    
    // Test 7: Verify file is deleted
    console.log('Test 7: Verify deletion');
    const existsAfterDelete = await s3Service.fileExists(uploadResult.s3Key);
    
    if (!existsAfterDelete) {
      console.log('✅ File successfully deleted!\n');
    } else {
      console.error('❌ File still exists after deletion!\n');
    }
    
    // Summary
    console.log('='.repeat(60));
    console.log('🎉 All S3 tests passed successfully!');
    console.log('='.repeat(60));
    console.log('Your S3 integration is working correctly.');
    console.log('You can now use S3 for file storage in your application.');
    
  } catch (error) {
    console.error('\n❌ S3 Test Failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check your AWS credentials in .env file');
    console.error('  2. Verify the S3 bucket name is correct');
    console.error('  3. Ensure the IAM user has S3 permissions');
    console.error('  4. Check the AWS region matches your bucket region');
    console.error('\nFull Error:', error);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  testS3Integration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { testS3Integration };
