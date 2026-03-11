PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================================
-- 1. ADMINS
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    full_name   TEXT    NOT NULL,
    role        TEXT    NOT NULL DEFAULT 'admin',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 2. ELECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS elections (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT    NOT NULL,
    description     TEXT,
    event_type      TEXT    NOT NULL,
    election_scope  TEXT    NOT NULL DEFAULT 'institution',
    voting_type     TEXT    NOT NULL,
    auth_method     TEXT    NOT NULL,
    price_per_vote  REAL    DEFAULT 0,
    currency        TEXT    DEFAULT 'GHS',
    code_prefix     TEXT    DEFAULT '',
    start_date      TEXT    NOT NULL,
    end_date        TEXT    NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'draft',
    results_public  INTEGER NOT NULL DEFAULT 0,
    show_on_landing INTEGER NOT NULL DEFAULT 1,
    created_by      INTEGER NOT NULL REFERENCES admins(id),
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_elections_status ON elections(status);
CREATE INDEX IF NOT EXISTS idx_elections_event_type ON elections(event_type);

-- ============================================================
-- 3. POSITIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS positions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    election_id     INTEGER NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    title           TEXT    NOT NULL,
    description     TEXT,
    max_votes       INTEGER NOT NULL DEFAULT 1,
    display_order   INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_positions_election ON positions(election_id);

-- ============================================================
-- 4. CANDIDATES
-- ============================================================
CREATE TABLE IF NOT EXISTS candidates (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    election_id     INTEGER NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    position_id     INTEGER NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    full_name       TEXT    NOT NULL,
    contestant_code TEXT,
    photo_url       TEXT,
    portfolio       TEXT,
    display_order   INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(election_id, contestant_code)
);

CREATE INDEX IF NOT EXISTS idx_candidates_position ON candidates(position_id);
CREATE INDEX IF NOT EXISTS idx_candidates_election ON candidates(election_id);
CREATE INDEX IF NOT EXISTS idx_candidates_code ON candidates(contestant_code);

-- ============================================================
-- 5. STUDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id      TEXT    NOT NULL UNIQUE,
    pin             TEXT    NOT NULL,
    full_name       TEXT    NOT NULL,
    class_name      TEXT,
    hall            TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);

-- ============================================================
-- 6. VOTER CODES
-- ============================================================
CREATE TABLE IF NOT EXISTS voter_codes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    election_id     INTEGER NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
    code            TEXT    NOT NULL UNIQUE,
    student_name    TEXT,
    is_used         INTEGER NOT NULL DEFAULT 0,
    used_at         TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_voter_codes_election ON voter_codes(election_id);
CREATE INDEX IF NOT EXISTS idx_voter_codes_code ON voter_codes(code);

-- ============================================================
-- 7. VOTE SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS vote_sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    election_id     INTEGER NOT NULL REFERENCES elections(id),
    voter_type      TEXT    NOT NULL,
    voter_ref       TEXT    NOT NULL,
    ip_address      TEXT,
    voted_at        TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(election_id, voter_ref)
);

CREATE INDEX IF NOT EXISTS idx_vote_sessions_election ON vote_sessions(election_id);

-- ============================================================
-- 8. VOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS votes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    election_id     INTEGER NOT NULL REFERENCES elections(id),
    position_id     INTEGER NOT NULL REFERENCES positions(id),
    candidate_id    INTEGER NOT NULL REFERENCES candidates(id),
    session_id      INTEGER REFERENCES vote_sessions(id),
    vote_count      INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_votes_election ON votes(election_id);
CREATE INDEX IF NOT EXISTS idx_votes_position ON votes(position_id);
CREATE INDEX IF NOT EXISTS idx_votes_candidate ON votes(candidate_id);

-- ============================================================
-- 9. PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    election_id     INTEGER NOT NULL REFERENCES elections(id),
    candidate_id    INTEGER NOT NULL REFERENCES candidates(id),
    position_id     INTEGER NOT NULL REFERENCES positions(id),
    voter_name      TEXT,
    voter_phone     TEXT,
    voter_email     TEXT,
    amount          REAL    NOT NULL,
    vote_count      INTEGER NOT NULL,
    provider        TEXT,
    payment_method  TEXT    NOT NULL,
    paystack_ref    TEXT    UNIQUE,
    status          TEXT    NOT NULL DEFAULT 'pending',
    approved_by     INTEGER REFERENCES admins(id),
    approved_at     TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payments_election ON payments(election_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_ref ON payments(paystack_ref);

-- ============================================================
-- 10. SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
    key             TEXT    PRIMARY KEY,
    value           TEXT    NOT NULL,
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO settings (key, value) VALUES ('app_name', 'School Voting System');
INSERT OR IGNORE INTO settings (key, value) VALUES ('default_currency', 'GHS');

-- ============================================================
-- 11. AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id    INTEGER REFERENCES admins(id),
    action      TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id   INTEGER,
    details     TEXT,
    ip_address  TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================
-- 12. VOTE RECEIPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS vote_receipts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  INTEGER NOT NULL REFERENCES vote_sessions(id),
    election_id INTEGER NOT NULL REFERENCES elections(id),
    receipt_hash TEXT NOT NULL UNIQUE,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_vote_receipts_hash ON vote_receipts(receipt_hash);

-- ============================================================
-- 13. ELECTION TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS election_templates (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT,
    config      TEXT NOT NULL,
    created_by  INTEGER NOT NULL REFERENCES admins(id),
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- 14. USSD SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS ussd_sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      TEXT NOT NULL UNIQUE,
    phone_number    TEXT NOT NULL,
    service_code    TEXT,
    election_id     INTEGER REFERENCES elections(id),
    voter_ref       TEXT,
    current_step    TEXT NOT NULL DEFAULT 'welcome',
    selections      TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ussd_sessions_session ON ussd_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_ussd_sessions_phone ON ussd_sessions(phone_number);
