const { getDb } = require('../config/database');
const { hashPassword } = require('../utils/hashPassword');
const { logAction } = require('../services/auditService');

exports.list = (req, res, next) => {
  try {
    const db = getDb();
    const admins = db.prepare('SELECT id, username, full_name, role, created_at, updated_at FROM admins ORDER BY created_at DESC').all();
    res.json({ admins });
  } catch (err) {
    next(err);
  }
};

exports.getById = (req, res, next) => {
  try {
    const db = getDb();
    const admin = db.prepare('SELECT id, username, full_name, role, created_at, updated_at FROM admins WHERE id = ?').get(req.params.id);
    if (!admin) {
      return res.status(404).json({ error: { message: 'Admin not found' } });
    }
    res.json({ admin });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const db = getDb();
    const { username, password, full_name, role } = req.body;

    const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ error: { message: 'Username already exists' } });
    }

    const hashedPassword = await hashPassword(password);
    const normalizedRole = role === 'super_admin' ? 'superadmin' : role;

    const result = db.prepare(
      'INSERT INTO admins (username, password, full_name, role) VALUES (?, ?, ?, ?)'
    ).run(username, hashedPassword, full_name, normalizedRole);

    const newAdmin = db.prepare('SELECT id, username, full_name, role, created_at FROM admins WHERE id = ?').get(result.lastInsertRowid);
    logAction(req.admin.adminId, 'create', 'admin', Number(result.lastInsertRowid), { username, role: normalizedRole }, req.ip);
    res.status(201).json({ admin: newAdmin });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { username, password, full_name, role } = req.body;

    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
    if (!admin) {
      return res.status(404).json({ error: { message: 'Admin not found' } });
    }

    if (username && username !== admin.username) {
      const existing = db.prepare('SELECT id FROM admins WHERE username = ? AND id != ?').get(username, id);
      if (existing) {
        return res.status(400).json({ error: { message: 'Username already exists' } });
      }
    }

    const updates = [];
    const params = [];

    if (username !== undefined) { updates.push('username = ?'); params.push(username); }
    if (full_name !== undefined) { updates.push('full_name = ?'); params.push(full_name); }
    if (role !== undefined) {
      const normalizedRole = role === 'super_admin' ? 'superadmin' : role;
      updates.push('role = ?');
      params.push(normalizedRole);
    }
    if (password) {
      const hashedPassword = await hashPassword(password);
      updates.push('password = ?');
      params.push(hashedPassword);
    }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(id);
      db.prepare(`UPDATE admins SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updated = db.prepare('SELECT id, username, full_name, role, created_at, updated_at FROM admins WHERE id = ?').get(id);
    logAction(req.admin.adminId, 'update', 'admin', parseInt(id), { username: updated.username }, req.ip);
    res.json({ admin: updated });
  } catch (err) {
    next(err);
  }
};

exports.remove = (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.admin.adminId) {
      return res.status(400).json({ error: { message: 'You cannot delete your own account' } });
    }

    const admin = db.prepare('SELECT id, username FROM admins WHERE id = ?').get(id);
    if (!admin) {
      return res.status(404).json({ error: { message: 'Admin not found' } });
    }

    db.prepare('DELETE FROM admins WHERE id = ?').run(id);
    logAction(req.admin.adminId, 'delete', 'admin', parseInt(id), { username: admin.username }, req.ip);
    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    next(err);
  }
};
