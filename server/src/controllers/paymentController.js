const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { PAYSTACK_SECRET_KEY } = require('../config/env');
const crypto = require('crypto');
const { logAction } = require('../services/auditService');

const paystackEnabled = !!PAYSTACK_SECRET_KEY;

exports.initialize = async (req, res, next) => {
  try {
    const db = getDb();
    const { election_id, candidate_id, position_id, vote_count, voter_name, voter_phone, voter_email, provider } = req.body;

    if (!election_id || !candidate_id || !position_id || !vote_count) {
      return res.status(400).json({ error: { message: 'Missing required fields' } });
    }

    const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(election_id);
    if (!election || election.voting_type !== 'paid') {
      return res.status(400).json({ error: { message: 'Invalid election for paid voting' } });
    }

    const amount = vote_count * election.price_per_vote;
    const reference = `PAY-${uuidv4().substring(0, 12)}`;

    const result = db.prepare(`
      INSERT INTO payments (election_id, candidate_id, position_id, voter_name, voter_phone, voter_email, amount, vote_count, provider, payment_method, paystack_ref, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      election_id, candidate_id, position_id,
      voter_name || null, voter_phone || null, voter_email || null,
      amount, vote_count, provider || null,
      paystackEnabled ? 'paystack' : 'manual',
      reference
    );

    if (paystackEnabled && voter_email) {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: voter_email,
          amount: Math.round(amount * 100),
          currency: 'GHS',
          reference,
          channels: ['mobile_money'],
          metadata: {
            election_id,
            candidate_id,
            position_id,
            vote_count,
            payment_id: result.lastInsertRowid,
          },
        }),
      });

      const data = await response.json();
      if (data.status) {
        return res.json({
          payment_id: result.lastInsertRowid,
          reference,
          authorization_url: data.data.authorization_url,
          amount,
          method: 'paystack',
        });
      }
    }

    res.json({
      payment_id: result.lastInsertRowid,
      reference,
      amount,
      method: 'manual',
      message: 'Payment recorded. Awaiting admin approval.',
    });
  } catch (err) {
    next(err);
  }
};

exports.verify = async (req, res, next) => {
  try {
    const db = getDb();
    const { reference } = req.params;
    const payment = db.prepare('SELECT * FROM payments WHERE paystack_ref = ?').get(reference);
    if (!payment) {
      return res.status(404).json({ error: { message: 'Payment not found' } });
    }

    if (payment.status === 'success') {
      return res.json({ status: 'success', payment });
    }

    if (paystackEnabled) {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      });
      const data = await response.json();

      if (data.data && data.data.status === 'success') {
        processSuccessfulPayment(payment.id);
        const updated = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment.id);
        return res.json({ status: 'success', payment: updated });
      }
    }

    res.json({ status: payment.status, payment });
  } catch (err) {
    next(err);
  }
};

exports.webhook = (req, res) => {
  try {
    const db = getDb();
    if (!paystackEnabled) return res.sendStatus(200);

    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));

    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.sendStatus(401);
    }

    const event = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;
    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      const payment = db.prepare('SELECT * FROM payments WHERE paystack_ref = ?').get(reference);
      if (payment && payment.status !== 'success') {
        processSuccessfulPayment(payment.id);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.sendStatus(500);
  }
};

exports.approveManual = (req, res, next) => {
  try {
    const db = getDb();
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: { message: 'Payment not found' } });
    }
    if (payment.status === 'success') {
      return res.status(400).json({ error: { message: 'Payment already approved' } });
    }

    processSuccessfulPayment(payment.id, req.admin.adminId);
    const updated = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment.id);
    logAction(req.admin.adminId, 'approve_payment', 'payment', payment.id, { amount: payment.amount, vote_count: payment.vote_count }, req.ip);
    res.json({ message: 'Payment approved and votes recorded', payment: updated });
  } catch (err) {
    next(err);
  }
};

exports.listByElection = (req, res, next) => {
  try {
    const db = getDb();
    const payments = db.prepare(
      'SELECT * FROM payments WHERE election_id = ? ORDER BY created_at DESC'
    ).all(req.params.electionId);
    res.json({ payments });
  } catch (err) {
    next(err);
  }
};

function processSuccessfulPayment(paymentId, approvedBy) {
  const db = getDb();
  const processPayment = db.transaction(() => {
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
    if (!payment || payment.status === 'success') return;

    if (approvedBy) {
      db.prepare(
        "UPDATE payments SET status = 'success', approved_by = ?, approved_at = datetime('now') WHERE id = ?"
      ).run(approvedBy, paymentId);
    } else {
      db.prepare("UPDATE payments SET status = 'success' WHERE id = ?").run(paymentId);
    }

    db.prepare(
      'INSERT INTO votes (election_id, position_id, candidate_id, vote_count, payment_id) VALUES (?, ?, ?, ?, ?)'
    ).run(payment.election_id, payment.position_id, payment.candidate_id, payment.vote_count, paymentId);
  });

  processPayment();

  try {
    const payment = db.prepare('SELECT election_id FROM payments WHERE id = ?').get(paymentId);
    if (payment) {
      const { getIO } = require('../config/socket');
      const io = getIO();
      setTimeout(() => {
        try {
          const db2 = getDb();
          const results = db2.prepare(`
            SELECT c.id AS candidate_id, c.full_name, c.contestant_code, c.photo_url,
                   p.id AS position_id, p.title AS position_title,
                   COALESCE(SUM(v.vote_count), 0) AS total_votes
            FROM candidates c
            JOIN positions p ON c.position_id = p.id
            LEFT JOIN votes v ON v.candidate_id = c.id
            WHERE c.election_id = ?
            GROUP BY c.id
            ORDER BY p.display_order, total_votes DESC
          `).all(payment.election_id);

          const payload = { electionId: payment.election_id, results, timestamp: new Date().toISOString() };
          io.of('/admin').to(`election:${payment.election_id}`).emit('vote:update', payload);
          io.of('/public').to(`election:${payment.election_id}`).emit('vote:update', payload);
        } catch (e) { /* socket not ready */ }
      }, 500);
    }
  } catch (e) { /* ignore socket errors */ }
}
