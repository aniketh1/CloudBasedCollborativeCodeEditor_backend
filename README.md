# Cloud-Based Collaborative Code Editor - Backend

This is the backend server for the Cloud-Based Collaborative Code Editor. It provides real-time terminal functionality, project management, and WebSocket communication for the collaborative coding environment.

## Features

- **Real-time Terminal**: PowerShell integration with proper input/output handling
- **WebSocket Communication**: Socket.IO for real-time collaboration
- **Project Management**: CRUD operations for coding projects
- **Room-based Collaboration**: Multiple users can work in shared coding rooms
- **File System Integration**: File operations and project structure management

## Technologies Used

- **Node.js & Express**: Server framework
- **Socket.IO**: Real-time WebSocket communication
- **MongoDB**: Database for user data and projects
- **PowerShell Integration**: Terminal functionality on Windows
- **JWT Authentication**: Secure user authentication

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```
4. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Projects
- `GET /api/projects` - Get user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get specific project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Rooms
- `GET /api/rooms` - Get available rooms
- `POST /api/rooms` - Create new room
- `GET /api/rooms/:id` - Get room details

### File System
- `POST /api/filesystem/create` - Create file/folder
- `GET /api/filesystem/read` - Read file content
- `PUT /api/filesystem/update` - Update file content
- `DELETE /api/filesystem/delete` - Delete file/folder

## WebSocket Events

### Terminal Events
- `terminal-input` - Send input to terminal
- `terminal-output` - Receive terminal output
- `terminal-ready` - Terminal session initialized

### Collaboration Events
- `join-room` - Join a coding room
- `leave-room` - Leave a coding room
- `code-change` - Real-time code synchronization

## Development

The server includes extensive debugging and logging for terminal operations. Key features:

- PowerShell process spawning with proper flags
- Input/output character conversion (DEL to Backspace)
- Comprehensive error handling and logging
- Real-time collaboration support

## Configuration

- Default port: 5000
- Terminal: PowerShell (Windows)
- Database: MongoDB
- WebSocket: Socket.IO with CORS enabled

## License

MIT License
