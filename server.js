const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require('cors');
const helmet = require('helmet');

const session = require('express-session');
const { body, validationResult } = require('express-validator');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],   // ✅ allow onclick
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
    },
  })
);
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;
const connectDB = require("./db");

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS middleware
app.use(cors());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'inventory-management-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Body parsing middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Make io available to routes
app.set('io', io);

// Middleware to add user data to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  next();
});

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// Redirect middleware for login/signup access
app.get('/login', (req, res) => {
  res.redirect('/auth/login');
});

app.get('/signup', (req, res) => {
  res.redirect('/auth/signup');
});

// Routes
const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const apiRoutes = require('./routes/api');

app.use('/auth', authRoutes);
app.use('/inventory', requireAuth, inventoryRoutes);
app.use('/api', requireAuth, apiRoutes);

// Public routes
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/home');
  }
  res.render('index');
});


// Protected routes
app.get('/home', requireAuth, (req, res) => {
  res.render('home', { 
    userName: req.session.user.firstName || req.session.user.username
  });
});

app.get('/add-item', requireAuth, (req, res) => {
  res.render('add-item');
});

app.get('/inventory-list', requireAuth, (req, res) => {
  res.render('inventory-list');
});

app.get('/alerts', requireAuth, (req, res) => {
  res.render('alerts');
});

app.get('/edit-item', requireAuth, (req, res) => {
  res.render('edit-item');
});

app.get('/hazardous-materials', requireAuth, (req, res) => {
  res.render('hazardous-materials');
});

app.get('/items-available', requireAuth, (req, res) => {
  res.render('items-available');
});

app.get('/low-stock', requireAuth, (req, res) => {
  res.render('low-stock');
});

app.get('/reserved-items', requireAuth, (req, res) => {
  res.render('reserved-items');
});

app.get('/transaction-log', requireAuth, (req, res) => {
  res.render('transaction-log');
});

// Profile and Settings routes
app.get('/profile', requireAuth, (req, res) => {
  res.render('profile', {
    user: req.session.user
  });
});

app.get('/settings', requireAuth, (req, res) => {
  res.render('settings', {
    user: req.session.user
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
    res.redirect('/');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).render('error', { 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { 
    message: 'Page not found'
  });
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);
  
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
});
