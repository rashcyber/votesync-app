const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

function authVoter(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Voter authentication required' } });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.voterRef) {
      return res.status(403).json({ error: { message: 'Voter access required' } });
    }
    req.voter = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: { message: 'Invalid or expired voter session' } });
  }
}

module.exports = authVoter;
