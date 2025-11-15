// src/routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../../db');

// GET /api/health
router.get('/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      status: 'ok',
      time: result.rows[0].now,
    });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

module.exports = router;
