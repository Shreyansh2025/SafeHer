const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
require('dotenv').config();

// Import the Sequelize database connection and all models
const { sequelize } = require('./models/relation');

const app = express();
const server = http.createServer(app);
const io = new Server(server , {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware to parse incoming JSON requests
app.use(express.json());
const emergencyRoutes = require('./routes/emergencyRoutes');
const notificationRoutes = require('./routes/notificationRoutes');


// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'SafeHer API is running correctly.' });
});

app.use('/api/emergency', emergencyRoutes);
app.use('/api/notifications', notificationRoutes);
// Define the port from environment variables or default to 3000

io.on('connection',(socket) =>{
  console.log(`📡 New device connected: ${socket.id}`);

  socket.on('sendLocation', (data) => {
    console.log(`📍 Location update from User ${data.userId}: ${data.latitude}, ${data.longitude}`);

    io.emit('receiveLocation', data);
  });

  socket.on('disconnect',()=>{
    console.log(`❌ Device disconnected: ${socket.id}`);
  });



})
const PORT = process.env.PORT || 3000;


// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  
  // Verify database connection independently of the model sync
  sequelize.authenticate()
    .then(() => console.log('✅ Database connection established successfully.'))
    .catch(err => console.error('❌ Unable to connect to the database:', err));
});