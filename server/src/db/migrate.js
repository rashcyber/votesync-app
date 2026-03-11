const fs = require('fs');
const path = require('path');
const { initDatabase, getDb } = require('../config/database');

async function migrate() {
  // Ensure database is initialized (idempotent)
  try {
    getDb();
  } catch (e) {
    await initDatabase();
  }

  const db = getDb();

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Split by semicolons and execute each statement
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('PRAGMA'));

  for (const stmt of statements) {
    try {
      db.exec(stmt + ';');
    } catch (err) {
      // Ignore "already exists" and "duplicate column" type errors
      if (!err.message.includes('already exists') && !err.message.includes('duplicate column')) {
        console.error(`Error executing: ${stmt.substring(0, 80)}...`);
        console.error(err.message);
      }
    }
  }

  // Run ALTER TABLE migrations (these fail gracefully if columns already exist)
  const alterStatements = [
    'ALTER TABLE voter_codes ADD COLUMN student_id INTEGER REFERENCES students(id)',
    'ALTER TABLE votes ADD COLUMN payment_id INTEGER REFERENCES payments(id)',
    'ALTER TABLE elections ADD COLUMN show_on_landing INTEGER NOT NULL DEFAULT 1',
    'ALTER TABLE elections ADD COLUMN notify_voters INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE elections ADD COLUMN reminder_sent INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE elections ADD COLUMN election_scope TEXT NOT NULL DEFAULT \'institution\'',
    'ALTER TABLE elections ADD COLUMN ussd_enabled INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE elections ADD COLUMN ussd_service_code TEXT',
  ];

  for (const stmt of alterStatements) {
    try {
      db.exec(stmt + ';');
    } catch (err) {
      // Ignore duplicate column errors
      if (!err.message.includes('duplicate column')) {
        // Log but don't fail - column may already exist
      }
    }
  }

  // Create notifications table
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        election_id INTEGER REFERENCES elections(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'announcement',
        target_group TEXT NOT NULL DEFAULT 'all',
        sent_by INTEGER REFERENCES admins(id),
        sent_at TEXT NOT NULL DEFAULT (datetime('now')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  } catch (err) {
    if (!err.message.includes('already exists')) {
      console.error('Error creating notifications table:', err.message);
    }
  }

  // Create activity_log table for real-time feed
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        election_id INTEGER REFERENCES elections(id) ON DELETE CASCADE,
        activity_type TEXT NOT NULL,
        description TEXT NOT NULL,
        metadata TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_activity_log_election ON activity_log(election_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at)');
  } catch (err) {
    if (!err.message.includes('already exists')) {
      console.error('Error creating activity_log table:', err.message);
    }
  }

  // Create indexes for new columns (safe with IF NOT EXISTS)
  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_voter_codes_student ON voter_codes(student_id);');
    db.exec('CREATE INDEX IF NOT EXISTS idx_votes_payment ON votes(payment_id);');
  } catch (err) {
    // Ignore errors
  }

  console.log('Database migration completed successfully.');
}

// Run if called directly
if (require.main === module) {
  migrate().then(() => process.exit(0)).catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = migrate;
