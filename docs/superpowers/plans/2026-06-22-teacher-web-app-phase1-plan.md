# Teacher Web App — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend API (Node/Express/MySQL) and teacher-facing React app covering homework assignment and grading — the two core business flows.

**Architecture:** REST API with JWT auth backed by MySQL. Teacher React SPA (Vite) consumes the API. Parent `index.html` stays untouched in Phase 1; integration comes in Phase 2.

**Tech Stack:** Node.js 22, Express 4, MySQL 8, bcrypt, jsonwebtoken, multer, React 18, Vite 5, React Router 6

## Global Constraints

- Zero-config for parent app: `index.html` remains a standalone single file, no build step
- Teacher app runs on `localhost:5173` (Vite dev), API on `localhost:3000`
- JWT tokens expire in 7 days, stored in localStorage
- All API responses use `{ success: boolean, data?: any, error?: string }`
- Database: MySQL with connection pool, schema in `server/db/schema.sql`
- Passwords hashed with bcrypt (10 rounds)
- File uploads to `server/uploads/` directory (multer)

---

### Task 1: Project scaffolding

**Files:**
- Create: `server/package.json`, `server/index.js`, `server/db/connection.js`, `server/middleware/auth.js`
- Create: `teacher/` via `npm create vite@latest`

**Interfaces:**
- Produces: `server/index.js` Express app on port 3000, `teacher/` React app on port 5173
- Produces: `server/db/connection.js` exports `pool` (mysql2/promise pool)

- [ ] **Step 1: Initialize server package**

```bash
mkdir -p server/db server/routes server/middleware server/uploads
cd server && npm init -y
```

- [ ] **Step 2: Install server dependencies**

```bash
cd server
npm install express mysql2 bcrypt jsonwebtoken multer cors dotenv
```

- [ ] **Step 3: Create `server/index.js`**

```js
require('dotenv').config();
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
app.use('/api/homework', homeworkRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/submissions', submissionRoutes);

app.get('/api/health', (req, res) => res.json({ success: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on :${PORT}`));
```

- [ ] **Step 4: Create `server/db/connection.js`**

```js
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'class2',
  waitForConnections: true,
  connectionLimit: 10,
});
module.exports = pool;
```

- [ ] **Step 5: Create `server/.env`**

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=class2
JWT_SECRET=class2-dev-secret-change-in-production
```

- [ ] **Step 6: Initialize teacher React app with Vite**

```bash
cd teacher && npm create vite@latest . -- --template react
npm install react-router-dom axios
```

- [ ] **Step 7: Verify both apps start**

```bash
# Terminal 1
cd server && node index.js
# Expected: "API running on :3000"

# Terminal 2
cd teacher && npm run dev
# Expected: Vite dev server on :5173
```

Test: `curl http://localhost:3000/api/health` → `{"success":true}`

- [ ] **Step 8: Commit**

```bash
git add server/ teacher/ .gitignore
git commit -m "scaffold: Node/Express backend + React/Vite teacher app"
```

---

### Task 2: MySQL database schema

**Files:**
- Create: `server/db/schema.sql`
- Create: `server/db/seed.sql`

**Interfaces:**
- Produces: 10 tables in `class2` database
- Produces: `server/db/seed.sql` with demo data (2 teachers, 1 class, 5 students, 20 questions)

- [ ] **Step 1: Create `server/db/schema.sql`**

```sql
CREATE DATABASE IF NOT EXISTS class2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE class2;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('teacher','parent') NOT NULL,
  display_name VARCHAR(50) NOT NULL,
  subject VARCHAR(20) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  grade_level VARCHAR(20) NOT NULL,
  teacher_id INT NOT NULL,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  class_id INT NOT NULL,
  parent_id INT NULL,
  student_number VARCHAR(20) NOT NULL,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id VARCHAR(20) NOT NULL,
  type ENUM('calc','word','choice','fill','translate','rewrite') NOT NULL,
  stem TEXT NOT NULL,
  answer TEXT NOT NULL,
  options JSON NULL,
  knowledge_point VARCHAR(100) NOT NULL,
  difficulty TINYINT DEFAULT 3,
  grade_level VARCHAR(20) NOT NULL,
  created_by INT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE homework (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  subject_id VARCHAR(20) NOT NULL,
  teacher_id INT NOT NULL,
  class_id INT NOT NULL,
  type ENUM('school','custom') DEFAULT 'school',
  deadline DATE NOT NULL,
  status ENUM('active','closed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE homework_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  homework_id INT NOT NULL,
  question_id INT NOT NULL,
  sort_order INT NOT NULL DEFAULT 1,
  FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE homework_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  homework_id INT NOT NULL,
  student_id INT NOT NULL,
  score INT NULL,
  answers JSON NULL,
  status ENUM('pending','submitted','graded') DEFAULT 'pending',
  submitted_at TIMESTAMP NULL,
  graded_at TIMESTAMP NULL,
  FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE knowledge_points (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  subject_id VARCHAR(20) NOT NULL,
  parent_id INT NULL,
  FOREIGN KEY (parent_id) REFERENCES knowledge_points(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE print_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL,
  meta JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  tier TINYINT DEFAULT 0,
  expires_at DATE NULL,
  auto_renew BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_homework_class ON homework(class_id);
CREATE INDEX idx_homework_teacher ON homework(teacher_id);
CREATE INDEX idx_submissions_homework ON homework_submissions(homework_id);
CREATE INDEX idx_submissions_student ON homework_submissions(student_id);
CREATE INDEX idx_questions_subject ON questions(subject_id);
CREATE INDEX idx_questions_kp ON questions(knowledge_point);
```

- [ ] **Step 2: Create `server/db/seed.sql`** with demo teachers, students, and questions

Demo data: 2 teacher accounts (王老师/math, 李老师/chinese), 1 class (三年级2班), 5 students, 20 sample questions across subjects.

- [ ] **Step 3: Run schema and seed**

```bash
mysql -u root < server/db/schema.sql
mysql -u root class2 < server/db/seed.sql
```

- [ ] **Step 4: Commit**

```bash
git add server/db/schema.sql server/db/seed.sql
git commit -m "feat: MySQL schema with 10 tables + seed data"
```

---

### Task 3: Auth system (register, login, JWT middleware)

**Files:**
- Create: `server/routes/auth.js`
- Modify: `server/middleware/auth.js`

**Interfaces:**
- Produces: `POST /api/auth/register` — body `{ username, password, role, display_name, subject? }` → `{ token, user }`
- Produces: `POST /api/auth/login` — body `{ username, password }` → `{ token, user }`
- Produces: `authMiddleware` — Express middleware, extracts `req.user` from JWT

- [ ] **Step 1: Create `server/middleware/auth.js`**

```js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'class2-dev-secret';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '未登录' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ success: false, error: '登录已过期' });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try { req.user = jwt.verify(header.slice(7), JWT_SECRET); } catch (e) {}
  }
  next();
}

module.exports = { authMiddleware, optionalAuth, JWT_SECRET };
```

- [ ] **Step 2: Create `server/routes/auth.js`**

```js
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
```

- [ ] **Step 3: Test auth endpoints**

```bash
# Start server: cd server && node index.js

# Register a teacher
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"wang","password":"123456","role":"teacher","display_name":"王老师","subject":"math"}'
# Expected: { success: true, data: { token: "...", user: {...} } }

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"wang","password":"123456"}'
# Expected: { success: true, data: { token: "...", user: {...} } }

# Test failed login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"wang","password":"wrong"}'
# Expected: { success: false, error: "用户名或密码错误" }
```

- [ ] **Step 4: Commit**

```bash
git add server/routes/auth.js server/middleware/auth.js
git commit -m "feat: JWT auth (register/login) with bcrypt"
```

---

### Task 4: Question bank API

**Files:**
- Create: `server/routes/questions.js`

**Interfaces:**
- Produces: `GET /api/questions?subject=&kp=&difficulty=&keyword=&page=1&limit=20`
- Produces: `POST /api/questions` — authenticated, body `{ subject_id, type, stem, answer, options?, knowledge_point, difficulty, grade_level }`
- Produces: `PUT /api/questions/:id`, `DELETE /api/questions/:id`

- [ ] **Step 1: Create `server/routes/questions.js`**

```js
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
    const [rows] = await pool.execute(sql, params);
    const [[{ total }]] = await pool.execute(
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
    const [result] = await pool.execute(
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
    await pool.execute(
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
    await pool.execute('DELETE FROM questions WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Test CRUD**

```bash
TOKEN="<token from login>"

# Create
curl -X POST http://localhost:3000/api/questions \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"subject_id":"math","type":"calc","stem":"3/4 + 1/2 = ?","answer":"5/4","knowledge_point":"分数加法","difficulty":2,"grade_level":"三年级"}'

# List
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/questions?subject=math&page=1"

# Search
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/questions?keyword=分数"

# Update
curl -X PUT http://localhost:3000/api/questions/1 \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"subject_id":"math","type":"calc","stem":"3/4 + 1/2 = ?","answer":"5/4","knowledge_point":"分数加法","difficulty":3,"grade_level":"三年级"}'

# Delete
curl -X DELETE http://localhost:3000/api/questions/1 -H "Authorization: Bearer $TOKEN"
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/questions.js
git commit -m "feat: question bank CRUD API"
```

---

### Task 5: Homework assignment API

**Files:**
- Create: `server/routes/homework.js`

**Interfaces:**
- Produces: `GET /api/homework?class_id=&status=&type=` → homework list
- Produces: `GET /api/homework/:id` → homework detail with questions
- Produces: `POST /api/homework` → create homework with `{ title, subject_id, class_id, deadline, type, question_ids: [1,2,3] }`, auto-creates `homework_submissions` for all students in class
- Produces: `PUT /api/homework/:id`, `DELETE /api/homework/:id`

- [ ] **Step 1: Create `server/routes/homework.js`**

```js
const express = require('express');
const pool = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// List homework
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { class_id, status, type } = req.query;
    let sql = 'SELECT h.*, c.name as class_name, u.display_name as teacher_name FROM homework h JOIN classes c ON h.class_id = c.id JOIN users u ON h.teacher_id = u.id WHERE 1=1';
    const params = [];
    if (class_id) { sql += ' AND h.class_id = ?'; params.push(parseInt(class_id)); }
    if (status) { sql += ' AND h.status = ?'; params.push(status); }
    if (type) { sql += ' AND h.type = ?'; params.push(type); }
    sql += ' ORDER BY h.created_at DESC';
    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Get homework detail with questions
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [[hw]] = await pool.execute(
      'SELECT h.*, c.name as class_name FROM homework h JOIN classes c ON h.class_id = c.id WHERE h.id = ?',
      [req.params.id]
    );
    if (!hw) return res.status(404).json({ success: false, error: '作业不存在' });
    const [questions] = await pool.execute(
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
    const [result] = await conn.execute(
      'INSERT INTO homework (title, subject_id, teacher_id, class_id, deadline, type) VALUES (?, ?, ?, ?, ?, ?)',
      [title, subject_id, req.user.id, class_id, deadline, type || 'school']
    );
    const hwId = result.insertId;
    // Attach questions
    for (let i = 0; i < question_ids.length; i++) {
      await conn.execute(
        'INSERT INTO homework_questions (homework_id, question_id, sort_order) VALUES (?, ?, ?)',
        [hwId, question_ids[i], i + 1]
      );
    }
    // Create submissions for all students in class
    const [students] = await conn.execute('SELECT id FROM students WHERE class_id = ?', [class_id]);
    for (const s of students) {
      await conn.execute(
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

// Delete homework
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.execute('DELETE FROM homework WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Get homework stats
router.get('/:id/stats', authMiddleware, async (req, res) => {
  try {
    const [[hw]] = await pool.execute('SELECT * FROM homework WHERE id = ?', [req.params.id]);
    if (!hw) return res.status(404).json({ success: false, error: '作业不存在' });
    const [submissions] = await pool.execute(
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
```

- [ ] **Step 2: Test homework creation**

```bash
TOKEN="<teacher token>"

# Create homework
curl -X POST http://localhost:3000/api/homework \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"分数加减法练习","subject_id":"math","class_id":1,"deadline":"2026-06-28","type":"school","question_ids":[1,2,3,4,5]}'

# List homework
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/homework?class_id=1"

# Get homework detail
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/homework/1"

# Get homework stats
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/homework/1/stats"
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/homework.js
git commit -m "feat: homework CRUD API with auto submission creation"
```

---

### Task 6: Grading & submissions API

**Files:**
- Create: `server/routes/submissions.js`

**Interfaces:**
- Produces: `GET /api/submissions?homework_id=` → list submissions
- Produces: `GET /api/submissions/:id` → single submission with answers
- Produces: `POST /api/submissions/:id/grade` → save grade `{ score, answers }`, updates submission status to 'graded'

- [ ] **Step 1: Create `server/routes/submissions.js`**

```js
const express = require('express');
const pool = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// List submissions for a homework
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { homework_id } = req.query;
    if (!homework_id) return res.status(400).json({ success: false, error: '缺少homework_id' });
    const [rows] = await pool.execute(
      'SELECT hs.*, s.name as student_name, s.student_number FROM homework_submissions hs JOIN students s ON hs.student_id = s.id WHERE hs.homework_id = ? ORDER BY s.student_number',
      [parseInt(homework_id)]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Get single submission
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [[sub]] = await pool.execute(
      'SELECT hs.*, s.name as student_name, s.student_number, h.title as homework_title, h.subject_id, h.total_questions FROM homework_submissions hs JOIN students s ON hs.student_id = s.id JOIN homework h ON hs.homework_id = h.id WHERE hs.id = ?',
      [req.params.id]
    );
    if (!sub) return res.status(404).json({ success: false, error: '提交不存在' });
    // Get the homework questions for reference
    const [questions] = await pool.execute(
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
    await pool.execute(
      'UPDATE homework_submissions SET score = ?, answers = ?, status = ?, graded_at = NOW() WHERE id = ?',
      [score, JSON.stringify(answers), 'graded', req.params.id]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Test grading**

```bash
TOKEN="<teacher token>"

# List submissions for homework 1
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/submissions?homework_id=1"

# Grade a submission
curl -X POST http://localhost:3000/api/submissions/1/grade \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"score":80,"answers":{"1":{"correct":true,"userAnswer":"5/4"},"2":{"correct":false,"userAnswer":"2/3","errorCause":"计算操作","analysis":"异分母加法需先通分"}}}'
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/submissions.js
git commit -m "feat: submissions list + grading API"
```

---

### Task 7: Teacher React app shell + routing + API client

**Files:**
- Modify: `teacher/src/main.jsx`, `teacher/src/App.jsx`
- Create: `teacher/src/api/client.js`
- Create: `teacher/src/pages/` directory

**Interfaces:**
- Produces: `api` module with `login()`, `getHomework()`, `createHomework()`, etc.
- Produces: React Router with routes: `/login`, `/dashboard`, `/assign`, `/grading`, `/grading/:id`
- Produces: Auth context that provides `{ user, token, login, logout }`

- [ ] **Step 1: Create API client `teacher/src/api/client.js`**

```js
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (username, password) => api.post('/auth/login', { username, password });
export const register = (data) => api.post('/auth/register', data);

// Homework
export const getHomeworkList = (params) => api.get('/homework', { params });
export const getHomeworkDetail = (id) => api.get(`/homework/${id}`);
export const createHomework = (data) => api.post('/homework', data);
export const deleteHomework = (id) => api.delete(`/homework/${id}`);
export const getHomeworkStats = (id) => api.get(`/homework/${id}/stats`);

// Questions
export const getQuestions = (params) => api.get('/questions', { params });
export const createQuestion = (data) => api.post('/questions', data);

// Submissions
export const getSubmissions = (homework_id) => api.get('/submissions', { params: { homework_id } });
export const getSubmissionDetail = (id) => api.get(`/submissions/${id}`);
export const gradeSubmission = (id, data) => api.post(`/submissions/${id}/grade`, data);

export default api;
```

- [ ] **Step 2: Create auth context `teacher/src/context/AuthContext.jsx`**

```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch { logout(); }
    }
  }, [token]);

  const login = async (username, password) => {
    const { data } = await apiLogin(username, password);
    localStorage.setItem('token', data.data.token);
    setToken(data.data.token);
    setUser(data.data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

- [ ] **Step 3: Create App with routing `teacher/src/App.jsx`**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AssignHomework from './pages/AssignHomework';
import GradingList from './pages/GradingList';
import GradingDetail from './pages/GradingDetail';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/assign" element={<PrivateRoute><AssignHomework /></PrivateRoute>} />
          <Route path="/grading" element={<PrivateRoute><GradingList /></PrivateRoute>} />
          <Route path="/grading/:id" element={<PrivateRoute><GradingDetail /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add teacher/src/
git commit -m "feat: teacher app shell with routing, auth context, API client"
```

---

### Task 8: Teacher login page

**Files:**
- Create: `teacher/src/pages/Login.jsx`
- Create: `teacher/src/pages/Login.css`

**Interfaces:**
- Consumes: `useAuth().login`

- [ ] **Step 1: Create `teacher/src/pages/Login.jsx`**

```jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>徽乐宝</h1>
        <h2>教师端</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}
          <input type="text" placeholder="用户名" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? '登录中...' : '登录'}</button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add login page styles**

Clean centered card layout with the app's existing color scheme.

- [ ] **Step 3: Test login flow**

```bash
cd teacher && npm run dev
# Open http://localhost:5173/login
# Login with wang / 123456 → should redirect to dashboard
```

- [ ] **Step 4: Commit**

```bash
git add teacher/src/pages/Login.jsx teacher/src/pages/Login.css
git commit -m "feat: teacher login page"
```

---

### Task 9: Teacher dashboard + layout

**Files:**
- Create: `teacher/src/pages/Dashboard.jsx`
- Create: `teacher/src/components/Layout.jsx`

**Interfaces:**
- Consumes: `useAuth().user`, `getHomeworkList()`
- Produces: Layout with sidebar nav, dashboard with homework stats

- [ ] **Step 1: Create Layout component with sidebar**

```jsx
// teacher/src/components/Layout.jsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>徽乐宝</h2>
          <span className="role-badge">教师端</span>
        </div>
        <nav>
          <Link to="/" className={pathname === '/' ? 'active' : ''}>📋 工作台</Link>
          <Link to="/assign" className={pathname === '/assign' ? 'active' : ''}>📝 布置作业</Link>
          <Link to="/grading" className={pathname.startsWith('/grading') ? 'active' : ''}>✅ 批改作业</Link>
        </nav>
        <div className="sidebar-footer">
          <span>{user?.display_name}</span>
          <button onClick={logout}>退出</button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create Dashboard page**

```jsx
// teacher/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { getHomeworkList } from '../api/client';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHomeworkList({}).then(res => {
      setHomework(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div>加载中...</div></Layout>;

  const active = homework.filter(h => h.status === 'active');
  const graded = homework.filter(h => h.status === 'closed');

  return (
    <Layout>
      <div className="dashboard">
        <h1>工作台</h1>
        <div className="stats-cards">
          <div className="stat-card">
            <span className="stat-num">{active.length}</span>
            <span className="stat-label">进行中作业</span>
          </div>
          <div className="stat-card">
            <span className="stat-num">{graded.length}</span>
            <span className="stat-label">已完成</span>
          </div>
        </div>
        <div className="homework-list">
          <h2>最近作业</h2>
          {homework.slice(0, 10).map(hw => (
            <div key={hw.id} className="hw-card">
              <div>
                <strong>{hw.title}</strong>
                <span>{hw.class_name} · {hw.teacher_name} · {hw.deadline}</span>
              </div>
              <Link to={`/grading/${hw.id}`}>查看</Link>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add teacher/src/pages/Dashboard.jsx teacher/src/pages/Dashboard.css \
        teacher/src/components/Layout.jsx teacher/src/components/Layout.css
git commit -m "feat: teacher dashboard with sidebar layout"
```

---

### Task 10: Assign homework page

**Files:**
- Create: `teacher/src/pages/AssignHomework.jsx`

**Interfaces:**
- Consumes: `getQuestions()`, `createHomework()`
- Produces: Full homework creation flow — select subject, search questions, pick questions, set title/deadline, submit

- [ ] **Step 1: Create `teacher/src/pages/AssignHomework.jsx`**

Multi-step form: (1) Select class & subject, set title/deadline, (2) Search & select questions from bank with subject/kp/difficulty filters, (3) Preview & submit.

Key UI elements:
- Subject tabs (数学/语文/英语/物理/化学)
- Knowledge point filter dropdown
- Question cards with checkbox selection, showing stem + answer + type badge
- Selected count badge
- Form fields: title input, deadline date picker, class selector
- Submit button disabled until ≥1 question selected

- [ ] **Step 2: Implement question selection logic**

```jsx
const [selectedIds, setSelectedIds] = useState([]);
const toggleQuestion = (id) => {
  setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
};
```

- [ ] **Step 3: Implement homework creation**

```jsx
const handleSubmit = async () => {
  await createHomework({ title, subject_id, class_id, deadline, type, question_ids: selectedIds });
  navigate('/'); // back to dashboard
};
```

- [ ] **Step 4: Commit**

```bash
git add teacher/src/pages/AssignHomework.jsx teacher/src/pages/AssignHomework.css
git commit -m "feat: assign homework page with question bank search"
```

---

### Task 11: Grading list + detail pages

**Files:**
- Create: `teacher/src/pages/GradingList.jsx`
- Create: `teacher/src/pages/GradingDetail.jsx`

**Interfaces:**
- Consumes: `getHomeworkList()`, `getSubmissions()`, `getSubmissionDetail()`, `gradeSubmission()`
- Produces: Grading list (homework → submission summary), detail page (per-student grading with per-question correction)

- [ ] **Step 1: Create GradingList page**

Shows all active homework with submission stats — each card shows:
- Homework title, class, deadline
- Submission progress: `5/42 submitted, 3 graded`
- Click → navigate to grading detail for that homework

- [ ] **Step 2: Create GradingDetail page**

Two panels:
- **Left**: Student list with submission status (pending/submitted/graded), score, student name
- **Right**: Selected student's answer sheet — per-question: stem, correct answer, student's answer, correct/wrong toggle, score input, error cause selector, analysis textarea

Key grading form:
```jsx
const [answers, setAnswers] = useState({});
const [score, setScore] = useState(0);

const handleGrade = async () => {
  await gradeSubmission(submissionId, { score, answers });
  // refresh list
};
```

- [ ] **Step 3: Commit**

```bash
git add teacher/src/pages/GradingList.jsx teacher/src/pages/GradingList.css \
        teacher/src/pages/GradingDetail.jsx teacher/src/pages/GradingDetail.css
git commit -m "feat: grading list + detail pages"
```

---

### Task 12: Seed data population

**Files:**
- Modify: `server/db/seed.sql`

Seed the database with realistic demo data so the teacher app is immediately usable:
- 2 teachers (王老师/math, 李老师/chinese, 张老师/english, 刘老师/physics, 陈老师/chemistry)
- 3 classes
- 15 students across classes
- 50+ questions across all 5 subjects
- 3 sample homework assignments with submissions

- [ ] **Step 1: Expand `server/db/seed.sql`**

Insert users, classes, students, and questions. Reuse question content from existing `index.html` mockData for consistency. Run `mysql -u root class2 < server/db/seed.sql`.

- [ ] **Step 2: Verify seeded data**

```bash
mysql -u root class2 -e "SELECT COUNT(*) FROM questions; SELECT COUNT(*) FROM students; SELECT COUNT(*) FROM homework;"
# Expected: 50+, 15, 3
```

- [ ] **Step 3: Commit**

```bash
git add server/db/seed.sql
git commit -m "feat: comprehensive seed data (5 teachers, 15 students, 50+ questions)"
```
