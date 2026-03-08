#!/usr/bin/env node

// Claude Code hook script — reads stdin JSON, adds cwd/timestamp/event type, POSTs to session monitor server.
// Usage: node send-event.js <hook_event>
// Receives hook input via stdin, echoes it back to stdout (required by Claude Code).
// Never blocks Claude Code — exits 0 even on errors.

const MONITOR_URL = 'http://localhost:8111/api/sessions/events';
const hookEvent = process.argv[2] || 'Unknown';

let inputData = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { inputData += chunk; });

process.stdin.on('end', async () => {
  // Always echo stdin back to stdout (Claude Code requires this)
  process.stdout.write(inputData);

  let stdinJson = {};
  try {
    stdinJson = JSON.parse(inputData);
  } catch {
    // stdin might be empty or invalid JSON — that's fine
  }

  const payload = {
    hook_event: hookEvent,
    cwd: process.cwd(),
    timestamp: new Date().toISOString(),
    stdin_data: stdinJson
  };

  try {
    await fetch(MONITOR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000)
    });
  } catch {
    // Server might be down — fail silently, never block Claude Code
  }

  process.exit(0);
});

// Handle case where stdin is already closed (no piped input)
if (process.stdin.isTTY) {
  process.exit(0);
}
