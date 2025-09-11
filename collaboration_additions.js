// Enhanced collaboration tracking
const roomUsers = new Map(); // roomId -> Map(userId -> { name, avatar, color, lastSeen })
const userCursors = new Map(); // roomId -> Map(userId -> { line, column, selection })
const activeFiles = new Map(); // roomId -> Map(filePath -> { content, lastModified, editingUsers: Set })
const userPresence = new Map(); // userId -> { roomId, currentFile, isActive, lastActivity }

// Generate user colors for cursors
const userColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];
let colorIndex = 0;

// Helper function to assign user color
function assignUserColor() {
  const color = userColors[colorIndex % userColors.length];
  colorIndex++;
  return color;
}

