const bcrypt = require('bcryptjs');
const { getDb } = require('../config/database');
const migrate = require('./migrate');

async function seed() {
  // Run migrations first (this also initializes the db)
  await migrate();
  const db = getDb();

  // Check if admin already exists
  const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get('admin');
  if (existing) {
    console.log('Default admin already exists, skipping seed.');
    return;
  }

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  db.prepare(
    'INSERT INTO admins (username, password, full_name, role) VALUES (?, ?, ?, ?)'
  ).run('admin', hashedPassword, 'System Administrator', 'superadmin');

  console.log('Seed completed. Default admin: username=admin, password=admin123');
}

module.exports = { seed };
