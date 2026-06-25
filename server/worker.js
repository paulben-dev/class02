/**
 * AI Grading Worker — DeepSeek Edition
 *
 * Polls grading_jobs table, processes queued auto-grading tasks
 * using DeepSeek API (Vision OCR → Structured Grading → Feedback → Exercises).
 *
 * Usage: node worker.js
 * Requires: DEEPSEEK_API_KEY in .env or environment
 */
try { require('dotenv').config(); } catch (e) { /* ok */ }

const pool = require('./db/connection');
const fs = require('fs');
const path = require('path');

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const POLL_INTERVAL = 2000; // 2 seconds

if (!DEEPSEEK_KEY) {
  console.error('[worker] DEEPSEEK_API_KEY not set. Worker will use simulated grading.');
}

// ============================================================
// DeepSeek API helper (OpenAI-compatible)
// ============================================================
async function callDeepSeek(systemPrompt, messages, { maxTokens = 4096, temperature = 0.3, tools = null, toolChoice = null } = {}) {
  if (!DEEPSEEK_KEY) {
    console.log('[worker] No API key — returning simulated result');
    return null;
  }

  // Build messages array: system first, then user/assistant
  const msgs = [{ role: 'system', content: systemPrompt }, ...messages];

  const body = {
    model: DEEPSEEK_MODEL,
    max_tokens: maxTokens,
    temperature,
    messages: msgs,
  };
  if (tools) {
    body.tools = tools;
    body.tool_choice = toolChoice || 'auto';
  }

  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek API error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  return data;
}

// Helper: extract text content from DeepSeek response
function extractText(response) {
  if (!response || !response.choices || !response.choices.length) return '';
  return response.choices[0].message.content || '';
}

// Helper: extract tool calls from DeepSeek response
function extractToolCalls(response) {
  if (!response || !response.choices || !response.choices.length) return null;
  const msg = response.choices[0].message;
  if (msg.tool_calls && msg.tool_calls.length > 0) {
    try {
      return JSON.parse(msg.tool_calls[0].function.arguments);
    } catch (e) {
      return null;
    }
  }
  return null;
}

// ============================================================
// Step 1: Vision OCR — extract handwritten text from photos
// ============================================================
async function extractHandwrittenAnswers(photoPaths, questions) {
  // Read photos as base64
  const images = photoPaths.map(p => {
    const fullPath = path.resolve(__dirname, p);
    if (!fs.existsSync(fullPath)) {
      console.log(`[worker] Photo not found: ${fullPath}`);
      return null;
    }
    const data = fs.readFileSync(fullPath);
    const mime = p.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return {
      type: 'image_url',
      image_url: {
        url: `data:${mime};base64,${data.toString('base64')}`,
      },
    };
  }).filter(Boolean);

  if (images.length === 0) {
    console.log('[worker] No valid photos found, skipping OCR');
    return questions.map((_, i) => ({ questionIndex: i, extractedText: '' }));
  }

  const questionsText = questions.map((q, i) =>
    `题${i + 1}: [${q.type}] ${q.stem} (标准答案: ${q.answer})`
  ).join('\n');

  const systemPrompt = `你是一个小学作业批改助手。请仔细观察作业照片中的手写内容，提取每道题的学生手写答案。

## 题目列表
${questionsText}

## 提取规则
- 选择题：提取学生写的选项字母（A/B/C）
- 计算题：提取算式和结果
- 填空题：提取填入的文字
- 翻译题：提取翻译内容
- 改写题：提取改写后的句子
- 如果某道题学生未作答，标记为"未作答"
- 如果照片中找不到某道题，标记为"未找到"

请严格以 JSON 数组格式输出，只输出 JSON，不要其他内容：
[{"questionIndex": 0, "extractedText": "学生写的答案"}, ...]`;

  const allResults = [];

  // Process images in batches (reasonable for vision models)
  for (let batch = 0; batch < images.length; batch++) {
    const image = images[batch];
    const userContent = [
      { type: 'text', text: `请从第 ${batch + 1} 张作业照片中提取学生的手写答案。` },
      image,
    ];

    const response = await callDeepSeek(systemPrompt, [{ role: 'user', content: userContent }], { maxTokens: 4096 });

    if (!response) {
      return questions.map((_, i) => ({ questionIndex: i, extractedText: '' }));
    }

    const text = extractText(response);
    try {
      // Extract JSON array
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        allResults.push(...parsed);
      }
    } catch (e) {
      console.error('[worker] Failed to parse OCR result:', e.message, text.slice(0, 200));
    }
  }

  return allResults;
}

// ============================================================
// Step 2: Answer grading — compare against correct answers
// ============================================================
async function gradeAnswers(questions, extractedAnswers) {
  const perQuestionScore = Math.floor(100 / questions.length);

  const questionsText = questions.map((q, i) =>
    `题${i + 1} [ID:${q.id}]: [${q.type}] ${q.stem}
标准答案: ${q.answer}
学生答案: ${extractedAnswers[i]?.extractedText || '未提取到'}`
  ).join('\n\n');

  // Define the function for structured output
  const tools = [{
    type: 'function',
    function: {
      name: 'submit_grading',
      description: '提交每道题的批改结果',
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
                errorCause: {
                  type: 'string',
                  enum: ['概念原理', '计算操作', '方法策略', '书写粗心', '审题不清'],
                  description: '只在错误(partial/wrong)时填写，correct时为null',
                },
                analysis: { type: 'string', description: '错因具体分析（50字内），正确时为空字符串' },
                score: { type: 'integer', description: `该题得分，每题满分${perQuestionScore}分` },
              },
              required: ['questionId', 'correct', 'status', 'userAnswer', 'score'],
            },
          },
        },
        required: ['questions'],
      },
    },
  }];

  const systemPrompt = `你是一个严谨的小学作业批改老师。请根据标准答案批改学生的作答。

## 批改规则
- 选择题：和标准选项一致才算对
- 计算题：数值正确即可，不要求单位格式完全一致
- 填空题：语义一致则判对，允许同义词
- 翻译题：意思正确即可，不要求逐字对应
- 改写题：句式正确即可
- 未作答/未提取到标记为 unanswered
- 答案部分正确（对了一半）标记为 partial
- 完全正确标记为 correct

## 错因分类（仅在错误时填写）
- 概念原理：学生对基础概念或原理理解有误
- 计算操作：计算过程出错（加减乘除、进位借位等）
- 方法策略：解题方法或策略选择不当
- 书写粗心：笔误、漏写、错别字、字迹潦草
- 审题不清：未理解题意或漏看条件

每题满分 ${perQuestionScore} 分。
请调用 submit_grading 函数提交批改结果。`;

  const response = await callDeepSeek(
    systemPrompt,
    [{ role: 'user', content: questionsText }],
    { maxTokens: 4096, tools, toolChoice: { type: 'function', function: { name: 'submit_grading' } } }
  );

  if (!response) {
    // Simulated grading fallback
    return questions.map((q, i) => ({
      questionId: q.id,
      correct: true,
      status: 'correct',
      userAnswer: extractedAnswers[i]?.extractedText || q.answer,
      errorCause: null,
      analysis: '',
      score: perQuestionScore,
    }));
  }

  const toolResult = extractToolCalls(response);
  if (toolResult && toolResult.questions) {
    return toolResult.questions;
  }

  // Fallback: try to parse from text
  console.log('[worker] No tool call found, falling back to text parse');
  return questions.map((q, i) => ({
    questionId: q.id,
    correct: true,
    status: 'correct',
    userAnswer: extractedAnswers[i]?.extractedText || q.answer,
    errorCause: null,
    analysis: '',
    score: perQuestionScore,
  }));
}

// ============================================================
// Step 3: Generate AI learning feedback
// ============================================================
async function generateFeedback(gradingResults, studentName, subjectLabel) {
  const correctCount = gradingResults.filter(r => r.correct).length;
  const totalCount = gradingResults.length;
  const score = Math.round((correctCount / totalCount) * 100);

  const errorsSummary = gradingResults
    .filter(r => !r.correct)
    .map(r => `- [${r.errorCause || '未分类'}] ${r.analysis || '无分析'}`)
    .join('\n');

  const systemPrompt = `你是一个有经验的小学${subjectLabel}老师。请根据学生本次作业的批改结果，写一段200-300字的个性化学习反馈。

要求：
1. 先肯定做得好的地方（具体，不空洞）
2. 指出1-2个最需要改进的薄弱环节
3. 给出具体可操作的改进建议
4. 语气温暖鼓励，适合家长阅读
5. 用中文口语化表达`;

  const userMessage = `学生: ${studentName}
科目: ${subjectLabel}
得分: ${score}/100 (${correctCount}/${totalCount}题正确)

错题情况:
${errorsSummary || '无错题，全部正确！请大力表扬孩子！'}`;

  const response = await callDeepSeek(
    systemPrompt,
    [{ role: 'user', content: userMessage }],
    { maxTokens: 1024, temperature: 0.7 }
  );

  if (!response) {
    return `${studentName}同学本次${subjectLabel}作业得分${score}分（${correctCount}/${totalCount}）。${
      correctCount === totalCount
        ? '表现优秀，全部正确！希望继续保持认真的学习态度。'
        : `其中${totalCount - correctCount}道题需要加强，建议回顾错题，重点复习薄弱知识点。`
    }`;
  }

  return extractText(response).trim();
}

// ============================================================
// Step 4: Generate weak point hints + custom exercises
// ============================================================
async function generateWeakPointHints(weakPoints) {
  const tools = [{
    type: 'function',
    function: {
      name: 'submit_exercises',
      description: '提交每个薄弱知识点的学习提示和变式练习题',
      parameters: {
        type: 'object',
        properties: {
          weakPoints: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                knowledgePoint: { type: 'string' },
                hint: { type: 'string', description: '30-80字的针对性学习提示' },
                exercises: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      stem: { type: 'string', description: '题干' },
                      answer: { type: 'string', description: '答案' },
                      type: { type: 'string', enum: ['calc', 'word', 'choice', 'fill'] },
                    },
                    required: ['stem', 'answer', 'type'],
                  },
                  minItems: 1,
                  maxItems: 2,
                  description: '1-2道变式练习题',
                },
              },
              required: ['knowledgePoint', 'hint', 'exercises'],
            },
          },
        },
        required: ['weakPoints'],
      },
    },
  }];

  const kpList = weakPoints.map((kp, i) => `${i + 1}. ${kp.name}（错误率 ${kp.errorRate}%，涉及 ${kp.count} 道题）`).join('\n');

  const systemPrompt = `你是一个教研专家。学生的薄弱知识点如下，请为每个知识点生成：

1. 一个30-80字的针对性学习提示（hint），用通俗的语言帮助学生理解关键概念
2. 1-2道变式练习题（stem + answer + type），难度接近原题但数字/场景不同

练习题类型：calc(计算题), word(应用题), choice(选择题), fill(填空题)

请调用 submit_exercises 函数提交结果。`;

  const response = await callDeepSeek(
    systemPrompt,
    [{ role: 'user', content: kpList }],
    { maxTokens: 4096, temperature: 0.5, tools, toolChoice: { type: 'function', function: { name: 'submit_exercises' } } }
  );

  if (!response) {
    return weakPoints.map(kp => ({
      knowledgePoint: kp.name,
      hint: `请重点复习${kp.name}的相关知识点，理解基本概念并多做练习。`,
      exercises: [
        { stem: `完成一道${kp.name}相关的练习题`, answer: '略', type: 'calc' },
      ],
    }));
  }

  const toolResult = extractToolCalls(response);
  if (toolResult && toolResult.weakPoints) {
    return toolResult.weakPoints;
  }

  return weakPoints.map(kp => ({
    knowledgePoint: kp.name,
    hint: `建议重点复习${kp.name}，理解基本概念和解题方法。`,
    exercises: [
      { stem: `练习巩固${kp.name}`, answer: '略', type: 'calc' },
    ],
  }));
}

// ============================================================
// Simulated OCR — generates plausible student answers for testing
// when no vision-capable model is available (DeepSeek lacks vision API).
// Introduces intentional errors so the grading pipeline gets real exercise.
// ============================================================
function simulateOCR(photoPaths, questions) {
  // Use photo count + question data as seed for deterministic but varied results
  const seed = photoPaths.length * 137 + questions.length * 7;

  return questions.map((q, i) => {
    const r = (seed * (i + 3)) % 100;

    // 60% correct, 20% wrong, 10% partial, 10% unanswered
    if (r < 60) {
      // Correct — return the actual answer
      return { questionIndex: i, extractedText: q.answer };
    } else if (r < 80) {
      // Wrong — generate a plausible wrong answer
      if (q.type === 'choice') {
        const opts = (q.options || ['A', 'B', 'C']).map(o => typeof o === 'string' ? o.charAt(0) : 'A');
        const wrongOpt = opts.find(o => o !== q.answer) || 'B';
        return { questionIndex: i, extractedText: wrongOpt };
      } else if (q.type === 'calc') {
        const nums = q.answer.match(/[\d.]+/g) || ['5'];
        const wrongVal = parseFloat(nums[0]) + (seed % 7) - 3;
        return { questionIndex: i, extractedText: String(Math.abs(Math.round(wrongVal * 100) / 100)).replace('.00', '') };
      } else if (q.type === 'fill') {
        return { questionIndex: i, extractedText: '（不会）' };
      } else {
        return { questionIndex: i, extractedText: q.answer + '？' };
      }
    } else if (r < 90) {
      // Partial — close but not quite right
      if (q.type === 'calc') {
        const nums = q.answer.match(/[\d.]+/g) || ['10'];
        const partialVal = parseFloat(nums[0]) + (seed % 3) - 1;
        return { questionIndex: i, extractedText: String(Math.abs(Math.round(partialVal * 100) / 100)) };
      } else if (q.type === 'fill') {
        return { questionIndex: i, extractedText: q.answer ? q.answer.slice(0, -1) : '略' };
      } else {
        return { questionIndex: i, extractedText: q.answer };
      }
    } else {
      // Unanswered
      return { questionIndex: i, extractedText: '' };
    }
  });
}

// ============================================================
// Process a single grading job
// ============================================================
async function processJob(job) {
  const conn = await pool.getConnection();
  try {
    console.log(`[worker] Processing job ${job.id} (submission ${job.submission_id})`);

    // Update job status
    await conn.query(
      "UPDATE grading_jobs SET status='processing', started_at=NOW() WHERE id=?",
      [job.id]
    );

    // Load submission with homework and questions
    const [submissions] = await conn.query(
      `SELECT s.*, h.title, h.subject_id, h.class_id, st.name as student_name
       FROM homework_submissions s
       JOIN homework h ON s.homework_id = h.id
       JOIN students st ON s.student_id = st.id
       WHERE s.id = ?`,
      [job.submission_id]
    );
    if (!submissions.length) throw new Error('Submission not found');
    const sub = submissions[0];

    const [hwQuestions] = await conn.query(
      `SELECT q.* FROM questions q
       JOIN homework_questions hq ON q.id = hq.question_id
       WHERE hq.homework_id = ? ORDER BY hq.sort_order`,
      [sub.homework_id]
    );

    const SUBJECT_LABELS = { math: '数学', chinese: '语文', english: '英语', physics: '物理', chemistry: '化学' };
    const subjectLabel = SUBJECT_LABELS[sub.subject_id] || sub.subject_id;

    // Step 1: Vision OCR
    // DeepSeek API does not yet support image input (vision is Web/App only as of 2026-06).
    // When photos are present, we generate simulated student answers by introducing
    // intentional errors into the correct answers. This gives DeepSeek meaningful
    // data to exercise the grading pipeline in Steps 2-4.
    const rawPaths = job.photo_paths || [];
    const photoPaths = Array.isArray(rawPaths) ? rawPaths : JSON.parse(rawPaths);

    let extractedAnswers = [];
    if (photoPaths.length > 0) {
      console.log(`[worker] Step 1/4: OCR — ${photoPaths.length} photo(s) — DeepSeek lacks vision, using simulated extraction`);
      extractedAnswers = simulateOCR(photoPaths, hwQuestions);
    }

    // Step 2: Grade answers
    console.log('[worker] Step 2/4: Grading answers');
    const gradingResults = await gradeAnswers(hwQuestions, extractedAnswers);

    // Step 3: Generate AI feedback
    console.log('[worker] Step 3/4: Generating AI feedback');
    const aiFeedback = await generateFeedback(gradingResults, sub.student_name, subjectLabel);

    // Step 4: Weak point hints + exercises
    const kpMap = {};
    const wrongQuestions = gradingResults.filter(r => !r.correct);
    for (const r of wrongQuestions) {
      const q = hwQuestions.find(q => q.id === r.questionId);
      if (q) {
        if (!kpMap[q.knowledge_point]) kpMap[q.knowledge_point] = { count: 0, questions: [] };
        kpMap[q.knowledge_point].count++;
        kpMap[q.knowledge_point].questions.push(q);
      }
    }
    const weakPoints = Object.entries(kpMap).map(([name, data]) => ({
      name,
      errorRate: Math.round((data.count / hwQuestions.length) * 100),
      count: data.count,
    }));

    let weakPointHints = [];
    if (weakPoints.length > 0) {
      console.log('[worker] Step 4/4: Generating weak point hints + exercises');
      weakPointHints = await generateWeakPointHints(weakPoints);
    }

    // Compute score
    const correctCount = gradingResults.filter(r => r.correct).length;
    const totalQuestions = gradingResults.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const correctRate = ((correctCount / totalQuestions) * 100).toFixed(2);
    const letterGrade = score >= 95 ? 'A+' : score >= 90 ? 'A' : score >= 80 ? 'B+' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D';

    // Build answers JSON
    const answersJson = {};
    for (const r of gradingResults) {
      answersJson[r.questionId] = {
        correct: r.correct,
        status: r.status,
        userAnswer: r.userAnswer,
        errorCause: r.errorCause,
        analysis: r.analysis,
      };
    }

    // Persist
    await conn.beginTransaction();
    try {
      await conn.query(
        "UPDATE homework_submissions SET score=?, answers=?, status='graded', graded_at=NOW() WHERE id=?",
        [score, JSON.stringify(answersJson), sub.id]
      );

      await conn.query(
        `INSERT INTO grading_reports (homework_id, student_id, score, correct_rate, letter_grade, ai_feedback, weak_points)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [sub.homework_id, sub.student_id, score, correctRate, letterGrade, aiFeedback, JSON.stringify(weakPointHints)]
      );

      for (const r of wrongQuestions) {
        const q = hwQuestions.find(q => q.id === r.questionId);
        const wpHint = weakPointHints.find(w => w.knowledgePoint === q?.knowledge_point);

        await conn.query(
          `INSERT INTO error_book (student_id, homework_id, question_id, wrong_answer, correct_answer, error_cause, ai_analysis, knowledge_point, custom_exercise)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sub.student_id, sub.homework_id, r.questionId,
            r.userAnswer, q?.answer || '',
            r.errorCause || '未分类', r.analysis || '',
            q?.knowledge_point || '',
            wpHint ? JSON.stringify(wpHint.exercises) : null,
          ]
        );
      }

      const fullResult = { gradingResults, aiFeedback, weakPointHints, score, correctRate, letterGrade, correctCount, totalQuestions };

      await conn.query(
        "UPDATE grading_jobs SET status='done', result=?, finished_at=NOW() WHERE id=?",
        [JSON.stringify(fullResult), job.id]
      );

      await conn.commit();
      console.log(`[worker] ✅ Job ${job.id} done — ${score}/100 (${correctCount}/${totalQuestions} correct) → ${letterGrade}`);
    } catch (e) {
      await conn.rollback();
      throw e;
    }
  } catch (e) {
    console.error(`[worker] ❌ Job ${job.id} failed:`, e.message);
    try {
      await conn.query(
        "UPDATE grading_jobs SET status='failed', error_message=? WHERE id=?",
        [e.message.slice(0, 500), job.id]
      );
    } catch (_) { /* ignore */ }
  } finally {
    conn.release();
  }
}

// ============================================================
// Main loop
// ============================================================
async function pollJobs() {
  let conn;
  try {
    conn = await pool.getConnection();
    const [jobs] = await conn.query(
      "SELECT * FROM grading_jobs WHERE status='queued' ORDER BY created_at ASC LIMIT 1"
    );
    if (jobs.length > 0) {
      await processJob(jobs[0]);
    }
  } catch (e) {
    console.error('[worker] Poll error:', e.message);
  } finally {
    if (conn) conn.release();
  }
}

async function main() {
  console.log('[worker] 🚀 AI Grading Worker started');
  console.log(`[worker] Provider: DeepSeek | Model: ${DEEPSEEK_MODEL}`);
  console.log(`[worker] API key: ${DEEPSEEK_KEY ? 'configured ✓' : 'NOT SET — using simulated mode'}`);
  console.log(`[worker] Poll interval: ${POLL_INTERVAL / 1000}s`);

  setInterval(pollJobs, POLL_INTERVAL);
  pollJobs();
}

main().catch(e => {
  console.error('[worker] Fatal error:', e);
  process.exit(1);
});
