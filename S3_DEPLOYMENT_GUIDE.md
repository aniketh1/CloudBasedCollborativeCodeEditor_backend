# AWS S3 Integration - Deployment Guide

## ✅ What We've Implemented

### **Backend Changes**
1. **AWS SDK Integration**
   - Installed `@aws-sdk/client-s3`, `@aws-sdk/lib-storage`, `@aws-sdk/s3-request-presigner`
   - Created `services/S3Service.js` for S3 operations

2. **File Model Updates** (`models/File.js`)
   - Added S3 storage fields: `storageType`, `s3Key`, `s3Bucket`, `s3ETag`
   - Modified file CRUD operations to support S3 storage
   - Files stored in S3, metadata in MongoDB
   - Automatic fallback to MongoDB if S3 fails

3. **S3 Service Features**
   - `uploadFile()` - Upload file content to S3
   - `downloadFile()` - Download file content from S3
   - `deleteFile()` - Delete file from S3
   - `deleteProjectFiles()` - Bulk delete project files
   - `getPresignedUrl()` - Generate temporary download URLs
   - `fileExists()` - Check file existence
   - `getFileMetadata()` - Get file info without downloading

4. **File Storage Strategy**
   - **Content**: Stored in S3 (cloud storage)
   - **Metadata**: Stored in MongoDB (name, path, language, timestamps, etc.)
   - **Benefits**: 
     - Scalable storage for large files
     - Reduced MongoDB storage costs
     - Better performance for file operations
     - Version control support

## 🚀 Deployment Steps

### **Step 1: Configure Render Environment Variables**

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your **backend service**: `CloudBasedCollborativeCodeEditor_backend`
3. Navigate to **Environment** tab
4. Click **Add Environment Variable**
5. Add the following variables:

```
AWS_ACCESS_KEY_ID=AKIAR************LUI
AWS_SECRET_ACCESS_KEY=11S6U8***************************q82
AWS_S3_BUCKET_NAME=colabdev-project-files-2025
AWS_REGION=eu-north-1
```

> **Note**: Use your actual AWS credentials from AWS Console (IAM > Users > Security credentials)

6. Click **Save Changes**
7. Render will automatically trigger a deployment

### **Step 2: Verify Deployment**

After deployment completes (2-3 minutes):

1. **Check Logs** in Render dashboard
2. Look for: `✅ S3 Service initialized with bucket: colabdev-project-files-2025`
3. Test file creation in your app

### **Step 3: Monitor S3 Usage**

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com)
2. Select bucket: `colabdev-project-files-2025`
3. Check the **Objects** tab to see uploaded files
4. Files will be organized as: `projects/{projectId}/files/{filepath}`

## 🧪 Testing S3 Integration

### **Local Testing**
```bash
cd Backend
node test-s3.js
```

This will:
- Upload a test file
- Download and verify content
- Check file existence
- Get file metadata
- Generate presigned URL
- Delete the test file
- Verify deletion

### **Production Testing**
1. Create a new project in your app
2. Create/edit a file
3. Check AWS S3 Console to verify file is uploaded
4. Check MongoDB to verify metadata is stored (without content)

## 📊 Migration (Optional)

If you have existing files in MongoDB that you want to move to S3:

### **Dry Run** (Preview migration without changes)
```bash
node migrate-to-s3.js --dry-run
```

### **Migrate All Files**
```bash
node migrate-to-s3.js
```

### **Migrate Specific Project**
```bash
node migrate-to-s3.js --projectId=YOUR_PROJECT_ID
```

## 🔧 How It Works

### **File Creation Flow**
1. User creates a file in the editor
2. Backend receives file data (path, content, language)
3. If S3 is configured (`storageType: 's3'`):
   - Upload content to S3: `projects/{projectId}/files/{filepath}`
   - Store metadata in MongoDB (without content)
   - Save S3 key, bucket, ETag
4. If S3 fails or not configured:
   - Fallback to MongoDB storage
   - Store content directly in MongoDB

### **File Retrieval Flow**
1. User opens a file
2. Backend fetches file metadata from MongoDB
3. If `storageType === 's3'`:
   - Download content from S3 using `s3Key`
   - Return content to frontend
4. If `storageType === 'mongodb'`:
   - Return content directly from MongoDB

### **File Update Flow**
1. User edits file
2. Backend updates file:
   - Upload new version to S3 (overwrites existing)
   - Update metadata in MongoDB
   - Update `s3ETag` for version tracking
   - Create version record (also in S3)

### **File Deletion Flow**
1. User deletes file
2. Backend:
   - Delete file from S3
   - Delete metadata from MongoDB
   - Delete all versions from S3 and MongoDB

## 📁 S3 Folder Structure

```
colabdev-project-files-2025/
├── projects/
│   ├── {projectId-1}/
│   │   └── files/
│   │       ├── index.js
│   │       ├── src/
│   │       │   ├── App.js
│   │       │   └── utils.js
│   │       └── package.json
│   ├── {projectId-2}/
│   │   └── files/
│   │       └── ...
│   └── versions/
│       ├── {versionId-1}
│       ├── {versionId-2}
│       └── ...
```

## 🔐 Security Notes

### **AWS Credentials**
- ✅ Stored securely in environment variables
- ✅ Never committed to Git (in `.env` file)
- ✅ IAM user has minimal permissions (S3 only)

### **S3 Bucket Permissions**
- Private bucket (not publicly accessible)
- Access via IAM credentials only
- Files can only be accessed through your backend API
- Presigned URLs for temporary direct access (expires after 1 hour)

## 💰 Cost Estimation

### **AWS S3 Pricing** (eu-north-1 region)
- **Storage**: ~$0.024 per GB/month
- **PUT/COPY requests**: $0.005 per 1,000 requests
- **GET requests**: $0.0004 per 1,000 requests
- **Data Transfer OUT**: First 1 GB free, then $0.09 per GB

### **Example Usage**
- 100 projects × 10 files × 50 KB = ~50 MB storage = **$0.0012/month**
- 1,000 file operations/month = **$0.005/month**
- **Total**: Less than **$0.01/month** for small-scale usage

### **Free Tier** (First 12 months)
- 5 GB storage
- 20,000 GET requests
- 2,000 PUT requests
- **Your usage will likely stay within free tier!**

## 🐛 Troubleshooting

### **Error: "S3 Service not initialized"**
- Check if AWS environment variables are set in Render
- Verify variable names match exactly
- Check Render deployment logs

### **Error: "The bucket does not exist"**
- Verify bucket name: `colabdev-project-files-2025`
- Check if bucket is in `eu-north-1` region
- Confirm bucket wasn't deleted

### **Error: "Access Denied"**
- Check IAM user permissions
- Verify Access Key ID and Secret Access Key
- Ensure IAM user has `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` permissions

### **Files Not Appearing in S3**
- Check Render environment variables are set
- Look for S3 errors in Render logs
- Verify `storageType` field in MongoDB is `'s3'`
- Check if fallback to MongoDB occurred

### **Slow File Operations**
- S3 is in `eu-north-1` (Stockholm) - may have latency from other regions
- Consider using CloudFront CDN for faster access
- Presigned URLs can bypass backend for downloads

## 📚 Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/best-practices.html)
- [Render Environment Variables](https://render.com/docs/configure-environment-variables)

## ✅ Success Checklist

- [ ] AWS S3 bucket created: `colabdev-project-files-2025`
- [ ] IAM user created with S3 permissions
- [ ] Environment variables added to Render
- [ ] Backend redeployed successfully
- [ ] S3 Service initialization message in logs
- [ ] Test file creation works
- [ ] Files appear in S3 Console
- [ ] MongoDB only stores metadata (no content)
- [ ] File retrieval works correctly
- [ ] File deletion removes from S3

## 🎉 You're All Set!

Your collaborative code editor now uses AWS S3 for scalable, cloud-based file storage! 🚀
