require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const authController = require('./controllers/authController');
const documentController = require('./controllers/documentController');
const Document = require('./models/Document');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || "http://localhost:3000");
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-auth-token');
  next();
});

// Auth Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/user/profile', authController.authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Document Routes
app.post('/api/documents', authController.authenticate, documentController.createDocument);
app.put('/api/documents/:id', authController.authenticate, documentController.updateDocument);
app.get('/api/documents/:id', authController.authenticate, documentController.getDocument);
app.post('/api/documents/:id/branches', authController.authenticate, documentController.createBranch);
app.post('/api/documents/:id/switch-branch', authController.authenticate, documentController.switchBranch);
app.post('/api/documents/:id/merge', authController.authenticate, documentController.mergeBranch);
app.post('/api/documents/:id/collaborators', authController.authenticate, documentController.addCollaborator);

// Socket.IO Authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    socket.user = User.findById(decoded.id);
    next();
  } catch {
    return next(new Error('Invalid token'));
  }
});

// Socket.IO Event Handlers
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);

  socket.on('joinDocument', ({ documentId }) => {
    const doc = Document.findById(documentId);
    if (doc && doc.hasPermission(socket.userId, 'read')) {
      socket.join(`doc:${documentId}`);
      socket.emit('documentData', { ...doc.getMetadataFor(socket.userId) });
    } else {
      socket.emit('error', { message: 'Access denied' });
    }
  });

  socket.on('textChange', ({ documentId, delta }) => {
    const doc = Document.findById(documentId);
    if (doc && doc.hasPermission(socket.userId, 'write')) {
      socket.to(`doc:${documentId}`).emit('textChange', { 
        delta, 
        userId: socket.userId 
      });
    }
  });

  socket.on('saveVersion', ({ documentId, encryptedContent, message }) => {
    const doc = Document.findById(documentId);
    if (doc && doc.hasPermission(socket.userId, 'write')) {
      const version = doc.addVersion(encryptedContent, socket.userId, message);
      io.to(`doc:${documentId}`).emit('versionSaved', { version });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});