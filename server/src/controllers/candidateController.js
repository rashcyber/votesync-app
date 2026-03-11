const { getDb } = require('../config/database');
const { EVENT_TYPE_PREFIXES } = require('../../../shared/electionTypes');
const { logAction } = require('../services/auditService');

function generateContestantCode(electionId) {
  const db = getDb();
  const election = db.prepare('SELECT code_prefix, event_type FROM elections WHERE id = ?').get(electionId);
  if (!election) return null;

  const prefix = election.code_prefix || EVENT_TYPE_PREFIXES[election.event_type] || 'EVT';

  const last = db.prepare(
    "SELECT contestant_code FROM candidates WHERE election_id = ? AND contestant_code LIKE ? ORDER BY id DESC LIMIT 1"
  ).get(electionId, `${prefix}-%`);

  let nextNum = 1;
  if (last) {
    const parts = last.contestant_code.split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) nextNum = num + 1;
  }

  return `${prefix}-${String(nextNum).padStart(3, '0')}`;
}

exports.listByPosition = (req, res, next) => {
  try {
    const db = getDb();
    const candidates = db.prepare(
      'SELECT * FROM candidates WHERE position_id = ? ORDER BY display_order'
    ).all(req.params.positionId);
    res.json({ candidates });
  } catch (err) {
    next(err);
  }
};

exports.listByElection = (req, res, next) => {
  try {
    const db = getDb();
    const candidates = db.prepare(
      'SELECT * FROM candidates WHERE election_id = ? ORDER BY position_id, display_order'
    ).all(req.params.electionId);
    res.json({ candidates });
  } catch (err) {
    next(err);
  }
};

exports.create = (req, res, next) => {
  try {
    const db = getDb();
    const { electionId } = req.params;
    const { full_name, position_id, portfolio, contestant_code, display_order } = req.body;

    if (!full_name || !position_id) {
      return res.status(400).json({ error: { message: 'Full name and position are required' } });
    }

    const election = db.prepare('SELECT id FROM elections WHERE id = ?').get(electionId);
    if (!election) {
      return res.status(404).json({ error: { message: 'Election not found' } });
    }

    const position = db.prepare('SELECT id FROM positions WHERE id = ? AND election_id = ?').get(position_id, electionId);
    if (!position) {
      return res.status(404).json({ error: { message: 'Position not found in this election' } });
    }

    const code = contestant_code || generateContestantCode(parseInt(electionId));
    const photoUrl = req.file ? `/uploads/candidates/${req.file.filename}` : null;

    const result = db.prepare(`
      INSERT INTO candidates (election_id, position_id, full_name, contestant_code, photo_url, portfolio, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(electionId, position_id, full_name, code, photoUrl, portfolio || null, display_order || 0);

    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(result.lastInsertRowid);
    logAction(req.admin.adminId, 'create', 'candidate', candidate.id, { full_name, election_id: electionId }, req.ip);
    res.status(201).json({ candidate });
  } catch (err) {
    next(err);
  }
};

exports.update = (req, res, next) => {
  try {
    const db = getDb();
    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: { message: 'Candidate not found' } });
    }

    const { full_name, portfolio, contestant_code, display_order } = req.body;
    const photoUrl = req.file ? `/uploads/candidates/${req.file.filename}` : null;

    db.prepare(`
      UPDATE candidates SET
        full_name = COALESCE(?, full_name),
        portfolio = COALESCE(?, portfolio),
        contestant_code = COALESCE(?, contestant_code),
        photo_url = COALESCE(?, photo_url),
        display_order = COALESCE(?, display_order)
      WHERE id = ?
    `).run(
      full_name || null, portfolio, contestant_code || null,
      photoUrl, display_order ?? null, req.params.id
    );

    const updated = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
    logAction(req.admin.adminId, 'update', 'candidate', parseInt(req.params.id), { full_name: updated.full_name }, req.ip);
    res.json({ candidate: updated });
  } catch (err) {
    next(err);
  }
};

exports.remove = (req, res, next) => {
  try {
    const db = getDb();
    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: { message: 'Candidate not found' } });
    }

    db.prepare('DELETE FROM candidates WHERE id = ?').run(req.params.id);
    logAction(req.admin.adminId, 'delete', 'candidate', parseInt(req.params.id), { full_name: candidate.full_name }, req.ip);
    res.json({ message: 'Candidate deleted' });
  } catch (err) {
    next(err);
  }
};
