-- ============================================================
-- Seed Data for class2 Homework Grading Platform
-- ============================================================

-- Disable foreign key checks for clean re-import
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE subscriptions;
TRUNCATE TABLE print_history;
TRUNCATE TABLE knowledge_points;
TRUNCATE TABLE homework_submissions;
TRUNCATE TABLE homework_questions;
TRUNCATE TABLE homework;
TRUNCATE TABLE questions;
TRUNCATE TABLE students;
TRUNCATE TABLE classes;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Users (5 teachers, one per subject)
-- ============================================================
INSERT INTO users (id, username, password_hash, role, display_name, subject) VALUES
(1, 'wang',  '$2b$10$QHJpiVWsAcg1WLudCyQ5.Oek1PUUobqaIzMGaFuB1zC2hhEuBESCG', 'teacher', '王老师', 'math'),
(2, 'li',    '$2b$10$QHJpiVWsAcg1WLudCyQ5.Oek1PUUobqaIzMGaFuB1zC2hhEuBESCG', 'teacher', '李老师', 'chinese'),
(3, 'zhang', '$2b$10$QHJpiVWsAcg1WLudCyQ5.Oek1PUUobqaIzMGaFuB1zC2hhEuBESCG', 'teacher', '张老师', 'english'),
(4, 'liu',   '$2b$10$QHJpiVWsAcg1WLudCyQ5.Oek1PUUobqaIzMGaFuB1zC2hhEuBESCG', 'teacher', '刘老师', 'physics'),
(5, 'chen',  '$2b$10$QHJpiVWsAcg1WLudCyQ5.Oek1PUUobqaIzMGaFuB1zC2hhEuBESCG', 'teacher', '陈老师', 'chemistry');

-- ============================================================
-- Classes (3 classes)
-- ============================================================
INSERT INTO classes (id, name, grade_level, teacher_id) VALUES
(1, '三年级1班', '三年级', 1),
(2, '三年级2班', '三年级', 2),
(3, '四年级1班', '四年级', 4);

-- ============================================================
-- Students (15 students, 5 per class)
-- ============================================================
INSERT INTO students (id, name, class_id, student_number) VALUES
-- 三年级1班
(1,  '赵小明', 1, '2024001'),
(2,  '钱小红', 1, '2024002'),
(3,  '孙小强', 1, '2024003'),
(4,  '李小美', 1, '2024004'),
(5,  '周小杰', 1, '2024005'),
-- 三年级2班
(6,  '吴小芳', 2, '2024006'),
(7,  '郑小伟', 2, '2024007'),
(8,  '王小丽', 2, '2024008'),
(9,  '冯小龙', 2, '2024009'),
(10, '陈小雅', 2, '2024010'),
-- 四年级1班
(11, '褚小天', 3, '2024011'),
(12, '卫小冰', 3, '2024012'),
(13, '蒋小磊', 3, '2024013'),
(14, '沈小静', 3, '2024014'),
(15, '韩小宇', 3, '2024015');

-- ============================================================
-- Knowledge Points (hierarchical, with parent relationships)
-- ============================================================
-- Math knowledge points (parent_id = NULL for top-level)
INSERT INTO knowledge_points (id, name, subject_id, parent_id) VALUES
(1,  '分数', 'math', NULL),
(2,  '乘法与除法', 'math', NULL),
(3,  '几何图形', 'math', NULL),
(4,  '小数', 'math', NULL),
(5,  '同分母分数加减法', 'math', 1),
(6,  '异分母分数加减法', 'math', 1),
(7,  '分数应用题', 'math', 1),
(8,  '乘法口诀', 'math', 2),
(9,  '长方形面积', 'math', 3),
(10, '正方形周长', 'math', 3),
(11, '小数加减法', 'math', 4),
(12, '小数乘法', 'math', 4),
(13, '小数除法', 'math', 4);

-- Chinese knowledge points
INSERT INTO knowledge_points (id, name, subject_id, parent_id) VALUES
(20, '古诗文', 'chinese', NULL),
(21, '语法与句式', 'chinese', NULL),
(22, '词语运用', 'chinese', NULL),
(23, '古诗默写', 'chinese', 20),
(24, '字词理解', 'chinese', 20),
(25, '把字句', 'chinese', 21),
(26, '被字句', 'chinese', 21),
(27, '成语运用', 'chinese', 22),
(28, '文言实词', 'chinese', 20),
(29, '修辞手法', 'chinese', 21),
(30, '多音字', 'chinese', 22),
(31, '标点符号', 'chinese', 21);

-- English knowledge points
INSERT INTO knowledge_points (id, name, subject_id, parent_id) VALUES
(40, '词汇', 'english', NULL),
(41, '语法', 'english', NULL),
(42, '时态', 'english', NULL),
(43, '水果类单词', 'english', 40),
(44, '动词have', 'english', 41),
(45, '三单形式', 'english', 41),
(46, '一般疑问句', 'english', 41),
(47, '现在进行时', 'english', 42),
(48, '一般过去式', 'english', 42),
(49, '比较级', 'english', 41),
(50, '地点类单词', 'english', 40);

-- Physics knowledge points
INSERT INTO knowledge_points (id, name, subject_id, parent_id) VALUES
(60, '光学', 'physics', NULL),
(61, '电学', 'physics', NULL),
(62, '力学', 'physics', NULL),
(63, '声学', 'physics', NULL),
(64, '光的反射', 'physics', 60),
(65, '光的折射', 'physics', 60),
(66, '串联电路', 'physics', 61),
(67, '牛顿定律', 'physics', 62),
(68, '浮力', 'physics', 62),
(69, '阿基米德原理', 'physics', 62),
(70, '杠杆', 'physics', 62),
(71, '声速', 'physics', 63);

-- Chemistry knowledge points
INSERT INTO knowledge_points (id, name, subject_id, parent_id) VALUES
(80, '物质变化', 'chemistry', NULL),
(81, '化学用语', 'chemistry', NULL),
(82, '溶液', 'chemistry', NULL),
(83, '金属', 'chemistry', NULL),
(84, '元素', 'chemistry', NULL),
(85, '酸碱盐', 'chemistry', NULL),
(86, '物理变化与化学变化', 'chemistry', 80),
(87, '化学方程式', 'chemistry', 81),
(88, '溶解度', 'chemistry', 82),
(89, '金属活动性顺序', 'chemistry', 83),
(90, '置换反应', 'chemistry', 83),
(91, '元素周期表', 'chemistry', 84);

-- ============================================================
-- Questions (60 questions, 12 per subject)
-- Reuses stem/answer from index.html mockData for consistency
-- ============================================================

-- === Math (questions 1-12) ===
INSERT INTO questions (id, subject_id, type, stem, answer, options, knowledge_point, difficulty, grade_level, created_by) VALUES
(1,  'math', 'calc',  '1/4 + 1/4 = ?',         '1/2',  NULL,                             '同分母分数加减法', 2, '三年级', 1),
(2,  'math', 'calc',  '3/8 + 1/8 = ?',         '1/2',  NULL,                             '同分母分数加减法', 2, '三年级', 1),
(3,  'math', 'calc',  '2/3 - 1/3 = ?',         '1/3',  NULL,                             '同分母分数加减法', 2, '三年级', 1),
(4,  'math', 'word',  '小明吃了1/3个蛋糕，小红吃了1/6个，一共吃了多少？', '1/2', NULL, '分数应用题', 3, '三年级', 1),
(5,  'math', 'calc',  '6 × 7 = ?',             '42',   NULL,                             '乘法口诀', 1, '三年级', 1),
(6,  'math', 'calc',  '8 × 9 = ?',             '72',   NULL,                             '乘法口诀', 1, '三年级', 1),
(7,  'math', 'calc',  '长方形长8cm，宽5cm，面积是多少？', '40cm²', NULL,                  '长方形面积', 2, '三年级', 1),
(8,  'math', 'calc',  '正方形边长6cm，周长是多少？',    '24cm',  NULL,                     '正方形周长', 2, '三年级', 1),
(9,  'math', 'calc',  '3.25 + 1.75 = ?',       '5.00', NULL,                             '小数加减法', 2, '三年级', 1),
(10, 'math', 'word',  '小明买文具花了6.5元，买零食花了3.8元，一共花了多少？', '10.3', NULL, '小数加减法', 2, '三年级', 1),
(11, 'math', 'calc',  '2.5 × 4 = ?',           '10',   NULL,                             '小数乘法', 2, '三年级', 1),
(12, 'math', 'calc',  '3.6 ÷ 4 = ?',           '0.9',  NULL,                             '小数除法', 2, '三年级', 1);

-- === Chinese (questions 13-24) ===
INSERT INTO questions (id, subject_id, type, stem, answer, options, knowledge_point, difficulty, grade_level, created_by) VALUES
(13, 'chinese', 'fill',   '床前明月光，__________。',             '疑是地上霜',            NULL,                                                                 '古诗默写', 1, '三年级', 2),
(14, 'chinese', 'choice', '"疑是地上霜"中"疑"的意思是？',         'B',                     '["A.怀疑","B.好像","C.疑问"]',                                         '字词理解', 3, '三年级', 2),
(15, 'chinese', 'fill',   '举头望明月，__________。',             '低头思故乡',            NULL,                                                                 '古诗默写', 1, '三年级', 2),
(16, 'chinese', 'rewrite','把"他完成了作业"改为"把"字句',         '他把作业完成了',        NULL,                                                                 '把字句', 3, '三年级', 2),
(17, 'chinese', 'rewrite','把"风吹落了树叶"改为"被"字句',         '树叶被风吹落了',        NULL,                                                                 '被字句', 3, '三年级', 2),
(18, 'chinese', 'fill',   '形容高兴得像发了狂一样：欣喜若___',     '狂',                    NULL,                                                                 '成语运用', 2, '三年级', 2),
(19, 'chinese', 'choice', '"画蛇添足"的意思最接近？',             'A',                     '["A.多此一举","B.栩栩如生","C.画龙点睛"]',                               '成语运用', 2, '三年级', 2),
(20, 'chinese', 'choice', '"学而时习之"中"时"的意思是？',         'B',                     '["A.时间","B.时常","C.时机"]',                                          '文言实词', 3, '三年级', 2),
(21, 'chinese', 'choice', '"月亮像圆盘"用了什么修辞？',           'B',                     '["A.拟人","B.比喻","C.夸张"]',                                          '修辞手法', 2, '三年级', 2),
(22, 'chinese', 'fill',   '用"坚持不懈"写一句话',                 '他坚持不懈地练习钢琴，终于取得了好成绩', NULL,                                       '成语运用', 3, '三年级', 2),
(23, 'chinese', 'fill',   '"行"在"银行"中读___，在"行走"中读___', 'háng,xíng',            NULL,                                                                 '多音字', 2, '三年级', 2),
(24, 'chinese', 'choice', '陈述句末尾用？',                       'A',                     '["A.句号","B.问号","C.感叹号"]',                                        '标点符号', 1, '三年级', 2);

-- === English (questions 25-36) ===
INSERT INTO questions (id, subject_id, type, stem, answer, options, knowledge_point, difficulty, grade_level, created_by) VALUES
(25, 'english', 'translate', 'apple 的中文意思是？',           '苹果',       NULL,                                          '水果类单词', 1, '三年级', 3),
(26, 'english', 'translate', '"香蕉"的英文是？',               'banana',     NULL,                                          '水果类单词', 1, '三年级', 3),
(27, 'english', 'fill',      'I ___ (有) a new book.',         'have',       NULL,                                          '动词have', 2, '三年级', 3),
(28, 'english', 'fill',      'She ___ (喜欢) apples very much.','likes',     NULL,                                          '三单形式', 2, '三年级', 3),
(29, 'english', 'choice',    '___ you like apples?',           'A',          '["A. Do","B. Does","C. Is"]',                   '一般疑问句', 2, '三年级', 3),
(30, 'english', 'fill',      'I ___ (read) a book now.',       'am reading', NULL,                                          '现在进行时', 3, '三年级', 3),
(31, 'english', 'fill',      'She ___ (sing) a song.',         'is singing', NULL,                                          '现在进行时', 3, '三年级', 3),
(32, 'english', 'choice',    'Look! The boy ___.',             'B',          '["A. runs","B. is running","C. run"]',         '现在进行时', 3, '三年级', 3),
(33, 'english', 'fill',      'I ___ (go) to the park yesterday.','went',     NULL,                                          '一般过去式', 3, '三年级', 3),
(34, 'english', 'fill',      'I am ___ (tall) than my brother.','taller',    NULL,                                          '比较级', 3, '四年级', 3),
(35, 'english', 'choice',    'This book is ___ than that one.','A',          '["A.more interesting","B.most interesting","C.interesting"]', '比较级', 3, '四年级', 3),
(36, 'english', 'translate', '"图书馆"的英文是？',              'library',    NULL,                                          '地点类单词', 1, '三年级', 3);

-- === Physics (questions 37-48) ===
INSERT INTO questions (id, subject_id, type, stem, answer, options, knowledge_point, difficulty, grade_level, created_by) VALUES
(37, 'physics', 'choice', '光在同种均匀介质中沿___传播。',           'A',    '["A.直线","B.曲线","C.折线"]',                                          '光的反射', 2, '四年级', 4),
(38, 'physics', 'fill',   '入射角等于___角。',                        '反射', NULL,                                                                      '光的反射', 2, '四年级', 4),
(39, 'physics', 'choice', '平面镜成像的特点是？',                     'B',    '["A.实像","B.虚像","C.倒像"]',                                              '光的反射', 2, '四年级', 4),
(40, 'physics', 'fill',   '光从空气斜射入水中时，折射角___入射角。（填"大于"或"小于"）', '小于', NULL,                                                '光的折射', 3, '四年级', 4),
(41, 'physics', 'choice', '下列哪个是导体？',                         'B',    '["A.橡胶","B.铜丝","C.玻璃"]',                                              '串联电路', 2, '四年级', 4),
(42, 'physics', 'fill',   '串联电路中，电流处处___。',                '相等', NULL,                                                                      '串联电路', 2, '四年级', 4),
(43, 'physics', 'choice', '牛顿第一定律又称为什么定律？',             'B',    '["A.万有引力定律","B.惯性定律","C.作用力定律"]',                            '牛顿定律', 3, '四年级', 4),
(44, 'physics', 'fill',   '一切物体在不受外力作用时，总保持___状态或___直线运动状态。', '静止、匀速', NULL,                                         '牛顿定律', 3, '四年级', 4),
(45, 'physics', 'choice', '物体浮在水面上时，浮力___重力。',         'B',    '["A.大于","B.等于","C.小于"]',                                              '浮力', 3, '四年级', 4),
(46, 'physics', 'fill',   '阿基米德原理：F浮 = ___',                 'ρ液gV排', NULL,                                                                  '阿基米德原理', 3, '四年级', 4),
(47, 'physics', 'choice', '省力杠杆的特点是？',                       'A',    '["A.动力臂>阻力臂","B.动力臂<阻力臂","C.动力臂=阻力臂"]',                  '杠杆', 2, '四年级', 4),
(48, 'physics', 'fill',   '声音在空气中的传播速度约为___m/s',        '340',  NULL,                                                                      '声速', 1, '四年级', 4);

-- === Chemistry (questions 49-60) ===
INSERT INTO questions (id, subject_id, type, stem, answer, options, knowledge_point, difficulty, grade_level, created_by) VALUES
(49, 'chemistry', 'choice', '下列属于化学变化的是？',           'B', '["A.水结成冰","B.铁生锈","C.玻璃破碎"]',                                  '物理变化与化学变化', 2, '四年级', 5),
(50, 'chemistry', 'fill',   '化学变化的基本特征是___。',       '有新物质生成', NULL,                                                          '物理变化与化学变化', 2, '四年级', 5),
(51, 'chemistry', 'choice', '下列属于物理变化的是？',           'C', '["A.酒精燃烧","B.食物腐烂","C.水蒸发"]',                                '物理变化与化学变化', 2, '四年级', 5),
(52, 'chemistry', 'fill',   'H₂O表示___这种物质。',            '水', NULL,                                                                  '化学方程式', 1, '四年级', 5),
(53, 'chemistry', 'choice', '下列属于溶液的是？',               'B', '["A.牛奶","B.糖水","C.泥水"]',                                            '溶解度', 2, '四年级', 5),
(54, 'chemistry', 'fill',   '在一定温度下，某物质在100g溶剂中达到___时所溶解的质量叫溶解度。', '饱和', NULL,                                 '溶解度', 3, '四年级', 5),
(55, 'chemistry', 'fill',   '金属活动性顺序：K Ca Na Mg Al Zn ___ Sn Pb (H) ___ Hg Ag Pt Au', 'Fe,Cu', NULL, '金属活动性顺序', 3, '九年级', 5),
(56, 'chemistry', 'choice', '铁和硫酸铜溶液反应生成？',        'A', '["A.FeSO₄+Cu","B.Fe₂(SO₄)₃+Cu","C.不反应"]',                              '置换反应', 3, '九年级', 5),
(57, 'chemistry', 'choice', '元素周期表是谁发现的？',           'A', '["A.门捷列夫","B.道尔顿","C.拉瓦锡"]',                                    '元素周期表', 1, '九年级', 5),
(58, 'chemistry', 'fill',   '元素周期表中，横排称为___，纵列称为___。', '周期、族', NULL,                                                     '元素周期表', 2, '九年级', 5),
(59, 'chemistry', 'choice', '下列属于酸的是？',                 'B', '["A.NaOH","B.HCl","C.NaCl"]',                                              '酸碱盐', 3, '九年级', 5),
(60, 'chemistry', 'fill',   '酸溶液的pH值___7。（填"大于""小于"或"等于"）', '小于', NULL,                                                  '酸碱盐', 3, '九年级', 5);

-- ============================================================
-- Homework (3 sample assignments)
-- ============================================================
INSERT INTO homework (id, title, subject_id, teacher_id, class_id, type, deadline, status) VALUES
(1, '分数加减法练习（三）',     'math',    1, 1, 'school', '2026-06-13', 'closed'),
(2, '古诗默写与阅读理解',       'chinese', 2, 2, 'school', '2026-06-13', 'closed'),
(3, '光的反射与折射',           'physics', 4, 3, 'school', '2026-06-17', 'active');

-- ============================================================
-- Homework-Questions Mappings
-- ============================================================
-- Homework 1: 分数加减法练习 (math, 8 questions)
INSERT INTO homework_questions (homework_id, question_id, sort_order) VALUES
(1, 1, 1),
(1, 2, 2),
(1, 3, 3),
(1, 4, 4),
(1, 5, 5),
(1, 6, 6),
(1, 9, 7),
(1, 10, 8);

-- Homework 2: 古诗默写与阅读理解 (chinese, 8 questions)
INSERT INTO homework_questions (homework_id, question_id, sort_order) VALUES
(2, 13, 1),
(2, 14, 2),
(2, 15, 3),
(2, 18, 4),
(2, 19, 5),
(2, 20, 6),
(2, 21, 7),
(2, 23, 8);

-- Homework 3: 光的反射与折射 (physics, 6 questions)
INSERT INTO homework_questions (homework_id, question_id, sort_order) VALUES
(3, 37, 1),
(3, 38, 2),
(3, 39, 3),
(3, 40, 4),
(3, 47, 5),
(3, 48, 6);

-- ============================================================
-- Homework Submissions (sample graded + pending)
-- ============================================================
-- Homework 1 submissions (graded for 3 students)
INSERT INTO homework_submissions (homework_id, student_id, score, answers, status, submitted_at, graded_at) VALUES
(1, 1, 85, '{"1":{"correct":true,"userAnswer":"1/2"},"2":{"correct":true,"userAnswer":"1/2"},"3":{"correct":true,"userAnswer":"1/3"},"4":{"correct":true,"userAnswer":"1/2"},"5":{"correct":true,"userAnswer":"42"},"6":{"correct":true,"userAnswer":"72"},"7":{"correct":false,"userAnswer":"10","analysis":"小数加减法计算错误"},"8":{"correct":true,"userAnswer":"10.3"}}', 'graded', '2026-06-12 18:30:00', '2026-06-12 20:00:00'),
(1, 2, 75, '{"1":{"correct":true,"userAnswer":"1/2"},"2":{"correct":false,"userAnswer":"1/4","analysis":"同分母分数加法计算错误"},"3":{"correct":true,"userAnswer":"1/3"},"4":{"correct":true,"userAnswer":"1/2"},"5":{"correct":true,"userAnswer":"42"},"6":{"correct":true,"userAnswer":"72"},"7":{"correct":false,"userAnswer":"9","analysis":"小数加减法计算错误"},"8":{"correct":true,"userAnswer":"10.3"}}', 'graded', '2026-06-12 19:00:00', '2026-06-12 21:00:00'),
(1, 3, 90, '{"1":{"correct":true,"userAnswer":"1/2"},"2":{"correct":true,"userAnswer":"1/2"},"3":{"correct":true,"userAnswer":"1/3"},"4":{"correct":true,"userAnswer":"1/2"},"5":{"correct":true,"userAnswer":"42"},"6":{"correct":true,"userAnswer":"72"},"7":{"correct":true,"userAnswer":"5.00"},"8":{"correct":true,"userAnswer":"10.3"}}', 'graded', '2026-06-12 18:00:00', '2026-06-12 20:30:00'),
(1, 4, NULL, NULL, 'pending', NULL, NULL),
(1, 5, NULL, NULL, 'pending', NULL, NULL);

-- Homework 2 submissions (graded for 2 students)
INSERT INTO homework_submissions (homework_id, student_id, score, answers, status, submitted_at, graded_at) VALUES
(2, 6, 80, '{"13":{"correct":true,"userAnswer":"疑是地上霜"},"14":{"correct":false,"userAnswer":"A","analysis":"疑在古诗中常作好像解"},"15":{"correct":true,"userAnswer":"低头思故乡"},"16":{"correct":true,"userAnswer":"他以完成作业了"},"17":{"correct":true,"userAnswer":"树叶被风吹落了"},"18":{"correct":true,"userAnswer":"狂"},"19":{"correct":false,"userAnswer":"B","analysis":"画蛇添足指多此一举"},"20":{"correct":true,"userAnswer":"B"}}', 'graded', '2026-06-12 17:00:00', '2026-06-12 19:00:00'),
(2, 7, 70, '{"13":{"correct":true,"userAnswer":"疑是地上霜"},"14":{"correct":true,"userAnswer":"B"},"15":{"correct":false,"userAnswer":"低头思故香","analysis":"默写错误，应为低头思故乡"},"16":{"correct":false,"userAnswer":"他完成了作业把","analysis":"把字句语序错误"},"17":{"correct":true,"userAnswer":"树叶被风吹落了"},"18":{"correct":true,"userAnswer":"狂"},"19":{"correct":true,"userAnswer":"A"},"20":{"correct":false,"userAnswer":"A","analysis":"时在学而时习之中作时常解"}}', 'graded', '2026-06-12 16:30:00', '2026-06-12 18:30:00');

-- Homework 3 submissions (submitted, not yet graded)
INSERT INTO homework_submissions (homework_id, student_id, status, submitted_at) VALUES
(3, 11, 'submitted', '2026-06-16 10:00:00'),
(3, 12, 'submitted', '2026-06-16 10:30:00'),
(3, 13, 'submitted', '2026-06-16 11:00:00');
-- Students 14,15 still pending

-- ============================================================
-- Subscriptions (teachers have premium, for demo)
-- ============================================================
INSERT INTO subscriptions (user_id, tier, expires_at, auto_renew) VALUES
(1, 2, '2027-06-22', TRUE),
(2, 2, '2027-06-22', TRUE),
(3, 1, '2026-12-31', FALSE),
(4, 2, '2027-06-22', TRUE),
(5, 1, '2026-12-31', FALSE);

-- ============================================================
-- Done
-- ============================================================
