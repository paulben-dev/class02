# Class Selector Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the checkbox list in Settings with a compact grade-tab + class-number-button selector.

**Architecture:** Single-page change — new React component logic in Settings.jsx + new CSS in Settings.css. No backend changes.

**Tech Stack:** React 19, CSS

## Global Constraints

- No backend changes
- Existing `getClasses({ all: 1 })` and `updateTeacherClasses(selectedIds)` API unchanged
- School name displayed in grade tabs when available
- Chinese labels throughout

---

### Task 1: Redesign Settings class selector

**Files:**
- Modify: `teacher/src/pages/Settings.jsx` — replace checkbox list with tab+button UI
- Modify: `teacher/src/pages/Settings.css` — replace class-list styles with tab+button styles

- [ ] **Step 1: Replace Settings.jsx content**

Replace `teacher/src/pages/Settings.jsx` with the new implementation:

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
  const [toastError, setToastError] = useState(false);
  const [activeGrade, setActiveGrade] = useState('');

  useEffect(() => {
    Promise.all([
      getClasses({ all: 1 }),
      getTeacherClasses()
    ])
      .then(([classRes, tcRes]) => {
        setAllClasses(classRes.data.data || []);
        const ids = tcRes.data.data?.class_ids || [];
        setSelectedIds(ids);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Group classes by grade level
  const gradeMap = {};
  allClasses.forEach(cls => {
    const key = cls.grade_level || '其他';
    if (!gradeMap[key]) gradeMap[key] = [];
    gradeMap[key].push(cls);
  });
  const grades = Object.keys(gradeMap).sort();
  const currentClasses = gradeMap[activeGrade] || [];

  // Auto-select first grade
  useEffect(() => {
    if (grades.length > 0 && !activeGrade) {
      setActiveGrade(grades[0]);
    }
  }, [grades, activeGrade]);

  const toggleClass = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllCurrent = () => {
    const currentIds = currentClasses.map(c => c.id);
    setSelectedIds(prev => [...new Set([...prev, ...currentIds])]);
  };

  const clearCurrent = () => {
    const currentIds = new Set(currentClasses.map(c => c.id));
    setSelectedIds(prev => prev.filter(id => !currentIds.has(id)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTeacherClasses(selectedIds);
      setToast('设置已保存');
      setToastError(false);
      setTimeout(() => setToast(''), 2000);
    } catch (e) {
      setToast('保存失败，请重试');
      setToastError(true);
      setTimeout(() => setToast(''), 2000);
    } finally {
      setSaving(false);
    }
  };

  // Build summary of selected classes
  const selectedSummary = {};
  allClasses.forEach(cls => {
    if (selectedIds.includes(cls.id)) {
      if (!selectedSummary[cls.grade_level]) selectedSummary[cls.grade_level] = [];
      selectedSummary[cls.grade_level].push(cls.name.replace(cls.grade_level, '') + '班');
    }
  });

  if (loading) {
    return <div className="settings-loading">加载中...</div>;
  }

  return (
    <div className="settings">
      <h1 className="settings-title">设置</h1>
      <p className="settings-subtitle">选择您任课的班级，设置后工作台、布置作业和批改作业将只显示所选班级。</p>

      {toast && <div className={`settings-toast ${toastError ? 'settings-toast-error' : ''}`}>{toast}</div>}

      <div className="settings-card">
        <h2 className="settings-card-title">任课班级</h2>
        {grades.length === 0 ? (
          <div className="settings-empty">暂无可用班级</div>
        ) : (
          <>
            {/* Grade tabs */}
            <div className="grade-tabs">
              {grades.map(grade => {
                const count = (gradeMap[grade] || []).filter(c => selectedIds.includes(c.id)).length;
                return (
                  <button
                    key={grade}
                    className={`grade-tab ${grade === activeGrade ? 'grade-tab-active' : ''}`}
                    onClick={() => setActiveGrade(grade)}
                  >
                    {grade}
                    {count > 0 && <span className="grade-tab-badge">{count}</span>}
                  </button>
                );
              })}
            </div>

            {/* Action bar */}
            <div className="grade-actions">
              <span className="grade-actions-info">
                {activeGrade} · 已选 {currentClasses.filter(c => selectedIds.includes(c.id)).length} 个班级
              </span>
              <div className="grade-actions-btns">
                <button className="grade-action-link" onClick={selectAllCurrent}>全选</button>
                <button className="grade-action-link grade-action-clear" onClick={clearCurrent}>清空</button>
              </div>
            </div>

            {/* Class number buttons */}
            <div className="class-buttons">
              {currentClasses.map(cls => {
                const selected = selectedIds.includes(cls.id);
                const label = cls.name.replace(cls.grade_level, '');
                return (
                  <button
                    key={cls.id}
                    className={`class-btn ${selected ? 'class-btn-selected' : ''}`}
                    onClick={() => toggleClass(cls.id)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Selected summary */}
            {Object.keys(selectedSummary).length > 0 && (
              <div className="selected-summary">
                <strong>当前已选班级：</strong>
                {Object.entries(selectedSummary).map(([grade, classes]) => (
                  <span key={grade}>{grade} · {classes.join('、')}</span>
                ))}
              </div>
            )}
          </>
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

- [ ] **Step 2: Replace Settings.css**

Replace `teacher/src/pages/Settings.css` with the new styles:

```css
.settings {
  padding: 32px;
  max-width: 680px;
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

/* Grade tabs */
.grade-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.grade-tab {
  padding: 5px 12px;
  border-radius: 14px;
  font-size: 13px;
  cursor: pointer;
  border: none;
  background: #e8e8e8;
  color: #666;
  transition: background 0.15s, color 0.15s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.grade-tab:hover {
  background: #d0d0d0;
}

.grade-tab-active {
  background: #4A90D9;
  color: #fff;
  font-weight: 600;
}

.grade-tab-active:hover {
  background: #3a7bc8;
}

.grade-tab-badge {
  background: rgba(255,255,255,0.3);
  color: #fff;
  border-radius: 8px;
  padding: 0 5px;
  font-size: 11px;
  min-width: 16px;
  text-align: center;
  font-weight: 600;
}

/* Action bar */
.grade-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.grade-actions-info {
  font-size: 12px;
  color: #888;
}

.grade-actions-btns {
  display: flex;
  gap: 8px;
}

.grade-action-link {
  background: none;
  border: none;
  color: #4A90D9;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.grade-action-link:hover {
  text-decoration: underline;
}

.grade-action-clear {
  color: #999;
}

/* Class buttons */
.class-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.class-btn {
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  padding: 8px 0;
  width: 56px;
  text-align: center;
  font-size: 14px;
  cursor: pointer;
  color: #666;
  background: #fff;
  transition: all 0.15s;
}

.class-btn:hover {
  border-color: #4A90D9;
  color: #4A90D9;
}

.class-btn-selected {
  background: #4A90D9;
  color: #fff;
  border-color: #4A90D9;
  font-weight: 600;
}

.class-btn-selected:hover {
  background: #3a7bc8;
  color: #fff;
}

/* Selected summary */
.selected-summary {
  margin-top: 16px;
  padding: 10px 14px;
  background: #f0f5ff;
  border-radius: 8px;
  font-size: 13px;
  color: #4A90D9;
  line-height: 1.8;
}

.selected-summary strong {
  color: #333;
}

/* Buttons */
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

.settings-toast.settings-toast-error {
  background: #e74c3c;
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

- [ ] **Step 3: Verify build**

```bash
cd /home/paulben/code/class2/teacher && npx vite build
```

Expected: "✓ built in XXXms" with no errors.

- [ ] **Step 4: Verify in browser**

Start local dev server:
```bash
cd /home/paulben/code/class2/teacher && npx vite --host 0.0.0.0
```

Navigate to `http://localhost:5173/teacher/settings`, login as wang/123456, and verify:
- Grade tabs show all 6 grades with selected counts
- Clicking a tab switches to that grade's class buttons
- Class buttons toggle blue/gray on click
- 全选/清空 work for current grade
- Selected summary shows all chosen classes
- Save persists selections

- [ ] **Step 5: Commit**

```bash
git add teacher/src/pages/Settings.jsx teacher/src/pages/Settings.css
git commit -m "feat: redesign class selector with grade tabs and number buttons"
```
