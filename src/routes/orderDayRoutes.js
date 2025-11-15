// src/routes/orderDayRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../../db');

// GET /api/order-days  -> list all days with stats
router.get('/order-days', async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT
        od.id,
        od.order_date,
        od.title,
        od.created_at,
        COALESCE(SUM(oe.quantity), 0) AS total_quantity,
        COALESCE(SUM(oe.total_ils), 0) AS total_ils,
        COALESCE(SUM(CASE WHEN oe.picked_up THEN 1 ELSE 0 END), 0) AS picked_up_count,
        COALESCE(SUM(CASE WHEN oe.paid THEN 1 ELSE 0 END), 0) AS paid_count
      FROM order_days od
      LEFT JOIN order_entries oe ON od.id = oe.order_day_id
      GROUP BY od.id
      ORDER BY od.order_date DESC, od.id DESC
      `
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching order days:', err);
    res.status(500).json({ error: 'Failed to fetch order days' });
  }
});

// POST /api/order-days  -> create new day
// body: { "order_date": "2025-11-14", "title": "optional" }
router.post('/order-days', async (req, res) => {
  try {
    const { order_date, title } = req.body;

    if (!order_date) {
      return res.status(400).json({ error: 'order_date is required' });
    }

    const result = await db.query(
      `
      INSERT INTO order_days (order_date, title)
      VALUES ($1, $2)
      RETURNING *
      `,
      [order_date, title || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating order day:', err);
    res.status(500).json({ error: 'Failed to create order day' });
  }
});
// GET /api/order-days/:id  -> single day with stats
router.get('/order-days/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `
      SELECT
        od.id,
        od.order_date,
        od.title,
        od.created_at,
        COALESCE(SUM(oe.quantity), 0) AS total_quantity,
        COALESCE(SUM(oe.total_ils), 0) AS total_ils,
        COALESCE(SUM(CASE WHEN oe.picked_up THEN 1 ELSE 0 END), 0) AS picked_up_count,
        COALESCE(SUM(CASE WHEN oe.paid THEN 1 ELSE 0 END), 0) AS paid_count
      FROM order_days od
      LEFT JOIN order_entries oe ON od.id = oe.order_day_id
      WHERE od.id = $1
      GROUP BY od.id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order day not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching order day:', err);
    res.status(500).json({ error: 'Failed to fetch order day' });
  }
});

module.exports = router;
