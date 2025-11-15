// src/routes/statsRoutes.js
const express = require('express');
const db = require('../../db');

const router = express.Router();

/**
 * GET /api/stats/summary
 * Returns overall stats across all days & entries
 */
router.get('/stats/summary', async (req, res) => {
  try {
    // Total days
    const daysResult = await db.query(
      'SELECT COUNT(*) AS total_days FROM order_days'
    );
    const totalDays = Number(daysResult.rows[0]?.total_days || 0);

    // Total revenue & pieces from entries
    const entriesAgg = await db.query(
      `SELECT
         COALESCE(SUM(total_ils), 0) AS total_revenue,
         COALESCE(SUM(quantity), 0)   AS total_pieces
       FROM order_entries`
    );
    const totalRevenue = Number(entriesAgg.rows[0]?.total_revenue || 0);
    const totalPieces  = Number(entriesAgg.rows[0]?.total_pieces || 0);

    // Unpaid amounts from entries
    const unpaidAgg = await db.query(
      `SELECT
         COALESCE(SUM(total_ils), 0) AS total_unpaid_amount,
         COUNT(*) AS total_unpaid_orders
       FROM order_entries
       WHERE paid = false`
    );
    const totalUnpaidAmount = Number(unpaidAgg.rows[0]?.total_unpaid_amount || 0);
    const totalUnpaidOrders = Number(unpaidAgg.rows[0]?.total_unpaid_orders || 0);

    // Unique customers
    const customersResult = await db.query(
      `SELECT COUNT(DISTINCT customer_name) AS total_customers
       FROM order_entries
       WHERE customer_name IS NOT NULL AND TRIM(customer_name) <> ''`
    );
    const totalCustomers = Number(customersResult.rows[0]?.total_customers || 0);

    // Top customers
    const topCustomersResult = await db.query(
      `SELECT
         customer_name,
         COALESCE(SUM(total_ils), 0) AS total_ils,
         COALESCE(SUM(quantity), 0)  AS total_quantity
       FROM order_entries
       WHERE customer_name IS NOT NULL AND TRIM(customer_name) <> ''
       GROUP BY customer_name
       ORDER BY total_ils DESC
       LIMIT 5`
    );
    const topCustomers = topCustomersResult.rows.map(row => ({
      customer_name: row.customer_name,
      total_ils: Number(row.total_ils || 0),
      total_quantity: Number(row.total_quantity || 0),
    }));

    // Daily revenue from order_days (using its totals)
    // Daily revenue, summed from entries joined with days
    const dailyRevenueResult = await db.query(
      `SELECT
        od.order_date::date AS order_date,
        COALESCE(SUM(oe.total_ils), 0) AS total_ils
      FROM order_days od
      JOIN order_entries oe ON oe.order_day_id = od.id
      GROUP BY od.order_date::date
      ORDER BY od.order_date::date`
    );
    const dailyRevenue = dailyRevenueResult.rows.map(row => ({
      order_date: row.order_date,
      total_ils: Number(row.total_ils || 0),
    }));

    res.json({
      total_days: totalDays,
      total_revenue: totalRevenue,
      total_pieces: totalPieces,
      total_unpaid_amount: totalUnpaidAmount,
      total_unpaid_orders: totalUnpaidOrders,
      total_customers: totalCustomers,
      top_customers: topCustomers,
      daily_revenue: dailyRevenue,
    });
  } catch (err) {
    console.error('Stats summary error:', err);
    res.status(500).json({ error: 'فشل في تحميل الإحصائيات.' });
  }
});

module.exports = router;
