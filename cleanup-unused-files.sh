#!/bin/bash

# Cleanup script for removing unused files from backend
# This script removes backup files, old server files, and test files
# IMPORTANT: Run this only after confirming simple-server.js is working

echo "🧹 Starting cleanup of unused backend files..."

# Create a backup list of files to be removed
echo "📋 Files to be removed:"
echo ""

# Old server files (we're using simple-server.js now)
echo "❌ index.js (old server - replaced by simple-server.js)"
echo "❌ index.js.backup"
echo "❌ index.js.backup-collab"

# Collaboration enhancement files (Socket.IO is disabled)
echo "❌ collaboration_additions.js"
echo "❌ enhanced_collaboration_events.js"
echo "❌ enhanced_disconnect.js"
echo "❌ enhanced_socket_events.js"

# Test files (not needed in production)
echo "❌ test-db.js"
echo "❌ test-email.js"
echo "❌ test-filesystem.js"
echo "❌ test-s3.js"
echo "❌ test-technologies.js"
echo "❌ check-schema.js"

# Migration scripts (already migrated)
echo "❌ migrate-to-s3.js"
echo "❌ recreate-projects.js"
echo "❌ reset-collections.js"
echo "❌ reset-db.js"

# Documentation files (keep only essential ones)
echo "❌ BACKEND_FIXES.md"
echo "❌ BACKEND_IMPLEMENTATION_GUIDE.md"
echo "❌ CORS_FIX_2025.md"
echo "❌ CORS_FIX_SUMMARY.md"
echo "❌ DEBUGGING_FILE_EXPLORER.md"
echo "❌ FILE_EXPLORER_FIX.md"
echo "❌ FRONTEND_BACKEND_S3_ANALYSIS.md"
echo "❌ FRONTEND_DEBUGGING_PROMPT.md"
echo "❌ SOCKET_ENHANCEMENTS.md"

echo ""
echo "📁 Essential files to KEEP:"
echo "✅ simple-server.js (active server)"
echo "✅ package.json"
echo "✅ package-lock.json"
echo "✅ .env files"
echo "✅ .gitignore"
echo "✅ README.md"
echo "✅ DEPLOYMENT_CHECKLIST.md"
echo "✅ ENV_SETUP.md"
echo "✅ S3_DEPLOYMENT_GUIDE.md"
echo "✅ S3_INTEGRATION_SUMMARY.md"
echo "✅ render.yaml"
echo "✅ All folders: config/, middleware/, models/, routes/, services/, scripts/"
echo ""

read -p "⚠️  Do you want to proceed with cleanup? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Cleanup cancelled"
    exit 0
fi

echo ""
echo "🗑️  Removing files..."

# Remove old server files
rm -f index.js index.js.backup index.js.backup-collab

# Remove collaboration enhancement files
rm -f collaboration_additions.js enhanced_collaboration_events.js enhanced_disconnect.js enhanced_socket_events.js

# Remove test files
rm -f test-db.js test-email.js test-filesystem.js test-s3.js test-technologies.js check-schema.js

# Remove migration scripts
rm -f migrate-to-s3.js recreate-projects.js reset-collections.js reset-db.js

# Remove excess documentation
rm -f BACKEND_FIXES.md BACKEND_IMPLEMENTATION_GUIDE.md CORS_FIX_2025.md CORS_FIX_SUMMARY.md
rm -f DEBUGGING_FILE_EXPLORER.md FILE_EXPLORER_FIX.md FRONTEND_BACKEND_S3_ANALYSIS.md
rm -f FRONTEND_DEBUGGING_PROMPT.md SOCKET_ENHANCEMENTS.md

echo "✅ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "  - Removed old server files (index.js, backups)"
echo "  - Removed Socket.IO enhancement files (disabled in simple-server.js)"
echo "  - Removed test files (not needed in production)"
echo "  - Removed migration scripts (already migrated to S3)"
echo "  - Removed excess documentation (kept essential guides)"
echo ""
echo "🎯 Active server: simple-server.js"
echo "📦 Run 'git status' to see changes"
