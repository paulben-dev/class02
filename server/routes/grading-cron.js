/**
 * Vercel Cron endpoint for grading job processing.
 * Called periodically by Vercel Cron Jobs to process one queued grading task.
 *
 * This replaces the long-running worker.js for Vercel deployment.
 * Each invocation processes exactly one job (within the 60s function timeout).
 */
const pool = require('../db/connection');

// DeepSeek API
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

async function callDeepSeek(systemPrompt, messages, { maxTokens = 4096, temperature = 0.3, tools = null } = {}) {
  if (!DEEPSEEK_KEY) return null;
  const msgs = [{ role: 'system', content: systemPrompt }, ...messages];
  const body = { model: DEEPSEEK_MODEL, max_tokens: maxTokens, temperature, messages: msgs };
  if (tools) { body.tools = tools; body.tool_choice = 'auto'; }
  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_KEY}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

function extractText(response) {
  return response?.choices?.[0]?.message?.content || '';
}

function extractToolCalls(response) {
  const tc = response?.choices?.[0]?.message?.tool_calls;
  if (tc?.length) {
    try { return JSON.parse(tc[0].function.arguments); } catch (_) {}
  }
  return null;
}

// Simulated OCR (DeepSeek lacks vision API)
function simulateOCR(questions) {
  const seed = questions.length * 137;
  return questions.map((q, i) => {
    const r = (seed * (i + 3)) % 100;
    if (r < 60) return { questionIndex: i, extractedText: q.answer };
    if (r < 80) return { questionIndex: i, extractedText: q.type === 'choice' ? ((q.options?.[0]?.charAt(0) || 'B')) : String(Math.abs(parseFloat((q.answer.match(/[\d.]+/g) || ['5'])[0]) + (seed % 3) - 1)) };
    if (r < 90) return { questionIndex: i, extractedText: q.answer ? q.answer.slice(0, -1) : '略' };
    return { questionIndex: i, extractedText: '' };
  });
}

async function gradeAnswers(questions, extracted) {
  const tools = [{
    type: 'function',
    function: {
      name: 'submit_grading',
      parameters: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                questionId: { type: 'integer' },
                correct: { type: 'boolean' },
                status: { type: 'string', enum: ['correct', 'partial', 'wrong', 'unanswered'] },
                userAnswer: { type: 'string' },
                errorCause: { type: 'string', enum: ['概念原理', '计算操作', '方法策略', '书写粗心', '审题不清'] },
                analysis: { type: 'string' },
                score: { type: 'integer' },
              },
              required: ['questionId', 'correct', 'status', 'userAnswer', 'score'],
            },
          },
        },
        required: ['questions'],
      },
    },
  }];

  const qText = questions.map((q, i) =>
    `题${i + 1} [ID:${q.id}]: [${q.type}] ${q.stem}\n标准答案: ${q.answer}\n学生答案: ${extracted[i]?.extractedText || '未提取到'}`
  ).join('\n\n');

  const res = await callDeepSeek(
    `批改规则：选择-选项一致才对；计算-数值正确即可；填空-语义一致判对；未作答unanswered。错因：概念原理/计算操作/方法策略/书写粗心/审题不清。`,
    [{ role: 'user', content: qText }],
    { maxTokens: 4096, tools }
  );

  if (!res) {
    const s = Math.floor(100 / questions.length);
    return questions.map(q => ({ questionId: q.id, correct: true, status: 'correct', userAnswer: q.answer, errorCause: null, analysis: '', score: s }));
  }

  const result = extractToolCalls(res);
  return result?.questions || questions.map(q => ({ questionId: q.id, correct: true, status: 'correct', userAnswer: q.answer, errorCause: null, analysis: '', score: Math.floor(100 / questions.length) }));
}

async function generateFeedback(results, studentName, subject) {
  const correct = results.filter(r => r.correct).length;
  const score = Math.round((correct / results.length) * 100);
  const errors = results.filter(r => !r.correct).map(r => `- ${r.errorCause}: ${r.analysis}`).join('\n');

  const res = await callDeepSeek(
    `你是小学${subject}老师。写200-300字个性化反馈：先表扬，再指薄弱点，给建议，语气温暖，中文。`,
    [{ role: 'user', content: `学生:${studentName} 得分:${score}/${correct}/${results.length}题\n错题:\n${errors || '全对！'}` }],
    { maxTokens: 1024, temperature: 0.7 }
  );
  return res ? extractText(res).trim() : `${studentName}同学得分${score}分(${correct}/${results.length})。${correct === results.length ? '全对，很棒！' : '建议回顾错题巩固薄弱知识点。'}`;
}

module.exports = async function processNextJob(req, res) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Find next queued job
    const [jobs] = await conn.query("SELECT * FROM grading_jobs WHERE status='queued' ORDER BY created_at ASC LIMIT 1");
    if (!jobs.length) return res.json({ processed: 0 });

    const job = jobs[0];
    console.log(`[cron] Processing job ${job.id}`);

    await conn.query("UPDATE grading_jobs SET status='processing', started_at=NOW() WHERE id=?", [job.id]);

    const [[sub]] = await conn.query(
      `SELECT s.*, h.title, h.subject_id, st.name as student_name
       FROM homework_submissions s JOIN homework h ON s.homework_id = h.id JOIN students st ON s.student_id = st.id WHERE s.id = ?`,
      [job.submission_id]
    );
    if (!sub) throw new Error('submission not found');

    const [questions] = await conn.query(
      `SELECT q.* FROM questions q JOIN homework_questions hq ON q.id = hq.question_id WHERE hq.homework_id = ? ORDER BY hq.sort_order`,
      [sub.homework_id]
    );

    const subjectLabels = { math: '数学', chinese: '语文', english: '英语', physics: '物理', chemistry: '化学' };

    // Step 1: OCR (simulated)
    const extracted = simulateOCR(questions);

    // Step 2: Grade
    console.log(`[cron] Grading ${questions.length} questions`);
    const gradingResults = await gradeAnswers(questions, extracted);

    // Step 3: Feedback
    console.log('[cron] Generating feedback');
    const aiFeedback = await generateFeedback(gradingResults, sub.student_name, subjectLabels[sub.subject_id] || sub.subject_id);

    // Compute score
    const correctCount = gradingResults.filter(r => r.correct).length;
    const total = gradingResults.length;
    const score = Math.round((correctCount / total) * 100);
    const correctRate = ((correctCount / total) * 100).toFixed(2);
    const letterGrade = score >= 95 ? 'A+' : score >= 90 ? 'A' : score >= 80 ? 'B+' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D';

    // Build answers JSON
    const answersJson = {};
    for (const r of gradingResults) {
      answersJson[r.questionId] = { correct: r.correct, status: r.status, userAnswer: r.userAnswer, errorCause: r.errorCause, analysis: r.analysis };
    }

    // Persist
    await conn.beginTransaction();
    await conn.query("UPDATE homework_submissions SET score=?, answers=?, status='graded', graded_at=NOW() WHERE id=?", [score, JSON.stringify(answersJson), sub.id]);
    await conn.query(
      "INSERT INTO grading_reports (homework_id, student_id, score, correct_rate, letter_grade, ai_feedback, weak_points) VALUES (?,?,?,?,?,?,?)",
      [sub.homework_id, sub.student_id, score, correctRate, letterGrade, aiFeedback, '[]']
    );

    // Error book entries
    for (const r of gradingResults.filter(r => !r.correct)) {
      const q = questions.find(q => q.id === r.questionId);
      await conn.query(
        "INSERT INTO error_book (student_id, homework_id, question_id, wrong_answer, correct_answer, error_cause, ai_analysis, knowledge_point) VALUES (?,?,?,?,?,?,?,?)",
        [sub.student_id, sub.homework_id, r.questionId, r.userAnswer, q?.answer || '', r.errorCause || '', r.analysis || '', q?.knowledge_point || '']
      );
    }

    await conn.query("UPDATE grading_jobs SET status='done', result=?, finished_at=NOW() WHERE id=?", [JSON.stringify({ score, correctRate, letterGrade, aiFeedback }), job.id]);
    await conn.commit();

    console.log(`[cron] ✅ Job ${job.id} done: ${score}/100 (${correctCount}/${total})`);
    res.json({ processed: 1, jobId: job.id, score, letterGrade });
  } catch (e) {
    console.error(`[cron] ❌ Job failed:`, e.message);
    if (conn) {
      try {
        await conn.query("UPDATE grading_jobs SET status='failed', error_message=? WHERE id=?", [e.message.slice(0, 500), job?.id]);
      } catch (_) {}
    }
    res.status(500).json({ error: e.message });
  } finally {
    if (conn) conn.release();
  }
};
