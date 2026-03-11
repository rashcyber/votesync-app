const { getDb } = require('../config/database');
const { logAction } = require('./auditService');

let intervalId = null;

function tick() {
  try {
    const db = getDb();
    const now = new Date().toISOString();

    // Activate draft elections whose start_date has passed
    const toActivate = db.prepare(
      "SELECT id, title FROM elections WHERE status = 'draft' AND start_date <= ?"
    ).all(now);

    for (const election of toActivate) {
      db.prepare("UPDATE elections SET status = 'active', updated_at = datetime('now') WHERE id = ?").run(election.id);
      logAction(null, 'auto_activate', 'election', election.id, { title: election.title });
      console.log(`[Scheduler] Activated election #${election.id}: ${election.title}`);
    }

    // Complete active elections whose end_date has passed
    const toComplete = db.prepare(
      "SELECT id, title FROM elections WHERE status = 'active' AND end_date <= ?"
    ).all(now);

    for (const election of toComplete) {
      db.prepare("UPDATE elections SET status = 'completed', updated_at = datetime('now') WHERE id = ?").run(election.id);
      logAction(null, 'auto_complete', 'election', election.id, { title: election.title });
      console.log(`[Scheduler] Completed election #${election.id}: ${election.title}`);
    }
  } catch (err) {
    console.error('[Scheduler] Error:', err.message);
  }
}

function startScheduler() {
  if (intervalId) return;
  tick(); // Run immediately on start
  intervalId = setInterval(tick, 60 * 1000); // Every 60 seconds
  console.log('[Scheduler] Election auto-scheduler started (60s interval)');
}

function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

module.exports = { startScheduler, stopScheduler };
