try { require('dotenv').config(); } catch (e) { /* dotenv not available on Vercel */ }
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const homeworkRoutes = require('./routes/homework');
const questionRoutes = require('./routes/questions');
const submissionRoutes = require('./routes/submissions');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/classes', require('./routes/classes'));
app.use('/api/homework', homeworkRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/teacher', require('./routes/teacher'));
app.use('/api/parent', require('./routes/parent'));
app.post('/api/cron/grading', require('./routes/grading-cron'));

app.get('/api/health', (req, res) => res.json({ success: true }));

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`API running on :${PORT}`));
}
module.exports = app;
