const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const sessionStore = require('../services/session-store');
const projectMatcher = require('../services/project-matcher');

// POST /api/sessions/events
// Receives hook events from Claude Code hooks
router.post('/', (req, res) => {
  try {
    const event = req.body;
    const { hook_event, cwd, timestamp } = event;
    const stdinData = event.stdin_data || {};
    const ts = timestamp || new Date().toISOString();

    if (!hook_event) {
      return res.status(400).json({ error: 'Missing hook_event' });
    }

    switch (hook_event) {
      case 'SessionStart': {
        const sessionId = crypto.randomUUID();
        const matchedProject = projectMatcher.match(cwd);

        // Close any previous active sessions for this cwd
        sessionStore.endActiveSessionsForCwd(cwd, {
          endedAt: ts,
          exceptId: sessionId
        });

        sessionStore.createSession({
          id: sessionId,
          cwd: cwd || '',
          model: stdinData.model || null,
          projectId: matchedProject?.repo || null,
          projectName: matchedProject?.name || null,
          projectMatchType: matchedProject ? 'auto' : null,
          startedAt: ts
        });

        return res.status(200).json({ received: true, session_id: sessionId });
      }

      case 'PostToolUse': {
        const activeSession = sessionStore.getActiveSessionForCwd(cwd);
        if (!activeSession) {
          // No active session for this cwd — create a stub
          const sessionId = crypto.randomUUID();
          const matchedProject = projectMatcher.match(cwd);

          sessionStore.createSession({
            id: sessionId,
            cwd: cwd || '',
            model: null,
            projectId: matchedProject?.repo || null,
            projectName: matchedProject?.name || null,
            projectMatchType: matchedProject ? 'auto' : null,
            startedAt: ts
          });

          sessionStore.addEvent(sessionId, {
            eventType: 'PostToolUse',
            toolName: stdinData.tool_name || null,
            timestamp: ts,
            payload: JSON.stringify(summarizeToolInput(stdinData))
          });

          return res.status(200).json({ received: true, session_id: sessionId });
        }

        sessionStore.addEvent(activeSession.id, {
          eventType: 'PostToolUse',
          toolName: stdinData.tool_name || null,
          timestamp: ts,
          payload: JSON.stringify(summarizeToolInput(stdinData))
        });

        return res.status(200).json({ received: true, session_id: activeSession.id });
      }

      case 'Stop': {
        const activeSession = sessionStore.getActiveSessionForCwd(cwd);
        if (activeSession) {
          sessionStore.addEvent(activeSession.id, {
            eventType: 'Stop',
            toolName: null,
            timestamp: ts,
            payload: JSON.stringify({ stop: true })
          });
        }

        return res.status(200).json({ received: true });
      }

      default: {
        // Store any unrecognized event type
        const activeSession = sessionStore.getActiveSessionForCwd(cwd);
        if (activeSession) {
          sessionStore.addEvent(activeSession.id, {
            eventType: hook_event,
            toolName: null,
            timestamp: ts,
            payload: JSON.stringify({ raw_event: hook_event })
          });
        }

        return res.status(200).json({ received: true });
      }
    }
  } catch (err) {
    console.error('Failed to process event:', err.message);
    return res.status(500).json({ error: 'Failed to process event' });
  }
});

function summarizeToolInput(stdinData) {
  const summary = {};
  if (stdinData.tool_name) summary.tool_name = stdinData.tool_name;

  const input = stdinData.tool_input;
  if (!input) return summary;

  // Keep useful metadata, strip large content
  if (input.file_path) summary.file_path = input.file_path;
  if (input.command) summary.command = String(input.command).slice(0, 200);
  if (input.pattern) summary.pattern = input.pattern;
  if (input.query) summary.query = String(input.query).slice(0, 200);
  if (input.url) summary.url = input.url;
  if (input.description) summary.description = String(input.description).slice(0, 200);

  return summary;
}

module.exports = router;
