const { getDb } = require('../config/database');

exports.verifyReceipt = (req, res, next) => {
  try {
    const db = getDb();
    const { hash } = req.params;

    if (!hash || hash.length < 10) {
      return res.status(400).json({ error: { message: 'Invalid receipt hash' } });
    }

    const receipt = db.prepare(`
      SELECT vr.receipt_hash, vr.created_at AS voted_at, e.title AS election_title
      FROM vote_receipts vr
      JOIN elections e ON vr.election_id = e.id
      WHERE vr.receipt_hash = ?
    `).get(hash);

    if (!receipt) {
      return res.json({ verified: false, message: 'Receipt not found' });
    }

    res.json({
      verified: true,
      election_title: receipt.election_title,
      voted_at: receipt.voted_at,
      receipt_hash: receipt.receipt_hash,
    });
  } catch (err) {
    next(err);
  }
};
