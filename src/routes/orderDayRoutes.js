// src/routes/orderDayRoutes.js
const express = require('express');
const db = require('../../db');

const router = express.Router();

/**
 * GET /api/order-days
 * List all days with aggregated info
 */
router.get('/order-days', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         od.id,
         od.order_date,
         od.title,
         od.actual_spent_ils,
         od.created_at,
         COALESCE(SUM(oe.quantity), 0) AS total_quantity,
         COALESCE(SUM(oe.total_ils), 0) AS total_ils,
         COALESCE(SUM(CASE WHEN oe.picked_up THEN 1 ELSE 0 END), 0) AS picked_up_count,
         COALESCE(SUM(CASE WHEN oe.paid THEN 1 ELSE 0 END), 0)      AS paid_count
       FROM order_days od
       LEFT JOIN order_entries oe ON oe.order_day_id = od.id
       GROUP BY od.id
       ORDER BY od.order_date DESC, od.id DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching order days:', err);
    res.status(500).json({ error: 'Failed to load order days.' });
  }
});

/**
 * GET /api/order-days/:id
 * Single day with aggregated info
 */
router.get('/order-days/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT
         od.id,
         od.order_date,
         od.title,
         od.actual_spent_ils,
         COALESCE(SUM(oe.quantity), 0) AS total_quantity,
         COALESCE(SUM(oe.total_ils), 0) AS total_ils,
         COALESCE(SUM(CASE WHEN oe.picked_up THEN 1 ELSE 0 END), 0) AS picked_up_count,
         COALESCE(SUM(CASE WHEN oe.paid THEN 1 ELSE 0 END), 0)      AS paid_count
       FROM order_days od
       LEFT JOIN order_entries oe ON oe.order_day_id = od.id
       WHERE od.id = $1
       GROUP BY od.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Day not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching order day:', err);
    res.status(500).json({ error: 'Failed to load order day.' });
  }
});

/**
 * POST /api/order-days
 * Create a new day (with optional actual_spent_ils)
 */
router.post('/order-days', async (req, res) => {
  const { order_date, title, actual_spent_ils } = req.body;

  if (!order_date) {
    return res.status(400).json({ error: 'order_date is required.' });
  }

  const spent = actual_spent_ils != null ? actual_spent_ils : 0;

  try {
    const result = await db.query(
      `INSERT INTO order_days (order_date, title, actual_spent_ils)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [order_date, title || null, spent]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating order day:', err);
    res.status(500).json({ error: 'Failed to create order day.' });
  }
});

/**
 * PATCH /api/order-days/:id
 * Update actual_spent_ils only (for now)
 */
router.patch('/order-days/:id', async (req, res) => {
  const { id } = req.params;
  const { actual_spent_ils } = req.body;

  if (actual_spent_ils == null) {
    return res.status(400).json({ error: 'actual_spent_ils is required.' });
  }

  try {
    const result = await db.query(
      `UPDATE order_days
       SET actual_spent_ils = $1
       WHERE id = $2
       RETURNING *`,
      [actual_spent_ils, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Day not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating order day:', err);
    res.status(500).json({ error: 'Failed to update order day.' });
  }
});

module.exports = router;
