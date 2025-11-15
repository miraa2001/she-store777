const express = require('express');
const path = require('path');

const orderDayRoutes = require('./routes/orderDayRoutes');
const orderEntriesRoutes = require('./routes/orderEntryRoutes');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// 🔓 Public routes
app.use('/api', healthRoutes);
app.use('/api', authRoutes);

// 🔒 Protected routes (must have valid JWT)
app.use('/api', authMiddleware, orderDayRoutes);
app.use('/api', authMiddleware, orderEntriesRoutes);

module.exports = app;
