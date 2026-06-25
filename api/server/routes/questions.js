const express = require('express');
const pool = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// List/search questions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { subject, kp, difficulty, keyword, page = 1, limit = 20 } = req.query;
    let sql = 'SELECT * FROM questions WHERE 1=1';
    const params = [];
    if (subject) { sql += ' AND subject_id = ?'; params.push(subject); }
    if (kp) { sql += ' AND knowledge_point LIKE ?'; params.push(`%${kp}%`); }
    if (difficulty) { sql += ' AND difficulty = ?'; params.push(parseInt(difficulty)); }
    if (keyword) { sql += ' AND stem LIKE ?'; params.push(`%${keyword}%`); }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    const [rows] = await pool.query(sql, params);
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM questions WHERE 1=1' +
      (subject ? ' AND subject_id = ?' : '') +
      (kp ? ' AND knowledge_point LIKE ?' : '') +
      (difficulty ? ' AND difficulty = ?' : '') +
      (keyword ? ' AND stem LIKE ?' : ''),
      params.slice(0, -2)
    );
    res.json({ success: true, data: { questions: rows, total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Create question
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { subject_id, type, stem, answer, options, knowledge_point, difficulty, grade_level } = req.body;
    if (!subject_id || !type || !stem || !answer || !knowledge_point || !grade_level) {
      return res.status(400).json({ success: false, error: '缺少必填字段' });
    }
    const [result] = await pool.query(
      'INSERT INTO questions (subject_id, type, stem, answer, options, knowledge_point, difficulty, grade_level, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [subject_id, type, stem, answer, options ? JSON.stringify(options) : null, knowledge_point, difficulty || 3, grade_level, req.user.id]
    );
    res.json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Update question
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { subject_id, type, stem, answer, options, knowledge_point, difficulty, grade_level } = req.body;
    await pool.query(
      'UPDATE questions SET subject_id=?, type=?, stem=?, answer=?, options=?, knowledge_point=?, difficulty=?, grade_level=? WHERE id=?',
      [subject_id, type, stem, answer, options ? JSON.stringify(options) : null, knowledge_point, difficulty, grade_level, req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Delete question
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM questions WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
