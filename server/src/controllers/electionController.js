const { getDb } = require('../config/database');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const QRCode = require('qrcode');
const { logAction } = require('../services/auditService');

const VALID_TRANSITIONS = {
  draft: ['active'],
  active: ['paused', 'completed'],
  paused: ['active', 'completed'],
  completed: [],
};

exports.list = (req, res, next) => {
  try {
    const db = getDb();

    let isAdmin = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        if (decoded.adminId) isAdmin = true;
      } catch (e) { /* invalid token */ }
    }

    let elections;
    if (isAdmin) {
      elections = db.prepare(`
        SELECT e.*, 
          (SELECT COUNT(*) FROM votes v WHERE v.election_id = e.id) as total_votes,
          (SELECT COUNT(*) FROM positions p WHERE p.election_id = e.id) as position_count,
          (SELECT COUNT(*) FROM candidates c WHERE c.election_id = e.id) as candidate_count
        FROM elections e 
        ORDER BY e.created_at DESC
      `).all();
    } else {
      elections = db.prepare(`
        SELECT e.*, 
          (SELECT COUNT(*) FROM votes v WHERE v.election_id = e.id) as total_votes,
          (SELECT COUNT(*) FROM positions p WHERE p.election_id = e.id) as position_count,
          (SELECT COUNT(*) FROM candidates c WHERE c.election_id = e.id) as candidate_count
        FROM elections e 
        WHERE e.status IN ('active', 'completed') AND e.show_on_landing = 1 
        ORDER BY e.created_at DESC
      `).all();
    }
    res.json({ elections });
  } catch (err) {
    next(err);
  }
};

exports.getById = (req, res, next) => {
  try {
    const db = getDb();
    const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(req.params.id);
    if (!election) {
      return res.status(404).json({ error: { message: 'Election not found' } });
    }

    const positions = db.prepare('SELECT * FROM positions WHERE election_id = ? ORDER BY display_order').all(election.id);
    const candidates = db.prepare('SELECT * FROM candidates WHERE election_id = ? ORDER BY display_order').all(election.id);

    res.json({ election, positions, candidates });
  } catch (err) {
    next(err);
  }
};

exports.create = (req, res, next) => {
  try {
    const db = getDb();
    const { title, description, event_type, election_scope, voting_type, auth_method, price_per_vote, currency, code_prefix, start_date, end_date } = req.body;

    const result = db.prepare(`
      INSERT INTO elections (title, description, event_type, election_scope, voting_type, auth_method, price_per_vote, currency, code_prefix, start_date, end_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title,
      description || null,
      event_type,
      election_scope || 'institution',
      voting_type,
      auth_method,
      voting_type === 'paid' ? (price_per_vote || 1) : 0,
      currency || 'GHS',
      code_prefix || '',
      start_date,
      end_date,
      req.admin.adminId
    );

    const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(result.lastInsertRowid);
    logAction(req.admin.adminId, 'create', 'election', election.id, { title }, req.ip);
    res.status(201).json({ election });
  } catch (err) {
    next(err);
  }
};

exports.update = (req, res, next) => {
  try {
    const db = getDb();
    const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(req.params.id);
    if (!election) {
      return res.status(404).json({ error: { message: 'Election not found' } });
    }

    const { title, description, event_type, election_scope, voting_type, auth_method, price_per_vote, code_prefix, start_date, end_date, results_public, show_on_landing, ussd_enabled, ussd_service_code } = req.body;

    const updates = [];
    const params = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title || null); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (event_type !== undefined) { updates.push('event_type = ?'); params.push(event_type); }
    if (election_scope !== undefined) { updates.push('election_scope = ?'); params.push(election_scope); }
    if (voting_type !== undefined) { updates.push('voting_type = ?'); params.push(voting_type); }
    if (auth_method !== undefined) { updates.push('auth_method = ?'); params.push(auth_method); }
    if (price_per_vote !== undefined) { updates.push('price_per_vote = ?'); params.push(price_per_vote); }
    if (code_prefix !== undefined) { updates.push('code_prefix = ?'); params.push(code_prefix); }
    if (start_date !== undefined) { updates.push('start_date = ?'); params.push(start_date || null); }
    if (end_date !== undefined) { updates.push('end_date = ?'); params.push(end_date || null); }
    if (results_public !== undefined) { updates.push('results_public = ?'); params.push(results_public); }
    if (show_on_landing !== undefined) { updates.push('show_on_landing = ?'); params.push(show_on_landing); }
    if (ussd_enabled !== undefined) { updates.push('ussd_enabled = ?'); params.push(ussd_enabled); }
    if (ussd_service_code !== undefined) { updates.push('ussd_service_code = ?'); params.push(ussd_service_code); }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(req.params.id);
      
      const sql = `UPDATE elections SET ${updates.join(', ')} WHERE id = ?`;
      db.prepare(sql).run(...params);
    }

    const updated = db.prepare('SELECT * FROM elections WHERE id = ?').get(req.params.id);
    
    if (req.admin && req.admin.adminId) {
      logAction(req.admin.adminId, 'update', 'election', parseInt(req.params.id), { title: updated.title }, req.ip);
    }
    
    res.json({ election: updated });
  } catch (err) {
    console.error('Election update error:', err);
    next(err);
  }
};

exports.updateStatus = (req, res, next) => {
  try {
    const db = getDb();
    const { status } = req.body;
    const validStatuses = ['draft', 'active', 'paused', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: { message: `Status must be one of: ${validStatuses.join(', ')}` } });
    }

    const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(req.params.id);
    if (!election) {
      return res.status(404).json({ error: { message: 'Election not found' } });
    }

    // Enforce valid state transitions
    const allowed = VALID_TRANSITIONS[election.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: { message: `Cannot transition from '${election.status}' to '${status}'. Allowed: ${allowed.join(', ') || 'none'}` }
      });
    }

    db.prepare("UPDATE elections SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);
    const updated = db.prepare('SELECT * FROM elections WHERE id = ?').get(req.params.id);
    logAction(req.admin.adminId, 'status_change', 'election', parseInt(req.params.id), { from: election.status, to: status }, req.ip);
    res.json({ election: updated });
  } catch (err) {
    next(err);
  }
};

exports.remove = (req, res, next) => {
  try {
    const db = getDb();
    const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(req.params.id);
    if (!election) {
      return res.status(404).json({ error: { message: 'Election not found' } });
    }
    if (election.status !== 'draft') {
      return res.status(400).json({ error: { message: 'Only draft elections can be deleted' } });
    }

    db.prepare('DELETE FROM elections WHERE id = ?').run(req.params.id);
    logAction(req.admin.adminId, 'delete', 'election', parseInt(req.params.id), { title: election.title }, req.ip);
    res.json({ message: 'Election deleted' });
  } catch (err) {
    next(err);
  }
};

exports.getQRCode = async (req, res, next) => {
  try {
    const db = getDb();
    const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(req.params.id);
    if (!election) {
      return res.status(404).json({ error: { message: 'Election not found' } });
    }

    const votePath = election.voting_type === 'paid'
      ? `/vote/${election.id}/paid`
      : `/vote/${election.id}`;

    // Generate QR code as data URL
    const origin = req.headers.origin || req.headers.referer || `http://localhost:5173`;
    const baseUrl = new URL(origin).origin;
    const fullUrl = `${baseUrl}${votePath}`;

    const qrDataUrl = await QRCode.toDataURL(fullUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    });

    res.json({ qrcode: qrDataUrl, url: fullUrl });
  } catch (err) {
    next(err);
  }
};

exports.duplicate = (req, res, next) => {
  try {
    const db = getDb();
    const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(req.params.id);
    if (!election) {
      return res.status(404).json({ error: { message: 'Election not found' } });
    }

    const { start_date, end_date } = req.body;

    const result = db.prepare(`
      INSERT INTO elections (title, description, event_type, voting_type, auth_method, price_per_vote, currency, code_prefix, start_date, end_date, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
    `).run(
      `${election.title} (Copy)`,
      election.description,
      election.event_type,
      election.voting_type,
      election.auth_method,
      election.price_per_vote,
      election.currency,
      election.code_prefix,
      start_date,
      end_date,
      req.admin.adminId
    );

    const newElectionId = result.lastInsertRowid;

    // Clone positions
    const positions = db.prepare('SELECT * FROM positions WHERE election_id = ? ORDER BY display_order').all(req.params.id);
    const insertPosition = db.prepare(
      'INSERT INTO positions (election_id, title, description, max_votes, display_order) VALUES (?, ?, ?, ?, ?)'
    );
    for (const pos of positions) {
      insertPosition.run(newElectionId, pos.title, pos.description, pos.max_votes, pos.display_order);
    }

    const newElection = db.prepare('SELECT * FROM elections WHERE id = ?').get(newElectionId);
    logAction(req.admin.adminId, 'duplicate', 'election', Number(newElectionId), { original_id: parseInt(req.params.id) }, req.ip);
    res.status(201).json({ election: newElection });
  } catch (err) {
    next(err);
  }
};
