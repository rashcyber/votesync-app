const { getDb } = require('../config/database');

function logAction(adminId, action, entityType, entityId, details, ipAddress) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      adminId || null,
      action,
      entityType,
      entityId || null,
      typeof details === 'object' ? JSON.stringify(details) : (details || null),
      ipAddress || null
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

module.exports = { logAction };
