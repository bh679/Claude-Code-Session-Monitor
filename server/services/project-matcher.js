const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('../config');

let cachedConsumers = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60000; // reload consumers.json every 60s

function loadConsumers() {
  const now = Date.now();
  if (cachedConsumers && now - cacheTime < CACHE_TTL_MS) {
    return cachedConsumers;
  }

  try {
    const raw = fs.readFileSync(config.CONSUMERS_PATH, 'utf8');
    cachedConsumers = JSON.parse(raw);
    cacheTime = now;
    return cachedConsumers;
  } catch (err) {
    console.error('Failed to load consumers.json:', err.message);
    return cachedConsumers || [];
  }
}

function expandHome(p) {
  if (p.startsWith('~/')) {
    return path.join(os.homedir(), p.slice(2));
  }
  return p;
}

function stripWorktreeSuffix(cwd) {
  // Strip /.claude/worktrees/<name> suffix
  const worktreePattern = /\/.claude\/worktrees\/[^/]+$/;
  return cwd.replace(worktreePattern, '');
}

function match(cwd) {
  if (!cwd) return null;

  const consumers = loadConsumers();
  const normalizedCwd = stripWorktreeSuffix(cwd);

  // Build entries with expanded paths, sorted by path length descending (most specific first)
  const entries = consumers
    .map(c => ({
      ...c,
      expandedPath: expandHome(c.local_path)
    }))
    .sort((a, b) => b.expandedPath.length - a.expandedPath.length);

  // Exact or prefix match against expanded local paths
  for (const entry of entries) {
    if (normalizedCwd === entry.expandedPath || normalizedCwd.startsWith(entry.expandedPath + '/')) {
      return {
        repo: entry.repo,
        name: entry.project
      };
    }
  }

  // Fallback: match basename of cwd against project names (case-insensitive)
  const cwdBasename = path.basename(normalizedCwd).toLowerCase();
  const fallback = entries.find(e =>
    e.project.toLowerCase() === cwdBasename ||
    e.repo.split('/')[1].toLowerCase() === cwdBasename
  );

  if (fallback) {
    return {
      repo: fallback.repo,
      name: fallback.project
    };
  }

  return null;
}

module.exports = { match };
