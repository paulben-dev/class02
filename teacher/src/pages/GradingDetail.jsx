import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHomeworkDetail, getSubmissions, getSubmissionDetail, gradeSubmission } from '../api/client';
import './GradingDetail.css';

const TYPE_BADGES = {
  calc: { label: '计算', className: 'gd-type-calc' },
  word: { label: '应用', className: 'gd-type-word' },
  choice: { label: '选择', className: 'gd-type-choice' },
  fill: { label: '填空', className: 'gd-type-fill' },
  translate: { label: '翻译', className: 'gd-type-translate' },
  rewrite: { label: '改写', className: 'gd-type-rewrite' },
};

const ERROR_CAUSES = [
  { value: '', label: '-- 选择错误原因 --' },
  { value: '概念原理', label: '概念原理' },
  { value: '计算操作', label: '计算操作' },
  { value: '方法策略', label: '方法策略' },
  { value: '审题逻辑', label: '审题逻辑' },
  { value: '未作答', label: '未作答' },
  { value: '书写粗心', label: '书写粗心' },
];

const STATUS_CONFIG = {
  pending: { label: '待提交', color: '#999', bg: '#f5f5f5' },
  submitted: { label: '已提交', color: '#e8933c', bg: '#fff8f0' },
  graded: { label: '已批改', color: '#389e0d', bg: '#f0faf0' },
};

const DIFFICULTY_LABELS = ['', '★', '★★', '★★★', '★★★★', '★★★★★'];

export default function GradingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Data state
  const [homework, setHomework] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [subDetail, setSubDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  // Grading form state
  const [gradingAnswers, setGradingAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Load homework detail & submissions
  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      getHomeworkDetail(id),
      getSubmissions(id),
    ])
      .then(([hwRes, subRes]) => {
        setHomework(hwRes.data.data);
        setSubmissions(subRes.data.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.error || '加载作业详情失败');
        setLoading(false);
      });
  }, [id]);

  // Derived stats
  const stats = useMemo(() => {
    if (!submissions.length) return { total: 0, submitted: 0, graded: 0, pending: 0, avgScore: 0 };
    const total = submissions.length;
    const gradedList = submissions.filter(s => s.status === 'graded');
    const submittedList = submissions.filter(s => s.status === 'submitted');
    const pendingList = submissions.filter(s => s.status === 'pending');
    const graded = gradedList.length;
    const submitted = graded + submittedList.length;
    const pending = pendingList.length;
    const avgScore = graded > 0
      ? Math.round(gradedList.reduce((sum, s) => sum + (s.score || 0), 0) / graded)
      : 0;
    return { total, submitted, graded, pending, avgScore };
  }, [submissions]);

  // Questions from homework (for the grading form)
  const questions = homework?.questions || [];

  // Select a student
  const handleSelectStudent = async (submission) => {
    setSelectedSub(submission);
    setSaveError('');
    setSaveSuccess('');
    setDetailLoading(true);

    try {
      const res = await getSubmissionDetail(submission.id);
      const detail = res.data.data;
      setSubDetail(detail);

      // Initialize grading form from existing answers
      const existingAnswers = detail.answers ? (typeof detail.answers === 'string' ? JSON.parse(detail.answers) : detail.answers) : {};
      const initial = {};
      const questionList = detail.questions || [];
      questionList.forEach(q => {
        const existing = existingAnswers[q.id] || {};
        initial[q.id] = {
          correct: existing.correct !== undefined ? existing.correct : null,
          errorCause: existing.errorCause || existing.analysis || '',
          analysis: existing.analysis || '',
          userAnswer: existing.userAnswer || '',
        };
      });
      setGradingAnswers(initial);
    } catch (err) {
      setSaveError(err.response?.data?.error || '加载提交详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  // Toggle correct/wrong
  const toggleCorrect = (questionId) => {
    setGradingAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        correct: prev[questionId]?.correct === true ? false : true,
      },
    }));
  };

  // Update error cause
  const setErrorCause = (questionId, cause) => {
    setGradingAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        errorCause: cause,
      },
    }));
  };

  // Update analysis
  const setAnalysis = (questionId, text) => {
    setGradingAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        analysis: text,
      },
    }));
  };

  // Auto-computed score
  const computedScore = useMemo(() => {
    const totalQuestions = questions.length;
    if (totalQuestions === 0) return 0;
    const correctCount = Object.values(gradingAnswers).filter(a => a.correct === true).length;
    return Math.round((correctCount / totalQuestions) * 100);
  }, [gradingAnswers, questions.length]);

  // Handle save
  const handleSaveGrade = async () => {
    if (!selectedSub) return;
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    // Build answers payload
    const answersPayload = {};
    questions.forEach(q => {
      const ga = gradingAnswers[q.id] || {};
      answersPayload[q.id] = {
        correct: ga.correct === true,
        errorCause: ga.errorCause || '',
        analysis: ga.analysis || '',
      };
    });

    try {
      await gradeSubmission(selectedSub.id, {
        score: computedScore,
        answers: answersPayload,
      });

      // Update local submission status
      setSubmissions(prev =>
        prev.map(s =>
          s.id === selectedSub.id
            ? { ...s, status: 'graded', score: computedScore }
            : s
        )
      );
      setSelectedSub(prev => prev ? { ...prev, status: 'graded', score: computedScore } : prev);
      setSaveSuccess('批改保存成功');
    } catch (err) {
      setSaveError(err.response?.data?.error || '保存批改失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grading-detail">
        <div className="gd-loading">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grading-detail">
        <div className="gd-error">{error}</div>
        <button className="gd-back-btn" onClick={() => navigate('/grading')}>
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div className="grading-detail">
      {/* Header */}
      <div className="gd-header">
        <button className="gd-back-link" onClick={() => navigate('/grading')}>
          &lsaquo; 返回列表
        </button>
        <h1 className="gd-title">{homework?.title || '批改作业'}</h1>
        <div className="gd-meta">
          <span>{homework?.class_name}</span>
          <span className="gd-meta-sep">·</span>
          <span>截止：{homework?.deadline}</span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="gd-stats-bar">
        <div className="gd-stat-item">
          <span className="gd-stat-value">{stats.avgScore}</span>
          <span className="gd-stat-label">均分</span>
        </div>
        <div className="gd-stat-item">
          <span className="gd-stat-value gd-stat-graded">{stats.graded}</span>
          <span className="gd-stat-label">已批改</span>
        </div>
        <div className="gd-stat-item">
          <span className="gd-stat-value gd-stat-submitted">{stats.submitted}</span>
          <span className="gd-stat-label">已提交</span>
        </div>
        <div className="gd-stat-item">
          <span className="gd-stat-value gd-stat-pending">{stats.pending}</span>
          <span className="gd-stat-label">未提交</span>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="gd-panels">
        {/* Left: Student list */}
        <div className="gd-panel gd-panel-left">
          <h2 className="gd-panel-title">学生列表 ({submissions.length})</h2>
          {submissions.length === 0 ? (
            <div className="gd-empty">暂无学生</div>
          ) : (
            <div className="gd-student-list">
              {submissions.map(sub => {
                const statusCfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending;
                const isSelected = selectedSub?.id === sub.id;
                return (
                  <div
                    key={sub.id}
                    className={`gd-student-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectStudent(sub)}
                  >
                    <div className="gd-student-info">
                      <span className="gd-student-name">{sub.student_name}</span>
                      <span className="gd-student-number">{sub.student_number}</span>
                    </div>
                    <div className="gd-student-status">
                      <span
                        className="gd-status-badge"
                        style={{ color: statusCfg.color, background: statusCfg.bg }}
                      >
                        {statusCfg.label}
                      </span>
                      {sub.score !== null && sub.score !== undefined && (
                        <span className="gd-student-score">{sub.score}分</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Grading form */}
        <div className="gd-panel gd-panel-right">
          <h2 className="gd-panel-title">
            {selectedSub
              ? `${selectedSub.student_name} 的答卷`
              : '选择学生查看答卷'}
          </h2>

          {!selectedSub ? (
            <div className="gd-empty">请在左侧选择一个学生</div>
          ) : detailLoading ? (
            <div className="gd-loading">加载答卷中...</div>
          ) : (
            <div className="gd-grading-form">
              {/* Questions */}
              {questions.map((q, idx) => {
                const ga = gradingAnswers[q.id] || {};
                const typeBadge = TYPE_BADGES[q.type] || { label: q.type, className: 'gd-type-default' };
                const isCorrect = ga.correct === true;
                const isWrong = ga.correct === false;

                return (
                  <div key={q.id} className="gd-question-block">
                    <div className="gd-q-header">
                      <span className="gd-q-num">第 {idx + 1} 题</span>
                      <span className={`gd-q-type ${typeBadge.className}`}>{typeBadge.label}</span>
                      <span className="gd-q-difficulty">{DIFFICULTY_LABELS[q.difficulty] || ''}</span>
                      <span className="gd-q-kp">{q.knowledge_point}</span>
                    </div>
                    <div className="gd-q-stem">{q.stem}</div>
                    <div className="gd-q-answer-ref">
                      <span className="gd-q-answer-label">参考答案：</span>
                      <span className="gd-q-answer-text">{q.answer}</span>
                    </div>

                    {/* Student's answer display */}
                    {ga.userAnswer && (
                      <div className="gd-student-answer">
                        <span className="gd-student-answer-label">学生作答：</span>
                        <span className="gd-student-answer-text">{ga.userAnswer}</span>
                      </div>
                    )}

                    {/* Grading controls */}
                    <div className="gd-grading-controls">
                      <div className="gd-correct-toggle">
                        <button
                          className={`gd-toggle-btn gd-toggle-correct ${isCorrect ? 'active' : ''}`}
                          onClick={() => toggleCorrect(q.id)}
                        >
                          {isCorrect ? '✓ 正确' : '正确'}
                        </button>
                        <button
                          className={`gd-toggle-btn gd-toggle-wrong ${isWrong ? 'active' : ''}`}
                          onClick={() => toggleCorrect(q.id)}
                        >
                          {isWrong ? '✗ 错误' : '错误'}
                        </button>
                      </div>
                      {isWrong && (
                        <>
                          <select
                            className="gd-select"
                            value={ga.errorCause || ''}
                            onChange={e => setErrorCause(q.id, e.target.value)}
                          >
                            {ERROR_CAUSES.map(ec => (
                              <option key={ec.value} value={ec.value}>{ec.label}</option>
                            ))}
                          </select>
                          <textarea
                            className="gd-textarea"
                            placeholder="错误分析（可选）"
                            value={ga.analysis || ''}
                            onChange={e => setAnalysis(q.id, e.target.value)}
                            rows={2}
                          />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Score & Save */}
              {selectedSub && selectedSub.status !== 'graded' && (
                <div className="gd-save-section">
                  <div className="gd-score-display">
                    <span className="gd-score-label">自动评分：</span>
                    <span className="gd-score-value">{computedScore} 分</span>
                    <span className="gd-score-formula">
                      （{Object.values(gradingAnswers).filter(a => a.correct === true).length}/{questions.length} 正确）
                    </span>
                  </div>
                  {saveError && <div className="gd-save-error">{saveError}</div>}
                  {saveSuccess && <div className="gd-save-success">{saveSuccess}</div>}
                  <button
                    className="gd-save-btn"
                    disabled={saving}
                    onClick={handleSaveGrade}
                  >
                    {saving ? '保存中...' : '保存批改'}
                  </button>
                </div>
              )}

              {selectedSub && selectedSub.status === 'graded' && (
                <div className="gd-save-section">
                  <div className="gd-score-display">
                    <span className="gd-score-label">最终分数：</span>
                    <span className="gd-score-value">{computedScore} 分</span>
                    <span className="gd-score-note">（已批改完成，如需修改请重新批改）</span>
                  </div>
                  <button
                    className="gd-save-btn"
                    disabled={saving}
                    onClick={handleSaveGrade}
                  >
                    {saving ? '保存中...' : '重新批改'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
