const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

function generateAdminToken(admin) {
  return jwt.sign(
    { adminId: admin.id, username: admin.username, role: admin.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function generateVoterToken(electionId, voterRef, voterType) {
  return jwt.sign(
    { electionId, voterRef, voterType },
    JWT_SECRET,
    { expiresIn: '30m' }
  );
}

module.exports = { generateAdminToken, generateVoterToken };
