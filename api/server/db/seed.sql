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
TRUNCATE TABLE teacher_classes;
TRUNCATE TABLE classes;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Users (5 teachers + 10 parents)
-- All passwords: 123456 (bcrypt hash)
-- ============================================================
INSERT INTO users (id, username, password_hash, role, display_name, subject) VALUES
-- Teachers
(1, 'wang',  '$2b$10$QHJpiVWsAcg1WLudCyQ5.Oek1PUUobqaIzMGaFuB1zC2hhEuBESCG', 'teacher', '王老师', 'math'),
(2, 'li',    '$2b$10$QHJpiVWsAcg1WLudCyQ5.Oek1PUUobqaIzMGaFuB1zC2hhEuBESCG', 'teacher', '李老师', 'chinese'),
(3, 'zhang', '$2b$10$QHJpiVWsAcg1WLudCyQ5.Oek1PUUobqaIzMGaFuB1zC2hhEuBESCG', 'teacher', '张老师', 'english'),
(4, 'liu',   '$2b$10$QHJpiVWsAcg1WLudCyQ5.Oek1PUUobqaIzMGaFuB1zC2hhEuBESCG', 'teacher', '刘老师', 'physics'),
(5, 'chen',  '$2b$10$QHJpiVWsAcg1WLudCyQ5.Oek1PUUobqaIzMGaFuB1zC2hhEuBESCG', 'teacher', '陈老师', 'chemistry'),
-- Parents (10 named parents; 5 students remain unlinked for WeChat demo users)
(6,  'parent1',  '$2b$10$QHJpiVWsAcg1WLudCyQ5.Oek1PUUobqaIzMGaFuB1zC2hhEuBESCG', 'parent', '张妈妈', NULL),
(7,  'parent2',  '$2b$10$QHJpiVWsAcg1WLudCyQ5.Oek1PUUobqaIzMGaFuB1zC2hhEuBESCG', 'parent', '赵爸爸', NULL),
(8,  'parent3',  '$2b$10$QHJpiVWsAcg1WLudCyQ5.Oek1PUUobqaIzMGaFuB1zC2hhEuBESCG', 'parent', '钱妈妈', NULL),
(9,  'parent4',  '$2b$10$QHJpiVWsAcg1WLudCyQ5.Oek1PUUobqaIzMGaFuB1zC2hhEuBESCG', 'parent', '孙爸爸', NULL),
(10, 'parent5',  '$2b$10$QHJpiVWsAcg1WLudCyQ5.Oek1PUUobqaIzMGaFuB1zC2hhEuBESCG', 'parent', '李妈妈', NULL),
(11, 'parent6',  '$2b$10$QHJpiVWsAcg1WLudCyQ5.Oek1PUUobqaIzMGaFuB1zC2hhEuBESCG', 'parent', '周爸爸', NULL),
(12, 'parent7',  '$2b$10$QHJpiVWsAcg1WLudCyQ5.Oek1PUUobqaIzMGaFuB1zC2hhEuBESCG', 'parent', '吴妈妈', NULL),
(13, 'parent8',  '$2b$10$QHJpiVWsAcg1WLudCyQ5.Oek1PUUobqaIzMGaFuB1zC2hhEuBESCG', 'parent', '郑爸爸', NULL),
(14, 'parent9',  '$2b$10$QHJpiVWsAcg1WLudCyQ5.Oek1PUUobqaIzMGaFuB1zC2hhEuBESCG', 'parent', '王妈妈', NULL),
(15, 'parent10', '$2b$10$QHJpiVWsAcg1WLudCyQ5.Oek1PUUobqaIzMGaFuB1zC2hhEuBESCG', 'parent', '冯爸爸', NULL);

-- ============================================================
-- Classes (11 classes covering all primary grades)
-- ============================================================
INSERT INTO classes (id, name, grade_level, teacher_id) VALUES
(1, '三年级1班', '三年级', 1),
(2, '三年级2班', '三年级', 2),
(3, '四年级1班', '四年级', 4),
(4, '一年级1班', '一年级', 1),
(5, '一年级2班', '一年级', 1),
(6, '二年级1班', '二年级', 1),
(7, '二年级2班', '二年级', 1),
(8, '五年级1班', '五年级', 1),
(9, '五年级2班', '五年级', 1),
(10, '六年级1班', '六年级', 1),
(11, '六年级2班', '六年级', 1);

-- ============================================================
-- Teacher-Class assignments (migrated from classes.teacher_id)
-- ============================================================
INSERT INTO teacher_classes (teacher_id, class_id) VALUES
(1, 1),   -- 王老师(math) teaches 三年级1班
(2, 2),   -- 李老师(chinese) teaches 三年级2班
(3, 2),   -- 张老师(english) teaches 三年级2班 (shares class 2 with 李老师)
(4, 3),   -- 刘老师(physics) teaches 四年级1班
(1, 3);   -- 王老师(math) also teaches 四年级1班

-- ============================================================
-- Students (15 students, 5 per class, each linked to a parent)
-- ============================================================
INSERT INTO students (id, name, class_id, parent_id, student_number) VALUES
-- 三年级1班
(1,  '赵小明', 1, 6,  '2024001'),
(2,  '钱小红', 1, 7,  '2024002'),
(3,  '孙小强', 1, 8,  '2024003'),
(4,  '李小美', 1, 9,  '2024004'),
(5,  '周小杰', 1, 10, '2024005'),
-- 三年级2班 (unlinked — for WeChat demo auto-link)
(6,  '吴小芳', 2, NULL, '2024006'),
(7,  '郑小伟', 2, NULL, '2024007'),
(8,  '王小丽', 2, NULL, '2024008'),
(9,  '冯小龙', 2, NULL, '2024009'),
(10, '陈小雅', 2, NULL, '2024010'),
-- 四年级1班
(11, '褚小天', 3, 6,  '2024011'),
(12, '卫小冰', 3, 7,  '2024012'),
(13, '蒋小磊', 3, 8,  '2024013'),
(14, '沈小静', 3, 9,  '2024014'),
(15, '韩小宇', 3, 10, '2024015');

-- ============================================================
-- Knowledge Points (hierarchical, with parent relationships)
-- ============================================================
-- Math knowledge points
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
-- Questions (100 questions, 20 per subject)
-- ============================================================

-- === Math (questions 1-20) ===
INSERT INTO questions (id, subject_id, type, stem, answer, options, knowledge_point, difficulty, grade_level, created_by) VALUES
(1,  'math', 'calc',  '1/4 + 1/4 = ?',         '1/2',  NULL,                             '同分母分数加减法', 2, '三年级', 1),
(2,  'math', 'calc',  '3/8 + 1/8 = ?',         '1/2',  NULL,                             '同分母分数加减法', 2, '三年级', 1),
(3,  'math', 'calc',  '2/3 - 1/3 = ?',         '1/3',  NULL,                             '同分母分数加减法', 2, '三年级', 1),
(4,  'math', 'calc',  '5/6 - 1/6 = ?',         '2/3',  NULL,                             '同分母分数加减法', 2, '三年级', 1),
(5,  'math', 'calc',  '1/2 + 1/4 = ?',         '3/4',  NULL,                             '异分母分数加减法', 3, '三年级', 1),
(6,  'math', 'calc',  '1/3 + 1/6 = ?',         '1/2',  NULL,                             '异分母分数加减法', 3, '三年级', 1),
(7,  'math', 'calc',  '3/4 - 1/2 = ?',         '1/4',  NULL,                             '异分母分数加减法', 3, '三年级', 1),
(8,  'math', 'calc',  '2/5 + 1/10 = ?',        '1/2',  NULL,                             '异分母分数加减法', 3, '三年级', 1),
(9,  'math', 'word',  '小明吃了1/3个蛋糕，小红吃了1/6个，一共吃了多少？', '1/2', NULL, '分数应用题', 3, '三年级', 1),
(10, 'math', 'word',  '一根绳子长5/6米，剪去1/3米，还剩多少？', '1/2', NULL, '分数应用题', 3, '三年级', 1),
(11, 'math', 'calc',  '6 × 7 = ?',             '42',   NULL,                             '乘法口诀', 1, '三年级', 1),
(12, 'math', 'calc',  '8 × 9 = ?',             '72',   NULL,                             '乘法口诀', 1, '三年级', 1),
(13, 'math', 'calc',  '7 × 8 = ?',             '56',   NULL,                             '乘法口诀', 1, '三年级', 1),
(14, 'math', 'word',  '每排8棵树，种了7排，一共多少棵？', '56', NULL,                    '乘法口诀', 2, '三年级', 1),
(15, 'math', 'calc',  '长方形长8cm，宽5cm，面积是多少？', '40cm²', NULL,                  '长方形面积', 2, '三年级', 1),
(16, 'math', 'calc',  '正方形边长6cm，周长是多少？',    '24cm',  NULL,                     '正方形周长', 2, '三年级', 1),
(17, 'math', 'calc',  '3.25 + 1.75 = ?',       '5.00', NULL,                             '小数加减法', 2, '三年级', 1),
(18, 'math', 'word',  '小明买文具花了6.5元，买零食花了3.8元，一共花了多少？', '10.3', NULL, '小数加减法', 2, '三年级', 1),
(19, 'math', 'calc',  '2.5 × 4 = ?',           '10',   NULL,                             '小数乘法', 2, '三年级', 1),
(20, 'math', 'calc',  '3.6 ÷ 4 = ?',           '0.9',  NULL,                             '小数除法', 2, '三年级', 1);

-- === Chinese (questions 21-40) ===
INSERT INTO questions (id, subject_id, type, stem, answer, options, knowledge_point, difficulty, grade_level, created_by) VALUES
(21, 'chinese', 'fill',   '床前明月光，__________。',             '疑是地上霜',            NULL,                                                                 '古诗默写', 1, '三年级', 2),
(22, 'chinese', 'choice', '"疑是地上霜"中"疑"的意思是？',         'B',                     '["A.怀疑","B.好像","C.疑问"]',                                         '字词理解', 3, '三年级', 2),
(23, 'chinese', 'fill',   '举头望明月，__________。',             '低头思故乡',            NULL,                                                                 '古诗默写', 1, '三年级', 2),
(24, 'chinese', 'fill',   '白日依山尽，__________。',             '黄河入海流',            NULL,                                                                 '古诗默写', 1, '三年级', 2),
(25, 'chinese', 'fill',   '欲穷千里目，__________。',             '更上一层楼',            NULL,                                                                 '古诗默写', 1, '三年级', 2),
(26, 'chinese', 'rewrite','把"他完成了作业"改为"把"字句',         '他把作业完成了',        NULL,                                                                 '把字句', 3, '三年级', 2),
(27, 'chinese', 'rewrite','把"风吹落了树叶"改为"被"字句',         '树叶被风吹落了',        NULL,                                                                 '被字句', 3, '三年级', 2),
(28, 'chinese', 'rewrite','把"这本书被他看完了"改为"把"字句',     '他把这本书看完了',      NULL,                                                                 '把字句', 3, '三年级', 2),
(29, 'chinese', 'fill',   '形容高兴得像发了狂一样：欣喜若___',     '狂',                    NULL,                                                                 '成语运用', 2, '三年级', 2),
(30, 'chinese', 'choice', '"画蛇添足"的意思最接近？',             'A',                     '["A.多此一举","B.栩栩如生","C.画龙点睛"]',                               '成语运用', 2, '三年级', 2),
(31, 'chinese', 'choice', '"学而时习之"中"时"的意思是？',         'B',                     '["A.时间","B.时常","C.时机"]',                                          '文言实词', 3, '三年级', 2),
(32, 'chinese', 'choice', '"月亮像圆盘"用了什么修辞？',           'B',                     '["A.拟人","B.比喻","C.夸张"]',                                          '修辞手法', 2, '三年级', 2),
(33, 'chinese', 'fill',   '用"坚持不懈"写一句话',                 '他坚持不懈地练习钢琴，终于取得了好成绩', NULL,                                       '成语运用', 3, '三年级', 2),
(34, 'chinese', 'fill',   '"行"在"银行"中读___，在"行走"中读___', 'háng,xíng',            NULL,                                                                 '多音字', 2, '三年级', 2),
(35, 'chinese', 'choice', '陈述句末尾用？',                       'A',                     '["A.句号","B.问号","C.感叹号"]',                                        '标点符号', 1, '三年级', 2),
(36, 'chinese', 'rewrite','陈述句→反问句：你应该好好学习',         '难道你不应该好好学习吗？', NULL,                                                                 '句式转换', 3, '三年级', 2),
(37, 'chinese', 'rewrite','反问句→陈述句：难道这不是事实吗？',     '这是事实',              NULL,                                                                 '句式转换', 3, '三年级', 2),
(38, 'chinese', 'rewrite','把"妈妈做好了饭"改为"被"字句',         '饭被妈妈做好了',        NULL,                                                                 '被字句', 2, '三年级', 2),
(39, 'chinese', 'choice', '"但愿人长久"的作者是？',               'B',                     '["A.李白","B.苏轼","C.杜甫"]',                                          '文言实词', 3, '三年级', 2),
(40, 'chinese', 'fill',   '填ABB式词语：红___，绿___',            '彤彤,油油',            NULL,                                                                 '词语运用', 1, '三年级', 2);

-- === English (questions 41-60) ===
INSERT INTO questions (id, subject_id, type, stem, answer, options, knowledge_point, difficulty, grade_level, created_by) VALUES
(41, 'english', 'translate', 'apple 的中文意思是？',           '苹果',       NULL,                                          '水果类单词', 1, '三年级', 3),
(42, 'english', 'translate', '"香蕉"的英文是？',               'banana',     NULL,                                          '水果类单词', 1, '三年级', 3),
(43, 'english', 'translate', '"橘子"的英文是？',               'orange',     NULL,                                          '水果类单词', 1, '三年级', 3),
(44, 'english', 'translate', 'grape 的中文意思是？',           '葡萄',       NULL,                                          '水果类单词', 1, '三年级', 3),
(45, 'english', 'fill',      'I ___ (有) a new book.',         'have',       NULL,                                          '动词have', 2, '三年级', 3),
(46, 'english', 'fill',      'She ___ (喜欢) apples very much.','likes',     NULL,                                          '三单形式', 2, '三年级', 3),
(47, 'english', 'choice',    '___ you like apples?',           'A',          '["A. Do","B. Does","C. Is"]',                   '一般疑问句', 2, '三年级', 3),
(48, 'english', 'choice',    'He ___ to school every day.',    'B',          '["A. go","B. goes","C. going"]',                '三单形式', 2, '三年级', 3),
(49, 'english', 'fill',      'I ___ (read) a book now.',       'am reading', NULL,                                          '现在进行时', 3, '三年级', 3),
(50, 'english', 'fill',      'She ___ (sing) a song.',         'is singing', NULL,                                          '现在进行时', 3, '三年级', 3),
(51, 'english', 'choice',    'Look! The boy ___.',             'B',          '["A. runs","B. is running","C. run"]',         '现在进行时', 3, '三年级', 3),
(52, 'english', 'fill',      'I ___ (go) to the park yesterday.','went',     NULL,                                          '一般过去式', 3, '三年级', 3),
(53, 'english', 'fill',      'She ___ (visit) her grandma last week.','visited', NULL,                                    '一般过去式', 3, '三年级', 3),
(54, 'english', 'fill',      'I am ___ (tall) than my brother.','taller',    NULL,                                          '比较级', 3, '四年级', 3),
(55, 'english', 'choice',    'This book is ___ than that one.','A',          '["A.more interesting","B.most interesting","C.interesting"]', '比较级', 3, '四年级', 3),
(56, 'english', 'translate', '"图书馆"的英文是？',              'library',    NULL,                                          '地点类单词', 1, '三年级', 3),
(57, 'english', 'translate', '"学校"的英文是？',               'school',     NULL,                                          '地点类单词', 1, '三年级', 3),
(58, 'english', 'fill',      'They ___ (有) many friends.',     'have',       NULL,                                          '动词have', 2, '三年级', 3),
(59, 'english', 'choice',    '___ she like reading?',          'B',          '["A. Do","B. Does","C. Is"]',                   '一般疑问句', 2, '三年级', 3),
(60, 'english', 'fill',      'The cat ___ (sleep) under the desk now.','is sleeping', NULL,                              '现在进行时', 2, '三年级', 3);

-- === Physics (questions 61-80) ===
INSERT INTO questions (id, subject_id, type, stem, answer, options, knowledge_point, difficulty, grade_level, created_by) VALUES
(61, 'physics', 'choice', '光在同种均匀介质中沿___传播。',           'A',    '["A.直线","B.曲线","C.折线"]',                                          '光的反射', 2, '四年级', 4),
(62, 'physics', 'fill',   '入射角等于___角。',                        '反射', NULL,                                                                      '光的反射', 2, '四年级', 4),
(63, 'physics', 'choice', '平面镜成像的特点是？',                     'B',    '["A.实像","B.虚像","C.倒像"]',                                              '光的反射', 2, '四年级', 4),
(64, 'physics', 'fill',   '光从空气斜射入水中时，折射角___入射角。（填"大于"或"小于"）', '小于', NULL,                                                '光的折射', 3, '四年级', 4),
(65, 'physics', 'choice', '下列哪个是导体？',                         'B',    '["A.橡胶","B.铜丝","C.玻璃"]',                                              '串联电路', 2, '四年级', 4),
(66, 'physics', 'fill',   '串联电路中，电流处处___。',                '相等', NULL,                                                                      '串联电路', 2, '四年级', 4),
(67, 'physics', 'choice', '牛顿第一定律又称为什么定律？',             'B',    '["A.万有引力定律","B.惯性定律","C.作用力定律"]',                            '牛顿定律', 3, '四年级', 4),
(68, 'physics', 'fill',   '一切物体在不受外力作用时，总保持___状态或___直线运动状态。', '静止、匀速', NULL,                                         '牛顿定律', 3, '四年级', 4),
(69, 'physics', 'choice', '物体浮在水面上时，浮力___重力。',         'B',    '["A.大于","B.等于","C.小于"]',                                              '浮力', 3, '四年级', 4),
(70, 'physics', 'fill',   '阿基米德原理：F浮 = ___',                 'ρ液gV排', NULL,                                                                  '阿基米德原理', 3, '四年级', 4),
(71, 'physics', 'choice', '省力杠杆的特点是？',                       'A',    '["A.动力臂>阻力臂","B.动力臂<阻力臂","C.动力臂=阻力臂"]',                  '杠杆', 2, '四年级', 4),
(72, 'physics', 'fill',   '声音在空气中的传播速度约为___m/s',        '340',  NULL,                                                                      '声速', 1, '四年级', 4),
(73, 'physics', 'choice', '光从空气射入水中时，光线会？',             'B',    '["A.沿直线传播","B.发生折射","C.发生反射"]',                              '光的折射', 2, '四年级', 4),
(74, 'physics', 'fill',   '凸透镜对光线有___作用。',                  '会聚', NULL,                                                                      '光的折射', 3, '四年级', 4),
(75, 'physics', 'choice', '并联电路中，各支路电压的特点是？',         'B',    '["A.各支路电压不同","B.各支路电压相等","C.总电压为零"]',                  '串联电路', 3, '四年级', 4),
(76, 'physics', 'fill',   '力的三要素是大小、方向和___。',            '作用点', NULL,                                                                    '牛顿定律', 2, '四年级', 4),
(77, 'physics', 'choice', '下列属于费力杠杆的是？',                   'B',    '["A.撬棍","B.镊子","C.剪刀"]',                                              '杠杆', 2, '四年级', 4),
(78, 'physics', 'fill',   '浸在液体中的物体所受浮力大小等于___。',    '排开液体的重力', NULL,                                                            '阿基米德原理', 3, '四年级', 4),
(79, 'physics', 'choice', '声音不能在___中传播。',                   'B',    '["A.空气","B.真空","C.水"]',                                                '声速', 1, '四年级', 4),
(80, 'physics', 'fill',   '光在真空中的速度约为___m/s。',            '3×10^8', NULL,                                                                   '光的反射', 2, '四年级', 4);

-- === Chemistry (questions 81-100) ===
INSERT INTO questions (id, subject_id, type, stem, answer, options, knowledge_point, difficulty, grade_level, created_by) VALUES
(81, 'chemistry', 'choice', '下列属于化学变化的是？',           'B', '["A.水结成冰","B.铁生锈","C.玻璃破碎"]',                                  '物理变化与化学变化', 2, '四年级', 5),
(82, 'chemistry', 'fill',   '化学变化的基本特征是___。',       '有新物质生成', NULL,                                                          '物理变化与化学变化', 2, '四年级', 5),
(83, 'chemistry', 'choice', '下列属于物理变化的是？',           'C', '["A.酒精燃烧","B.食物腐烂","C.水蒸发"]',                                '物理变化与化学变化', 2, '四年级', 5),
(84, 'chemistry', 'fill',   'H₂O表示___这种物质。',            '水', NULL,                                                                  '化学方程式', 1, '四年级', 5),
(85, 'chemistry', 'choice', '下列属于溶液的是？',               'B', '["A.牛奶","B.糖水","C.泥水"]',                                            '溶解度', 2, '四年级', 5),
(86, 'chemistry', 'fill',   '在一定温度下，某物质在100g溶剂中达到___时所溶解的质量叫溶解度。', '饱和', NULL,                                 '溶解度', 3, '四年级', 5),
(87, 'chemistry', 'fill',   '金属活动性顺序：K Ca Na Mg Al Zn ___ Sn Pb (H) ___ Hg Ag Pt Au', 'Fe,Cu', NULL, '金属活动性顺序', 3, '九年级', 5),
(88, 'chemistry', 'choice', '铁和硫酸铜溶液反应生成？',        'A', '["A.FeSO₄+Cu","B.Fe₂(SO₄)₃+Cu","C.不反应"]',                              '置换反应', 3, '九年级', 5),
(89, 'chemistry', 'choice', '元素周期表是谁发现的？',           'A', '["A.门捷列夫","B.道尔顿","C.拉瓦锡"]',                                    '元素周期表', 1, '九年级', 5),
(90, 'chemistry', 'fill',   '元素周期表中，横排称为___，纵列称为___。', '周期、族', NULL,                                                     '元素周期表', 2, '九年级', 5),
(91, 'chemistry', 'choice', '下列属于酸的是？',                 'B', '["A.NaOH","B.HCl","C.NaCl"]',                                              '酸碱盐', 3, '九年级', 5),
(92, 'chemistry', 'fill',   '酸溶液的pH值___7。（填"大于""小于"或"等于"）', '小于', NULL,                                                  '酸碱盐', 3, '九年级', 5),
(93, 'chemistry', 'choice', '下列属于碱的是？',                 'A', '["A.NaOH","B.HCl","C.NaCl"]',                                              '酸碱盐', 3, '九年级', 5),
(94, 'chemistry', 'fill',   'NaCl的化学名称是___。',           '氯化钠', NULL,                                                                '化学方程式', 1, '四年级', 5),
(95, 'chemistry', 'choice', '根据金属活动性顺序，下列能置换出氢气的是？', 'B', '["A.Cu","B.Zn","C.Ag"]',                                        '金属活动性顺序', 3, '九年级', 5),
(96, 'chemistry', 'fill',   '盐是由___离子和___离子组成的化合物。', '金属、酸根', NULL,                                                       '酸碱盐', 2, '九年级', 5),
(97, 'chemistry', 'choice', '下列属于纯净物的是？',             'C', '["A.空气","B.海水","C.蒸馏水"]',                                          '物理变化与化学变化', 2, '四年级', 5),
(98, 'chemistry', 'fill',   '化学方程式必须遵循___定律。',      '质量守恒', NULL,                                                              '化学方程式', 3, '九年级', 5),
(99, 'chemistry', 'choice', '下列金属活动性最强的是？',         'A', '["A.K","B.Fe","C.Ag"]',                                                    '金属活动性顺序', 2, '九年级', 5),
(100,'chemistry', 'fill',  'CO₂的化学名称是___。',            '二氧化碳', NULL,                                                               '化学方程式', 1, '四年级', 5);

-- ============================================================
-- Homework (6 assignments: 2 math, 2 chinese, 1 english, 1 physics)
-- ============================================================
INSERT INTO homework (id, title, subject_id, teacher_id, class_id, type, deadline, status) VALUES
(1, '分数加减法练习（三）',     'math',    1, 1, 'school', '2026-06-13', 'closed'),
(2, '古诗默写与阅读理解',       'chinese', 2, 2, 'school', '2026-06-13', 'closed'),
(3, '光的反射与折射',           'physics', 4, 3, 'school', '2026-06-17', 'active'),
(4, '乘法口诀应用练习',         'math',    1, 1, 'school', '2026-06-20', 'active'),
(5, '句式转换专项练习',         'chinese', 2, 2, 'school', '2026-06-20', 'active'),
(6, 'Unit 3 单词与句型',        'english', 3, 2, 'school', '2026-06-22', 'active');

-- ============================================================
-- Homework-Questions Mappings
-- ============================================================
-- Homework 1: 分数加减法练习 (math, 8 questions)
INSERT INTO homework_questions (homework_id, question_id, sort_order) VALUES
(1, 1, 1),  (1, 2, 2),  (1, 3, 3),  (1, 4, 4),
(1, 5, 5),  (1, 6, 6),  (1, 9, 7),  (1, 10, 8);

-- Homework 2: 古诗默写与阅读理解 (chinese, 8 questions)
INSERT INTO homework_questions (homework_id, question_id, sort_order) VALUES
(2, 21, 1), (2, 22, 2), (2, 23, 3), (2, 27, 4),
(2, 29, 5), (2, 30, 6), (2, 31, 7), (2, 32, 8);

-- Homework 3: 光的反射与折射 (physics, 8 questions)
INSERT INTO homework_questions (homework_id, question_id, sort_order) VALUES
(3, 61, 1), (3, 62, 2), (3, 63, 3), (3, 64, 4),
(3, 73, 5), (3, 74, 6), (3, 79, 7), (3, 80, 8);

-- Homework 4: 乘法口诀应用练习 (math, 8 questions)
INSERT INTO homework_questions (homework_id, question_id, sort_order) VALUES
(4, 11, 1), (4, 12, 2), (4, 13, 3), (4, 14, 4),
(4, 15, 5), (4, 16, 6), (4, 17, 7), (4, 18, 8);

-- Homework 5: 句式转换专项练习 (chinese, 8 questions)
INSERT INTO homework_questions (homework_id, question_id, sort_order) VALUES
(5, 26, 1), (5, 27, 2), (5, 28, 3), (5, 36, 4),
(5, 37, 5), (5, 38, 6), (5, 35, 7), (5, 33, 8);

-- Homework 6: Unit 3 单词与句型 (english, 8 questions)
INSERT INTO homework_questions (homework_id, question_id, sort_order) VALUES
(6, 41, 1), (6, 42, 2), (6, 45, 3), (6, 46, 4),
(6, 47, 5), (6, 48, 6), (6, 58, 7), (6, 59, 8);

-- ============================================================
-- Homework Submissions (for demo)
-- ============================================================
-- Homework 1 (closed, math - class 1): 5 students, 3 graded, 2 pending
INSERT INTO homework_submissions (homework_id, student_id, score, answers, status, submitted_at, graded_at) VALUES
(1, 1, 85, '{"1":{"correct":true,"userAnswer":"1/2"},"2":{"correct":true,"userAnswer":"1/2"},"3":{"correct":true,"userAnswer":"1/3"},"4":{"correct":true,"userAnswer":"2/3"},"5":{"correct":true,"userAnswer":"3/4"},"6":{"correct":true,"userAnswer":"1/2"},"7":{"correct":false,"userAnswer":"1/3","errorCause":"计算操作","analysis":"异分母分数加法计算错误，需通分"},"8":{"correct":true,"userAnswer":"1/2"}}', 'graded', '2026-06-12 18:30:00', '2026-06-12 20:00:00'),
(1, 2, 75, '{"1":{"correct":true,"userAnswer":"1/2"},"2":{"correct":false,"userAnswer":"1/4","errorCause":"计算操作","analysis":"同分母分数加法计算错误"},"3":{"correct":true,"userAnswer":"1/3"},"4":{"correct":true,"userAnswer":"2/3"},"5":{"correct":true,"userAnswer":"3/4"},"6":{"correct":true,"userAnswer":"1/2"},"7":{"correct":false,"userAnswer":"1/2","errorCause":"概念原理","analysis":"对分数应用题理解有误"},"8":{"correct":true,"userAnswer":"1/2"}}', 'graded', '2026-06-12 19:00:00', '2026-06-12 21:00:00'),
(1, 3, 90, '{"1":{"correct":true,"userAnswer":"1/2"},"2":{"correct":true,"userAnswer":"1/2"},"3":{"correct":true,"userAnswer":"1/3"},"4":{"correct":true,"userAnswer":"2/3"},"5":{"correct":true,"userAnswer":"3/4"},"6":{"correct":true,"userAnswer":"1/2"},"7":{"correct":true,"userAnswer":"1/2"},"8":{"correct":true,"userAnswer":"1/2"}}', 'graded', '2026-06-12 18:00:00', '2026-06-12 20:30:00'),
(1, 4, NULL, NULL, 'pending', NULL, NULL),
(1, 5, NULL, NULL, 'pending', NULL, NULL);

-- Homework 2 (closed, chinese - class 2): 5 students, 2 graded, 3 pending
INSERT INTO homework_submissions (homework_id, student_id, score, answers, status, submitted_at, graded_at) VALUES
(2, 6, 80, '{"21":{"correct":true,"userAnswer":"疑是地上霜"},"22":{"correct":false,"userAnswer":"A","errorCause":"概念原理","analysis":"疑在古诗中常作好像解"},"23":{"correct":true,"userAnswer":"低头思故乡"},"24":{"correct":true,"userAnswer":"树叶被风吹落了"},"25":{"correct":true,"userAnswer":"狂"},"26":{"correct":false,"userAnswer":"B","errorCause":"概念原理","analysis":"画蛇添足指多此一举"},"27":{"correct":true,"userAnswer":"B"},"28":{"correct":true,"userAnswer":"B"}}', 'graded', '2026-06-12 17:00:00', '2026-06-12 19:00:00'),
(2, 7, 70, '{"21":{"correct":true,"userAnswer":"疑是地上霜"},"22":{"correct":true,"userAnswer":"B"},"23":{"correct":false,"userAnswer":"低头思故香","errorCause":"书写粗心","analysis":"默写错误，应为低头思故乡"},"24":{"correct":false,"userAnswer":"他完成了作业把","errorCause":"方法策略","analysis":"把字句语序错误"},"25":{"correct":true,"userAnswer":"狂"},"26":{"correct":true,"userAnswer":"A"},"27":{"correct":false,"userAnswer":"A","errorCause":"概念原理","analysis":"时在学而时习之中作时常解"},"28":{"correct":true,"userAnswer":"B"}}', 'graded', '2026-06-12 16:30:00', '2026-06-12 18:30:00'),
(2, 8, NULL, NULL, 'pending', NULL, NULL),
(2, 9, NULL, NULL, 'pending', NULL, NULL),
(2, 10, NULL, NULL, 'pending', NULL, NULL);

-- Homework 3 (active, physics - class 3): 3 submitted, 2 pending
INSERT INTO homework_submissions (homework_id, student_id, score, answers, status, submitted_at) VALUES
(3, 11, NULL, '{"61":{"userAnswer":"A"},"62":{"userAnswer":"反射"},"63":{"userAnswer":"B"},"64":{"userAnswer":"小于"},"65":{"userAnswer":"A"},"66":{"userAnswer":"相等"},"67":{"userAnswer":"B"},"68":{"userAnswer":"静止、匀速"}}', 'submitted', '2026-06-16 10:00:00'),
(3, 12, NULL, '{"61":{"userAnswer":"A"},"62":{"userAnswer":"反射"},"63":{"userAnswer":"B"},"64":{"userAnswer":"大于"},"65":{"userAnswer":"B"},"66":{"userAnswer":"相等"},"67":{"userAnswer":"B"},"68":{"userAnswer":"静止"}}', 'submitted', '2026-06-16 10:30:00'),
(3, 13, NULL, '{"61":{"userAnswer":"B"},"62":{"userAnswer":"折射"},"63":{"userAnswer":"B"},"64":{"userAnswer":"小于"},"65":{"userAnswer":"B"},"66":{"userAnswer":"不相等"},"67":{"userAnswer":"A"},"68":{"userAnswer":"静止、匀速"}}', 'submitted', '2026-06-16 11:00:00'),
(3, 14, NULL, NULL, 'pending', NULL),
(3, 15, NULL, NULL, 'pending', NULL);

-- Homework 4 (active, math - class 1): 5 students, all pending
INSERT INTO homework_submissions (homework_id, student_id, status) VALUES
(4, 1, 'pending'), (4, 2, 'pending'), (4, 3, 'pending'), (4, 4, 'pending'), (4, 5, 'pending');

-- Homework 5 (active, chinese - class 2): 5 students, all pending
INSERT INTO homework_submissions (homework_id, student_id, status) VALUES
(5, 6, 'pending'), (5, 7, 'pending'), (5, 8, 'pending'), (5, 9, 'pending'), (5, 10, 'pending');

-- Homework 6 (active, english - class 2): 5 students, all pending
INSERT INTO homework_submissions (homework_id, student_id, status) VALUES
(6, 6, 'pending'), (6, 7, 'pending'), (6, 8, 'pending'), (6, 9, 'pending'), (6, 10, 'pending');

-- ============================================================
-- Subscriptions
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
