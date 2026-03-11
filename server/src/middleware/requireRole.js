const { getDb } = require('../config/database');

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin || !req.admin.adminId) {
      return res.status(401).json({ error: { message: 'Authentication required' } });
    }

    const db = getDb();
    const admin = db.prepare('SELECT role FROM admins WHERE id = ?').get(req.admin.adminId);
    if (!admin) {
      return res.status(401).json({ error: { message: 'Admin not found' } });
    }

    // Normalize role - treat 'superadmin' same as 'super_admin'
    const normalizedRole = admin.role === 'superadmin' ? 'super_admin' : admin.role;

    if (!roles.includes(normalizedRole)) {
      return res.status(403).json({ error: { message: 'Insufficient permissions' } });
    }

    next();
  };
}

module.exports = requireRole;
