const path = require('path');

module.exports = {
  PORT: process.env.SESSION_MONITOR_PORT || 8111,
  DB_PATH: path.join(__dirname, '..', 'data', 'sessions.db'),
  CONSUMERS_PATH: path.join(__dirname, '..', 'consumers.json'),
  PROJECTS_DIR: process.env.PROJECTS_DIR
    || path.join(process.env.HOME, 'Projects')
};
