const { getDb } = require('../config/database');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const PDFDocument = require('pdfkit');

function isAdminRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    return !!decoded.adminId;
  } catch (e) {
    return false;
  }
}

exports.getResults = (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(id);
    if (!election) {
      return res.status(404).json({ error: { message: 'Election not found' } });
    }

    const isAdmin = isAdminRequest(req);
    if (!election.results_public && !isAdmin) {
      return res.status(403).json({ error: { message: 'Results are not yet public' } });
    }

    const positions = db.prepare(
      'SELECT * FROM positions WHERE election_id = ? ORDER BY display_order'
    ).all(id);

    const results = positions.map(pos => {
      const candidates = db.prepare(`
        SELECT c.id, c.full_name, c.contestant_code, c.photo_url,
               COALESCE(SUM(v.vote_count), 0) AS total_votes
        FROM candidates c
        LEFT JOIN votes v ON v.candidate_id = c.id
        WHERE c.position_id = ?
        GROUP BY c.id
        ORDER BY total_votes DESC
      `).all(pos.id);

      const totalVotes = candidates.reduce((sum, c) => sum + c.total_votes, 0);

      return {
        position: pos,
        candidates: candidates.map(c => ({
          ...c,
          percentage: totalVotes > 0 ? ((c.total_votes / totalVotes) * 100).toFixed(1) : '0.0',
        })),
        totalVotes,
      };
    });

    const totalVoters = db.prepare(
      'SELECT COUNT(*) AS count FROM vote_sessions WHERE election_id = ?'
    ).get(id).count;

    res.json({ election, results, totalVoters });
  } catch (err) {
    next(err);
  }
};

exports.getStats = (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(id);
    if (!election) {
      return res.status(404).json({ error: { message: 'Election not found' } });
    }

    const totalVoters = db.prepare(
      'SELECT COUNT(*) AS count FROM vote_sessions WHERE election_id = ?'
    ).get(id).count;

    const totalVotes = db.prepare(
      'SELECT COALESCE(SUM(vote_count), 0) AS count FROM votes WHERE election_id = ?'
    ).get(id).count;

    const totalPayments = db.prepare(
      "SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total FROM payments WHERE election_id = ? AND status = 'success'"
    ).get(id);

    let registeredVoters = 0;
    if (election.auth_method === 'student_id_pin') {
      registeredVoters = db.prepare('SELECT COUNT(*) AS count FROM students').get().count;
    } else {
      registeredVoters = db.prepare(
        'SELECT COUNT(*) AS count FROM voter_codes WHERE election_id = ?'
      ).get(id).count;
    }

    const turnout = registeredVoters > 0 ? ((totalVoters / registeredVoters) * 100).toFixed(1) : '0.0';

    res.json({
      totalVoters,
      totalVotes,
      registeredVoters,
      turnout,
      payments: {
        count: totalPayments.count,
        totalAmount: totalPayments.total,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.exportResults = (req, res, next) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { format } = req.query;

    const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(id);
    if (!election) {
      return res.status(404).json({ error: { message: 'Election not found' } });
    }

    const isAdmin = isAdminRequest(req);
    if (!election.results_public && !isAdmin) {
      return res.status(403).json({ error: { message: 'Results are not yet public' } });
    }

    const positions = db.prepare(
      'SELECT * FROM positions WHERE election_id = ? ORDER BY display_order'
    ).all(id);

    const results = positions.map(pos => {
      const candidates = db.prepare(`
        SELECT c.full_name, c.contestant_code,
               COALESCE(SUM(v.vote_count), 0) AS total_votes
        FROM candidates c
        LEFT JOIN votes v ON v.candidate_id = c.id
        WHERE c.position_id = ?
        GROUP BY c.id
        ORDER BY total_votes DESC
      `).all(pos.id);

      return { position: pos.title, candidates };
    });

    if (format === 'csv') {
      let csv = 'Position,Candidate,Code,Votes\n';
      for (const r of results) {
        for (const c of r.candidates) {
          csv += `"${r.position}","${c.full_name}","${c.contestant_code || ''}",${c.total_votes}\n`;
        }
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${election.title}-results.csv"`);
      return res.send(csv);
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${election.title}-results.pdf"`);
      
      doc.pipe(res);
      
      doc.fontSize(20).text('Election Results', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text(election.title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);
      
      for (const r of results) {
        doc.fontSize(14).fillColor('#2563eb').text(r.position, { underline: true });
        doc.moveDown(0.5);
        
        const totalVotes = r.candidates.reduce((sum, c) => sum + c.total_votes, 0);
        
        for (let i = 0; i < r.candidates.length; i++) {
          const c = r.candidates[i];
          const percentage = totalVotes > 0 ? ((c.total_votes / totalVotes) * 100).toFixed(1) : '0.0';
          
          if (i === 0 && c.total_votes > 0) {
            doc.fontSize(11).fillColor('#16a34a').text(`★ ${c.full_name} - ${c.total_votes} votes (${percentage}%)`);
          } else {
            doc.fontSize(11).fillColor('#334155').text(`${c.full_name} - ${c.total_votes} votes (${percentage}%)`);
          }
        }
        
        doc.moveDown();
      }
      
      doc.fontSize(10).fillColor('#64748b').text(`Total Candidates: ${results.reduce((sum, r) => sum + r.candidates.length, 0)}`);
      doc.end();
      return;
    }

    res.json({ election: election.title, results });
  } catch (err) {
    next(err);
  }
};
