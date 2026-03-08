#!/usr/bin/env node

// Removes Claude Code Session Monitor hooks from ~/.claude/settings.json.
// Preserves all other hooks and settings.

const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = path.join(process.env.HOME, '.claude', 'settings.json');

function uninstall() {
  if (!fs.existsSync(SETTINGS_PATH)) {
    console.log('No settings.json found — nothing to uninstall.');
    return;
  }

  const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));

  if (!settings.hooks) {
    console.log('No hooks configured — nothing to uninstall.');
    return;
  }

  let removed = 0;

  for (const event of Object.keys(settings.hooks)) {
    const before = settings.hooks[event].length;
    settings.hooks[event] = settings.hooks[event].filter(hookGroup => {
      if (!hookGroup.hooks) return true;
      // Remove hook groups that contain our send-event.js
      const isOurs = hookGroup.hooks.some(h =>
        h.command && h.command.includes('send-event.js')
      );
      return !isOurs;
    });
    removed += before - settings.hooks[event].length;

    // Clean up empty arrays
    if (settings.hooks[event].length === 0) {
      delete settings.hooks[event];
    }
  }

  // Clean up empty hooks object
  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));

  if (removed > 0) {
    console.log(`Removed ${removed} hook(s) from ${SETTINGS_PATH}`);
  } else {
    console.log('No session monitor hooks found — nothing to remove.');
  }
}

uninstall();
