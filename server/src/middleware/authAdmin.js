const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

function authAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Authentication required' } });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.adminId) {
      return res.status(403).json({ error: { message: 'Admin access required' } });
    }
    // Include role from token (set during login)
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: { message: 'Invalid or expired token' } });
  }
}

module.exports = authAdmin;
