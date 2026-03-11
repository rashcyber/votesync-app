const { getDb } = require('../config/database');
const { logAction } = require('../services/auditService');

exports.list = (req, res, next) => {
  try {
    const db = getDb();
    const templates = db.prepare(
      'SELECT et.*, a.full_name AS created_by_name FROM election_templates et LEFT JOIN admins a ON et.created_by = a.id ORDER BY et.created_at DESC'
    ).all();

    // Parse config JSON
    const parsed = templates.map(t => ({
      ...t,
      config: JSON.parse(t.config),
    }));

    res.json({ templates: parsed });
  } catch (err) {
    next(err);
  }
};

exports.create = (req, res, next) => {
  try {
    const db = getDb();
    const { name, description, config } = req.body;

    const result = db.prepare(
      'INSERT INTO election_templates (name, description, config, created_by) VALUES (?, ?, ?, ?)'
    ).run(name, description || null, JSON.stringify(config), req.admin.adminId);

    const template = db.prepare('SELECT * FROM election_templates WHERE id = ?').get(result.lastInsertRowid);
    template.config = JSON.parse(template.config);

    logAction(req.admin.adminId, 'create', 'template', template.id, { name }, req.ip);
    res.status(201).json({ template });
  } catch (err) {
    next(err);
  }
};

exports.remove = (req, res, next) => {
  try {
    const db = getDb();
    const template = db.prepare('SELECT * FROM election_templates WHERE id = ?').get(req.params.id);
    if (!template) {
      return res.status(404).json({ error: { message: 'Template not found' } });
    }

    db.prepare('DELETE FROM election_templates WHERE id = ?').run(req.params.id);
    logAction(req.admin.adminId, 'delete', 'template', parseInt(req.params.id), { name: template.name }, req.ip);
    res.json({ message: 'Template deleted' });
  } catch (err) {
    next(err);
  }
};
