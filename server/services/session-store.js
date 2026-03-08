const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');

let db;

function getDb() {
  if (!db) {
    const dir = path.dirname(config.DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(config.DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

function createSession({ id, cwd, model, projectId, projectName, projectMatchType, startedAt }) {
  const d = getDb();
  d.prepare(`
    INSERT INTO sessions (id, cwd, model, project_id, project_name, project_match_type, started_at, status, last_event_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
    ON CONFLICT(id) DO UPDATE SET
      last_event_at = excluded.last_event_at,
      model = COALESCE(excluded.model, sessions.model),
      status = 'active'
  `).run(id, cwd, model, projectId, projectName, projectMatchType, startedAt, startedAt);
}

function endSession(sessionId, { endedAt }) {
  const d = getDb();
  d.prepare(`
    UPDATE sessions SET status = 'ended', ended_at = ?, last_event_at = ?
    WHERE id = ?
  `).run(endedAt, endedAt, sessionId);
}

function endActiveSessionsForCwd(cwd, { endedAt, exceptId }) {
  const d = getDb();
  d.prepare(`
    UPDATE sessions SET status = 'ended', ended_at = ?
    WHERE cwd = ? AND status = 'active' AND id != ?
  `).run(endedAt, cwd, exceptId);
}

function addEvent(sessionId, { eventType, toolName, timestamp, payload }) {
  const d = getDb();

  // Ensure session exists (create stub if event arrives before SessionStart)
  d.prepare(`
    INSERT INTO sessions (id, cwd, status, started_at, last_event_at)
    VALUES (?, '', 'active', ?, ?)
    ON CONFLICT(id) DO UPDATE SET last_event_at = ?
  `).run(sessionId, timestamp, timestamp, timestamp);

  d.prepare(`
    INSERT INTO events (session_id, event_type, tool_name, timestamp, payload)
    VALUES (?, ?, ?, ?, ?)
  `).run(sessionId, eventType, toolName, timestamp, payload);
}

function getActiveSessionForCwd(cwd) {
  return getDb().prepare(
    'SELECT * FROM sessions WHERE cwd = ? AND status = ? ORDER BY last_event_at DESC LIMIT 1'
  ).get(cwd, 'active');
}

function listSessions({ status, limit }) {
  const d = getDb();
  let query = 'SELECT * FROM sessions';
  const params = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY last_event_at DESC LIMIT ?';
  params.push(limit || 50);

  return d.prepare(query).all(...params);
}

function getSession(id) {
  return getDb().prepare('SELECT * FROM sessions WHERE id = ?').get(id);
}

function getSessionEvents(sessionId) {
  return getDb().prepare(
    'SELECT * FROM events WHERE session_id = ? ORDER BY timestamp ASC'
  ).all(sessionId);
}

function getProjectSessions(projectId) {
  return getDb().prepare(
    'SELECT * FROM sessions WHERE project_id = ? ORDER BY last_event_at DESC LIMIT 50'
  ).all(projectId);
}

function updateSessionProject(sessionId, { projectId, projectName, projectMatchType }) {
  getDb().prepare(`
    UPDATE sessions SET project_id = ?, project_name = ?, project_match_type = ?
    WHERE id = ?
  `).run(projectId, projectName, projectMatchType, sessionId);
}

module.exports = {
  createSession,
  endSession,
  endActiveSessionsForCwd,
  addEvent,
  getActiveSessionForCwd,
  listSessions,
  getSession,
  getSessionEvents,
  getProjectSessions,
  updateSessionProject
};
