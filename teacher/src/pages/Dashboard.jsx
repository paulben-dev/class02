import { useState, useEffect } from 'react';
import { getHomeworkList } from '../api/client';
import { Link } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHomeworkList({})
      .then(res => {
        setHomework(res.data.data || []);
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
          <span className="stat-num">{active.length}</span>
          <span className="stat-label">进行中作业</span>
        </div>
        <div className="stat-card stat-card-closed">
          <span className="stat-num">{closed.length}</span>
          <span className="stat-label">已完成</span>
        </div>
        <div className="stat-card stat-card-total">
          <span className="stat-num">{homework.length}</span>
          <span className="stat-label">全部作业</span>
        </div>
      </div>

      {Object.entries(groupedByClass).map(([className, hwList]) => (
        <div key={className} className="dashboard-section">
          <h2 className="section-title">{className}</h2>
          <div className="hw-list">
            {hwList.slice(0, 10).map(hw => (
              <div key={hw.id} className="hw-card">
                <div className="hw-card-info">
                  <strong className="hw-title">{hw.title}</strong>
                  <span className="hw-meta">
                    {hw.teacher_name} · 截止：{hw.deadline?.split('T')[0] || hw.deadline}
                  </span>
                </div>
                <div className="hw-card-actions">
                  {statusBadge(hw.status)}
                  <Link to={`/grading/${hw.id}`} className="hw-view-link">查看</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {homework.length === 0 && (
        <div className="empty-state">暂无作业，请先布置作业</div>
      )}
    </div>
  );
}
