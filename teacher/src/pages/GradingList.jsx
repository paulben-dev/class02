import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHomeworkList, getHomeworkStats, getClasses } from '../api/client';
import './GradingList.css';

const STATUS_BADGES = {
  active: { label: '进行中', className: 'gl-badge-active' },
  closed: { label: '已完成', className: 'gl-badge-closed' },
};

export default function GradingList() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statsMap, setStatsMap] = useState({});
  const [statsLoading, setStatsLoading] = useState(false);

  // Load classes
  useEffect(() => {
    getClasses()
      .then(res => {
        const list = res.data.data || [];
        setClasses(list);
        if (list.length > 0 && !selectedClassId) setSelectedClassId(String(list[0].id));
      })
      .catch(() => {});
  }, []);

  // Load homework when class changes
  useEffect(() => {
    setLoading(true);
    setError('');
    const params = { status: 'active' };
    getHomeworkList(params)
      .then(res => {
        const list = res.data.data || [];
        setHomeworkList(list);
        setLoading(false);
        if (list.length > 0) {
          setStatsLoading(true);
          Promise.allSettled(
            list.map(hw => getHomeworkStats(hw.id))
          ).then(results => {
            const map = {};
            results.forEach((r, i) => {
              if (r.status === 'fulfilled') {
                map[list[i].id] = r.value.data.data;
              }
            });
            setStatsMap(map);
            setStatsLoading(false);
          });
        }
      })
      .catch(err => {
        setError(err.response?.data?.error || '加载作业列表失败');
        setLoading(false);
      });
  }, [selectedClassId]);

  // Filter by selected class
  const filteredHomework = selectedClassId
    ? homeworkList.filter(hw => hw.class_id === parseInt(selectedClassId))
    : homeworkList;

  // Group homework by class for display
  const groupedHomework = {};
  filteredHomework.forEach(hw => {
    const key = hw.class_name || `班级${hw.class_id}`;
    if (!groupedHomework[key]) groupedHomework[key] = [];
    groupedHomework[key].push(hw);
  });

  if (loading) {
    return (
      <div className="grading-list">
        <h1 className="gl-title">批改作业</h1>
        <div className="gl-loading">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grading-list">
        <h1 className="gl-title">批改作业</h1>
        <div className="gl-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="grading-list">
      <h1 className="gl-title">批改作业</h1>

      {/* Class selector */}
      <div className="gl-class-filter">
        <label className="gl-filter-label">班级：</label>
        <select
          className="gl-filter-select"
          value={selectedClassId}
          onChange={e => setSelectedClassId(e.target.value)}
        >
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {filteredHomework.length === 0 ? (
        <div className="gl-empty">
          <p>暂无需要批改的作业</p>
          <p className="gl-empty-hint">该班级暂时没有进行中的作业。</p>
        </div>
      ) : (
        <div className="gl-class-groups">
          {Object.entries(groupedHomework).map(([className, hwList]) => (
            <div key={className} className="gl-class-group">
              <h2 className="gl-class-name">{className}</h2>
              <div className="gl-list">
                {hwList.map(hw => {
                  const stats = statsMap[hw.id];
                  return (
                    <div
                      key={hw.id}
                      className="gl-card"
                      onClick={() => navigate(`/grading/${hw.id}`)}
                    >
                      <div className="gl-card-left">
                        <div className="gl-card-header">
                          <strong className="gl-card-title">{hw.title}</strong>
                          {STATUS_BADGES[hw.status] && (
                            <span className={`gl-badge ${STATUS_BADGES[hw.status].className}`}>
                              {STATUS_BADGES[hw.status].label}
                            </span>
                          )}
                        </div>
                        <div className="gl-card-meta">
                          <span>{hw.teacher_name}</span>
                          <span className="gl-meta-sep">·</span>
                          <span>截止：{hw.deadline?.split('T')[0] || hw.deadline}</span>
                        </div>
                        {stats ? (
                          <div className="gl-card-progress">
                            <div className="gl-progress-bar">
                              <div
                                className="gl-progress-fill"
                                style={{ width: `${stats.total > 0 ? (stats.submitted / stats.total) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="gl-progress-text">
                              {stats.submitted}/{stats.total} 已提交
                              {stats.graded > 0 && `，${stats.graded} 已批改`}
                              {stats.graded < stats.submitted && stats.graded > 0 && `，${stats.submitted - stats.graded} 待批改`}
                              {stats.avgScore > 0 && `，均分 ${stats.avgScore}`}
                            </span>
                          </div>
                        ) : statsLoading ? (
                          <div className="gl-card-progress">
                            <span className="gl-progress-loading">加载统计中...</span>
                          </div>
                        ) : null}
                      </div>
                      <div className="gl-card-arrow">&rsaquo;</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
