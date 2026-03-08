#!/usr/bin/env node

// Installs Claude Code Session Monitor hooks into ~/.claude/settings.json.
// Preserves all existing settings and hooks. Avoids duplicate installation.

const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = path.join(process.env.HOME, '.claude', 'settings.json');
const SEND_SCRIPT = path.join(__dirname, 'send-event.js');

const HOOKS_CONFIG = {
  SessionStart: [{
    matcher: 'startup|resume',
    hooks: [{
      type: 'command',
      command: `node "${SEND_SCRIPT}" SessionStart`,
      timeout: 5
    }]
  }],
  PostToolUse: [{
    matcher: 'Write|Edit|Bash',
    hooks: [{
      type: 'command',
      command: `node "${SEND_SCRIPT}" PostToolUse`,
      timeout: 5
    }]
  }],
  Stop: [{
    hooks: [{
      type: 'command',
      command: `node "${SEND_SCRIPT}" Stop`,
      timeout: 5
    }]
  }]
};

function install() {
  let settings = {};
  if (fs.existsSync(SETTINGS_PATH)) {
    settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  }

  if (!settings.hooks) {
    settings.hooks = {};
  }

  let installed = 0;

  for (const [event, hookGroups] of Object.entries(HOOKS_CONFIG)) {
    if (!settings.hooks[event]) {
      settings.hooks[event] = [];
    }

    for (const hookGroup of hookGroups) {
      // Check if already installed (by matching our send-event.js path)
      const alreadyInstalled = settings.hooks[event].some(existing =>
        existing.hooks && existing.hooks.some(h =>
          h.command && h.command.includes('send-event.js')
        )
      );

      if (!alreadyInstalled) {
        settings.hooks[event].push(hookGroup);
        installed++;
      }
    }
  }

  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));

  if (installed > 0) {
    console.log(`Installed ${installed} hook(s) in ${SETTINGS_PATH}`);
  } else {
    console.log('Hooks already installed — no changes made.');
  }
}

install();
