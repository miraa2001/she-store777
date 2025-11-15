// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || '';

  // Expect "Bearer token"
  const [, token] = authHeader.split(' ');

  if (!token) {
    return res
      .status(401)
      .json({ error: 'غير مصرح. يرجى تسجيل الدخول.' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'dev_secret'
    );
    req.user = decoded; // { id, username, name }
    next();
  } catch (err) {
    console.error('JWT verify error:', err);
    return res
      .status(401)
      .json({ error: 'الجلسة منتهية أو غير صالحة. يرجى تسجيل الدخول مرة أخرى.' });
  }
}

module.exports = authMiddleware;
