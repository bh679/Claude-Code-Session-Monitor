# Claude Code Session Monitor

Real-time session monitor that replaces Claude-Sentinel. Uses Claude Code hooks to capture session events instantly and push them to a standalone Express server.

## Architecture

```
Claude Code Hooks (stdin JSON → POST)
    ↓
Session Monitor Server (port 8111, SQLite)
    ↓
CMD Dashboard (port 8080, Sessions tab)
```

## Key Commands

- `npm start` — Start the session monitor server on port 8111
- `npm run install-hooks` — Install hooks into ~/.claude/settings.json
- `npm run uninstall-hooks` — Remove hooks

## Project Structure

- `server/` — Express server with SQLite storage
- `hooks/` — Hook scripts and installer
- `consumers.json` — Project list with local paths for session-to-project matching
- `data/` — SQLite database (gitignored)

## API

- `POST /api/sessions/events` — Receive hook events
- `GET /api/sessions` — List sessions (?status=active&limit=50)
- `GET /api/sessions/:id` — Session detail with events
- `GET /api/projects/:id/sessions` — Sessions for a project
- `POST /api/sessions/:id/project` — Manual project override

## Version Format

V.MM.PPPP (matches CMD dashboard convention)
