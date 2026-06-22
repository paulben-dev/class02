import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuestions, createHomework, getClasses } from '../api/client';
import './AssignHomework.css';

const SUBJECTS = [
  { id: 'math', label: '数学' },
  { id: 'chinese', label: '语文' },
  { id: 'english', label: '英语' },
  { id: 'physics', label: '物理' },
  { id: 'chemistry', label: '化学' },
];

const SUBJECT_NAMES = Object.fromEntries(SUBJECTS.map(s => [s.id, s.label]));

const KNOWLEDGE_POINTS = {
  math: [
    { id: 5, name: '同分母分数加减法' },
    { id: 6, name: '异分母分数加减法' },
    { id: 7, name: '分数应用题' },
    { id: 8, name: '乘法口诀' },
    { id: 9, name: '长方形面积' },
    { id: 10, name: '正方形周长' },
    { id: 11, name: '小数加减法' },
    { id: 12, name: '小数乘法' },
    { id: 13, name: '小数除法' },
  ],
  chinese: [
    { id: 23, name: '古诗默写' },
    { id: 24, name: '字词理解' },
    { id: 25, name: '把字句' },
    { id: 26, name: '被字句' },
    { id: 27, name: '成语运用' },
    { id: 28, name: '文言实词' },
    { id: 29, name: '修辞手法' },
    { id: 30, name: '多音字' },
    { id: 31, name: '标点符号' },
  ],
  english: [
    { id: 43, name: '水果类单词' },
    { id: 44, name: '动词have' },
    { id: 45, name: '三单形式' },
    { id: 46, name: '一般疑问句' },
    { id: 47, name: '现在进行时' },
    { id: 48, name: '一般过去式' },
    { id: 49, name: '比较级' },
    { id: 50, name: '地点类单词' },
  ],
  physics: [
    { id: 64, name: '光的反射' },
    { id: 65, name: '光的折射' },
    { id: 66, name: '串联电路' },
    { id: 67, name: '牛顿定律' },
    { id: 68, name: '浮力' },
    { id: 69, name: '阿基米德原理' },
    { id: 70, name: '杠杆' },
    { id: 71, name: '声速' },
  ],
  chemistry: [
    { id: 86, name: '物理变化与化学变化' },
    { id: 87, name: '化学方程式' },
    { id: 88, name: '溶解度' },
    { id: 89, name: '金属活动性顺序' },
    { id: 90, name: '置换反应' },
    { id: 91, name: '元素周期表' },
    { id: 85, name: '酸碱盐' },
  ],
};

const TYPE_BADGES = {
  calc: { label: '计算', className: 'q-type-calc' },
  word: { label: '应用', className: 'q-type-word' },
  choice: { label: '选择', className: 'q-type-choice' },
  fill: { label: '填空', className: 'q-type-fill' },
  translate: { label: '翻译', className: 'q-type-translate' },
  rewrite: { label: '改写', className: 'q-type-rewrite' },
};

const DIFFICULTY_LABELS = ['', '★', '★★', '★★★', '★★★★', '★★★★★'];

export default function AssignHomework() {
  const navigate = useNavigate();

  // Step state
  const [step, setStep] = useState(1);

  // Step 1: Basic info
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('math');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [type, setType] = useState('school');
  const [deadline, setDeadline] = useState('');

  // Step 2: Question selection
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterSubject, setFilterSubject] = useState('math');
  const [filterKp, setFilterKp] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState(0);
  const [showAnswer, setShowAnswer] = useState({});
  const [totalCount, setTotalCount] = useState(0);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Load questions when filters change (only on step 2)
  useEffect(() => {
    if (step !== 2) return;
    setQuestionsLoading(true);
    setQuestionsError('');
    const params = { subject: filterSubject, limit: 50 };
    if (filterKp) params.kp = filterKp;
    if (filterDifficulty) params.difficulty = filterDifficulty;
    if (searchKeyword) params.keyword = searchKeyword;
    getQuestions(params)
      .then(res => {
        setQuestions(res.data.data.questions || []);
        setTotalCount(res.data.data.total || 0);
        setQuestionsLoading(false);
      })
      .catch(err => {
        setQuestionsError(err.response?.data?.error || '加载题目失败');
        setQuestionsLoading(false);
      });
  }, [step, filterSubject, filterKp, filterDifficulty, searchKeyword]);

  // Load teacher's classes
  useEffect(() => {
    getClasses()
      .then(res => {
        const list = res.data.data || [];
        setClasses(list);
        if (list.length > 0 && !classId) setClassId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const toggleQuestion = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAnswer = (id) => {
    setShowAnswer(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedQuestions = questions.filter(q => selectedIds.includes(q.id));

  const handleSubmit = async () => {
    if (!title.trim()) {
      setSubmitError('请输入作业标题');
      return;
    }
    if (!deadline) {
      setSubmitError('请选择截止日期');
      return;
    }
    if (selectedIds.length === 0) {
      setSubmitError('请至少选择一道题目');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await createHomework({
        title: title.trim(),
        subject_id: subjectId,
        class_id: classId,
        deadline,
        type,
        question_ids: selectedIds,
      });
      navigate('/grading');
    } catch (err) {
      setSubmitError(err.response?.data?.error || '创建作业失败');
      setSubmitting(false);
    }
  };

  const canNextStep = () => {
    if (step === 1) return title.trim() && deadline && classId;
    if (step === 2) return selectedIds.length > 0;
    return true;
  };

  const stepLabels = ['基本信息', '选择题目', '预览提交'];

  return (
    <div className="assign-homework">
      <h1 className="ah-title">布置作业</h1>

      {/* Step indicator */}
      <div className="ah-steps">
        {stepLabels.map((label, i) => (
          <div key={i} className={`ah-step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`}>
            <span className="ah-step-num">{i + 1}</span>
            <span className="ah-step-label">{label}</span>
          </div>
        ))}
      </div>

      {/* Submit error */}
      {submitError && <div className="ah-error">{submitError}</div>}

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="ah-card">
          <h2 className="ah-card-title">基本信息</h2>
          <div className="ah-form">
            <div className="ah-field">
              <label className="ah-label">作业标题</label>
              <input
                type="text"
                className="ah-input"
                placeholder="例如：第三单元分数练习题"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div className="ah-row">
              <div className="ah-field ah-field-half">
                <label className="ah-label">科目</label>
                <div className="ah-subject-tabs">
                  {SUBJECTS.map(s => (
                    <button
                      key={s.id}
                      className={`ah-subject-tab ${subjectId === s.id ? 'active' : ''}`}
                      onClick={() => setSubjectId(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ah-field ah-field-half">
                <label className="ah-label">班级</label>
                <select
                  className="ah-select"
                  value={classId}
                  onChange={e => setClassId(parseInt(e.target.value))}
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="ah-row">
              <div className="ah-field ah-field-half">
                <label className="ah-label">类型</label>
                <select
                  className="ah-select"
                  value={type}
                  onChange={e => setType(e.target.value)}
                >
                  <option value="school">校内作业</option>
                  <option value="custom">自定义练习</option>
                </select>
              </div>
              <div className="ah-field ah-field-half">
                <label className="ah-label">截止日期</label>
                <input
                  type="date"
                  className="ah-input"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="ah-actions">
            <button
              className="ah-btn ah-btn-primary"
              disabled={!canNextStep()}
              onClick={() => setStep(2)}
            >
              下一步：选择题目
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select Questions */}
      {step === 2 && (
        <div className="ah-card">
          <h2 className="ah-card-title">
            选择题目
            {selectedIds.length > 0 && (
              <span className="ah-selected-badge">已选 {selectedIds.length} 题</span>
            )}
          </h2>

          {/* Search & Filters */}
          <div className="ah-filters">
            <div className="ah-search-bar">
              <input
                type="text"
                className="ah-input"
                placeholder="搜索题目关键词..."
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
              />
            </div>
            <div className="ah-filter-row">
              <div className="ah-subject-tabs">
                {SUBJECTS.map(s => (
                  <button
                    key={s.id}
                    className={`ah-subject-tab ${filterSubject === s.id ? 'active' : ''}`}
                    onClick={() => { setFilterSubject(s.id); setFilterKp(''); }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="ah-filter-row ah-filter-row-secondary">
              <div className="ah-field ah-field-inline">
                <select
                  className="ah-select"
                  value={filterKp}
                  onChange={e => setFilterKp(e.target.value)}
                >
                  <option value="">全部知识点</option>
                  {(KNOWLEDGE_POINTS[filterSubject] || []).map(kp => (
                    <option key={kp.id} value={kp.name}>{kp.name}</option>
                  ))}
                </select>
              </div>
              <div className="ah-field ah-field-inline">
                <select
                  className="ah-select"
                  value={filterDifficulty}
                  onChange={e => setFilterDifficulty(parseInt(e.target.value))}
                >
                  <option value="0">全部难度</option>
                  <option value="1">难度 ★</option>
                  <option value="2">难度 ★★</option>
                  <option value="3">难度 ★★★</option>
                  <option value="4">难度 ★★★★</option>
                  <option value="5">难度 ★★★★★</option>
                </select>
              </div>
              <span className="ah-result-count">共 {totalCount} 题</span>
            </div>
          </div>

          {/* Question list */}
          {questionsLoading ? (
            <div className="ah-loading">加载题目中...</div>
          ) : questionsError ? (
            <div className="ah-error">{questionsError}</div>
          ) : questions.length === 0 ? (
            <div className="ah-empty">暂无匹配的题目</div>
          ) : (
            <div className="ah-question-list">
              {questions.map((q, idx) => {
                const selected = selectedIds.includes(q.id);
                const typeBadge = TYPE_BADGES[q.type] || { label: q.type, className: 'q-type-default' };
                return (
                  <div
                    key={q.id}
                    className={`ah-question-card ${selected ? 'selected' : ''}`}
                    onClick={() => toggleQuestion(q.id)}
                  >
                    <div className="ah-q-checkbox">
                      <span className={`ah-checkbox ${selected ? 'checked' : ''}`}>
                        {selected ? '✓' : ''}
                      </span>
                    </div>
                    <div className="ah-q-body">
                      <div className="ah-q-header">
                        <span className="ah-q-num">#{idx + 1}</span>
                        <span className={`ah-q-type ${typeBadge.className}`}>{typeBadge.label}</span>
                        <span className="ah-q-kp">{q.knowledge_point}</span>
                        <span className="ah-q-difficulty">{DIFFICULTY_LABELS[q.difficulty] || ''}</span>
                      </div>
                      <div className="ah-q-stem">{q.stem}</div>
                      <div className="ah-q-answer-toggle" onClick={(e) => { e.stopPropagation(); toggleAnswer(q.id); }}>
                        {showAnswer[q.id] ? '收起答案' : '查看答案'} &#9662;
                      </div>
                      {showAnswer[q.id] && (
                        <div className="ah-q-answer">
                          <span className="ah-q-answer-label">答案：</span>
                          {q.answer}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="ah-actions">
            <button className="ah-btn ah-btn-secondary" onClick={() => setStep(1)}>
              上一步
            </button>
            <button
              className="ah-btn ah-btn-primary"
              disabled={!canNextStep()}
              onClick={() => setStep(3)}
            >
              下一步：预览提交 ({selectedIds.length} 题已选)
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Submit */}
      {step === 3 && (
        <div className="ah-card">
          <h2 className="ah-card-title">预览确认</h2>

          {/* Summary */}
          <div className="ah-summary">
            <div className="ah-summary-row">
              <span className="ah-summary-label">标题</span>
              <span className="ah-summary-value">{title}</span>
            </div>
            <div className="ah-summary-row">
              <span className="ah-summary-label">科目</span>
              <span className="ah-summary-value">{SUBJECT_NAMES[subjectId]}</span>
            </div>
            <div className="ah-summary-row">
              <span className="ah-summary-label">班级</span>
              <span className="ah-summary-value">{CLASS_NAMES[classId]}</span>
            </div>
            <div className="ah-summary-row">
              <span className="ah-summary-label">类型</span>
              <span className="ah-summary-value">{type === 'school' ? '校内作业' : '自定义练习'}</span>
            </div>
            <div className="ah-summary-row">
              <span className="ah-summary-label">截止日期</span>
              <span className="ah-summary-value">{deadline}</span>
            </div>
            <div className="ah-summary-row">
              <span className="ah-summary-label">题目数量</span>
              <span className="ah-summary-value">{selectedIds.length} 题</span>
            </div>
          </div>

          {/* Selected questions preview */}
          <h3 className="ah-preview-subtitle">题目列表</h3>
          {selectedQuestions.length === 0 ? (
            <div className="ah-empty">未选择题目</div>
          ) : (
            <div className="ah-preview-list">
              {selectedQuestions.map((q, idx) => {
                const typeBadge = TYPE_BADGES[q.type] || { label: q.type, className: 'q-type-default' };
                return (
                  <div key={q.id} className="ah-preview-item">
                    <span className="ah-preview-num">{idx + 1}.</span>
                    <div className="ah-preview-body">
                      <div className="ah-preview-header">
                        <span className={`ah-q-type ${typeBadge.className}`}>{typeBadge.label}</span>
                        <span className="ah-q-kp">{q.knowledge_point}</span>
                        <span className="ah-q-difficulty">{DIFFICULTY_LABELS[q.difficulty] || ''}</span>
                      </div>
                      <div className="ah-preview-stem">{q.stem}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="ah-actions">
            <button className="ah-btn ah-btn-secondary" onClick={() => setStep(2)}>
              上一步
            </button>
            <button
              className="ah-btn ah-btn-primary ah-btn-submit"
              disabled={submitting || selectedIds.length === 0}
              onClick={handleSubmit}
            >
              {submitting ? '创建中...' : `确认并布置作业 (${selectedIds.length} 题)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
