const express = require('express');
const pool = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Get teacher's assigned class IDs
router.get('/classes', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, error: '仅教师可访问' });
    }
    const [rows] = await pool.query(
      'SELECT class_id FROM teacher_classes WHERE teacher_id = ? ORDER BY class_id',
      [req.user.id]
    );
    res.json({ success: true, data: { class_ids: rows.map(r => r.class_id) } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Set teacher's assigned classes (replace all)
router.put('/classes', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, error: '仅教师可访问' });
    }
    const { class_ids } = req.body;
    if (!Array.isArray(class_ids)) {
      return res.status(400).json({ success: false, error: 'class_ids 必须是数组' });
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('DELETE FROM teacher_classes WHERE teacher_id = ?', [req.user.id]);
      if (class_ids.length > 0) {
        const values = class_ids.map(id => [req.user.id, id]);
        await conn.query('INSERT INTO teacher_classes (teacher_id, class_id) VALUES ?', [values]);
      }
      await conn.commit();
      res.json({ success: true, data: { class_ids } });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
