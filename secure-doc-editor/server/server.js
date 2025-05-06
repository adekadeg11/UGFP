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
const io = socketIo(server);

const PORT = 3001;
const JWT_SECRET = 'your_jwt_secret_key';

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

io.on('connection', (socket) => {
  socket.on('joinDocument', ({ documentId }) => {
    const doc = Document.findById(documentId);
    if (doc && doc.hasPermission(socket.userId, 'read')) {
      socket.join(`doc:${documentId}`);
      socket.emit('documentData', { ...doc.getMetadataFor(socket.userId) });
    }
  });

  socket.on('textChange', ({ documentId, delta }) => {
    socket.to(`doc:${documentId}`).emit('textChange', { delta, userId: socket.userId });
  });

  socket.on('saveVersion', ({ documentId, encryptedContent, message }) => {
    const doc = Document.findById(documentId);
    if (doc && doc.hasPermission(socket.userId, 'write')) {
      const version = doc.addVersion(encryptedContent, socket.userId, message);
      io.to(`doc:${documentId}`).emit('versionSaved', { version });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
