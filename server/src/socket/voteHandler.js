const { getDb } = require('../config/database');

function getElectionResults(electionId) {
  const db = getDb();
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

  return { electionId, results, totalVoters, timestamp: new Date().toISOString() };
}

function setupVoteHandlers(io) {
  // When admin joins, send current snapshot
  io.of('/admin').on('connection', (socket) => {
    socket.on('join:election', (electionId) => {
      socket.join(`election:${electionId}`);
      const data = getElectionResults(electionId);
      socket.emit('vote:update', data);
    });
  });

  io.of('/public').on('connection', (socket) => {
    socket.on('join:election', (electionId) => {
      socket.join(`election:${electionId}`);
      // Only send if results are public
      const db = getDb();
      const election = db.prepare('SELECT results_public FROM elections WHERE id = ?').get(electionId);
      if (election && election.results_public) {
        const data = getElectionResults(electionId);
        socket.emit('vote:update', data);
      }
    });
  });
}

module.exports = { setupVoteHandlers, getElectionResults };
