// src/routes/orderEntryRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../../db');

// GET /api/order-days/:id/entries  -> all rows for a day
router.get('/order-days/:id/entries', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `
      SELECT *
      FROM order_entries
      WHERE order_day_id = $1
      ORDER BY id ASC
      `,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching entries:', err);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// POST /api/order-days/:id/entries  -> create new row
router.post('/order-days/:id/entries', async (req, res) => {
  const { id } = req.params;
  const { customer_name, quantity, total_ils, notes } = req.body;

  if (!customer_name) {
    return res.status(400).json({ error: 'customer_name is required' });
  }

  try {
    const result = await db.query(
      `
      INSERT INTO order_entries 
        (order_day_id, customer_name, quantity, total_ils, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [id, customer_name, quantity || 0, total_ils || 0, notes || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating entry:', err);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

// PATCH /api/entries/:entryId  -> inline update
router.patch('/entries/:entryId', async (req, res) => {
  const { entryId } = req.params;
  const fields = req.body;

  const columns = [];
  const values = [];
  let index = 1;

  for (let key in fields) {
    columns.push(`${key} = $${index}`);
    values.push(fields[key]);
    index++;
  }

  if (columns.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(entryId);

  try {
    const result = await db.query(
      `
      UPDATE order_entries
      SET ${columns.join(', ')}
      WHERE id = $${index}
      RETURNING *
      `,
      values
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating entry:', err);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// DELETE /api/entries/:entryId
router.delete('/entries/:entryId', async (req, res) => {
  const { entryId } = req.params;

  try {
    await db.query(
      `
      DELETE FROM order_entries
      WHERE id = $1
      `,
      [entryId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting entry:', err);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

module.exports = router;
