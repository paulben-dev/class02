const express = require('express');
const pool = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// List classes — teachers see their own classes, parents see their child's class
router.get('/', authMiddleware, async (req, res) => {
  try {
    let sql, params;
    if (req.user.role === 'teacher') {
      if (req.query.all === '1') {
        // Show all classes (for settings page class picker)
        sql = 'SELECT c.id, c.name, c.grade_level, s.name as school_name, (SELECT 1 FROM teacher_classes tc WHERE tc.teacher_id = ? AND tc.class_id = c.id) IS NOT NULL as is_assigned FROM classes c LEFT JOIN schools s ON c.school_id = s.id ORDER BY c.grade_level, c.name';
        params = [req.user.id];
      } else {
        // Only show classes the teacher is assigned to
        sql = 'SELECT c.id, c.name, c.grade_level, s.name as school_name FROM classes c JOIN teacher_classes tc ON c.id = tc.class_id LEFT JOIN schools s ON c.school_id = s.id WHERE tc.teacher_id = ? ORDER BY c.grade_level, c.name';
        params = [req.user.id];
      }
    } else if (req.user.role === 'parent') {
      // Parents see classes their children are in
      sql = 'SELECT DISTINCT c.id, c.name, c.grade_level, s.name as school_name FROM classes c JOIN students st ON c.id = st.class_id LEFT JOIN schools s ON c.school_id = s.id WHERE st.parent_id = ? ORDER BY c.grade_level, c.name';
      params = [req.user.id];
    } else {
      sql = 'SELECT c.id, c.name, c.grade_level, s.name as school_name FROM classes c LEFT JOIN schools s ON c.school_id = s.id ORDER BY c.grade_level, c.name';
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
