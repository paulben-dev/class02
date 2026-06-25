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

  // Grade order for sorting
  const GRADE_ORDER = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级'];
  const gradeSort = (a, b) => {
    const ai = GRADE_ORDER.indexOf(a);
    const bi = GRADE_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  };

  // Group classes by grade level
  const gradeMap = {};
  allClasses.forEach(cls => {
    const key = cls.grade_level || '其他';
    if (!gradeMap[key]) gradeMap[key] = [];
    gradeMap[key].push(cls);
  });
  const grades = Object.keys(gradeMap).sort(gradeSort);
  const currentClasses = gradeMap[activeGrade] || [];

  // Auto-select first grade
  useEffect(() => {
    if (grades.length > 0 && !activeGrade) {
      setActiveGrade(grades[0]);
    }
  }, [grades.length, activeGrade]);

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
      selectedSummary[cls.grade_level].push(cls.name.replace(cls.grade_level, ''));
    }
  });

  if (loading) {
    return <div className="settings-loading">加载中...</div>;
  }

  return (
    <div className="settings">
      <h1 className="settings-title">任课班级设置</h1>
      <p className="settings-subtitle">选择您任课的班级，设置后工作台、布置作业和批改作业将只显示所选班级。</p>

      {toast && <div className={`settings-toast ${toastError ? 'settings-toast-error' : ''}`}>{toast}</div>}

      {/* Card 1: Currently selected classes */}
      <div className="settings-card selected-classes-card">
        <h2 className="settings-card-title">您的任课班级</h2>
        {selectedIds.length === 0 ? (
          <p className="selected-classes-empty">尚未选择任课班级，请在下方的班级选择器中添加</p>
        ) : (
          <>
            {Object.entries(selectedSummary).sort(([a], [b]) => gradeSort(a, b)).map(([grade, classList]) => (
              <div key={grade} className="selected-classes-grade">
                <span className="selected-classes-grade-label">{grade}</span>
                <div className="selected-classes-tags">
                  {classList.map(name => (
                    <span key={name} className="selected-classes-tag">{name}</span>
                  ))}
                </div>
              </div>
            ))}
            <div className="selected-classes-count">共 {selectedIds.length} 个班级</div>
          </>
        )}
      </div>

      {/* Card 2: Class selection interface */}
      <div className="settings-card">
        <h2 className="settings-card-title">选择班级</h2>
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
