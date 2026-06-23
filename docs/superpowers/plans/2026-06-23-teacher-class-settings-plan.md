# Teacher Class Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a settings page where teachers configure which classes they teach, backed by a many-to-many `teacher_classes` table, scoping all class-aware views to assigned classes only.

**Architecture:** New `teacher_classes` junction table replaces the single `classes.teacher_id` column as the source of truth. A new `/api/teacher/classes` endpoint handles get/set. The existing `GET /api/classes` is modified to filter by the junction table for teachers. A new Settings page in the React app provides the UI.

**Tech Stack:** MySQL (new table), Express (new route + modified route), React 19 + React Router 7 (new page + sidebar entry)

## Global Constraints

- All API responses use `{ success: true, data: ... }` envelope
- Teacher auth via JWT Bearer token; `req.user.id` identifies the teacher
- Frontend CSS follows existing patterns: box-shadow cards, `#1a1a2e` dark color, `#f5f5f5` page background
- Chinese UI labels throughout

---

### Task 1: Add teacher_classes table to schema and seed data

**Files:**
- Modify: `server/db/schema.sql` (after classes table, before indexes)
- Modify: `server/db/seed.sql` (after classes INSERT, before students)

**Interfaces:**
- Produces: `teacher_classes(teacher_id INT, class_id INT, PRIMARY KEY (teacher_id, class_id))` table

- [ ] **Step 1: Add CREATE TABLE to schema.sql**

Add after the `classes` CREATE TABLE block (line 20) and before `students`:

```sql
CREATE TABLE teacher_classes (
  teacher_id INT NOT NULL,
  class_id INT NOT NULL,
  PRIMARY KEY (teacher_id, class_id),
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

Insert at `server/db/schema.sql:20` (after the classes table CREATE).

- [ ] **Step 2: Add seed data INSERT to seed.sql**

Add after the classes INSERT block (line 48) and before students:

```sql
-- Teacher-Class assignments (migrated from classes.teacher_id)
INSERT INTO teacher_classes (teacher_id, class_id) VALUES
(1, 1),   -- 王老师(math) teaches 三年级1班
(2, 2),   -- 李老师(chinese) teaches 三年级2班
(3, 2),   -- 张老师(english) teaches 三年级2班 (shares class 2 with 李老师)
(4, 3),   -- 刘老师(physics) teaches 四年级1班
(1, 3);   -- 王老师(math) also teaches 四年级1班
```

Insert at `server/db/seed.sql:48` (after the classes INSERT block, before students).

- [ ] **Step 3: Add TRUNCATE to seed.sql cleanup block**

Add `teacher_classes` to the TRUNCATE list in seed.sql. The current block at lines 6-17:

```sql
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE subscriptions;
TRUNCATE TABLE print_history;
TRUNCATE TABLE knowledge_points;
TRUNCATE TABLE homework_submissions;
TRUNCATE TABLE homework_questions;
TRUNCATE TABLE homework;
TRUNCATE TABLE questions;
TRUNCATE TABLE students;
TRUNCATE TABLE classes;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;
```

Add `TRUNCATE TABLE teacher_classes;` after `TRUNCATE TABLE classes;`.

- [ ] **Step 4: Run seed to apply changes**

Run: `cd /home/paulben/code/class2/server && node -e "const mysql = require('mysql2/promise'); (async () => { const c = await mysql.createConnection({host:'localhost',user:'root',password:'',multipleStatements:true}); await c.query('DROP DATABASE IF EXISTS class2; CREATE DATABASE class2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'); await c.end(); })()"` then rerun the seed file.

Or if the DB is already set up, run the migration directly:
```bash
cd /home/paulben/code/class2/server
node -e "
const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({host:'localhost',user:'root',password:'',database:'class2'});
  await c.query(\`CREATE TABLE IF NOT EXISTS teacher_classes (
    teacher_id INT NOT NULL,
    class_id INT NOT NULL,
    PRIMARY KEY (teacher_id, class_id),
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
  ) ENGINE=InnoDB\`);
  await c.query(\`INSERT IGNORE INTO teacher_classes (teacher_id, class_id) VALUES
    (1,1),(2,2),(3,2),(4,3),(1,3)\`);
  console.log('Migration done');
  await c.end();
})();
"
```

Expected: "Migration done" with no errors.

- [ ] **Step 5: Commit**

```bash
git add server/db/schema.sql server/db/seed.sql
git commit -m "feat: add teacher_classes junction table and seed data"
```

---

### Task 2: Create teacher route with get/set endpoints

**Files:**
- Create: `server/routes/teacher.js`
- Modify: `server/index.js:19` (add mount)

**Interfaces:**
- Produces: `GET /api/teacher/classes` → `{ success: true, data: { class_ids: [1, 2] } }`
- Produces: `PUT /api/teacher/classes` ← `{ class_ids: [1, 2, 3] }` → `{ success: true, data: { class_ids: [1, 2, 3] } }`
- Consumes: `authMiddleware` from `../middleware/auth`, `pool` from `../db/connection`

- [ ] **Step 1: Create server/routes/teacher.js**

```js
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
```

- [ ] **Step 2: Mount route in server/index.js**

Add after line 18 (`app.use('/api/submissions', submissionRoutes);`):

```js
app.use('/api/teacher', require('./routes/teacher'));
```

- [ ] **Step 3: Test the endpoints with curl**

Start server: `cd /home/paulben/code/class2/server && node index.js &`

```bash
# Login as wang (teacher 1)
TOKEN=$(curl -s http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"username":"wang","password":"123456"}' | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data.token))")

# Get current classes
curl -s http://localhost:3000/api/teacher/classes -H "Authorization: Bearer $TOKEN"
# Expected: {"success":true,"data":{"class_ids":[1,3]}}

# Set new classes
curl -s -X PUT http://localhost:3000/api/teacher/classes -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"class_ids":[1,2,3]}'
# Expected: {"success":true,"data":{"class_ids":[1,2,3]}}

# Verify
curl -s http://localhost:3000/api/teacher/classes -H "Authorization: Bearer $TOKEN"
# Expected: {"success":true,"data":{"class_ids":[1,2,3]}}

# Reset to original
curl -s -X PUT http://localhost:3000/api/teacher/classes -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"class_ids":[1,3]}'
```

- [ ] **Step 4: Commit**

```bash
git add server/routes/teacher.js server/index.js
git commit -m "feat: add teacher classes get/set API endpoints"
```

---

### Task 3: Modify GET /api/classes to filter by teacher_classes

**Files:**
- Modify: `server/routes/classes.js:7-21` (teacher branch of GET /)

**Interfaces:**
- Modifies: `GET /api/classes` for teacher role now returns only classes in `teacher_classes`
- New query param: `?all=1` bypasses the filter (for settings page to show all available classes)

- [ ] **Step 1: Update the teacher query in classes.js**

Replace the teacher branch in `server/routes/classes.js:10-13`:

Old:
```js
if (req.user.role === 'teacher') {
  // Teachers can teach multiple classes — show all classes
  sql = 'SELECT c.id, c.name, c.grade_level, s.name as school_name FROM classes c LEFT JOIN schools s ON c.school_id = s.id ORDER BY c.grade_level, c.name';
  params = [];
}
```

New:
```js
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
}
```

- [ ] **Step 2: Verify with curl**

```bash
# Login as wang
TOKEN=$(curl -s http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"username":"wang","password":"123456"}' | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).data.token))")

# Regular list (only assigned classes)
curl -s http://localhost:3000/api/classes -H "Authorization: Bearer $TOKEN" | node -e "process.stdin.on('data',d=>console.log(JSON.stringify(JSON.parse(d).data,null,2)))"
# Expected: only classes 1 and 3 (if wang has class_ids [1,3])

# All classes (for settings picker)
curl -s 'http://localhost:3000/api/classes?all=1' -H "Authorization: Bearer $TOKEN" | node -e "process.stdin.on('data',d=>console.log(JSON.stringify(JSON.parse(d).data,null,2)))"
# Expected: all 3 classes, each with is_assigned: 1 or 0
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/classes.js
git commit -m "feat: filter classes by teacher_classes for teachers, add ?all=1 mode"
```

---

### Task 4: Add teacher API functions to frontend client

**Files:**
- Modify: `teacher/src/api/client.js:38-39` (modify getClasses, add after getClassStudents)

**Interfaces:**
- Modifies: `getClasses(params)` now accepts optional params object → `api.get('/classes', { params })`
- Produces: `getTeacherClasses()` → `{ success: true, data: { class_ids: [1, 2] } }`
- Produces: `updateTeacherClasses(classIds)` → `{ success: true, data: { class_ids: [1, 2] } }`

- [ ] **Step 1: Modify getClasses to accept params, add two new exports**

Change line 38 from:
```js
export const getClasses = () => api.get('/classes');
```
To:
```js
export const getClasses = (params) => api.get('/classes', { params });
```

Add after line 39 (`export const getClassStudents = ...`):

```js
// Teacher settings
export const getTeacherClasses = () => api.get('/teacher/classes');
export const updateTeacherClasses = (classIds) => api.put('/teacher/classes', { class_ids: classIds });
```

No test needed—these are thin wrappers around axios calls.

- [ ] **Step 2: Commit**

```bash
git add teacher/src/api/client.js
git commit -m "feat: add teacher classes API functions to frontend client"
```

---

### Task 5: Create Settings page

**Files:**
- Create: `teacher/src/pages/Settings.jsx`
- Create: `teacher/src/pages/Settings.css`

**Interfaces:**
- Consumes: `getClasses()` from `../api/client` (with `?all=1` param), `getTeacherClasses()`, `updateTeacherClasses()` from `../api/client`
- Produces: A `<Settings />` page component rendering a class checkbox list with save button

- [ ] **Step 1: Create Settings.css**

```css
.settings {
  padding: 32px;
  max-width: 640px;
}

.settings-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px;
}

.settings-subtitle {
  font-size: 14px;
  color: #888;
  margin: 0 0 28px;
}

.settings-loading {
  padding: 48px 32px;
  font-size: 16px;
  color: #999;
}

.settings-card {
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

.settings-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 16px;
}

.settings-class-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings-class-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
  border: 1px solid transparent;
}

.settings-class-item:hover {
  background: #f8f9fc;
}

.settings-class-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #4A90D9;
  cursor: pointer;
  flex-shrink: 0;
}

.settings-class-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings-class-name {
  font-size: 15px;
  color: #1a1a2e;
  font-weight: 500;
}

.settings-class-grade {
  font-size: 12px;
  color: #999;
}

.settings-actions {
  display: flex;
  gap: 12px;
}

.settings-save-btn {
  padding: 10px 32px;
  background: #4A90D9;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.settings-save-btn:hover {
  background: #3a7bc8;
}

.settings-save-btn:disabled {
  background: #b0c8e0;
  cursor: not-allowed;
}

.settings-toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #2ecc71;
  color: #fff;
  padding: 12px 28px;
  border-radius: 8px;
  font-size: 15px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.18);
  z-index: 1000;
  animation: settings-toast-in 0.3s ease;
}

@keyframes settings-toast-in {
  from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.settings-empty {
  text-align: center;
  padding: 32px;
  color: #999;
  font-size: 14px;
}
```

- [ ] **Step 2: Create Settings.jsx**

```jsx
import { useState, useEffect } from 'react';
import { getClasses, getTeacherClasses, updateTeacherClasses } from '../api/client';
import './Settings.css';

export default function Settings() {
  const [allClasses, setAllClasses] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    Promise.all([
      getClasses({ all: 1 }),
      getTeacherClasses()
    ])
      .then(([classRes, tcRes]) => {
        setAllClasses(classRes.data.data || []);
        setSelectedIds(tcRes.data.data?.class_ids || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleClass = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTeacherClasses(selectedIds);
      setToast('设置已保存');
      setTimeout(() => setToast(''), 2000);
    } catch (e) {
      setToast('保存失败，请重试');
      setTimeout(() => setToast(''), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="settings-loading">加载中...</div>;
  }

  // Group classes by grade level
  const grouped = {};
  allClasses.forEach(cls => {
    const key = cls.grade_level || '其他';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(cls);
  });

  return (
    <div className="settings">
      <h1 className="settings-title">设置</h1>
      <p className="settings-subtitle">选择您任课的班级，设置后工作台、布置作业和批改作业将只显示所选班级。</p>

      {toast && <div className="settings-toast">{toast}</div>}

      <div className="settings-card">
        <h2 className="settings-card-title">任课班级</h2>
        {Object.keys(grouped).length === 0 ? (
          <div className="settings-empty">暂无可用班级</div>
        ) : (
          <div className="settings-class-list">
            {Object.entries(grouped).map(([grade, classes]) => (
              <div key={grade}>
                <div style={{ fontSize: '12px', color: '#aaa', padding: '8px 16px 4px', fontWeight: 600 }}>
                  {grade}
                </div>
                {classes.map(cls => (
                  <label key={cls.id} className="settings-class-item">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(cls.id)}
                      onChange={() => toggleClass(cls.id)}
                    />
                    <div className="settings-class-info">
                      <span className="settings-class-name">{cls.name}</span>
                      <span className="settings-class-grade">{cls.school_name || ''}</span>
                    </div>
                  </label>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="settings-actions">
        <button
          className="settings-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Test manually in browser**

Start the teacher app: `cd /home/paulben/code/class2/teacher && npx vite --host 0.0.0.0 &`

Navigate to the app, login as wang/123456, then manually navigate to `http://localhost:5173/settings`.

Expected: Page loads showing all 3 classes grouped by grade level. Wang's currently assigned classes (1, 3) are checked. Uncheck class 3, check class 2, click save. Should show green toast "设置已保存".

- [ ] **Step 4: Commit**

```bash
git add teacher/src/pages/Settings.jsx teacher/src/pages/Settings.css
git commit -m "feat: add Settings page with class checkbox selection"
```

---

### Task 6: Wire Settings page into routing and sidebar

**Files:**
- Modify: `teacher/src/App.jsx:6,24` (import Settings, add route)
- Modify: `teacher/src/components/Layout.jsx:25-29` (add nav entry)

**Interfaces:**
- Produces: `/settings` route accessible from sidebar

- [ ] **Step 1: Add import and route to App.jsx**

Add import after line 7 (`import GradingDetail from './pages/GradingDetail';`):

```jsx
import Settings from './pages/Settings';
```

Add route after line 23 (`<Route path="/grading/:id" element={<GradingDetail />} />`):

```jsx
              <Route path="/settings" element={<Settings />} />
```

- [ ] **Step 2: Add "设置" nav item to Layout.jsx**

Add after the GradingList entry in navLinks (line 28):

```jsx
    { to: '/settings', label: '设置', icon: '⚙️' },
```

The full navLinks array should become:

```jsx
  const navLinks = [
    { to: '/', label: '工作台', icon: '📋' },
    { to: '/assign', label: '布置作业', icon: '📝' },
    { to: '/grading', label: '批改作业', icon: '✅' },
    { to: '/settings', label: '设置', icon: '⚙️' },
  ];
```

- [ ] **Step 3: Test navigation in browser**

Open `http://localhost:5173/`, login, verify:
- Sidebar shows "⚙️ 设置" as the fourth nav item
- Clicking it navigates to `/settings` and the nav item highlights (active state)
- Clicking other nav items works as before
- The settings page loads and shows class checkboxes

- [ ] **Step 4: Commit**

```bash
git add teacher/src/App.jsx teacher/src/components/Layout.jsx
git commit -m "feat: add /settings route and sidebar navigation entry"
```

---

### Task 7: End-to-end verification

**Files:** None (manual testing)

- [ ] **Step 1: Verify class filtering on Dashboard**

Login as wang (assigned to classes 1, 3). Go to Dashboard `/`.
Expected: Only classes "三年级1班" and "四年级1班" appear. Class "三年级2班" is hidden.

- [ ] **Step 2: Verify AssignHomework class selector**

Go to `/assign`. Expected: Only classes 1 and 3 appear in the class multi-select.

- [ ] **Step 3: Verify GradingList class filter**

Go to `/grading`. Expected: Class filter dropdown only shows classes 1 and 3.

- [ ] **Step 4: Verify settings change takes effect**

Go to `/settings`, check class 2, save. Go back to Dashboard `/`.
Expected: All three classes now appear.

- [ ] **Step 5: Verify another teacher sees different classes**

Open an incognito window, login as li/123456 (assigned to class 2 only).
Expected: Dashboard only shows "三年级2班".

- [ ] **Step 6: Commit any fixes if needed**

If all tests pass, no commit needed. If fixes were made:
```bash
git add -A
git commit -m "fix: settings page edge cases"
```
