const express = require('express');
const router = express.Router();
const sessionStore = require('../services/session-store');

// GET /api/sessions?status=active&limit=50
router.get('/', (req, res) => {
  try {
    const { status, limit } = req.query;
    const sessions = sessionStore.listSessions({
      status: status || null,
      limit: parseInt(limit, 10) || 50
    });
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list sessions', message: err.message });
  }
});

// GET /api/sessions/:id
router.get('/:id', (req, res) => {
  try {
    const session = sessionStore.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const events = sessionStore.getSessionEvents(req.params.id);
    res.json({ ...session, events });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get session', message: err.message });
  }
});

module.exports = router;
