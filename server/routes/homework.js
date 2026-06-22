const express = require('express');
const pool = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// List homework — teachers only see their own classes by default
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { class_id, status, type, teacher_id, all } = req.query;
    let sql = 'SELECT h.*, c.name as class_name, c.grade_level, u.display_name as teacher_name, u.subject as teacher_subject FROM homework h JOIN classes c ON h.class_id = c.id JOIN users u ON h.teacher_id = u.id WHERE 1=1';
    const params = [];

    // Teachers only see their own homework by default (unless all=1 is passed)
    if (req.user.role === 'teacher' && all !== '1') {
      sql += ' AND h.teacher_id = ?';
      params.push(req.user.id);
    }
    if (teacher_id) { sql += ' AND h.teacher_id = ?'; params.push(parseInt(teacher_id)); }
    if (class_id) { sql += ' AND h.class_id = ?'; params.push(parseInt(class_id)); }
    if (status) { sql += ' AND h.status = ?'; params.push(status); }
    if (type) { sql += ' AND h.type = ?'; params.push(type); }
    sql += ' ORDER BY h.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Get homework detail with questions
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [[hw]] = await pool.query(
      'SELECT h.*, c.name as class_name FROM homework h JOIN classes c ON h.class_id = c.id WHERE h.id = ?',
      [req.params.id]
    );
    if (!hw) return res.status(404).json({ success: false, error: '作业不存在' });
    const [questions] = await pool.query(
      'SELECT q.*, hq.sort_order FROM questions q JOIN homework_questions hq ON q.id = hq.question_id WHERE hq.homework_id = ? ORDER BY hq.sort_order',
      [req.params.id]
    );
    res.json({ success: true, data: { ...hw, questions } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Create homework
router.post('/', authMiddleware, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { title, subject_id, class_id, deadline, type, question_ids } = req.body;
    if (!title || !subject_id || !class_id || !deadline || !question_ids || !question_ids.length) {
      return res.status(400).json({ success: false, error: '缺少必填字段' });
    }
    // Create homework
    const [result] = await conn.query(
      'INSERT INTO homework (title, subject_id, teacher_id, class_id, deadline, type) VALUES (?, ?, ?, ?, ?, ?)',
      [title, subject_id, req.user.id, class_id, deadline, type || 'school']
    );
    const hwId = result.insertId;
    // Attach questions
    for (let i = 0; i < question_ids.length; i++) {
      await conn.query(
        'INSERT INTO homework_questions (homework_id, question_id, sort_order) VALUES (?, ?, ?)',
        [hwId, question_ids[i], i + 1]
      );
    }
    // Create submissions for all students in class
    const [students] = await conn.query('SELECT id FROM students WHERE class_id = ?', [class_id]);
    for (const s of students) {
      await conn.query(
        'INSERT INTO homework_submissions (homework_id, student_id, status) VALUES (?, ?, ?)',
        [hwId, s.id, 'pending']
      );
    }
    await conn.commit();
    res.json({ success: true, data: { id: hwId } });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ success: false, error: e.message });
  } finally {
    conn.release();
  }
});

// Update homework
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, subject_id, class_id, deadline, type, status } = req.body;
    if (!title || !subject_id || !class_id || !deadline) {
      return res.status(400).json({ success: false, error: '缺少必填字段' });
    }
    await pool.query(
      'UPDATE homework SET title=?, subject_id=?, class_id=?, deadline=?, type=?, status=? WHERE id=?',
      [title, subject_id, class_id, deadline, type || 'school', status || 'active', req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Delete homework
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM homework WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Get homework stats
router.get('/:id/stats', authMiddleware, async (req, res) => {
  try {
    const [[hw]] = await pool.query('SELECT * FROM homework WHERE id = ?', [req.params.id]);
    if (!hw) return res.status(404).json({ success: false, error: '作业不存在' });
    const [submissions] = await pool.query(
      'SELECT hs.*, s.name as student_name FROM homework_submissions hs JOIN students s ON hs.student_id = s.id WHERE hs.homework_id = ?',
      [req.params.id]
    );
    const graded = submissions.filter(s => s.status === 'graded');
    const avgScore = graded.length ? graded.reduce((sum, s) => sum + s.score, 0) / graded.length : 0;
    res.json({ success: true, data: {
      total: submissions.length,
      submitted: submissions.filter(s => s.status !== 'pending').length,
      graded: graded.length,
      pending: submissions.filter(s => s.status === 'pending').length,
      avgScore: Math.round(avgScore),
      submissions
    }});
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
