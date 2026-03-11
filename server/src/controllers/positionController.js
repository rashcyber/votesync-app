const { getDb } = require('../config/database');
const { logAction } = require('../services/auditService');

exports.listByElection = (req, res, next) => {
  try {
    const db = getDb();
    const positions = db.prepare(
      'SELECT * FROM positions WHERE election_id = ? ORDER BY display_order'
    ).all(req.params.electionId);
    res.json({ positions });
  } catch (err) {
    next(err);
  }
};

exports.create = (req, res, next) => {
  try {
    const db = getDb();
    const { title, description, max_votes, display_order } = req.body;
    const { electionId } = req.params;

    const election = db.prepare('SELECT id FROM elections WHERE id = ?').get(electionId);
    if (!election) {
      return res.status(404).json({ error: { message: 'Election not found' } });
    }

    const result = db.prepare(`
      INSERT INTO positions (election_id, title, description, max_votes, display_order)
      VALUES (?, ?, ?, ?, ?)
    `).run(electionId, title, description || null, max_votes || 1, display_order || 0);

    const position = db.prepare('SELECT * FROM positions WHERE id = ?').get(result.lastInsertRowid);
    logAction(req.admin.adminId, 'create', 'position', position.id, { title, election_id: electionId }, req.ip);
    res.status(201).json({ position });
  } catch (err) {
    next(err);
  }
};

exports.update = (req, res, next) => {
  try {
    const db = getDb();
    const position = db.prepare('SELECT * FROM positions WHERE id = ?').get(req.params.id);
    if (!position) {
      return res.status(404).json({ error: { message: 'Position not found' } });
    }

    const { title, description, max_votes, display_order } = req.body;
    db.prepare(`
      UPDATE positions SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        max_votes = COALESCE(?, max_votes),
        display_order = COALESCE(?, display_order)
      WHERE id = ?
    `).run(title || null, description, max_votes ?? null, display_order ?? null, req.params.id);

    const updated = db.prepare('SELECT * FROM positions WHERE id = ?').get(req.params.id);
    logAction(req.admin.adminId, 'update', 'position', parseInt(req.params.id), { title: updated.title }, req.ip);
    res.json({ position: updated });
  } catch (err) {
    next(err);
  }
};

exports.remove = (req, res, next) => {
  try {
    const db = getDb();
    const position = db.prepare('SELECT * FROM positions WHERE id = ?').get(req.params.id);
    if (!position) {
      return res.status(404).json({ error: { message: 'Position not found' } });
    }

    db.prepare('DELETE FROM positions WHERE id = ?').run(req.params.id);
    logAction(req.admin.adminId, 'delete', 'position', parseInt(req.params.id), { title: position.title }, req.ip);
    res.json({ message: 'Position deleted' });
  } catch (err) {
    next(err);
  }
};
