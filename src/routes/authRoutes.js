// src/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../db');

const router = express.Router();

/**
 * POST /api/auth/login
 * body: { username, password }
 */
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: 'اسم المستخدم وكلمة المرور مطلوبان.' });
  }

  try {
    const result = await db.query(
      'SELECT id, username, password_hash, name FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة.' });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash || '');
    if (!isMatch) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة.' });
    }

    const payload = {
      id: user.id,
      username: user.username,
      name: user.name,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول.' });
  }
});

module.exports = router;
