const { getDb } = require('../config/database');
const { getIO } = require('../config/socket');
const crypto = require('crypto');

function emitVoteUpdate(electionId) {
  try {
    const db = getDb();
    const io = getIO();
    const results = db.prepare(`
      SELECT c.id AS candidate_id, c.full_name, c.contestant_code, c.photo_url,
             p.id AS position_id, p.title AS position_title,
             COALESCE(SUM(v.vote_count), 0) AS total_votes
      FROM candidates c
      JOIN positions p ON c.position_id = p.id
      LEFT JOIN votes v ON v.candidate_id = c.id
      WHERE c.election_id = ?
      GROUP BY c.id
      ORDER BY p.display_order, total_votes DESC
    `).all(electionId);

    const totalVoters = db.prepare(
      'SELECT COUNT(*) AS count FROM vote_sessions WHERE election_id = ?'
    ).get(electionId).count;

    const totalPaidVotes = db.prepare(
      'SELECT COALESCE(SUM(vote_count), 0) AS count FROM votes WHERE election_id = ? AND session_id IS NULL'
    ).get(electionId).count;

    const payload = { electionId, results, totalVoters, totalPaidVotes, timestamp: new Date().toISOString() };

    io.of('/admin').to(`election:${electionId}`).emit('vote:update', payload);
    io.of('/public').to(`election:${electionId}`).emit('vote:update', payload);
  } catch (err) {
    console.error('Socket emit error:', err.message);
  }
}

const pendingUpdates = new Map();
function scheduleVoteUpdate(electionId) {
  if (pendingUpdates.has(electionId)) return;
  pendingUpdates.set(electionId, setTimeout(() => {
    emitVoteUpdate(electionId);
    pendingUpdates.delete(electionId);
  }, 500));
}

exports.getBallot = (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(id);
    if (!election) {
      return res.status(404).json({ error: { message: 'Election not found' } });
    }
    if (election.status !== 'active') {
      return res.status(400).json({ error: { message: 'This election is not currently active' } });
    }

    const positions = db.prepare(
      'SELECT * FROM positions WHERE election_id = ? ORDER BY display_order'
    ).all(id);

    const candidates = db.prepare(
      'SELECT * FROM candidates WHERE election_id = ? ORDER BY display_order'
    ).all(id);

    const ballot = positions.map(pos => ({
      ...pos,
      candidates: candidates.filter(c => c.position_id === pos.id),
    }));

    res.json({ election, ballot });
  } catch (err) {
    next(err);
  }
};

exports.castFreeVote = (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { selections } = req.body;
    const { voterRef, voterType, electionId } = req.voter;

    if (parseInt(id) !== parseInt(electionId)) {
      return res.status(403).json({ error: { message: 'Token does not match this election' } });
    }

    const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(id);
    if (!election || election.status !== 'active') {
      return res.status(400).json({ error: { message: 'Election is not active' } });
    }
    if (election.voting_type !== 'free') {
      return res.status(400).json({ error: { message: 'This election uses paid voting' } });
    }

    const positions = db.prepare('SELECT * FROM positions WHERE election_id = ?').all(id);
    for (const sel of selections) {
      const pos = positions.find(p => p.id === sel.position_id);
      if (!pos) {
        return res.status(400).json({ error: { message: `Invalid position: ${sel.position_id}` } });
      }
      const candidate = db.prepare(
        'SELECT id FROM candidates WHERE id = ? AND position_id = ? AND election_id = ?'
      ).get(sel.candidate_id, sel.position_id, id);
      if (!candidate) {
        return res.status(400).json({ error: { message: `Invalid candidate ${sel.candidate_id} for position ${sel.position_id}` } });
      }
    }

    const castVote = db.transaction(() => {
      const existing = db.prepare(
        'SELECT id FROM vote_sessions WHERE election_id = ? AND voter_ref = ?'
      ).get(id, voterRef);
      if (existing) {
        throw Object.assign(new Error('You have already voted in this election'), { status: 400 });
      }

      const session = db.prepare(
        'INSERT INTO vote_sessions (election_id, voter_type, voter_ref, ip_address) VALUES (?, ?, ?, ?)'
      ).run(id, voterType, voterRef, req.ip || null);

      const insertVote = db.prepare(
        'INSERT INTO votes (election_id, position_id, candidate_id, session_id, vote_count) VALUES (?, ?, ?, ?, 1)'
      );
      for (const sel of selections) {
        insertVote.run(id, sel.position_id, sel.candidate_id, session.lastInsertRowid);
      }

      if (voterType === 'code') {
        db.prepare(
          "UPDATE voter_codes SET is_used = 1, used_at = datetime('now') WHERE code = ? AND election_id = ?"
        ).run(voterRef, id);
      }

      // Generate vote receipt
      const receiptHash = crypto
        .createHash('sha256')
        .update(`${id}:${voterRef}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`)
        .digest('hex')
        .substring(0, 16)
        .toUpperCase();

      db.prepare(
        'INSERT INTO vote_receipts (session_id, election_id, receipt_hash) VALUES (?, ?, ?)'
      ).run(session.lastInsertRowid, id, receiptHash);

      return { sessionId: session.lastInsertRowid, receiptHash };
    });

    const { sessionId, receiptHash } = castVote();
    scheduleVoteUpdate(parseInt(id));
    res.json({ message: 'Vote cast successfully', sessionId, receipt_hash: receiptHash });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: { message: err.message } });
    }
    next(err);
  }
};

exports.castPaidVote = (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { candidate_id, position_id, vote_count, payment_id } = req.body;

    const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(id);
    if (!election || election.status !== 'active') {
      return res.status(400).json({ error: { message: 'Election is not active' } });
    }
    if (election.voting_type !== 'paid') {
      return res.status(400).json({ error: { message: 'This election uses free voting' } });
    }

    const payment = db.prepare(
      'SELECT * FROM payments WHERE id = ? AND election_id = ? AND status = ?'
    ).get(payment_id, id, 'success');
    if (!payment) {
      return res.status(400).json({ error: { message: 'Payment not found or not confirmed' } });
    }

    // Validate that vote_count matches the payment record
    if (vote_count !== payment.vote_count) {
      return res.status(400).json({ error: { message: 'Vote count does not match payment' } });
    }

    // Validate that candidate_id and position_id match the payment record
    if (candidate_id !== payment.candidate_id || position_id !== payment.position_id) {
      return res.status(400).json({ error: { message: 'Candidate or position does not match payment' } });
    }

    // Check that payment hasn't already been used to record votes (prevent double-vote)
    const existingVote = db.prepare(
      'SELECT id FROM votes WHERE payment_id = ?'
    ).get(payment_id);
    if (existingVote) {
      return res.status(400).json({ error: { message: 'Votes have already been recorded for this payment' } });
    }

    db.prepare(
      'INSERT INTO votes (election_id, position_id, candidate_id, vote_count, payment_id) VALUES (?, ?, ?, ?, ?)'
    ).run(id, position_id, candidate_id, vote_count, payment_id);

    scheduleVoteUpdate(parseInt(id));
    res.json({ message: 'Paid votes recorded successfully', vote_count });
  } catch (err) {
    next(err);
  }
};

module.exports = exports;
