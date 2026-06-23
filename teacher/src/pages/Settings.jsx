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
