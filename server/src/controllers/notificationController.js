const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const authAdmin = require('../middleware/authAdmin');
const { logAction } = require('../services/auditService');

// Public - get all active notifications for landing page
exports.listPublic = (req, res, next) => {
  try {
    const db = getDb();
    const notifications = db.prepare(`
      SELECT n.*, e.title as election_title
      FROM notifications n 
      LEFT JOIN elections e ON n.election_id = e.id
      WHERE n.election_id IS NULL OR e.status = 'active'
      ORDER BY n.created_at DESC
      LIMIT 10
    `).all();
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
};

exports.createAnnouncement = (req, res, next) => {
  try {
    const db = getDb();
    const { title, message, type } = req.body;

    const result = db.prepare(`
      INSERT INTO notifications (election_id, title, message, type, target_group, sent_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(null, title, message, type || 'announcement', 'all', req.admin.adminId);

    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(result.lastInsertRowid);
    
    logAction(req.admin.adminId, 'create', 'announcement', notification.id, { title }, req.ip);
    
    res.status(201).json({ notification });
  } catch (err) {
    next(err);
  }
};

exports.list = (req, res, next) => {
  try {
    const db = getDb();
    const notifications = db.prepare(`
      SELECT n.*, a.full_name as sent_by_name 
      FROM notifications n 
      LEFT JOIN admins a ON n.sent_by = a.id 
      WHERE n.election_id = ? 
      ORDER BY n.created_at DESC
    `).all(req.params.electionId);
    res.json({ notifications });
  } catch (err) {
    next(err);
  }
};

exports.create = (req, res, next) => {
  try {
    const db = getDb();
    const { title, message, type, target_group } = req.body;
    const electionId = req.params.electionId;

    const result = db.prepare(`
      INSERT INTO notifications (election_id, title, message, type, target_group, sent_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(electionId, title, message, type || 'announcement', target_group || 'all', req.admin.adminId);

    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(result.lastInsertRowid);
    
    logAction(req.admin.adminId, 'create', 'notification', notification.id, { title, election_id: electionId }, req.ip);
    
    res.status(201).json({ notification });
  } catch (err) {
    next(err);
  }
};

exports.remove = (req, res, next) => {
  try {
    const db = getDb();
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: { message: 'Notification not found' } });
    }

    db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);
    logAction(req.admin.adminId, 'delete', 'notification', parseInt(req.params.id), { title: notification.title }, req.ip);
    
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
};
