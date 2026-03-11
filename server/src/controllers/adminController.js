const { getDb } = require('../config/database');
const { comparePassword } = require('../utils/hashPassword');
const { generateAdminToken } = require('../utils/generateToken');

exports.login = async (req, res, next) => {
  try {
    const db = getDb();
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: { message: 'Username and password are required' } });
    }

    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
    if (!admin) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    const valid = await comparePassword(password, admin.password);
    if (!valid) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    const token = generateAdminToken(admin);
    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        full_name: admin.full_name,
        role: admin.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = (req, res, next) => {
  try {
    const db = getDb();
    const admin = db.prepare('SELECT id, username, full_name, role, created_at FROM admins WHERE id = ?').get(req.admin.adminId);
    if (!admin) {
      return res.status(404).json({ error: { message: 'Admin not found' } });
    }
    res.json({ admin });
  } catch (err) {
    next(err);
  }
};
