const express = require('express');
const pool = require('../db/connection');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Multer config for photo uploads (local only; not available on Vercel serverless)
let upload = { array: () => (req, res, next) => next() };
try {
  const multer = require('multer');
  const path = require('path');
  const photoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `hw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  });
  upload = multer({ storage: photoStorage, limits: { fileSize: 10 * 1024 * 1024, files: 10 } });
} catch (e) {
  console.log('[parent] multer not available (expected on Vercel) — photo upload disabled');
}

// All parent routes require auth
router.use(authMiddleware);

// Get parent's children (linked students)
router.get('/children', async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, error: '仅家长可访问' });
    }
    const [rows] = await pool.query(
      'SELECT s.*, c.name as class_name, c.grade_level FROM students s JOIN classes c ON s.class_id = c.id WHERE s.parent_id = ?',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Get homework list for parent's children
router.get('/homework', async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, error: '仅家长可访问' });
    }
    const [children] = await pool.query(
      'SELECT id, class_id FROM students WHERE parent_id = ?',
      [req.user.id]
    );
    // If no children linked, return all homework with sample submission data (demo/onboarding mode)
    if (!children.length) {
      const [allHw] = await pool.query(
        `SELECT h.*, c.name as class_name, c.grade_level, u.display_name as teacher_name, u.subject as teacher_subject,
          hs.id as submission_id, hs.status as submission_status, hs.score, hs.submitted_at, hs.graded_at,
          (SELECT COUNT(*) FROM homework_submissions WHERE homework_id = h.id) as total_students
         FROM homework h
         JOIN classes c ON h.class_id = c.id
         JOIN users u ON h.teacher_id = u.id
         LEFT JOIN homework_submissions hs ON hs.id = (
           SELECT hs2.id FROM homework_submissions hs2
           WHERE hs2.homework_id = h.id AND hs2.status IN ('graded','submitted')
           ORDER BY FIELD(hs2.status, 'graded', 'submitted'), hs2.graded_at DESC
           LIMIT 1
         )
         ORDER BY h.deadline DESC`
      );
      return res.json({ success: true, data: allHw });
    }
    const classIds = [...new Set(children.map(c => c.class_id))];
    const childIds = children.map(c => c.id);

    const [homework] = await pool.query(
      `SELECT h.*, c.name as class_name, c.grade_level, u.display_name as teacher_name, u.subject as teacher_subject,
        hs.id as submission_id, hs.status as submission_status, hs.score, hs.submitted_at, hs.graded_at,
        (SELECT COUNT(*) FROM homework_submissions WHERE homework_id = h.id) as total_students
       FROM homework h
       JOIN classes c ON h.class_id = c.id
       JOIN users u ON h.teacher_id = u.id
       LEFT JOIN homework_submissions hs ON hs.homework_id = h.id AND hs.student_id IN (?)
       WHERE h.class_id IN (?)
       ORDER BY h.deadline DESC`,
      [childIds, classIds]
    );
    res.json({ success: true, data: homework });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Get homework detail with questions (for parent view)
router.get('/homework/:id', async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, error: '仅家长可访问' });
    }
    const [[hw]] = await pool.query(
      'SELECT h.*, c.name as class_name, c.grade_level, u.display_name as teacher_name FROM homework h JOIN classes c ON h.class_id = c.id JOIN users u ON h.teacher_id = u.id WHERE h.id = ?',
      [req.params.id]
    );
    if (!hw) return res.status(404).json({ success: false, error: '作业不存在' });

    const [questions] = await pool.query(
      'SELECT q.*, hq.sort_order FROM questions q JOIN homework_questions hq ON q.id = hq.question_id WHERE hq.homework_id = ? ORDER BY hq.sort_order',
      [req.params.id]
    );

    // Get the child's submission for this homework
    const [children] = await pool.query(
      'SELECT id FROM students WHERE parent_id = ?',
      [req.user.id]
    );
    const childIds = children.map(c => c.id);
    let submission = null;
    if (childIds.length) {
      const [subs] = await pool.query(
        'SELECT * FROM homework_submissions WHERE homework_id = ? AND student_id IN (?)',
        [req.params.id, childIds]
      );
      submission = subs[0] || null;
    }

    res.json({ success: true, data: { ...hw, questions, submission } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Submit answers/photo for grading
// Without photos: submits answers only
// With photos: uploads photos and triggers AI auto-grading
router.post('/homework/:id/submit', upload.array('photos', 10), async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, error: '仅家长可访问' });
    }
    const { student_id, answers } = req.body;
    if (!student_id) {
      return res.status(400).json({ success: false, error: '缺少student_id' });
    }

    // Verify this student belongs to this parent
    const [[student]] = await pool.query(
      'SELECT * FROM students WHERE id = ? AND parent_id = ?',
      [student_id, req.user.id]
    );
    if (!student) {
      return res.status(403).json({ success: false, error: '无权操作此学生' });
    }

    // Find the submission for this homework+student
    const [[sub]] = await pool.query(
      'SELECT * FROM homework_submissions WHERE homework_id = ? AND student_id = ?',
      [req.params.id, student_id]
    );
    if (!sub) {
      return res.status(404).json({ success: false, error: '提交记录不存在' });
    }

    // Collect photo paths from uploaded files
    const photoPaths = (req.files || []).map(f => f.path);

    if (photoPaths.length > 0) {
      // Photo-based: update submission with photos and trigger AI grading
      const userAnswers = answers ? (typeof answers === 'string' ? JSON.parse(answers) : answers) : {};
      await pool.query(
        'UPDATE homework_submissions SET answers = ?, photo_paths = ?, status = ?, submitted_at = NOW() WHERE id = ?',
        [JSON.stringify(userAnswers), JSON.stringify(photoPaths), 'submitted', sub.id]
      );

      // Create grading job
      const [jobResult] = await pool.query(
        'INSERT INTO grading_jobs (submission_id, status, photo_paths) VALUES (?, ?, ?)',
        [sub.id, 'queued', JSON.stringify(photoPaths)]
      );

      res.json({
        success: true,
        data: {
          id: sub.id,
          status: 'submitted',
          jobId: jobResult.insertId,
          estimatedSeconds: 20,
        },
      });
    } else {
      // Text-only submission (no photos)
      const userAnswers = answers ? (typeof answers === 'string' ? JSON.parse(answers) : answers) : {};
      await pool.query(
        'UPDATE homework_submissions SET answers = ?, status = ?, submitted_at = NOW() WHERE id = ?',
        [JSON.stringify(userAnswers), 'submitted', sub.id]
      );
      res.json({ success: true, data: { id: sub.id, status: 'submitted' } });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Poll grading job progress
router.get('/jobs/:id', async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, error: '仅家长可访问' });
    }
    const [[job]] = await pool.query('SELECT * FROM grading_jobs WHERE id = ?', [req.params.id]);
    if (!job) return res.status(404).json({ success: false, error: '任务不存在' });

    // Verify this job belongs to a submission owned by this parent
    const [[sub]] = await pool.query(
      'SELECT s.parent_id FROM homework_submissions hs JOIN students s ON hs.student_id = s.id WHERE hs.id = ?',
      [job.submission_id]
    );
    if (!sub || sub.parent_id !== req.user.id) {
      return res.status(403).json({ success: false, error: '无权查看此任务' });
    }

    const stepLabels = {
      queued: '排队等待中…',
      processing: '正在批改中…',
      done: '批改完成',
      failed: '批改失败',
    };

    res.json({
      success: true,
      data: {
        id: job.id,
        status: job.status,
        statusLabel: stepLabels[job.status] || job.status,
        submissionId: job.submission_id,
        createdAt: job.created_at,
        finishedAt: job.finished_at,
        errorMessage: job.error_message,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Retry failed grading job
router.post('/jobs/:id/retry', async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, error: '仅家长可访问' });
    }
    const [[job]] = await pool.query('SELECT * FROM grading_jobs WHERE id = ?', [req.params.id]);
    if (!job) return res.status(404).json({ success: false, error: '任务不存在' });
    if (job.status !== 'failed') {
      return res.status(400).json({ success: false, error: '只有失败的任务可以重试' });
    }

    await pool.query(
      "UPDATE grading_jobs SET status='queued', error_message=NULL, started_at=NULL, finished_at=NULL WHERE id=?",
      [job.id]
    );

    res.json({ success: true, data: { id: job.id, status: 'queued' } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Get AI grading report for a submission
router.get('/report/:submissionId', async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, error: '仅家长可访问' });
    }

    // Verify this submission belongs to this parent
    const [[sub]] = await pool.query(
      `SELECT hs.*, s.name as student_name, s.student_number, h.title as homework_title, h.subject_id
       FROM homework_submissions hs
       JOIN students s ON hs.student_id = s.id
       JOIN homework h ON hs.homework_id = h.id
       WHERE hs.id = ? AND s.parent_id = ?`,
      [req.params.submissionId, req.user.id]
    );
    if (!sub) return res.status(404).json({ success: false, error: '提交记录不存在或无权查看' });

    // Get the grading report
    const [[report]] = await pool.query(
      'SELECT * FROM grading_reports WHERE homework_id = ? AND student_id = ? ORDER BY generated_at DESC LIMIT 1',
      [sub.homework_id, sub.student_id]
    );

    // Get questions + homework detail
    const [questions] = await pool.query(
      'SELECT q.*, hq.sort_order FROM questions q JOIN homework_questions hq ON q.id = hq.question_id WHERE hq.homework_id = ? ORDER BY hq.sort_order',
      [sub.homework_id]
    );

    // Get class stats: how many students got each question right
    const [submissionCount] = await pool.query(
      'SELECT COUNT(*) as total FROM homework_submissions WHERE homework_id = ?',
      [sub.homework_id]
    );
    const totalSubmissions = submissionCount[0].total || 0;
    const [classStats] = await pool.query(
      `SELECT hs.answers FROM homework_submissions hs WHERE hs.homework_id = ? AND hs.status = 'graded'`,
      [sub.homework_id]
    );
    const classmatesRight = {};
    questions.forEach(q => { classmatesRight[q.id] = 0; });
    classStats.forEach(s => {
      const ans = s.answers ? (typeof s.answers === 'string' ? JSON.parse(s.answers) : s.answers) : {};
      Object.entries(ans).forEach(([qId, a]) => {
        if (a.correct || a.status === 'correct') classmatesRight[parseInt(qId)] = (classmatesRight[parseInt(qId)] || 0) + 1;
      });
    });

    // Build response
    const answers = sub.answers ? (typeof sub.answers === 'string' ? JSON.parse(sub.answers) : sub.answers) : {};
    const perQuestionDetail = questions.map(q => {
      const a = answers[q.id] || {};
      return {
        questionId: q.id,
        stem: q.stem,
        type: q.type,
        correctAnswer: q.answer,
        options: q.options,
        knowledgePoint: q.knowledge_point,
        difficulty: q.difficulty,
        userAnswer: a.userAnswer || '',
        correct: a.correct !== undefined ? a.correct : (a.status === 'correct'),
        status: a.status || (a.correct ? 'correct' : 'unanswered'),
        errorCause: a.errorCause || null,
        analysis: a.analysis || '',
        classmatesRight: classmatesRight[q.id] || 0,
        totalSubmissions: totalSubmissions,
      };
    });

    res.json({
      success: true,
      data: {
        submission: {
          id: sub.id,
          homeworkId: sub.homework_id,
          homeworkTitle: sub.homework_title,
          subjectId: sub.subject_id,
          studentName: sub.student_name,
          studentNumber: sub.student_number,
          score: sub.score,
          status: sub.status,
          submittedAt: sub.submitted_at,
          gradedAt: sub.graded_at,
        },
        questions: perQuestionDetail,
        report: report ? {
          score: report.score,
          correctRate: report.correct_rate,
          letterGrade: report.letter_grade,
          aiFeedback: report.ai_feedback,
          weakPoints: report.weak_points ? (typeof report.weak_points === 'string' ? JSON.parse(report.weak_points) : report.weak_points) : [],
          trendAnalysis: report.trend_analysis,
        } : null,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Get student error book
router.get('/error-book', async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, error: '仅家长可访问' });
    }

    const { subject_id, days, student_id: sid } = req.query;

    // Get parent's children
    const [children] = await pool.query(
      'SELECT id FROM students WHERE parent_id = ?',
      [req.user.id]
    );
    if (!children.length) {
      return res.json({ success: true, data: [] });
    }
    const childIds = children.map(c => c.id);

    // Build query
    let sql = `
      SELECT eb.*, h.title as homework_title, h.subject_id, q.stem as question_stem, q.type as question_type
      FROM error_book eb
      JOIN homework h ON eb.homework_id = h.id
      JOIN questions q ON eb.question_id = q.id
      WHERE eb.student_id IN (?)`;
    const params = [childIds];

    if (sid && childIds.includes(parseInt(sid))) {
      sql += ' AND eb.student_id = ?';
      params.push(parseInt(sid));
    }
    if (subject_id) {
      sql += ' AND h.subject_id = ?';
      params.push(subject_id);
    }
    if (days) {
      sql += ' AND eb.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)';
      params.push(parseInt(days));
    }

    sql += ' ORDER BY eb.created_at DESC';

    const [rows] = await pool.query(sql, params);

    // Transform for frontend
    const data = rows.map(r => ({
      id: r.id,
      studentId: r.student_id,
      homeworkId: r.homework_id,
      homeworkTitle: r.homework_title,
      subjectId: r.subject_id,
      questionId: r.question_id,
      questionStem: r.question_stem,
      questionType: r.question_type,
      wrongAnswer: r.wrong_answer,
      correctAnswer: r.correct_answer,
      errorCause: r.error_cause,
      analysis: r.ai_analysis,
      knowledgePoint: r.knowledge_point,
      customExercise: r.custom_exercise ? (typeof r.custom_exercise === 'string' ? JSON.parse(r.custom_exercise) : r.custom_exercise) : null,
      date: r.created_at,
    }));

    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Get submission detail for parent
router.get('/submission/:id', async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, error: '仅家长可访问' });
    }
    const [[sub]] = await pool.query(
      `SELECT hs.*, s.name as student_name, s.student_number, h.title as homework_title, h.subject_id
       FROM homework_submissions hs
       JOIN students s ON hs.student_id = s.id
       JOIN homework h ON hs.homework_id = h.id
       WHERE hs.id = ? AND s.parent_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!sub) return res.status(404).json({ success: false, error: '提交记录不存在或无权查看' });

    const [questions] = await pool.query(
      'SELECT q.*, hq.sort_order FROM questions q JOIN homework_questions hq ON q.id = hq.question_id WHERE hq.homework_id = ? ORDER BY hq.sort_order',
      [sub.homework_id]
    );

    res.json({ success: true, data: { ...sub, questions } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Generate AI-powered custom practice questions based on error book
router.post('/custom-practice', async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, error: '仅家长可访问' });
    }

    const { subject_id, knowledge_points } = req.body;

    // Get student's error context
    const [children] = await pool.query('SELECT id FROM students WHERE parent_id = ?', [req.user.id]);
    const childIds = children.map(c => c.id);
    let errorContext = [];

    if (childIds.length > 0) {
      let sql = `
        SELECT eb.knowledge_point, eb.error_cause, eb.wrong_answer, eb.correct_answer, q.stem, q.type
        FROM error_book eb
        JOIN questions q ON eb.question_id = q.id
        WHERE eb.student_id IN (?)`;
      const params = [childIds];

      if (subject_id) {
        sql += ' AND eb.homework_id IN (SELECT id FROM homework WHERE subject_id = ?)';
        params.push(subject_id);
      }
      if (knowledge_points && knowledge_points.length > 0) {
        sql += ' AND eb.knowledge_point IN (?)';
        params.push(knowledge_points);
      }

      sql += ' ORDER BY eb.created_at DESC LIMIT 15';
      const [rows] = await pool.query(sql, params);
      errorContext = rows;
    }

    if (errorContext.length === 0) {
      return res.json({ success: true, data: { questions: [], message: '暂无错题数据' } });
    }

    // Build prompt for DeepSeek
    const errorsSummary = errorContext.map((e, i) =>
      `${i + 1}. 知识点: ${e.knowledge_point} | 题型: ${e.type} | 错因: ${e.error_cause || '未知'}`
    ).join('\n');

    const kps = [...new Set(errorContext.map(e => e.knowledge_point))];

    const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_KEY) {
      return res.json({ success: true, data: { questions: [], message: 'AI服务未配置' } });
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        max_tokens: 4096,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: `你是小学教研专家。根据学生的错题记录，生成一份轻量练习卷。

## 核心策略：少而精，建立信心
- 总共只出 3-5 道题
- 前 1-2 道为「热身题」：简单、学生大概率能做对，帮助建立信心
- 后 2-3 道为「提升题」：针对最薄弱的 1-2 个知识点，难度稍高于错题但不过分
- 避免连续多道同类型题目，保持新鲜感

## 题目要求
- 题干简洁明了，小学生能独立读懂
- 题型多样：calc(计算), word(应用), choice(选择), fill(填空)
- 重点覆盖：${kps.join('、')}
- 每道题附带正确答案

严格以如下JSON格式输出（只输出JSON）：
{"questions":[{"stem":"题目内容","answer":"答案","type":"calc","knowledgePoint":"知识点名称"}]}`,
          },
          {
            role: 'user',
            content: `学生薄弱知识点及错因分析：\n${errorsSummary}\n\n请生成针对性练习题目。`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[custom-practice] DeepSeek error:', errText.slice(0, 200));
      return res.status(502).json({ success: false, error: 'AI服务调用失败' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return res.json({ success: true, data: { questions: parsed.questions || [] } });
    }

    return res.json({ success: true, data: { questions: [] } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
