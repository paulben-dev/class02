// Self-contained Express API for Vercel serverless deployment
const express = require('express');
const cors = require('cors');
const path = require('path');
try { require('dotenv').config(); } catch (e) {}
try { require('multer'); } catch (e) {}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => res.json({ success: true }));

// Static requires from ../server/routes (included via vercel.json includeFiles)
const serverDir = path.join(__dirname, '..', 'server', 'routes');
app.use('/api/auth', require(path.join(serverDir, 'auth')));
app.use('/api/classes', require(path.join(serverDir, 'classes')));
app.use('/api/homework', require(path.join(serverDir, 'homework')));
app.use('/api/questions', require(path.join(serverDir, 'questions')));
app.use('/api/submissions', require(path.join(serverDir, 'submissions')));
app.use('/api/teacher', require(path.join(serverDir, 'teacher')));
app.use('/api/parent', require(path.join(serverDir, 'parent')));
app.post('/api/cron/grading', require(path.join(serverDir, 'grading-cron')));

module.exports = app;
