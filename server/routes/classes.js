const express = require('express');
const pool = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// List classes — teachers see their own classes, parents see their child's class
router.get('/', authMiddleware, async (req, res) => {
  try {
    let sql, params;
    if (req.user.role === 'teacher') {
      sql = 'SELECT id, name, grade_level FROM classes WHERE teacher_id = ? ORDER BY grade_level, name';
      params = [req.user.id];
    } else if (req.user.role === 'parent') {
      // Parents see classes their children are in
      sql = 'SELECT DISTINCT c.id, c.name, c.grade_level FROM classes c JOIN students s ON c.id = s.class_id WHERE s.parent_id = ? ORDER BY c.grade_level, c.name';
      params = [req.user.id];
    } else {
      sql = 'SELECT id, name, grade_level FROM classes ORDER BY grade_level, name';
      params = [];
    }
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Get class students
router.get('/:id/students', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, student_number FROM students WHERE class_id = ? ORDER BY student_number',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
