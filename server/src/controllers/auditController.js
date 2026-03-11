const { getDb } = require('../config/database');

exports.listLogs = (req, res, next) => {
  try {
    const db = getDb();
    const { page = 1, limit = 50, entity_type, admin_id, from_date, to_date } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    let where = [];
    let params = [];

    if (entity_type) {
      where.push('al.entity_type = ?');
      params.push(entity_type);
    }
    if (admin_id) {
      where.push('al.admin_id = ?');
      params.push(parseInt(admin_id));
    }
    if (from_date) {
      where.push('al.created_at >= ?');
      params.push(from_date);
    }
    if (to_date) {
      where.push('al.created_at <= ?');
      params.push(to_date);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const total = db.prepare(
      `SELECT COUNT(*) AS count FROM audit_logs al ${whereClause}`
    ).get(...params).count;

    const logs = db.prepare(`
      SELECT al.*, a.username AS admin_username, a.full_name AS admin_name
      FROM audit_logs al
      LEFT JOIN admins a ON al.admin_id = a.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};
