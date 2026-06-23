import { useState, useEffect } from 'react';
import { getHomeworkList, getClasses } from '../api/client';
import { Link } from 'react-router-dom';
import { fmtDate } from '../utils';
import './Dashboard.css';

export default function Dashboard() {
  const [classes, setClasses] = useState([]);
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getClasses(),
      getHomeworkList({})
    ])
      .then(([classRes, hwRes]) => {
        setClasses(classRes.data.data || []);
        setHomework(hwRes.data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="dashboard-loading">加载中...</div>;
  }

  const active = homework.filter(h => h.status === 'active');
  const closed = homework.filter(h => h.status === 'closed');

  // Group homework by class
  const groupedByClass = {};
  homework.forEach(hw => {
    const key = hw.class_name || `班级${hw.class_id}`;
    if (!groupedByClass[key]) groupedByClass[key] = [];
    groupedByClass[key].push(hw);
  });

  const statusBadge = (status) => {
    if (status === 'active') return <span className="hw-badge hw-badge-active">进行中</span>;
    if (status === 'closed') return <span className="hw-badge hw-badge-closed">已完成</span>;
    return <span className="hw-badge hw-badge-draft">草稿</span>;
  };

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">工作台</h1>

      <div className="stats-cards">
        <div className="stat-card stat-card-active">
          <span className="stat-icon">📝</span>
          <span className="stat-num">{active.length}</span>
          <span className="stat-label">进行中作业</span>
        </div>
        <div className="stat-card stat-card-closed">
          <span className="stat-icon">✅</span>
          <span className="stat-num">{closed.length}</span>
          <span className="stat-label">已完成批改</span>
        </div>
        <div className="stat-card stat-card-total">
          <span className="stat-icon">📚</span>
          <span className="stat-num">{homework.length}</span>
          <span className="stat-label">全部作业</span>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="dashboard-section">
          <div className="section-body">
            <div className="hw-empty">
              <span>您尚未选择任课班级</span>
              <Link to="/settings" className="hw-assign-link">去设置 →</Link>
            </div>
          </div>
        </div>
      ) : (
        classes.map(cls => {
        const hwList = groupedByClass[cls.name] || [];
        return (
          <div key={cls.id} className="dashboard-section">
            <div className="section-header">
              <h2 className="section-title">{cls.name}</h2>
              <span className="section-grade">{cls.grade_level}</span>
              <span className="section-count">{hwList.length} 份作业</span>
            </div>
            <div className="section-body">
              {hwList.length > 0 ? (
                <div className="hw-list">
                  {hwList.map(hw => (
                    <div key={hw.id} className="hw-card">
                      <div className="hw-card-info">
                        <strong className="hw-title">{hw.title}</strong>
                        <span className="hw-meta">
                          {hw.teacher_name} · 截止：{fmtDate(hw.deadline)}
                        </span>
                      </div>
                      <div className="hw-card-actions">
                        {statusBadge(hw.status)}
                        <Link to={`/grading/${hw.id}`} className="hw-view-link">查看</Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="hw-empty">
                  <span>暂无作业</span>
                  <Link to="/assign" className="hw-assign-link">去布置 →</Link>
                </div>
              )}
            </div>
          </div>
        );
      }))
    }
    </div>
  );
}
