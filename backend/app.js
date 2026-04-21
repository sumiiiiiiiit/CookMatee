const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

const frontendOrigin = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '').trim();

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const io = new Server(server, {
  cors: { origin: frontendOrigin, credentials: true },
});

io.use((socket, next) => {
  let token = socket.handshake.auth?.token || socket.handshake.query?.token;

  if ((!token || token === 'none') && socket.handshake.headers.cookie) {
    const cookies = require('cookie').parse(socket.handshake.headers.cookie);
    token = cookies.token;
  }

  if (!token || token === 'none') return next(new Error('Authentication error'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Authentication error'));
  }
});

const userConnections = new Map();

io.on('connection', (socket) => {
  const userId = socket.userId;
  socket.join(userId);

  const currentCount = userConnections.get(userId) || 0;
  userConnections.set(userId, currentCount + 1);
  if (currentCount === 0) io.emit('user_online', userId);

  socket.on('send_message', async ({ receiverId, recipeId, message }) => {
    if (!receiverId || !message?.trim()) return;
    try {
      const payload = {
        senderId: userId,
        receiverId,
        message: message.trim(),
      };
      if (recipeId && recipeId !== 'null' && recipeId !== 'undefined') {
        payload.recipeId = recipeId;
      }

      const saved = await Message.create(payload);
      const response = {
        _id: saved._id,
        senderId: userId,
        receiverId,
        recipeId: saved.recipeId,
        message: saved.message,
        timestamp: saved.timestamp,
      };

      io.to(receiverId).emit('receive_message', response);
      io.to(userId).emit('message_sent', response);
    } catch (err) {
      console.error('Socket send_message error:', err);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  socket.on('typing', ({ receiverId }) => {
    io.to(receiverId).emit('user_typing', { senderId: userId });
  });

  socket.on('stop_typing', ({ receiverId }) => {
    io.to(receiverId).emit('user_stop_typing', { senderId: userId });
  });

  socket.on('disconnect', () => {
    const count = (userConnections.get(userId) || 1) - 1;
    if (count <= 0) {
      userConnections.delete(userId);
      io.emit('user_offline', userId);
    } else {
      userConnections.set(userId, count);
    }
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/search', require('./routes/search'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/earnings', require('./routes/earnings'));

app.get('/', (req, res) => {
  res.json({ message: 'CookMate API is running', status: 'ok' });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = { app, server };
