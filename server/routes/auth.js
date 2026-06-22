const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');
const { JWT_SECRET } = require('../middleware/auth');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, role, display_name, subject } = req.body;
    if (!username || !password || !role || !display_name) {
      return res.status(400).json({ success: false, error: '缺少必填字段' });
    }
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (username, password_hash, role, display_name, subject) VALUES (?, ?, ?, ?, ?)',
      [username, hash, role, display_name, subject || null]
    );
    const user = { id: result.insertId, username, role, display_name, subject };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, data: { token, user } });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: '用户名已存在' });
    }
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (!rows.length) return res.status(401).json({ success: false, error: '用户名或密码错误' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ success: false, error: '用户名或密码错误' });
    const payload = { id: user.id, username: user.username, role: user.role, display_name: user.display_name, subject: user.subject };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, data: { token, user: payload } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
