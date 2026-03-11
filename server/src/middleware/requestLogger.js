const fs = require('fs');
const path = require('path');

const logDir = path.resolve(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const accessLog = path.join(logDir, 'access.log');

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(ms) {
  if (ms < 1000) return ms + 'ms';
  return (ms / 1000).toFixed(2) + 's';
}

module.exports = (req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(body) {
    res.send = originalSend;
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    const method = req.method.padEnd(7);
    const status = res.statusCode.toString().padEnd(3);
    const url = req.originalUrl || req.url;
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || '-';
    
    const logEntry = `${timestamp} | ${method} ${status} | ${formatTime(duration)} | ${ip} | ${url} | ${userAgent}\n`;
    
    fs.appendFile(accessLog, logEntry, (err) => {
      if (err) console.error('Failed to write access log:', err.message);
    });
    
    return res.send(body);
  };
  
  next();
};
