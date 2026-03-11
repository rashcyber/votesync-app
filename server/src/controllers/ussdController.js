const { getDb } = require('../config/database');
const crypto = require('crypto');

// In-memory session cache for fast USSD lookups
const sessionCache = new Map();

// Auto-cleanup stale sessions every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of sessionCache.entries()) {
    if (now - session.lastAccess > 5 * 60 * 1000) {
      sessionCache.delete(key);
    }
  }
}, 60 * 1000);

function getSession(sessionId) {
  const cached = sessionCache.get(sessionId);
  if (cached) {
    cached.lastAccess = Date.now();
    return cached;
  }
  return null;
}

function setSession(sessionId, data) {
  sessionCache.set(sessionId, { ...data, lastAccess: Date.now() });
}

function clearSession(sessionId) {
  sessionCache.delete(sessionId);
}

exports.callback = (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;

  if (!sessionId || !phoneNumber) {
    return res.type('text/plain').send('END Invalid request');
  }

  const parts = (text || '').split('*').filter(p => p !== '');
  let response = '';

  try {
    const db = getDb();

    // No input yet — welcome menu
    if (parts.length === 0) {
      clearSession(sessionId);
      response = 'CON Welcome to VoteSync Pro\n\n1. Vote\n2. Check Results\n3. Verify Vote';
      return res.type('text/plain').send(response);
    }

    const mainChoice = parts[0];

    // ── VOTE FLOW ──
    if (mainChoice === '1') {
      // Step 1: Ask for voter code
      if (parts.length === 1) {
        response = 'CON Enter your voter code:';
        return res.type('text/plain').send(response);
      }

      // Step 2: Validate code and show elections
      if (parts.length === 2) {
        const code = parts[1].trim().toUpperCase();
        const voterCode = db.prepare(
          'SELECT vc.*, e.title, e.status, e.ussd_enabled FROM voter_codes vc JOIN elections e ON vc.election_id = e.id WHERE UPPER(vc.code) = ? AND vc.is_used = 0'
        ).get(code);

        if (!voterCode) {
          response = 'END Invalid or already used voter code.';
          return res.type('text/plain').send(response);
        }

        if (voterCode.status !== 'active') {
          response = 'END This election is not currently active.';
          return res.type('text/plain').send(response);
        }

        if (!voterCode.ussd_enabled) {
          response = 'END USSD voting is not enabled for this election.';
          return res.type('text/plain').send(response);
        }

        // Store election context
        setSession(sessionId, {
          voterCode: code,
          electionId: voterCode.election_id,
          electionTitle: voterCode.title,
          voterRef: code,
          selections: {},
        });

        // Show positions
        const positions = db.prepare(
          'SELECT id, title FROM positions WHERE election_id = ? ORDER BY display_order'
        ).all(voterCode.election_id);

        if (positions.length === 0) {
          response = 'END No positions available for this election.';
          return res.type('text/plain').send(response);
        }

        let menu = `CON ${voterCode.title}\nSelect position:\n`;
        positions.forEach((p, i) => {
          menu += `${i + 1}. ${p.title}\n`;
        });
        setSession(sessionId, { ...getSession(sessionId), positions });
        return res.type('text/plain').send(menu);
      }

      // Step 3: User selected a position, show candidates
      if (parts.length === 3) {
        const session = getSession(sessionId);
        if (!session || !session.positions) {
          response = 'END Session expired. Please dial again.';
          return res.type('text/plain').send(response);
        }

        const posIdx = parseInt(parts[2]) - 1;
        if (isNaN(posIdx) || posIdx < 0 || posIdx >= session.positions.length) {
          response = 'END Invalid selection.';
          return res.type('text/plain').send(response);
        }

        const position = session.positions[posIdx];
        const candidates = db.prepare(
          'SELECT id, full_name, contestant_code FROM candidates WHERE position_id = ? ORDER BY display_order'
        ).all(position.id);

        if (candidates.length === 0) {
          response = 'END No candidates for this position.';
          return res.type('text/plain').send(response);
        }

        let menu = `CON ${position.title}\nSelect candidate:\n`;
        candidates.forEach((c, i) => {
          menu += `${i + 1}. ${c.full_name}${c.contestant_code ? ` (${c.contestant_code})` : ''}\n`;
        });

        setSession(sessionId, { ...session, currentPosition: position, candidates });
        return res.type('text/plain').send(menu);
      }

      // Step 4: User selected a candidate, ask for confirmation
      if (parts.length === 4) {
        const session = getSession(sessionId);
        if (!session || !session.candidates) {
          response = 'END Session expired. Please dial again.';
          return res.type('text/plain').send(response);
        }

        const candIdx = parseInt(parts[3]) - 1;
        if (isNaN(candIdx) || candIdx < 0 || candIdx >= session.candidates.length) {
          response = 'END Invalid selection.';
          return res.type('text/plain').send(response);
        }

        const candidate = session.candidates[candIdx];
        const position = session.currentPosition;

        response = `CON Confirm vote:\n${position.title}: ${candidate.full_name}\n\n1. Confirm\n2. Cancel`;
        setSession(sessionId, { ...session, selectedCandidate: candidate });
        return res.type('text/plain').send(response);
      }

      // Step 5: Confirm or cancel
      if (parts.length === 5) {
        const session = getSession(sessionId);
        if (!session || !session.selectedCandidate) {
          response = 'END Session expired. Please dial again.';
          return res.type('text/plain').send(response);
        }

        if (parts[4] === '2') {
          clearSession(sessionId);
          response = 'END Vote cancelled.';
          return res.type('text/plain').send(response);
        }

        if (parts[4] !== '1') {
          response = 'END Invalid selection.';
          return res.type('text/plain').send(response);
        }

        // Cast the vote
        const { electionId, voterRef, selectedCandidate, currentPosition } = session;

        // Check if already voted
        const existingSession = db.prepare(
          'SELECT id FROM vote_sessions WHERE election_id = ? AND voter_ref = ?'
        ).get(electionId, voterRef);

        if (existingSession) {
          clearSession(sessionId);
          response = 'END You have already voted in this election.';
          return res.type('text/plain').send(response);
        }

        // Cast vote in transaction
        const insertVoteSession = db.prepare(
          'INSERT INTO vote_sessions (election_id, voter_type, voter_ref, ip_address) VALUES (?, ?, ?, ?)'
        );
        const insertVote = db.prepare(
          'INSERT INTO votes (election_id, position_id, candidate_id, session_id) VALUES (?, ?, ?, ?)'
        );
        const markCodeUsed = db.prepare(
          "UPDATE voter_codes SET is_used = 1, used_at = datetime('now') WHERE UPPER(code) = ? AND election_id = ?"
        );
        const insertReceipt = db.prepare(
          'INSERT INTO vote_receipts (session_id, election_id, receipt_hash) VALUES (?, ?, ?)'
        );

        const castVote = db.transaction(() => {
          const sessionResult = insertVoteSession.run(electionId, 'ussd', voterRef, phoneNumber);
          const voteSessionId = sessionResult.lastInsertRowid;

          // For simplicity, cast one vote for the selected position/candidate
          insertVote.run(electionId, currentPosition.id, selectedCandidate.id, voteSessionId);

          // Mark voter code as used
          markCodeUsed.run(voterRef, electionId);

          // Generate receipt
          const receiptData = `${voteSessionId}-${electionId}-${Date.now()}`;
          const receiptHash = crypto.createHash('sha256').update(receiptData).digest('hex').substring(0, 16);
          insertReceipt.run(voteSessionId, electionId, receiptHash);

          return receiptHash;
        });

        const receiptHash = castVote();
        clearSession(sessionId);
        response = `END Vote cast successfully!\nReceipt: ${receiptHash}\nVerify at votesync.app/verify/${receiptHash}`;
        return res.type('text/plain').send(response);
      }
    }

    // ── CHECK RESULTS ──
    if (mainChoice === '2') {
      if (parts.length === 1) {
        const elections = db.prepare(
          "SELECT id, title FROM elections WHERE status IN ('active', 'completed') AND ussd_enabled = 1 ORDER BY created_at DESC LIMIT 5"
        ).all();

        if (elections.length === 0) {
          response = 'END No active elections available.';
          return res.type('text/plain').send(response);
        }

        let menu = 'CON Select election:\n';
        elections.forEach((e, i) => {
          menu += `${i + 1}. ${e.title}\n`;
        });
        setSession(sessionId, { elections });
        return res.type('text/plain').send(menu);
      }

      if (parts.length === 2) {
        const session = getSession(sessionId);
        if (!session || !session.elections) {
          response = 'END Session expired.';
          return res.type('text/plain').send(response);
        }

        const idx = parseInt(parts[1]) - 1;
        if (isNaN(idx) || idx < 0 || idx >= session.elections.length) {
          response = 'END Invalid selection.';
          return res.type('text/plain').send(response);
        }

        const election = session.elections[idx];
        const results = db.prepare(`
          SELECT p.title as position_title, c.full_name, COUNT(v.id) as vote_count
          FROM positions p
          JOIN candidates c ON c.position_id = p.id
          LEFT JOIN votes v ON v.candidate_id = c.id
          WHERE p.election_id = ?
          GROUP BY p.id, c.id
          ORDER BY p.display_order, vote_count DESC
        `).all(election.id);

        if (results.length === 0) {
          response = 'END No results yet.';
          return res.type('text/plain').send(response);
        }

        let resultText = `END ${election.title} Results:\n`;
        let currentPosition = '';
        for (const row of results) {
          if (row.position_title !== currentPosition) {
            currentPosition = row.position_title;
            resultText += `\n${currentPosition}:\n`;
          }
          resultText += `  ${row.full_name}: ${row.vote_count} votes\n`;
        }

        clearSession(sessionId);
        return res.type('text/plain').send(resultText);
      }
    }

    // ── VERIFY VOTE ──
    if (mainChoice === '3') {
      if (parts.length === 1) {
        response = 'CON Enter your receipt code:';
        return res.type('text/plain').send(response);
      }

      if (parts.length === 2) {
        const hash = parts[1].trim();
        const receipt = db.prepare(`
          SELECT vr.receipt_hash, vr.created_at, e.title
          FROM vote_receipts vr
          JOIN elections e ON vr.election_id = e.id
          WHERE vr.receipt_hash = ?
        `).get(hash);

        if (!receipt) {
          response = 'END Receipt not found. Invalid code.';
        } else {
          response = `END Vote verified!\nElection: ${receipt.title}\nCast at: ${receipt.created_at}\nReceipt: ${receipt.receipt_hash}`;
        }
        clearSession(sessionId);
        return res.type('text/plain').send(response);
      }
    }

    // Fallback
    response = 'END Invalid input. Please dial again.';
    return res.type('text/plain').send(response);
  } catch (err) {
    console.error('USSD callback error:', err);
    return res.type('text/plain').send('END An error occurred. Please try again.');
  }
};
