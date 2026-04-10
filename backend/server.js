// server.js

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const Message = require('./models/Message');

dotenv.config();
connectDB();

const path = require('path');
const app = express();
const server = http.createServer(app);

// Middleware - Robust CORS configuration
const frontendOrigin = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, "").trim();

app.use(cors({
  origin: frontendOrigin,
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: frontendOrigin,
    credentials: true,
  }
});
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Socket.io Auth Middleware ───────────────────────────────────────────────
io.use((socket, next) => {
  // Accept token from handshake auth or as query param
  let token = socket.handshake.auth?.token || socket.handshake.query?.token;

  // If token missing from auth, try extracting from httpOnly cookie
  if ((!token || token === 'none') && socket.handshake.headers.cookie) {
    const cookies = require('cookie').parse(socket.handshake.headers.cookie);
    token = cookies.token;
  }

  if (!token || token === 'none') {
    return next(new Error('Authentication error'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// ─── Socket.io Real‑Time Messaging ──────────────────────────────────────────
// Track the number of connections per user to broadcast online/offline accurately
const userConnections = new Map();

io.on('connection', (socket) => {
  const userId = socket.userId;
  socket.join(userId);

  // Increment connection count
  const currentCount = userConnections.get(userId) || 0;
  userConnections.set(userId, currentCount + 1);

  // Broadcast online status if this is their first connection
  if (currentCount === 0) {
    io.emit('user_online', userId);
  }

  // ── Send a message ──────────────────────────────────────────────────────
  socket.on('send_message', async ({ receiverId, recipeId, message }) => {
    if (!receiverId || !message?.trim()) return;

    try {
      const payloadToSave = {
        senderId: userId,
        receiverId,
        message: message.trim(),
      };
      // Add recipeId only if provided and not null string
      if (recipeId && recipeId !== 'null' && recipeId !== 'undefined') {
        payloadToSave.recipeId = recipeId;
      }

      const saved = await Message.create(payloadToSave);

      // In real scenario we'd deeply populate recipe details, but returning the ID is fine for frontend
      const payload = {
        _id: saved._id,
        senderId: userId,
        receiverId,
        recipeId: saved.recipeId,
        message: saved.message,
        timestamp: saved.timestamp,
      };

      // Deliver to receiver (all their active tabs)
      io.to(receiverId).emit('receive_message', payload);

      // Confirm delivery back to sender (all their active tabs)
      io.to(userId).emit('message_sent', payload);
    } catch (err) {
      console.error('Socket send_message error:', err);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // ── Typing indicators ───────────────────────────────────────────────────
  socket.on('typing', ({ receiverId }) => {
    io.to(receiverId).emit('user_typing', { senderId: userId });
  });

  socket.on('stop_typing', ({ receiverId }) => {
    io.to(receiverId).emit('user_stop_typing', { senderId: userId });
  });

  // ── Disconnect ───────────────────────────────────────────────────────────
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

// ─── REST Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/search', require('./routes/search'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/earnings', require('./routes/earnings'));


app.get('/', (req, res) => {
  res.json({ message: 'CookMate API is running!', status: 'ok' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});


app.get('/oauth2callback', require('./controllers/passwordController').handleOAuthCallback);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
