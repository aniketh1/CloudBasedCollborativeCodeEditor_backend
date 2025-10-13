const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const stream = require('stream');

class S3Service {
  constructor() {
    // Initialize S3 client with credentials from environment variables
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    
    this.bucketName = process.env.AWS_S3_BUCKET_NAME;
    
    // Validate configuration
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !this.bucketName) {
      console.warn('⚠️ AWS S3 configuration missing. File storage may not work properly.');
    } else {
      console.log(`✅ S3 Service initialized with bucket: ${this.bucketName}`);
    }
  }

  /**
   * Generate S3 key from project and file path
   * Format: projects/{projectId}/files/{filepath}
   */
  generateS3Key(projectId, filepath) {
    // Remove leading slash if present
    const cleanPath = filepath.startsWith('/') ? filepath.slice(1) : filepath;
    return `projects/${projectId}/files/${cleanPath}`;
  }

  /**
   * Upload file content to S3
   * @param {string} projectId - Project ID
   * @param {string} filepath - File path within project
   * @param {string|Buffer} content - File content
   * @param {string} contentType - MIME type (default: 'text/plain')
   * @returns {Promise<object>} Upload result with s3Key and ETag
   */
  async uploadFile(projectId, filepath, content, contentType = 'text/plain') {
    const s3Key = this.generateS3Key(projectId, filepath);
    
    try {
      // Convert string content to Buffer if needed
      const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');
      
      const uploadParams = {
        Bucket: this.bucketName,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          projectId: projectId,
          filepath: filepath,
          uploadedAt: new Date().toISOString(),
        },
      };

      // Use Upload for better handling of large files
      const upload = new Upload({
        client: this.s3Client,
        params: uploadParams,
      });

      const result = await upload.done();
      
      console.log(`✅ Uploaded file to S3: ${s3Key}`);
      
      return {
        s3Key,
        bucket: this.bucketName,
        etag: result.ETag,
        location: result.Location,
        versionId: result.VersionId,
      };
    } catch (error) {
      console.error('❌ S3 upload error:', error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Download file content from S3
   * @param {string} s3Key - S3 object key
   * @returns {Promise<string>} File content as string
   */
  async downloadFile(s3Key) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      const response = await this.s3Client.send(command);
      
      // Convert stream to string
      const content = await this.streamToString(response.Body);
      
      console.log(`✅ Downloaded file from S3: ${s3Key}`);
      
      return content;
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        console.warn(`⚠️ File not found in S3: ${s3Key}`);
        return null;
      }
      console.error('❌ S3 download error:', error);
      throw new Error(`Failed to download file from S3: ${error.message}`);
    }
  }

  /**
   * Delete file from S3
   * @param {string} s3Key - S3 object key
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(s3Key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await this.s3Client.send(command);
      
      console.log(`✅ Deleted file from S3: ${s3Key}`);
      
      return true;
    } catch (error) {
      console.error('❌ S3 delete error:', error);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  /**
   * Delete all files for a project (when project is deleted)
   * @param {string} projectId - Project ID
   * @returns {Promise<number>} Number of files deleted
   */
  async deleteProjectFiles(projectId) {
    try {
      const prefix = `projects/${projectId}/files/`;
      
      // List all objects with the project prefix
      const listCommand = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      const listResponse = await this.s3Client.send(listCommand);
      
      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        console.log(`ℹ️ No files to delete for project: ${projectId}`);
        return 0;
      }

      // Delete all objects
      const deletePromises = listResponse.Contents.map(obj => 
        this.deleteFile(obj.Key)
      );

      await Promise.all(deletePromises);
      
      console.log(`✅ Deleted ${listResponse.Contents.length} files for project: ${projectId}`);
      
      return listResponse.Contents.length;
    } catch (error) {
      console.error('❌ S3 batch delete error:', error);
      throw new Error(`Failed to delete project files from S3: ${error.message}`);
    }
  }

  /**
   * Generate presigned URL for direct download (useful for large files)
   * @param {string} s3Key - S3 object key
   * @param {number} expiresIn - URL expiration in seconds (default: 3600)
   * @returns {Promise<string>} Presigned URL
   */
  async getPresignedUrl(s3Key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      
      return url;
    } catch (error) {
      console.error('❌ S3 presigned URL error:', error);
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  /**
   * Check if file exists in S3
   * @param {string} s3Key - S3 object key
   * @returns {Promise<boolean>} True if file exists
   */
  async fileExists(s3Key) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Helper: Convert readable stream to string
   */
  async streamToString(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
  }

  /**
   * Get file metadata from S3 (without downloading content)
   * @param {string} s3Key - S3 object key
   * @returns {Promise<object>} File metadata
   */
  async getFileMetadata(s3Key) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      const response = await this.s3Client.send(command);
      
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        etag: response.ETag,
        metadata: response.Metadata,
      };
    } catch (error) {
      console.error('❌ S3 metadata error:', error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new S3Service();
