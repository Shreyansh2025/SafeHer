const express = require('express');
require('dotenv').config();

// Import the Sequelize database connection and all models
const { sequelize } = require('./models/relation');

const app = express();

// Middleware to parse incoming JSON requests
app.use(express.json());

// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'SafeHer API is running correctly.' });
});

// Define the port from environment variables or default to 3000
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  
  // Verify database connection independently of the model sync
  sequelize.authenticate()
    .then(() => console.log('✅ Database connection established successfully.'))
    .catch(err => console.error('❌ Unable to connect to the database:', err));
});