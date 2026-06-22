import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHomeworkList, getHomeworkStats } from '../api/client';
import './GradingList.css';

const STATUS_BADGES = {
  active: { label: '进行中', className: 'gl-badge-active' },
  closed: { label: '已完成', className: 'gl-badge-closed' },
  draft: { label: '草稿', className: 'gl-badge-draft' },
};

export default function GradingList() {
  const navigate = useNavigate();
  const [homeworkList, setHomeworkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statsMap, setStatsMap] = useState({});
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    getHomeworkList({ status: 'active' })
      .then(res => {
        const list = res.data.data || [];
        setHomeworkList(list);
        setLoading(false);
        // Fetch stats for each homework
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
  }, []);

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

      {homeworkList.length === 0 ? (
        <div className="gl-empty">
          <p>暂无需要批改的作业</p>
          <p className="gl-empty-hint">暂时没有进行中的作业，请先布置作业。</p>
        </div>
      ) : (
        <div className="gl-list">
          {homeworkList.map(hw => {
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
                    <span>{hw.class_name}</span>
                    <span className="gl-meta-sep">·</span>
                    <span>截止：{hw.deadline}</span>
                    {hw.teacher_name && (
                      <>
                        <span className="gl-meta-sep">·</span>
                        <span>{hw.teacher_name}</span>
                      </>
                    )}
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
                        {stats.graded > 0 && stats.graded < stats.submitted && `，${stats.submitted - stats.graded} 待批改`}
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
      )}
    </div>
  );
}
