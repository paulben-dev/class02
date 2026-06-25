// Self-contained Express API for Vercel serverless deployment
// Explicit top-level requires so Vercel's bundler can statically detect all dependencies
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcryptjs = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
const mysql2 = require('mysql2/promise');
try { require('dotenv').config(); } catch (e) {}
try { require('multer'); } catch (e) {}

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Load routes from ../server/routes/
const serverDir = path.join(__dirname, '..', 'server');

app.use('/api/auth', require(path.join(serverDir, 'routes/auth')));
app.use('/api/classes', require(path.join(serverDir, 'routes/classes')));
app.use('/api/homework', require(path.join(serverDir, 'routes/homework')));
app.use('/api/questions', require(path.join(serverDir, 'routes/questions')));
app.use('/api/submissions', require(path.join(serverDir, 'routes/submissions')));
app.use('/api/teacher', require(path.join(serverDir, 'routes/teacher')));
app.use('/api/parent', require(path.join(serverDir, 'routes/parent')));
app.post('/api/cron/grading', require(path.join(serverDir, 'routes/grading-cron')));

app.get('/api/health', (req, res) => res.json({ success: true }));

module.exports = app;
