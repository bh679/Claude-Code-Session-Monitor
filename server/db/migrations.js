const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const config = require('../config');

function initDb() {
  const dir = path.dirname(config.DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(config.DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      cwd TEXT NOT NULL DEFAULT '',
      model TEXT,
      project_id TEXT,
      project_name TEXT,
      project_match_type TEXT,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      status TEXT DEFAULT 'active',
      last_event_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      tool_name TEXT,
      timestamp TEXT NOT NULL,
      payload TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
  `);

  db.close();
}

module.exports = { initDb };
