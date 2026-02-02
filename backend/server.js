// server.js

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const path = require('path');
const app = express();

// Middleware
app.use(cors({
  origin: true, // Reflect the request origin
  credentials: true
}));
app.use(cookieParser());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// OAuth client
// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
  res.json({ message: 'CookMate API is running!' });
});

// Note: OAuth callback handled here to match Google Console redirect URI
app.get('/oauth2callback', require('./controllers/authController').handleOAuthCallback);

const PORT = process.env.PORT || 5001; // Port 5001 matches your .env and redirect URI
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
