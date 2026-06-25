const express = require('express');
const bcrypt = require('bcryptjs');
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

// WeChat-style auto-login (simulated wx.login)
router.post('/wechat', async (req, res) => {
  try {
    const { code, demo_parent } = req.body;
    if (!code) return res.status(400).json({ success: false, error: '缺少微信授权码' });

    // Demo mode: use a specific pre-seeded parent (used by parent app demo login)
    if (demo_parent) {
      const [rows] = await pool.execute('SELECT * FROM users WHERE username = ? AND role = ?', [demo_parent, 'parent']);
      if (rows.length) {
        const user = rows[0];
        const payload = { id: user.id, username: user.username, role: user.role, display_name: user.display_name, subject: user.subject };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ success: true, data: { token, user: payload } });
      }
      return res.status(404).json({ success: false, error: '演示账号不存在' });
    }

    // Normal WeChat flow: generate a stable openid from the code
    const wxOpenId = 'wx_' + require('crypto').createHash('md5').update(code).digest('hex').slice(0, 10);

    // Check if this wechat user already has an account
    const [existing] = await pool.execute('SELECT * FROM users WHERE username = ?', [wxOpenId]);
    let user;

    if (existing.length) {
      user = existing[0];
    } else {
      // Auto-register: create parent account, attempt to link to an unlinked student
      const hash = await bcrypt.hash('wx_' + code, 10);
      const [result] = await pool.execute(
        'INSERT INTO users (username, password_hash, role, display_name, subject) VALUES (?, ?, ?, ?, ?)',
        [wxOpenId, hash, 'parent', '微信家长', null]
      );

      // Try to link an unlinked student (first-come-first-served for demo)
      const [unlinked] = await pool.execute('SELECT id FROM students WHERE parent_id IS NULL LIMIT 1');
      if (unlinked.length) {
        await pool.execute('UPDATE students SET parent_id = ? WHERE id = ?', [result.insertId, unlinked[0].id]);
      }

      user = { id: result.insertId, username: wxOpenId, role: 'parent', display_name: '微信家长', subject: null };
    }

    const payload = { id: user.id, username: user.username, role: user.role, display_name: user.display_name, subject: user.subject };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, data: { token, user: payload } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
