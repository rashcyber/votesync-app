const express = require('express');
const router = express.Router();
const { getDb } = require('../config/database');
const authAdmin = require('../middleware/authAdmin');

router.get('/students/export', authAdmin, (req, res, next) => {
  try {
    const db = getDb();
    const students = db.prepare(
      'SELECT student_id, full_name, class_name, hall, pin FROM students ORDER BY full_name'
    ).all();
    
    const csv = 'Student ID,Name,Class,Hall,PIN\n' + students.map(s =>
      `${s.student_id},"${s.full_name}","${s.class_name || ''}","${s.hall || ''}",${s.pin || ''}`
    ).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=student-credentials.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
