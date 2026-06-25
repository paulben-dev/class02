// Minimal Express API for Vercel serverless deployment
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => res.json({ success: true, dirname: typeof __dirname !== 'undefined' ? __dirname : 'undefined' }));

// Test loading one route statically
try {
  const authRouter = require('../server/routes/auth');
  app.use('/api/auth', authRouter);
} catch (e) {
  app.get('/api/debug', (req, res) => res.json({ error: e.message, code: e.code }));
}

module.exports = app;
