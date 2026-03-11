const { getDb } = require('../config/database');
const { comparePassword, hashPassword } = require('../utils/hashPassword');
const { generateVoterToken } = require('../utils/generateToken');
const { v4: uuidv4 } = require('uuid');
const importService = require('../services/importService');
const PDFDocument = require('pdfkit');
const { logAction } = require('../services/auditService');

exports.login = async (req, res, next) => {
  try {
    const db = getDb();
    const { method, election_id, student_id, pin, code } = req.body;

    const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(election_id);
    if (!election) {
      return res.status(404).json({ error: { message: 'Election not found' } });
    }
    if (election.status !== 'active') {
      return res.status(400).json({ error: { message: 'This election is not currently active' } });
    }

    const now = new Date().toISOString();
    if (now < election.start_date) {
      return res.status(400).json({ error: { message: 'Voting has not started yet' } });
    }
    if (now > election.end_date) {
      return res.status(400).json({ error: { message: 'Voting has ended' } });
    }

    if (method === 'student_id_pin') {
      if (!student_id || !pin) {
        return res.status(400).json({ error: { message: 'Student ID and PIN are required' } });
      }

      const student = db.prepare('SELECT * FROM students WHERE student_id = ?').get(student_id);
      if (!student) {
        return res.status(401).json({ error: { message: 'Invalid student ID or PIN' } });
      }

      const valid = await comparePassword(pin, student.pin);
      if (!valid) {
        return res.status(401).json({ error: { message: 'Invalid student ID or PIN' } });
      }

      const session = db.prepare(
        'SELECT id FROM vote_sessions WHERE election_id = ? AND voter_ref = ?'
      ).get(election_id, student_id);
      if (session) {
        return res.status(400).json({ error: { message: 'You have already voted in this election' } });
      }

      const token = generateVoterToken(election_id, student_id, 'student');
      return res.json({ token, voter: { name: student.full_name, type: 'student' } });
    }

    if (method === 'voter_code') {
      if (!code) {
        return res.status(400).json({ error: { message: 'Voter code is required' } });
      }

      const voterCode = db.prepare(
        'SELECT * FROM voter_codes WHERE code = ? AND election_id = ?'
      ).get(code, election_id);
      if (!voterCode) {
        return res.status(401).json({ error: { message: 'Invalid voter code' } });
      }
      if (voterCode.is_used) {
        return res.status(400).json({ error: { message: 'This code has already been used' } });
      }

      const token = generateVoterToken(election_id, code, 'code');
      return res.json({ token, voter: { name: voterCode.student_name || 'Voter', type: 'code' } });
    }

    return res.status(400).json({ error: { message: 'Invalid authentication method' } });
  } catch (err) {
    next(err);
  }
};

exports.listStudents = (req, res, next) => {
  try {
    const db = getDb();
    const students = db.prepare(
      'SELECT id, student_id, full_name, class_name, hall, pin, created_at FROM students ORDER BY full_name'
    ).all();
    const studentsWithHasPin = students.map(s => ({
      ...s,
      hasPin: !!s.pin,
      pin: undefined // Don't expose actual PIN
    }));
    res.json({ students: studentsWithHasPin });
  } catch (err) {
    next(err);
  }
};

exports.getStudentCount = (req, res, next) => {
  try {
    const db = getDb();
    const count = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

exports.createStudent = async (req, res, next) => {
  try {
    const db = getDb();
    const { student_id, pin, full_name, class_name, hall } = req.body;

    const existing = db.prepare('SELECT id FROM students WHERE student_id = ?').get(student_id);
    if (existing) {
      return res.status(409).json({ error: { message: 'Student ID already exists' } });
    }

    const hashedPin = await hashPassword(pin);
    const result = db.prepare(
      'INSERT INTO students (student_id, pin, full_name, class_name, hall) VALUES (?, ?, ?, ?, ?)'
    ).run(student_id, hashedPin, full_name, class_name || null, hall || null);

    const student = db.prepare(
      'SELECT id, student_id, full_name, class_name, hall, created_at FROM students WHERE id = ?'
    ).get(result.lastInsertRowid);

    logAction(req.admin.adminId, 'create', 'student', student.id, { student_id, full_name }, req.ip);
    res.status(201).json({ student });
  } catch (err) {
    next(err);
  }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const db = getDb();
    const { student_id, pin, full_name, class_name, hall } = req.body;
    const studentId = req.params.id;

    const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    if (!existing) {
      return res.status(404).json({ error: { message: 'Student not found' } });
    }

    // Check if student_id is being changed and if it's already taken
    if (student_id && student_id !== existing.student_id) {
      const duplicate = db.prepare('SELECT id FROM students WHERE student_id = ? AND id != ?').get(student_id, studentId);
      if (duplicate) {
        return res.status(409).json({ error: { message: 'Student ID already exists' } });
      }
    }

    const updates = [];
    const params = [];

    if (student_id !== undefined) { updates.push('student_id = ?'); params.push(student_id); }
    if (full_name !== undefined) { updates.push('full_name = ?'); params.push(full_name); }
    if (class_name !== undefined) { updates.push('class_name = ?'); params.push(class_name || null); }
    if (hall !== undefined) { updates.push('hall = ?'); params.push(hall || null); }
    if (pin !== undefined && pin) { 
      const hashedPin = await hashPassword(pin);
      updates.push('pin = ?');
      params.push(hashedPin);
    }

    if (updates.length > 0) {
      params.push(studentId);
      const sql = `UPDATE students SET ${updates.join(', ')} WHERE id = ?`;
      db.prepare(sql).run(...params);
    }

    const updated = db.prepare('SELECT id, student_id, full_name, class_name, hall, created_at FROM students WHERE id = ?').get(studentId);
    logAction(req.admin.adminId, 'update', 'student', parseInt(studentId), { student_id: updated.student_id }, req.ip);
    res.json({ student: updated });
  } catch (err) {
    next(err);
  }
};

exports.removeStudent = (req, res, next) => {
  try {
    const db = getDb();
    const student = db.prepare('SELECT id, full_name FROM students WHERE id = ?').get(req.params.id);
    if (!student) {
      return res.status(404).json({ error: { message: 'Student not found' } });
    }
    db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
    logAction(req.admin.adminId, 'delete', 'student', parseInt(req.params.id), { full_name: student.full_name }, req.ip);
    res.json({ message: 'Student deleted' });
  } catch (err) {
    next(err);
  }
};

exports.importStudents = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No file uploaded' } });
    }

    const result = await importService.parseFile(req.file.path, req.file.originalname);
    res.json({
      fileId: req.file.filename,
      columns: result.columns,
      preview: result.preview,
      suggestedMapping: result.suggestedMapping,
      totalRows: result.totalRows,
    });
  } catch (err) {
    next(err);
  }
};

exports.confirmImport = async (req, res, next) => {
  try {
    const { fileId, mapping, generatePins } = req.body;
    if (!fileId || !mapping) {
      return res.status(400).json({ error: { message: 'fileId and mapping are required' } });
    }

    const result = await importService.importStudents(fileId, mapping, generatePins !== false);
    logAction(req.admin.adminId, 'import', 'student', null, { count: result.imported }, req.ip);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.generateCodes = (req, res, next) => {
  try {
    const db = getDb();
    const { electionId } = req.params;
    const { count, studentNames, assignToStudents } = req.body;

    const election = db.prepare('SELECT id, code_prefix FROM elections WHERE id = ?').get(electionId);
    if (!election) {
      return res.status(404).json({ error: { message: 'Election not found' } });
    }

    // Use election's code_prefix or fall back to 'VOTE'
    const prefix = (election.code_prefix || 'VOTE').toUpperCase().replace(/[^A-Z0-9]/g, '');

    function generateUniqueCode() {
      const maxRetries = 10;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const code = `${prefix}-${uuidv4().substring(0, 8).toUpperCase()}`;
        const exists = db.prepare('SELECT 1 FROM voter_codes WHERE code = ?').get(code);
        if (!exists) return code;
      }
      throw new Error('Failed to generate unique code after multiple attempts');
    }

    const codes = [];

    if (assignToStudents) {
      // Fetch all students and generate one code per student
      const students = db.prepare('SELECT id, full_name, class_name FROM students ORDER BY full_name').all();
      if (students.length === 0) {
        return res.status(400).json({ error: { message: 'No students registered. Import students first.' } });
      }

      const insert = db.prepare(
        'INSERT INTO voter_codes (election_id, code, student_name, student_id) VALUES (?, ?, ?, ?)'
      );

      const generateBatch = db.transaction(() => {
        for (const student of students) {
          const code = generateUniqueCode();
          const result = insert.run(electionId, code, student.full_name, student.id);
          codes.push({
            id: Number(result.lastInsertRowid),
            code,
            student_name: student.full_name,
            student_id: student.id,
            class_name: student.class_name,
            is_used: 0,
            used_at: null,
          });
        }
      });

      generateBatch();
    } else {
      // Generate anonymous codes
      const insert = db.prepare(
        'INSERT INTO voter_codes (election_id, code, student_name) VALUES (?, ?, ?)'
      );

      const generateBatch = db.transaction(() => {
        for (let i = 0; i < count; i++) {
          const code = generateUniqueCode();
          const name = studentNames && studentNames[i] ? studentNames[i] : null;
          const result = insert.run(electionId, code, name);
          codes.push({ id: Number(result.lastInsertRowid), code, student_name: name, is_used: 0, used_at: null });
        }
      });

      generateBatch();
    }

    logAction(req.admin.adminId, 'generate_codes', 'voter_codes', null, { election_id: electionId, count: codes.length, assignToStudents: !!assignToStudents }, req.ip);
    res.status(201).json({ codes, count: codes.length });
  } catch (err) {
    next(err);
  }
};

exports.listCodes = (req, res, next) => {
  try {
    const db = getDb();
    const codes = db.prepare(`
      SELECT vc.id, vc.code, vc.student_name, vc.student_id, vc.is_used, vc.used_at, vc.created_at,
             s.class_name, s.full_name AS student_full_name
      FROM voter_codes vc
      LEFT JOIN students s ON vc.student_id = s.id
      WHERE vc.election_id = ?
      ORDER BY vc.created_at
    `).all(req.params.electionId);
    res.json({ codes });
  } catch (err) {
    next(err);
  }
};

exports.deleteCode = (req, res, next) => {
  try {
    const db = getDb();
    const { electionId, codeId } = req.params;

    const code = db.prepare(
      'SELECT id, is_used FROM voter_codes WHERE id = ? AND election_id = ?'
    ).get(codeId, electionId);

    if (!code) {
      return res.status(404).json({ error: { message: 'Code not found' } });
    }
    if (code.is_used) {
      return res.status(400).json({ error: { message: 'Cannot delete a code that has already been used' } });
    }

    db.prepare('DELETE FROM voter_codes WHERE id = ?').run(codeId);
    res.json({ message: 'Code deleted' });
  } catch (err) {
    next(err);
  }
};

exports.revokeUnusedCodes = (req, res, next) => {
  try {
    const db = getDb();
    const { electionId } = req.params;

    const election = db.prepare('SELECT id FROM elections WHERE id = ?').get(electionId);
    if (!election) {
      return res.status(404).json({ error: { message: 'Election not found' } });
    }

    const result = db.prepare(
      'DELETE FROM voter_codes WHERE election_id = ? AND is_used = 0'
    ).run(electionId);

    logAction(req.admin.adminId, 'revoke_codes', 'voter_codes', null, { election_id: electionId, count: result.changes }, req.ip);
    res.json({ message: `${result.changes} unused codes revoked`, count: result.changes });
  } catch (err) {
    next(err);
  }
};

exports.exportCodesPDF = (req, res, next) => {
  try {
    const db = getDb();
    const { electionId } = req.params;

    const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(electionId);
    if (!election) {
      return res.status(404).json({ error: { message: 'Election not found' } });
    }

    const codes = db.prepare(`
      SELECT vc.code, vc.student_name, vc.is_used,
             s.class_name
      FROM voter_codes vc
      LEFT JOIN students s ON vc.student_id = s.id
      WHERE vc.election_id = ?
      ORDER BY vc.created_at
    `).all(electionId);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="voter-codes-election-${electionId}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text(election.title, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica').text('Voter Codes', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1);

    // Table header
    const tableTop = doc.y;
    const colWidths = { num: 30, code: 140, name: 180, cls: 100, status: 65 };
    const startX = 40;

    function drawTableHeader(y) {
      doc.fillColor('#333').fontSize(9).font('Helvetica-Bold');
      let x = startX;
      doc.text('#', x, y, { width: colWidths.num });
      x += colWidths.num;
      doc.text('Code', x, y, { width: colWidths.code });
      x += colWidths.code;
      doc.text('Student Name', x, y, { width: colWidths.name });
      x += colWidths.name;
      doc.text('Class', x, y, { width: colWidths.cls });
      x += colWidths.cls;
      doc.text('Status', x, y, { width: colWidths.status });

      doc.moveTo(startX, y + 14).lineTo(startX + 515, y + 14).strokeColor('#ccc').stroke();
      return y + 18;
    }

    let y = drawTableHeader(tableTop);

    codes.forEach((code, i) => {
      // Page break every ~30 rows
      if (y > 740) {
        doc.addPage();
        y = drawTableHeader(40);
      }

      doc.fillColor('#444').fontSize(8).font('Helvetica');
      let x = startX;
      doc.text(String(i + 1), x, y, { width: colWidths.num });
      x += colWidths.num;
      doc.font('Courier').text(code.code, x, y, { width: colWidths.code });
      x += colWidths.code;
      doc.font('Helvetica').text(code.student_name || '--', x, y, { width: colWidths.name });
      x += colWidths.name;
      doc.text(code.class_name || '--', x, y, { width: colWidths.cls });
      x += colWidths.cls;
      doc.fillColor(code.is_used ? '#dc2626' : '#16a34a').text(code.is_used ? 'Used' : 'Available', x, y, { width: colWidths.status });

      y += 16;
    });

    // Footer
    doc.moveDown(2);
    doc.fillColor('#999').fontSize(8).font('Helvetica').text(
      `Total: ${codes.length} codes | Available: ${codes.filter(c => !c.is_used).length} | Used: ${codes.filter(c => c.is_used).length}`,
      { align: 'center' }
    );

    doc.end();
  } catch (err) {
    next(err);
  }
};
