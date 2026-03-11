const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { getDb } = require('../config/database');
const { hashPassword } = require('../utils/hashPassword');

const KNOWN_HEADERS = {
  student_id: ['student id', 'student_id', 'studentid', 'id', 'index number', 'index_number', 'matric', 'matric number', 'registration number', 'reg no', 'reg_no'],
  full_name: ['full name', 'full_name', 'name', 'student name', 'student_name'],
  class_name: ['class', 'class_name', 'form', 'level', 'year', 'programme', 'program'],
  hall: ['hall', 'hostel', 'hall_name', 'residence'],
  pin: ['pin', 'password', 'pass'],
};

function detectMapping(headers) {
  const mapping = {};
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());

  for (const [field, patterns] of Object.entries(KNOWN_HEADERS)) {
    for (let i = 0; i < lowerHeaders.length; i++) {
      if (patterns.includes(lowerHeaders[i])) {
        mapping[field] = headers[i];
        break;
      }
    }
  }

  return mapping;
}

async function parseFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  let rows = [];
  let columns = [];

  if (ext === '.csv') {
    // Use xlsx to parse CSV as well for consistency
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (data.length > 0) {
      columns = data[0].map(String);
      rows = data.slice(1).map(row => {
        const obj = {};
        columns.forEach((col, i) => {
          obj[col] = row[i] !== undefined ? String(row[i]) : '';
        });
        return obj;
      });
    }
  } else if (ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (data.length > 0) {
      columns = data[0].map(String);
      rows = data.slice(1).map(row => {
        const obj = {};
        columns.forEach((col, i) => {
          obj[col] = row[i] !== undefined ? String(row[i]) : '';
        });
        return obj;
      });
    }
  }

  const suggestedMapping = detectMapping(columns);
  const preview = rows.slice(0, 5);

  return {
    columns,
    preview,
    suggestedMapping,
    totalRows: rows.length,
  };
}

async function importStudents(fileId, mapping, generatePins = true) {
  const db = getDb();
  const filePath = path.resolve(__dirname, '../../data', fileId);
  if (!fs.existsSync(filePath)) {
    throw Object.assign(new Error('Import file not found'), { status: 404 });
  }

  // Parse the full file
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (data.length < 2) {
    throw Object.assign(new Error('File is empty or has no data rows'), { status: 400 });
  }

  const headers = data[0].map(String);
  const rows = data.slice(1);

  // Map columns
  const studentIdCol = headers.indexOf(mapping.student_id);
  const nameCol = headers.indexOf(mapping.full_name);
  const classCol = mapping.class_name ? headers.indexOf(mapping.class_name) : -1;
  const hallCol = mapping.hall ? headers.indexOf(mapping.hall) : -1;
  const pinCol = mapping.pin ? headers.indexOf(mapping.pin) : -1;

  if (studentIdCol === -1 || nameCol === -1) {
    throw Object.assign(new Error('Student ID and Name columns are required'), { status: 400 });
  }

  let imported = 0;
  let skipped = 0;
  const errors = [];
  const generatedPins = [];

  const insertStmt = db.prepare(
    'INSERT OR IGNORE INTO students (student_id, pin, full_name, class_name, hall) VALUES (?, ?, ?, ?, ?)'
  );

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const studentId = row[studentIdCol] ? String(row[studentIdCol]).trim() : '';
    const fullName = row[nameCol] ? String(row[nameCol]).trim() : '';

    if (!studentId || !fullName) {
      errors.push({ row: i + 2, message: 'Missing student ID or name' });
      skipped++;
      continue;
    }

    let pin;
    if (pinCol >= 0 && row[pinCol]) {
      pin = String(row[pinCol]).trim();
    } else if (generatePins) {
      pin = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit PIN
    } else {
      errors.push({ row: i + 2, message: 'No PIN provided and auto-generation disabled' });
      skipped++;
      continue;
    }

    const className = classCol >= 0 ? (row[classCol] ? String(row[classCol]).trim() : null) : null;
    const hall = hallCol >= 0 ? (row[hallCol] ? String(row[hallCol]).trim() : null) : null;

    try {
      const hashedPin = await hashPassword(pin);
      const result = insertStmt.run(studentId, hashedPin, fullName, className, hall);

      if (result.changes > 0) {
        imported++;
        if (generatePins && (pinCol < 0 || !row[pinCol])) {
          generatedPins.push({ student_id: studentId, full_name: fullName, pin });
        }
      } else {
        skipped++;
      }
    } catch (err) {
      errors.push({ row: i + 2, message: err.message });
      skipped++;
    }
  }

  // Clean up the import file
  try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }

  return {
    imported,
    skipped,
    errors: errors.slice(0, 20), // Limit error list
    generatedPins: generatedPins.length > 0 ? generatedPins : undefined,
  };
}

module.exports = { parseFile, importStudents };
