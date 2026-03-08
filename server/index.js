const express = require('express');
const cors = require('cors');
const { initDb } = require('./db/migrations');
const eventsRoutes = require('./routes/events');
const sessionsRoutes = require('./routes/sessions');
const projectsRoutes = require('./routes/projects');
const overridesRoutes = require('./routes/overrides');
const config = require('./config');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// API routes
app.use('/api/sessions/events', eventsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/sessions', overridesRoutes);
app.use('/api/sessions', sessionsRoutes);

// Initialize database
initDb();

app.listen(config.PORT, () => {
  console.log(`Session Monitor running on http://localhost:${config.PORT}`);
});
