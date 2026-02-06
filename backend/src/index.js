require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// CORS Configuration
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Routes
app.use('/api', require('./routes/health'));
app.use('/api', require('./routes/profile'));
app.use('/api', require('./routes/bank'));
app.use('/api', require('./routes/courses'));
app.use('/api', require('./routes/prices'));
app.use('/api/auth', require('./routes/auth'));

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
