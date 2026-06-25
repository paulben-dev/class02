// Self-contained Express API for Vercel serverless deployment
const express = require('express');
const cors = require('cors');
try { require('dotenv').config(); } catch (e) {}
try { require('multer'); } catch (e) {}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check first
app.get('/api/health', (req, res) => res.json({ success: true }));

// Load routes with error isolation - each route loaded independently
// Using path.resolve so Vercel bundler can follow the static require chain
const path = require('path');
const serverDir = path.resolve(__dirname, '..', 'server', 'routes');

function loadRoute(name) {
  try {
    return require(path.join(serverDir, name));
  } catch (e) {
    console.error('Failed to load route ' + name + ':', e.message);
    const { Router } = require('express');
    const r = Router();
    r.all('*', (req, res) => res.status(500).json({ error: 'Route unavailable: ' + name }));
    return r;
  }
}

app.use('/api/auth', loadRoute('auth'));
app.use('/api/classes', loadRoute('classes'));
app.use('/api/homework', loadRoute('homework'));
app.use('/api/questions', loadRoute('questions'));
app.use('/api/submissions', loadRoute('submissions'));
app.use('/api/teacher', loadRoute('teacher'));
app.use('/api/parent', loadRoute('parent'));
app.post('/api/cron/grading', loadRoute('grading-cron'));

module.exports = app;
