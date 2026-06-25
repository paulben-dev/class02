// Self-contained Express API for Vercel serverless deployment
// All server code is under api/ so Vercel bundles node_modules for all route files
const express = require('express');
const cors = require('cors');
try { require('dotenv').config(); } catch (e) {}
try { require('multer'); } catch (e) {}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => res.json({ success: true }));

// Routes (all under api/server/ so Vercel bundler can resolve their requires)
const authRouter = require('./server/routes/auth');
const classesRouter = require('./server/routes/classes');
const homeworkRouter = require('./server/routes/homework');
const questionsRouter = require('./server/routes/questions');
const submissionsRouter = require('./server/routes/submissions');
const teacherRouter = require('./server/routes/teacher');
const parentRouter = require('./server/routes/parent');
const gradingCronRouter = require('./server/routes/grading-cron');

app.use('/api/auth', authRouter);
app.use('/api/classes', classesRouter);
app.use('/api/homework', homeworkRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/teacher', teacherRouter);
app.use('/api/parent', parentRouter);
app.post('/api/cron/grading', gradingCronRouter);

module.exports = app;
