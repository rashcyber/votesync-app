const { getDb } = require('../config/database');

exports.lookupByCode = (req, res, next) => {
  try {
    const db = getDb();
    const { code } = req.params;

    if (!code || code.length < 2) {
      return res.status(400).json({ error: { message: 'Invalid contestant code' } });
    }

    const candidate = db.prepare(`
      SELECT c.id, c.full_name, c.contestant_code, c.photo_url, c.portfolio,
             e.id AS election_id, e.title AS election_title, e.event_type, e.voting_type,
             e.price_per_vote, e.currency, e.status AS election_status,
             e.start_date, e.end_date,
             p.id AS position_id, p.title AS position_title
      FROM candidates c
      JOIN elections e ON c.election_id = e.id
      JOIN positions p ON c.position_id = p.id
      WHERE c.contestant_code = ? AND e.status = 'active'
    `).get(code.toUpperCase());

    if (!candidate) {
      return res.status(404).json({ error: { message: 'Contestant not found or election is not active' } });
    }

    res.json({
      candidate: {
        id: candidate.id,
        full_name: candidate.full_name,
        contestant_code: candidate.contestant_code,
        photo_url: candidate.photo_url,
        portfolio: candidate.portfolio,
        position: {
          id: candidate.position_id,
          title: candidate.position_title,
        },
      },
      election: {
        id: candidate.election_id,
        title: candidate.election_title,
        event_type: candidate.event_type,
        voting_type: candidate.voting_type,
        price_per_vote: candidate.price_per_vote,
        currency: candidate.currency,
        status: candidate.election_status,
        start_date: candidate.start_date,
        end_date: candidate.end_date,
      },
    });
  } catch (err) {
    next(err);
  }
};
