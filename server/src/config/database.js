const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'voting.db');

let db = null;

// Wrapper that provides a better-sqlite3-like synchronous API over sql.js
class Database {
  constructor(sqlDb) {
    this._db = sqlDb;
    this._inTransaction = false;
    this._saveTimer = null;
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        self._db.run(sql, params);
        const lastId = self._db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0] || 0;
        const changes = self._db.getRowsModified();
        // Only save if not inside a transaction (transaction saves on commit)
        if (!self._inTransaction) {
          self._debouncedSave();
        }
        return { lastInsertRowid: lastId, changes };
      },
      get(...params) {
        try {
          const stmt = self._db.prepare(sql);
          stmt.bind(params);
          if (stmt.step()) {
            const cols = stmt.getColumnNames();
            const vals = stmt.get();
            stmt.free();
            const row = {};
            cols.forEach((col, i) => { row[col] = vals[i]; });
            return row;
          }
          stmt.free();
          return undefined;
        } catch (e) {
          console.error('DB get error:', sql, params, e.message);
          return undefined;
        }
      },
      all(...params) {
        try {
          const stmt = self._db.prepare(sql);
          stmt.bind(params);
          const rows = [];
          const cols = stmt.getColumnNames();
          while (stmt.step()) {
            const vals = stmt.get();
            const row = {};
            cols.forEach((col, i) => { row[col] = vals[i]; });
            rows.push(row);
          }
          stmt.free();
          return rows;
        } catch (e) {
          console.error('DB all error:', sql, params, e.message);
          return [];
        }
      },
    };
  }

  exec(sql) {
    this._db.run(sql);
    if (!this._inTransaction) {
      this._debouncedSave();
    }
  }

  pragma(sql) {
    try {
      this._db.run(`PRAGMA ${sql}`);
    } catch (e) {
      // Ignore pragma errors (sql.js doesn't support WAL, etc.)
    }
  }

  transaction(fn) {
    const self = this;
    return function (...args) {
      self._inTransaction = true;
      self._db.run('BEGIN TRANSACTION');
      try {
        const result = fn(...args);
        self._db.run('COMMIT');
        self._inTransaction = false;
        self._save();
        return result;
      } catch (err) {
        try {
          self._db.run('ROLLBACK');
        } catch (rollbackErr) {
          console.error('Rollback error:', rollbackErr.message);
        }
        self._inTransaction = false;
        throw err;
      }
    };
  }

  // Immediate save to disk
  _save() {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
    }
    try {
      const data = this._db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (e) {
      console.error('DB save error:', e.message);
    }
  }

  // Debounced save - batches rapid writes
  _debouncedSave() {
    if (this._saveTimer) return;
    this._saveTimer = setTimeout(() => {
      this._saveTimer = null;
      this._save();
    }, 100);
  }

  close() {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._save();
    }
    this._db.close();
  }
}

async function initDatabase() {
  const SQL = await initSqlJs();

  let sqlDb;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(fileBuffer);
  } else {
    sqlDb = new SQL.Database();
  }

  db = new Database(sqlDb);
  db.pragma('foreign_keys = ON');

  return db;
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

module.exports = { initDatabase, getDb };
