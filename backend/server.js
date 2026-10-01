const express = require('express');
const http = require('http');                 // [from A] needed so socket.io can share the server
const { Server } = require('socket.io');      // [from A]
require('dotenv').config();

// [from A] Loading relation.js here guarantees every model + association is registered at startup
const { sequelize } = require('./models/relation');

// [from B] all route files
const authRoute = require('./routes/authRoute');
const emergencyContactRoutes = require('./routes/emergencyContactRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);        // [from A] (B used app.listen, which can't host socket.io)
const io = new Server(server, {               // [from A] (B used `io` without ever creating it)
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware to parse incoming JSON requests
app.use(express.json());

// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'SafeHer API is running correctly.' });
});

// ---- Routes: paths are exactly as B defined them ----
// register / login
app.use('/api', authRoute);

// emergency contacts
app.use('/api/emergency-Contact', emergencyContactRoutes);

// sos
app.use('/api/emergency', emergencyRoutes);

// notifications
app.use('/api/notifications', notificationRoutes);

// admin
app.use('/api/admin', adminRoutes);

// ---- Socket.IO (same code in A and B) ----
io.on('connection', (socket) => {
  console.log(`📡 New device connected: ${socket.id}`);

  socket.on('sendLocation', (data) => {
    console.log(`📍 Location update from User ${data.userId}: ${data.latitude}, ${data.longitude}`);

    io.emit('receiveLocation', data);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Device disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);

  // [from A] Verify database connection independently of the model sync
  sequelize.authenticate()
    .then(() => console.log('✅ Database connection established successfully.'))
    .catch((err) => console.error('❌ Unable to connect to the database:', err));
});
