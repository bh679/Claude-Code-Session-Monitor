const express = require('express');
const router = express.Router();
const sessionStore = require('../services/session-store');

// GET /api/projects/:id/sessions
// :id is the repo identifier, e.g. "bh679/chess-project" (URL-encoded)
router.get('/:id/sessions', (req, res) => {
  try {
    const projectId = decodeURIComponent(req.params.id);
    const sessions = sessionStore.getProjectSessions(projectId);
    res.json({ project_id: projectId, sessions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get project sessions', message: err.message });
  }
});

module.exports = router;
