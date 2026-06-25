const express = require('express');
const pool = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// List submissions for a homework
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { homework_id } = req.query;
    if (!homework_id) return res.status(400).json({ success: false, error: '缺少homework_id' });
    const [rows] = await pool.query(
      'SELECT hs.*, s.name as student_name, s.student_number FROM homework_submissions hs JOIN students s ON hs.student_id = s.id WHERE hs.homework_id = ? ORDER BY s.student_number',
      [parseInt(homework_id)]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Get single submission with questions
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [[sub]] = await pool.query(
      'SELECT hs.*, s.name as student_name, s.student_number, h.title as homework_title, h.subject_id FROM homework_submissions hs JOIN students s ON hs.student_id = s.id JOIN homework h ON hs.homework_id = h.id WHERE hs.id = ?',
      [req.params.id]
    );
    if (!sub) return res.status(404).json({ success: false, error: '提交不存在' });
    const [questions] = await pool.query(
      'SELECT q.*, hq.sort_order FROM questions q JOIN homework_questions hq ON q.id = hq.question_id WHERE hq.homework_id = ? ORDER BY hq.sort_order',
      [sub.homework_id]
    );
    res.json({ success: true, data: { ...sub, questions } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Grade a submission
router.post('/:id/grade', authMiddleware, async (req, res) => {
  try {
    const { score, answers } = req.body;
    if (score === undefined || !answers) {
      return res.status(400).json({ success: false, error: '缺少score或answers' });
    }
    await pool.query(
      'UPDATE homework_submissions SET score = ?, answers = ?, status = ?, graded_at = NOW() WHERE id = ?',
      [score, JSON.stringify(answers), 'graded', req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
