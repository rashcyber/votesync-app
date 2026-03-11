const http = require('http');
const os = require('os');
const { PORT } = require('./config/env');
const { initDatabase } = require('./config/database');
const { initSocket } = require('./config/socket');

async function start() {
  // Initialize database first (must be before loading app/routes)
  await initDatabase();

  // Run migrations
  const migrate = require('./db/migrate');
  await migrate();

  // Auto-seed default admin user
  const { seed } = require('./db/seed');
  await seed();

  // Now load app (which loads routes that use getDb())
  const app = require('./app');

  const server = http.createServer(app);

  // Initialize Socket.io
  initSocket(server);

  // Start election auto-scheduler
  const { startScheduler } = require('./services/scheduler');
  startScheduler();

  // Bind to 0.0.0.0 for local network access
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  VoteSync Pro Server`);
    console.log(`  -------------------`);
    console.log(`  Local:   http://localhost:${PORT}`);

    // Show network addresses for local network mode
    const interfaces = os.networkInterfaces();
    for (const [name, addrs] of Object.entries(interfaces)) {
      for (const addr of addrs) {
        if (addr.family === 'IPv4' && !addr.internal) {
          console.log(`  Network: http://${addr.address}:${PORT}`);
        }
      }
    }
    console.log(`\n  API:     http://localhost:${PORT}/api/health`);
    console.log('');
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
