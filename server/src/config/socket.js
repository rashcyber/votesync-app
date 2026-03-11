const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./env');
const { getDb } = require('./database');

function getCurrentResults(electionId) {
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

  const totalPaidVotes = db.prepare(
    'SELECT COALESCE(SUM(vote_count), 0) AS count FROM votes WHERE election_id = ? AND session_id IS NULL'
  ).get(electionId).count;

  return { electionId, results, totalVoters, totalPaidVotes, timestamp: new Date().toISOString() };
}

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*' },
    path: '/socket.io',
  });

  // Admin namespace - requires JWT
  const adminNs = io.of('/admin');
  adminNs.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (!decoded.adminId) return next(new Error('Admin access required'));
      socket.adminId = decoded.adminId;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  adminNs.on('connection', (socket) => {
    socket.on('join:election', (electionId) => {
      socket.join(`election:${electionId}`);
      try {
        const snapshot = getCurrentResults(electionId);
        socket.emit('vote:update', snapshot);
      } catch (err) {
        console.error('Snapshot emit error (admin):', err.message);
      }
    });

    socket.on('leave:election', (electionId) => {
      socket.leave(`election:${electionId}`);
    });
  });

  // Public namespace - no auth, but only for published results
  const publicNs = io.of('/public');
  publicNs.on('connection', (socket) => {
    socket.on('join:election', (electionId) => {
      socket.join(`election:${electionId}`);
      try {
        const db = getDb();
        const election = db.prepare('SELECT results_public FROM elections WHERE id = ?').get(electionId);
        if (election && election.results_public) {
          const snapshot = getCurrentResults(electionId);
          socket.emit('vote:update', snapshot);
        }
      } catch (err) {
        console.error('Snapshot emit error (public):', err.message);
      }
    });

    socket.on('leave:election', (electionId) => {
      socket.leave(`election:${electionId}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { initSocket, getIO };
