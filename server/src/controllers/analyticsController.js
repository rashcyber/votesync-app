const { getDb } = require('../config/database');

exports.timeline = (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const election = db.prepare('SELECT id FROM elections WHERE id = ?').get(id);
    if (!election) {
      return res.status(404).json({ error: { message: 'Election not found' } });
    }

    // Votes over time (hourly buckets)
    const timeline = db.prepare(`
      SELECT
        strftime('%Y-%m-%d %H:00', vs.voted_at) AS hour,
        COUNT(*) AS vote_count
      FROM vote_sessions vs
      WHERE vs.election_id = ?
      GROUP BY hour
      ORDER BY hour
    `).all(id);

    // Also include paid votes timeline
    const paidTimeline = db.prepare(`
      SELECT
        strftime('%Y-%m-%d %H:00', v.created_at) AS hour,
        SUM(v.vote_count) AS vote_count
      FROM votes v
      WHERE v.election_id = ? AND v.session_id IS NULL
      GROUP BY hour
      ORDER BY hour
    `).all(id);

    res.json({ timeline, paidTimeline });
  } catch (err) {
    next(err);
  }
};

exports.demographics = (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const election = db.prepare('SELECT id FROM elections WHERE id = ?').get(id);
    if (!election) {
      return res.status(404).json({ error: { message: 'Election not found' } });
    }

    // Turnout by class
    const byClass = db.prepare(`
      SELECT s.class_name, COUNT(*) AS vote_count
      FROM vote_sessions vs
      JOIN students s ON vs.voter_ref = s.student_id
      WHERE vs.election_id = ? AND vs.voter_type = 'student' AND s.class_name IS NOT NULL
      GROUP BY s.class_name
      ORDER BY vote_count DESC
    `).all(id);

    // Turnout by hall
    const byHall = db.prepare(`
      SELECT s.hall, COUNT(*) AS vote_count
      FROM vote_sessions vs
      JOIN students s ON vs.voter_ref = s.student_id
      WHERE vs.election_id = ? AND vs.voter_type = 'student' AND s.hall IS NOT NULL
      GROUP BY s.hall
      ORDER BY vote_count DESC
    `).all(id);

    // Summary stats
    const totalFreeVotes = db.prepare(
      'SELECT COUNT(*) AS count FROM vote_sessions WHERE election_id = ?'
    ).get(id).count;

    const totalPaidVotes = db.prepare(
      'SELECT COALESCE(SUM(vote_count), 0) AS count FROM votes WHERE election_id = ? AND session_id IS NULL'
    ).get(id).count;

    const totalStudents = db.prepare('SELECT COUNT(*) AS count FROM students').get().count;

    res.json({
      byClass,
      byHall,
      summary: {
        totalFreeVotes,
        totalPaidVotes,
        totalStudents,
        turnoutPercent: totalStudents > 0 ? Math.round((totalFreeVotes / totalStudents) * 100) : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};
