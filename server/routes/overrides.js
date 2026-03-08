const express = require('express');
const router = express.Router();
const sessionStore = require('../services/session-store');

// POST /api/sessions/:id/project
// Body: { project_id: "bh679/chess-project", project_name: "Chess" }
router.post('/:id/project', (req, res) => {
  try {
    const { project_id, project_name } = req.body;
    if (!project_id) {
      return res.status(400).json({ error: 'project_id required' });
    }

    const session = sessionStore.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    sessionStore.updateSessionProject(req.params.id, {
      projectId: project_id,
      projectName: project_name || project_id.split('/')[1],
      projectMatchType: 'manual'
    });

    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project', message: err.message });
  }
});

module.exports = router;
