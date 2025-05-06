require('dotenv').config();
const cors = require('cors');
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
app.use(cors({
    origin: 'http://localhost:3000', 
    credentials: true
  }));
  
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(bodyParser.json());

app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/user/profile', authController.authenticate, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/documents', authController.authenticate, documentController.createDocument);
app.put('/api/documents/:id', authController.authenticate, documentController.updateDocument);
app.get('/api/documents/:id', authController.authenticate, documentController.getDocument);
app.post('/api/documents/:id/branches', authController.authenticate, documentController.createBranch);
app.post('/api/documents/:id/switch-branch', authController.authenticate, documentController.switchBranch);
app.post('/api/documents/:id/merge', authController.authenticate, documentController.mergeBranch);
app.post('/api/documents/:id/collaborators', authController.authenticate, documentController.addCollaborator);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error: no token'));
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    socket.user = User.findById(decoded.id);
    if (!socket.user) throw new Error('User not found');
    next();
  } catch (err) {
    console.error('Socket auth error:', err.message);
    return next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.userId}`);

  socket.on('joinDocument', ({ documentId }) => {
    console.log(`User ${socket.userId} joined document ${documentId}`);
    const doc = Document.findById(documentId);
    if (doc && doc.hasPermission(socket.userId, 'read')) {
      socket.join(`doc:${documentId}`);
      socket.emit('documentData', { ...doc.getMetadataFor(socket.userId) });
    } else {
      console.warn(`Access denied to document ${documentId} for user ${socket.userId}`);
    }
  });

  socket.on('textChange', ({ documentId, delta }) => {
    socket.to(`doc:${documentId}`).emit('textChange', { delta, userId: socket.userId });
  });

  socket.on('saveVersion', ({ documentId, encryptedContent, message }) => {
    console.log(`saveVersion received for doc ${documentId} by user ${socket.userId}`);
    const doc = Document.findById(documentId);
    if (doc && doc.hasPermission(socket.userId, 'write')) {
      const version = doc.addVersion(encryptedContent, socket.userId, message);
      console.log("Emitting versionSaved:", version);
      io.to(`doc:${documentId}`).emit('versionSaved', { version });
    } else {
      console.warn(`saveVersion denied for doc ${documentId} by user ${socket.userId}`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
