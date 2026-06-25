-- ============================================================
-- Data Expansion for class2 Homework Grading Platform
-- Adds comprehensive demo data on top of existing records
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- Part 1: Expand Classes (add grades 1-2, 5-6 that are missing)
-- ============================================================

-- Link existing classes to school
UPDATE classes SET school_id = 1 WHERE school_id IS NULL;

INSERT IGNORE INTO classes (id, name, grade_level, teacher_id, school_id) VALUES
(4,  '一年级1班', '一年级', 1, 1),
(5,  '一年级2班', '一年级', 2, 1),
(6,  '二年级1班', '二年级', 3, 1),
(7,  '二年级2班', '二年级', 4, 1),
(8,  '五年级1班', '五年级', 5, 1),
(9,  '五年级2班', '五年级', 1, 1),
(10, '六年级1班', '六年级', 2, 1),
(11, '六年级2班', '六年级', 3, 1);

-- ============================================================
-- Part 2: Expand Teacher-Class Assignments
-- ============================================================
INSERT IGNORE INTO teacher_classes (teacher_id, class_id) VALUES
-- 王老师(math) teaches classes 1, 3, 4, 5, 6, 8, 9
(1, 4), (1, 5), (1, 6), (1, 8), (1, 9),
-- 李老师(chinese) teaches classes 2, 4, 5, 7, 10
(2, 4), (2, 5), (2, 7), (2, 10),
-- 张老师(english) teaches classes 2, 3, 6, 8, 11
(3, 3), (3, 6), (3, 8), (3, 11),
-- 刘老师(physics) teaches classes 3, 8, 9, 10, 11
(4, 8), (4, 9), (4, 10), (4, 11),
-- 陈老师(chemistry) teaches classes 8, 9, 10, 11
(5, 8), (5, 9), (5, 10), (5, 11);

-- ============================================================
-- Part 3: Expand Students (add more students to all classes)
-- Total target: ~60 students (~10 per class)
-- ============================================================

-- Class 1 (三年级1班): already has 5 students (1-5), add 5 more
INSERT IGNORE INTO students (id, name, class_id, parent_id, student_number) VALUES
(16, '马小川', 1, 11, '2024016'),
(17, '牛小梅', 1, 12, '2024017'),
(18, '杨小光', 1, 13, '2024018'),
(19, '朱小云', 1, 14, '2024019'),
(20, '秦小雷', 1, 15, '2024020');

-- Class 2 (三年级2班): already has 5 students (6-10), add 5 more
INSERT IGNORE INTO students (id, name, class_id, parent_id, student_number) VALUES
(21, '尤小辉', 2, NULL, '2024021'),
(22, '许小燕', 2, NULL, '2024022'),
(23, '何小冬', 2, NULL, '2024023'),
(24, '吕小春', 2, NULL, '2024024'),
(25, '施小秋', 2, NULL, '2024025');

-- Class 3 (四年级1班): already has 5 students (11-15), add 5 more
INSERT IGNORE INTO students (id, name, class_id, parent_id, student_number) VALUES
(26, '张小曼', 3, 11, '2024026'),
(27, '孔小伟', 3, 12, '2024027'),
(28, '曹小强', 3, 13, '2024028'),
(29, '严小莉', 3, 14, '2024029'),
(30, '华小刚', 3, 15, '2024030');

-- Class 4 (一年级1班): 10 new students
INSERT IGNORE INTO students (id, name, class_id, parent_id, student_number) VALUES
(31, '丁小豆', 4, 6,  '2024031'),
(32, '于小苗', 4, 7,  '2024032'),
(33, '余小果', 4, 8,  '2024033'),
(34, '潘小乐', 4, 9,  '2024034'),
(35, '杜小安', 4, 10, '2024035'),
(36, '戴小宁', 4, NULL, '2024036'),
(37, '夏小静', 4, NULL, '2024037'),
(38, '钟小文', 4, NULL, '2024038'),
(39, '姚小明', 4, NULL, '2024039'),
(40, '汪小亮', 4, NULL, '2024040');

-- Class 5 (一年级2班): 10 students
INSERT IGNORE INTO students (id, name, class_id, parent_id, student_number) VALUES
(41, '方小美', 5, 11, '2024041'),
(42, '石小磊', 5, 12, '2024042'),
(43, '谭小涛', 5, 13, '2024043'),
(44, '廖小涵', 5, 14, '2024044'),
(45, '邹小博', 5, 15, '2024045'),
(46, '熊小萌', 5, NULL, '2024046'),
(47, '金小鑫', 5, NULL, '2024047'),
(48, '陆小璐', 5, NULL, '2024048'),
(49, '郝小好', 5, NULL, '2024049'),
(50, '白小雪', 5, NULL, '2024050');

-- Class 6 (二年级1班): 10 students
INSERT IGNORE INTO students (id, name, class_id, parent_id, student_number) VALUES
(51, '崔小智', 6, 6,  '2024051'),
(52, '康小健', 6, 7,  '2024052'),
(53, '毛小羽', 6, 8,  '2024053'),
(54, '邱小思', 6, 9,  '2024054'),
(55, '秦小艺', 6, 10, '2024055'),
(56, '江水清', 6, NULL, '2024056'),
(57, '史小册', 6, NULL, '2024057'),
(58, '顾小盼', 6, NULL, '2024058'),
(59, '侯小飞', 6, NULL, '2024059'),
(60, '龙小腾', 6, NULL, '2024060');

-- Class 8 (五年级1班): 10 students
INSERT IGNORE INTO students (id, name, class_id, parent_id, student_number) VALUES
(61, '万小里', 8, 11, '2024061'),
(62, '段小毅', 8, 12, '2024062'),
(63, '雷小鸣', 8, 13, '2024063'),
(64, '汤小圆', 8, 14, '2024064'),
(65, '尹小格', 8, 15, '2024065'),
(66, '易小峰', 8, NULL, '2024066'),
(67, '武小威', 8, NULL, '2024067'),
(68, '乔小彤', 8, NULL, '2024068'),
(69, '贺小加', 8, NULL, '2024069'),
(70, '赖小宁', 8, NULL, '2024070');

-- ============================================================
-- Part 4: Expand Homework (add more assignments across subjects)
-- ============================================================

-- Math homework for class 1 (三年级1班)
INSERT INTO homework (id, title, subject_id, teacher_id, class_id, type, deadline, status) VALUES
(16, '小数加减法综合练习', 'math', 1, 1, 'school', '2026-06-15', 'closed');

-- Math homework for class 3 (四年级1班)
INSERT INTO homework (id, title, subject_id, teacher_id, class_id, type, deadline, status) VALUES
(17, '几何图形面积计算', 'math', 1, 3, 'school', '2026-06-18', 'active');

-- Chinese homework for class 2
INSERT INTO homework (id, title, subject_id, teacher_id, class_id, type, deadline, status) VALUES
(18, '课文《春》阅读理解', 'chinese', 2, 2, 'school', '2026-06-16', 'closed');

-- Chinese homework for class 4 (一年级1班)
INSERT INTO homework (id, title, subject_id, teacher_id, class_id, type, deadline, status) VALUES
(19, '拼音与生字练习', 'chinese', 2, 4, 'school', '2026-06-25', 'active');

-- English homework for class 2
INSERT INTO homework (id, title, subject_id, teacher_id, class_id, type, deadline, status) VALUES
(20, 'Unit 4 现在进行时专项', 'english', 3, 2, 'school', '2026-06-19', 'active');

-- English homework for class 6 (二年级1班)
INSERT INTO homework (id, title, subject_id, teacher_id, class_id, type, deadline, status) VALUES
(21, 'Unit 1 基础词汇与句型', 'english', 3, 6, 'school', '2026-06-26', 'active');

-- Physics homework for class 3
INSERT INTO homework (id, title, subject_id, teacher_id, class_id, type, deadline, status) VALUES
(22, '牛顿定律应用练习', 'physics', 4, 3, 'school', '2026-06-14', 'closed');

-- Physics homework for class 8 (五年级1班)
INSERT INTO homework (id, title, subject_id, teacher_id, class_id, type, deadline, status) VALUES
(23, '电路分析与计算', 'physics', 4, 8, 'school', '2026-06-28', 'active');

-- Chemistry homework (currently none!)
INSERT INTO homework (id, title, subject_id, teacher_id, class_id, type, deadline, status) VALUES
(24, '化学变化与物理变化', 'chemistry', 5, 8, 'school', '2026-06-18', 'active'),
(25, '酸碱盐基础练习', 'chemistry', 5, 9, 'school', '2026-06-27', 'active');

-- Math homework for class 6 (二年级1班)
INSERT INTO homework (id, title, subject_id, teacher_id, class_id, type, deadline, status) VALUES
(26, '乘法口诀大挑战', 'math', 1, 6, 'school', '2026-06-29', 'active');

-- ============================================================
-- Part 5: Homework-Questions Mappings
-- ============================================================

-- Hw 16: 小数加减法综合练习 (math) - questions 17,18,19,20 + extras
INSERT IGNORE INTO homework_questions (homework_id, question_id, sort_order) VALUES
(16, 17, 1), (16, 18, 2), (16, 19, 3), (16, 20, 4),
(16, 11, 5), (16, 12, 6), (16, 15, 7), (16, 16, 8);

-- Hw 17: 几何图形面积计算 (math) - questions about area/perimeter
INSERT IGNORE INTO homework_questions (homework_id, question_id, sort_order) VALUES
(17, 15, 1), (17, 16, 2), (17, 17, 3), (17, 18, 4),
(17, 19, 5), (17, 20, 6), (17, 1, 7), (17, 5, 8);

-- Hw 18: 课文《春》阅读理解 (chinese)
INSERT IGNORE INTO homework_questions (homework_id, question_id, sort_order) VALUES
(18, 22, 1), (18, 23, 2), (18, 27, 3), (18, 29, 4),
(18, 30, 5), (18, 31, 6), (18, 32, 7), (18, 40, 8);

-- Hw 19: 拼音与生字练习 (chinese)
INSERT IGNORE INTO homework_questions (homework_id, question_id, sort_order) VALUES
(19, 21, 1), (19, 24, 2), (19, 25, 3), (19, 34, 4),
(19, 36, 5), (19, 37, 6), (19, 38, 7), (19, 40, 8);

-- Hw 20: Unit 4 现在进行时 (english)
INSERT IGNORE INTO homework_questions (homework_id, question_id, sort_order) VALUES
(20, 49, 1), (20, 50, 2), (20, 51, 3), (20, 60, 4),
(20, 47, 5), (20, 48, 6), (20, 45, 7), (20, 58, 8);

-- Hw 21: Unit 1 基础词汇 (english)
INSERT IGNORE INTO homework_questions (homework_id, question_id, sort_order) VALUES
(21, 41, 1), (21, 42, 2), (21, 43, 3), (21, 44, 4),
(21, 56, 5), (21, 57, 6), (21, 45, 7), (21, 47, 8);

-- Hw 22: 牛顿定律应用 (physics)
INSERT IGNORE INTO homework_questions (homework_id, question_id, sort_order) VALUES
(22, 67, 1), (22, 68, 2), (22, 76, 3), (22, 69, 4),
(22, 70, 5), (22, 71, 6), (22, 77, 7), (22, 78, 8);

-- Hw 23: 电路分析与计算 (physics)
INSERT IGNORE INTO homework_questions (homework_id, question_id, sort_order) VALUES
(23, 65, 1), (23, 66, 2), (23, 75, 3), (23, 61, 4),
(23, 72, 5), (23, 79, 6), (23, 80, 7), (23, 62, 8);

-- Hw 24: 化学变化与物理变化 (chemistry)
INSERT IGNORE INTO homework_questions (homework_id, question_id, sort_order) VALUES
(24, 81, 1), (24, 82, 2), (24, 83, 3), (24, 97, 4),
(24, 84, 5), (24, 94, 6), (24, 100, 7), (24, 89, 8);

-- Hw 25: 酸碱盐基础 (chemistry)
INSERT IGNORE INTO homework_questions (homework_id, question_id, sort_order) VALUES
(25, 91, 1), (25, 92, 2), (25, 93, 3), (25, 96, 4),
(25, 87, 5), (25, 88, 6), (25, 95, 7), (25, 99, 8);

-- Hw 26: 乘法口诀大挑战 (math)
INSERT IGNORE INTO homework_questions (homework_id, question_id, sort_order) VALUES
(26, 11, 1), (26, 12, 2), (26, 13, 3), (26, 14, 4),
(26, 15, 5), (26, 16, 6), (26, 17, 7), (26, 18, 8);

-- ============================================================
-- Part 6: Expand Submissions (graded, submitted, pending)
-- ============================================================

-- Hw 16 (closed, math - class 1): 10 students, 8 graded, 2 pending
INSERT IGNORE INTO homework_submissions (homework_id, student_id, score, answers, status, submitted_at, graded_at) VALUES
(16, 1,  92, '{"17":{"correct":true,"userAnswer":"5.00"},"18":{"correct":true,"userAnswer":"10.3"},"19":{"correct":true,"userAnswer":"10"},"20":{"correct":true,"userAnswer":"0.9"},"11":{"correct":true,"userAnswer":"42"},"12":{"correct":true,"userAnswer":"72"},"15":{"correct":true,"userAnswer":"40cm²"},"16":{"correct":true,"userAnswer":"24cm"}}', 'graded', '2026-06-14 18:00:00', '2026-06-14 20:00:00'),
(16, 2,  78, '{"17":{"correct":true,"userAnswer":"5.00"},"18":{"correct":true,"userAnswer":"10.3"},"19":{"correct":true,"userAnswer":"10"},"20":{"correct":false,"userAnswer":"0.09","errorCause":"计算操作","analysis":"小数除法小数点位置错误，3.6÷4应得0.9"},"11":{"correct":true,"userAnswer":"42"},"12":{"correct":true,"userAnswer":"72"},"15":{"correct":false,"userAnswer":"40","errorCause":"书写粗心","analysis":"面积单位未写cm²"},"16":{"correct":true,"userAnswer":"24cm"}}', 'graded', '2026-06-14 19:00:00', '2026-06-14 21:00:00'),
(16, 3,  88, '{"17":{"correct":true,"userAnswer":"5.00"},"18":{"correct":true,"userAnswer":"10.3"},"19":{"correct":true,"userAnswer":"10"},"20":{"correct":true,"userAnswer":"0.9"},"11":{"correct":true,"userAnswer":"42"},"12":{"correct":false,"userAnswer":"63","errorCause":"计算操作","analysis":"8×9=72，乘法口诀记忆错误"},"15":{"correct":true,"userAnswer":"40cm²"},"16":{"correct":true,"userAnswer":"24cm"}}', 'graded', '2026-06-14 17:30:00', '2026-06-14 20:30:00'),
(16, 4,  95, '{"17":{"correct":true,"userAnswer":"5.00"},"18":{"correct":true,"userAnswer":"10.3"},"19":{"correct":true,"userAnswer":"10"},"20":{"correct":true,"userAnswer":"0.9"},"11":{"correct":true,"userAnswer":"42"},"12":{"correct":true,"userAnswer":"72"},"15":{"correct":true,"userAnswer":"40cm²"},"16":{"correct":true,"userAnswer":"24cm"}}', 'graded', '2026-06-14 18:45:00', '2026-06-14 21:00:00'),
(16, 5,  70, '{"17":{"correct":true,"userAnswer":"5.00"},"18":{"correct":false,"userAnswer":"9.3","errorCause":"计算操作","analysis":"6.5+3.8进位错误，应为10.3"},"19":{"correct":true,"userAnswer":"10"},"20":{"correct":false,"userAnswer":"1.2","errorCause":"概念原理","analysis":"对小数除法的概念理解有误"},"11":{"correct":true,"userAnswer":"42"},"12":{"correct":true,"userAnswer":"72"},"15":{"correct":false,"userAnswer":"13cm²","errorCause":"方法策略","analysis":"用周长公式计算了面积，长方形面积=长×宽=8×5=40"},"16":{"correct":true,"userAnswer":"24cm"}}', 'graded', '2026-06-14 19:30:00', '2026-06-14 21:30:00'),
(16, 16, 82, '{"17":{"correct":true,"userAnswer":"5.00"},"18":{"correct":true,"userAnswer":"10.3"},"19":{"correct":true,"userAnswer":"10"},"20":{"correct":true,"userAnswer":"0.9"},"11":{"correct":true,"userAnswer":"42"},"12":{"correct":true,"userAnswer":"72"},"15":{"correct":true,"userAnswer":"40cm²"},"16":{"correct":false,"userAnswer":"12cm","errorCause":"概念原理","analysis":"正方形周长=边长×4=24，与面积公式混淆"}}', 'graded', '2026-06-14 20:00:00', '2026-06-15 08:00:00'),
(16, 17, 60, '{"17":{"correct":true,"userAnswer":"5.00"},"18":{"correct":false,"userAnswer":"11.3","errorCause":"计算操作","analysis":"小数加法错误"},"19":{"correct":false,"userAnswer":"5","errorCause":"概念原理","analysis":"2.5×4概念不清"},"20":{"correct":true,"userAnswer":"0.9"},"11":{"correct":true,"userAnswer":"42"},"12":{"correct":false,"userAnswer":"81","errorCause":"书写粗心","analysis":"8×9=72"},"15":{"correct":false,"userAnswer":"26cm²","errorCause":"方法策略","analysis":"用周长公式(8+5)×2"},"16":{"correct":true,"userAnswer":"24cm"}}', 'graded', '2026-06-14 20:30:00', '2026-06-15 08:30:00'),
(16, 18, 85, '{"17":{"correct":true,"userAnswer":"5.00"},"18":{"correct":true,"userAnswer":"10.3"},"19":{"correct":true,"userAnswer":"10"},"20":{"correct":true,"userAnswer":"0.9"},"11":{"correct":true,"userAnswer":"42"},"12":{"correct":true,"userAnswer":"72"},"15":{"correct":true,"userAnswer":"40cm²"},"16":{"correct":true,"userAnswer":"24cm"}}', 'graded', '2026-06-14 21:00:00', '2026-06-15 09:00:00'),
(16, 19, NULL, NULL, 'submitted', '2026-06-15 10:00:00', NULL),
(16, 20, NULL, NULL, 'pending', NULL, NULL);

-- Hw 18 (closed, chinese - class 2): 10 students, 7 graded
INSERT IGNORE INTO homework_submissions (homework_id, student_id, score, answers, status, submitted_at, graded_at) VALUES
(18, 6,  85, '{"22":{"correct":true,"userAnswer":"B"},"23":{"correct":true,"userAnswer":"低头思故乡"},"27":{"correct":true,"userAnswer":"树叶被风吹落了"},"29":{"correct":true,"userAnswer":"狂"},"30":{"correct":true,"userAnswer":"A"},"31":{"correct":true,"userAnswer":"B"},"32":{"correct":true,"userAnswer":"B"},"40":{"correct":true,"userAnswer":"彤彤,油油"}}', 'graded', '2026-06-15 17:00:00', '2026-06-15 19:00:00'),
(18, 7,  72, '{"22":{"correct":true,"userAnswer":"B"},"23":{"correct":false,"userAnswer":"低头思古乡","errorCause":"书写粗心","analysis":"默写错字"},"27":{"correct":true,"userAnswer":"树叶被风吹落了"},"29":{"correct":false,"userAnswer":"旺","errorCause":"概念原理","analysis":"欣喜若狂而非欣喜若旺"},"30":{"correct":true,"userAnswer":"A"},"31":{"correct":false,"userAnswer":"A","errorCause":"概念原理","analysis":"时在学而时习之中作时常解"},"32":{"correct":true,"userAnswer":"B"},"40":{"correct":true,"userAnswer":"彤彤,油油"}}', 'graded', '2026-06-15 18:00:00', '2026-06-15 20:00:00'),
(18, 8,  90, '{"22":{"correct":true,"userAnswer":"B"},"23":{"correct":true,"userAnswer":"低头思故乡"},"27":{"correct":true,"userAnswer":"树叶被风吹落了"},"29":{"correct":true,"userAnswer":"狂"},"30":{"correct":true,"userAnswer":"A"},"31":{"correct":true,"userAnswer":"B"},"32":{"correct":true,"userAnswer":"B"},"40":{"correct":true,"userAnswer":"彤彤,油油"}}', 'graded', '2026-06-15 18:30:00', '2026-06-15 20:30:00'),
(18, 9,  68, '{"22":{"correct":false,"userAnswer":"A","errorCause":"概念原理","analysis":"疑在古诗中作好像解"},"23":{"correct":true,"userAnswer":"低头思故乡"},"27":{"correct":false,"userAnswer":"风把树叶吹落了","errorCause":"方法策略","analysis":"被字句结构应为树叶+被+风吹落"},"29":{"correct":true,"userAnswer":"狂"},"30":{"correct":true,"userAnswer":"A"},"31":{"correct":true,"userAnswer":"B"},"32":{"correct":true,"userAnswer":"B"},"40":{"correct":false,"userAnswer":"红红,绿绿","errorCause":"书写粗心","analysis":"ABB式应为彤彤、油油"}}', 'graded', '2026-06-15 19:00:00', '2026-06-16 08:00:00'),
(18, 10, 75, '{"22":{"correct":true,"userAnswer":"B"},"23":{"correct":true,"userAnswer":"低头思故乡"},"27":{"correct":true,"userAnswer":"树叶被风吹落了"},"29":{"correct":true,"userAnswer":"狂"},"30":{"correct":true,"userAnswer":"A"},"31":{"correct":false,"userAnswer":"C","errorCause":"概念原理","analysis":"文言实词理解不足"},"32":{"correct":true,"userAnswer":"B"},"40":{"correct":true,"userAnswer":"彤彤,油油"}}', 'graded', '2026-06-16 09:00:00', '2026-06-16 10:00:00'),
(18, 21, 88, '{"22":{"correct":true,"userAnswer":"B"},"23":{"correct":true,"userAnswer":"低头思故乡"},"27":{"correct":true,"userAnswer":"树叶被风吹落了"},"29":{"correct":true,"userAnswer":"狂"},"30":{"correct":true,"userAnswer":"A"},"31":{"correct":true,"userAnswer":"B"},"32":{"correct":true,"userAnswer":"B"},"40":{"correct":true,"userAnswer":"彤彤,油油"}}', 'graded', '2026-06-16 09:30:00', '2026-06-16 10:30:00'),
(18, 22, 82, '{"22":{"correct":true,"userAnswer":"B"},"23":{"correct":true,"userAnswer":"低头思故乡"},"27":{"correct":true,"userAnswer":"树叶被风吹落了"},"29":{"correct":true,"userAnswer":"狂"},"30":{"correct":true,"userAnswer":"A"},"31":{"correct":true,"userAnswer":"B"},"32":{"correct":false,"userAnswer":"B","errorCause":"概念原理","analysis":"修辞手法混淆"},"40":{"correct":true,"userAnswer":"彤彤,油油"}}', 'graded', '2026-06-16 10:00:00', '2026-06-16 11:00:00'),
(18, 23, NULL, NULL, 'submitted', '2026-06-16 11:00:00', NULL),
(18, 24, NULL, NULL, 'pending', NULL, NULL),
(18, 25, NULL, NULL, 'pending', NULL, NULL);

-- Hw 22 (closed, physics - class 3): 10 students, 6 graded
INSERT IGNORE INTO homework_submissions (homework_id, student_id, score, answers, status, submitted_at, graded_at) VALUES
(22, 11, 88, '{"67":{"correct":true,"userAnswer":"B"},"68":{"correct":true,"userAnswer":"静止、匀速"},"76":{"correct":true,"userAnswer":"作用点"},"69":{"correct":true,"userAnswer":"B"},"70":{"correct":true,"userAnswer":"ρ液gV排"},"71":{"correct":true,"userAnswer":"A"},"77":{"correct":true,"userAnswer":"B"},"78":{"correct":true,"userAnswer":"排开液体的重力"}}', 'graded', '2026-06-13 18:00:00', '2026-06-13 20:00:00'),
(22, 12, 75, '{"67":{"correct":true,"userAnswer":"B"},"68":{"correct":true,"userAnswer":"静止、匀速"},"76":{"correct":true,"userAnswer":"作用点"},"69":{"correct":false,"userAnswer":"C","errorCause":"概念原理","analysis":"漂浮时浮力=重力"},"70":{"correct":true,"userAnswer":"ρ液gV排"},"71":{"correct":true,"userAnswer":"A"},"77":{"correct":false,"userAnswer":"A","errorCause":"概念原理","analysis":"镊子是费力杠杆"},"78":{"correct":true,"userAnswer":"排开液体的重力"}}', 'graded', '2026-06-13 19:00:00', '2026-06-14 08:00:00'),
(22, 13, 82, '{"67":{"correct":true,"userAnswer":"B"},"68":{"correct":true,"userAnswer":"静止、匀速"},"76":{"correct":true,"userAnswer":"作用点"},"69":{"correct":true,"userAnswer":"B"},"70":{"correct":true,"userAnswer":"ρ液gV排"},"71":{"correct":true,"userAnswer":"A"},"77":{"correct":true,"userAnswer":"B"},"78":{"correct":false,"userAnswer":"物体重力","errorCause":"概念原理","analysis":"浮力等于排开液体的重力"}}', 'graded', '2026-06-13 20:00:00', '2026-06-14 08:30:00'),
(22, 14, 65, '{"67":{"correct":true,"userAnswer":"B"},"68":{"correct":false,"userAnswer":"静止","errorCause":"书写粗心","analysis":"漏写了匀速"},"76":{"correct":true,"userAnswer":"作用点"},"69":{"correct":false,"userAnswer":"C","errorCause":"概念原理","analysis":"浮力与重力关系不清"},"70":{"correct":false,"userAnswer":"G排","errorCause":"方法策略","analysis":"未写出完整公式ρ液gV排"},"71":{"correct":true,"userAnswer":"A"},"77":{"correct":true,"userAnswer":"B"},"78":{"correct":false,"userAnswer":"液体重量","errorCause":"概念原理","analysis":"表达不准确"}}', 'graded', '2026-06-14 09:00:00', '2026-06-14 10:00:00'),
(22, 15, 90, '{"67":{"correct":true,"userAnswer":"B"},"68":{"correct":true,"userAnswer":"静止、匀速"},"76":{"correct":true,"userAnswer":"作用点"},"69":{"correct":true,"userAnswer":"B"},"70":{"correct":true,"userAnswer":"ρ液gV排"},"71":{"correct":true,"userAnswer":"A"},"77":{"correct":true,"userAnswer":"B"},"78":{"correct":true,"userAnswer":"排开液体的重力"}}', 'graded', '2026-06-14 09:30:00', '2026-06-14 10:30:00'),
(22, 26, 78, '{"67":{"correct":true,"userAnswer":"B"},"68":{"correct":true,"userAnswer":"静止、匀速"},"76":{"correct":true,"userAnswer":"作用点"},"69":{"correct":true,"userAnswer":"B"},"70":{"correct":true,"userAnswer":"ρ液gV排"},"71":{"correct":false,"userAnswer":"B","errorCause":"概念原理","analysis":"省力杠杆动力臂>阻力臂"},"77":{"correct":true,"userAnswer":"B"},"78":{"correct":true,"userAnswer":"排开液体的重力"}}', 'graded', '2026-06-14 10:00:00', '2026-06-14 11:00:00'),
(22, 27, NULL, NULL, 'submitted', '2026-06-14 11:00:00', NULL),
(22, 28, NULL, NULL, 'submitted', '2026-06-14 12:00:00', NULL),
(22, 29, NULL, NULL, 'pending', NULL, NULL),
(22, 30, NULL, NULL, 'pending', NULL, NULL);

-- Hw 17 (active, math - class 3): 10 students enrolled, 5 submitted
INSERT IGNORE INTO homework_submissions (homework_id, student_id, status) VALUES
(17, 11, 'pending'), (17, 12, 'pending'), (17, 13, 'pending'),
(17, 14, 'pending'), (17, 15, 'pending'), (17, 26, 'pending'),
(17, 27, 'pending'), (17, 28, 'pending'), (17, 29, 'pending'),
(17, 30, 'pending');

-- Hw 19 (active, chinese - class 4): 10 students enrolled
INSERT IGNORE INTO homework_submissions (homework_id, student_id, status) VALUES
(19, 31, 'pending'), (19, 32, 'pending'), (19, 33, 'pending'),
(19, 34, 'pending'), (19, 35, 'pending'), (19, 36, 'pending'),
(19, 37, 'pending'), (19, 38, 'pending'), (19, 39, 'pending'),
(19, 40, 'pending');

-- Hw 20 (active, english - class 2): 10 students, 4 submitted, 2 graded
INSERT IGNORE INTO homework_submissions (homework_id, student_id, score, answers, status, submitted_at, graded_at) VALUES
(20, 6,  90, '{"49":{"correct":true,"userAnswer":"am reading"},"50":{"correct":true,"userAnswer":"is singing"},"51":{"correct":true,"userAnswer":"B"},"60":{"correct":true,"userAnswer":"is sleeping"},"47":{"correct":true,"userAnswer":"A"},"48":{"correct":true,"userAnswer":"B"},"45":{"correct":true,"userAnswer":"have"},"58":{"correct":true,"userAnswer":"have"}}', 'graded', '2026-06-18 16:00:00', '2026-06-18 18:00:00'),
(20, 7,  78, '{"49":{"correct":true,"userAnswer":"am reading"},"50":{"correct":true,"userAnswer":"is singing"},"51":{"correct":true,"userAnswer":"B"},"60":{"correct":true,"userAnswer":"is sleeping"},"47":{"correct":true,"userAnswer":"A"},"48":{"correct":false,"userAnswer":"A","errorCause":"概念原理","analysis":"三单he后用goes"},"45":{"correct":true,"userAnswer":"have"},"58":{"correct":false,"userAnswer":"has","errorCause":"概念原理","analysis":"they后用have而非has"}}', 'graded', '2026-06-18 17:00:00', '2026-06-18 19:00:00'),
(20, 8,  NULL, '{"49":{"userAnswer":"reading"},"50":{"userAnswer":"singing"},"51":{"userAnswer":"B"},"60":{"userAnswer":"sleeping"},"47":{"userAnswer":"A"},"48":{"userAnswer":"B"},"45":{"userAnswer":"have"},"58":{"userAnswer":"have"}}', 'submitted', '2026-06-18 18:00:00', NULL),
(20, 9,  NULL, '{"49":{"userAnswer":"am reading"},"50":{"userAnswer":"is singing"},"51":{"userAnswer":"C"},"60":{"userAnswer":"is sleeping"},"47":{"userAnswer":"B"},"48":{"userAnswer":"B"},"45":{"userAnswer":"have"},"58":{"userAnswer":"have"}}', 'submitted', '2026-06-18 19:00:00', NULL),
(20, 10, 'pending', NULL, 'pending', NULL, NULL),
(20, 21, 'pending', NULL, 'pending', NULL, NULL),
(20, 22, 'pending', NULL, 'pending', NULL, NULL),
(20, 23, 'pending', NULL, 'pending', NULL, NULL),
(20, 24, 'pending', NULL, 'pending', NULL, NULL),
(20, 25, 'pending', NULL, 'pending', NULL, NULL);

-- Hw 24 (active, chemistry - class 8): 10 students, 3 submitted
INSERT IGNORE INTO homework_submissions (homework_id, student_id, score, answers, status, submitted_at, graded_at) VALUES
(24, 61, NULL, '{"81":{"userAnswer":"B"},"82":{"userAnswer":"有新物质生成"},"83":{"userAnswer":"C"},"97":{"userAnswer":"C"},"84":{"userAnswer":"水"},"94":{"userAnswer":"氯化钠"},"100":{"userAnswer":"二氧化碳"},"89":{"userAnswer":"A"}}', 'submitted', '2026-06-17 14:00:00', NULL),
(24, 62, NULL, '{"81":{"userAnswer":"B"},"82":{"userAnswer":"产生新物质"},"83":{"userAnswer":"C"},"97":{"userAnswer":"B"},"84":{"userAnswer":"水"},"94":{"userAnswer":"食盐"},"100":{"userAnswer":"二氧化碳"},"89":{"userAnswer":"A"}}', 'submitted', '2026-06-17 15:00:00', NULL),
(24, 63, NULL, '{"81":{"userAnswer":"A"},"82":{"userAnswer":"有新物质生成"},"83":{"userAnswer":"C"},"97":{"userAnswer":"C"},"84":{"userAnswer":"H2O"},"94":{"userAnswer":"NaCl"},"100":{"userAnswer":"CO2"},"89":{"userAnswer":"B"}}', 'submitted', '2026-06-17 16:00:00', NULL),
(24, 64, 'pending', NULL, 'pending', NULL, NULL),
(24, 65, 'pending', NULL, 'pending', NULL, NULL),
(24, 66, 'pending', NULL, 'pending', NULL, NULL),
(24, 67, 'pending', NULL, 'pending', NULL, NULL),
(24, 68, 'pending', NULL, 'pending', NULL, NULL),
(24, 69, 'pending', NULL, 'pending', NULL, NULL),
(24, 70, 'pending', NULL, 'pending', NULL, NULL);

-- Hw 3 (active, physics - class 3): add more submissions beyond existing 5
INSERT IGNORE INTO homework_submissions (homework_id, student_id, status) VALUES
(3, 26, 'pending'), (3, 27, 'pending'), (3, 28, 'pending'),
(3, 29, 'pending'), (3, 30, 'pending');

-- Hw 4 (active, math - class 1): add submissions for new students 16-20
INSERT IGNORE INTO homework_submissions (homework_id, student_id, status) VALUES
(4, 16, 'pending'), (4, 17, 'pending'), (4, 18, 'pending'),
(4, 19, 'pending'), (4, 20, 'pending');

-- Hw 5 (active, chinese - class 2): add submissions for new students 21-25
INSERT IGNORE INTO homework_submissions (homework_id, student_id, status) VALUES
(5, 21, 'pending'), (5, 22, 'pending'), (5, 23, 'pending'),
(5, 24, 'pending'), (5, 25, 'pending');

-- Hw 6 (active, english - class 2): add submissions for new students 21-25
INSERT IGNORE INTO homework_submissions (homework_id, student_id, status) VALUES
(6, 21, 'pending'), (6, 22, 'pending'), (6, 23, 'pending'),
(6, 24, 'pending'), (6, 25, 'pending');

-- ============================================================
-- Part 7: Expand Subscriptions (add for parents)
-- ============================================================
INSERT IGNORE INTO subscriptions (user_id, tier, expires_at, auto_renew) VALUES
(6,  2, '2027-06-22', TRUE),   -- 张妈妈 (premium)
(7,  1, '2026-12-31', FALSE),  -- 赵爸爸 (basic)
(8,  2, '2027-03-15', TRUE),   -- 钱妈妈 (premium)
(9,  0, NULL, FALSE),          -- 孙爸爸 (free)
(10, 1, '2026-09-30', FALSE),  -- 李妈妈 (basic)
(11, 2, '2027-01-01', TRUE);   -- 周爸爸 (premium)

-- ============================================================
-- Part 8: Print History (add demo records)
-- ============================================================
INSERT IGNORE INTO print_history (id, user_id, title, type, meta) VALUES
(1, 1, '分数加减法练习（三）- 三年级1班', 'homework', '{"homework_id": 1, "class_id": 1, "pages": 2}'),
(2, 2, '古诗默写与阅读理解 - 三年级2班', 'homework', '{"homework_id": 2, "class_id": 2, "pages": 3}'),
(3, 1, '小数加减法综合练习 - 三年级1班', 'homework', '{"homework_id": 16, "class_id": 1, "pages": 2}'),
(4, 6, '赵小明 - 学习报告', 'report', '{"student_id": 1, "type": "monthly", "month": "2026-06"}'),
(5, 7, '钱小红 - 错题本', 'errors', '{"student_id": 2, "subject": "math", "count": 5}'),
(6, 1, '三年级1班 - 期末复习卷', 'custom', '{"class_id": 1, "questions": 20, "pages": 4}'),
(7, 8, '孙小强 - 学习报告', 'report', '{"student_id": 3, "type": "weekly", "week": "2026-W24"}'),
(8, 3, 'Unit 3 单词与句型 - 三年级2班', 'homework', '{"homework_id": 6, "class_id": 2, "pages": 2}');

-- ============================================================
-- Done
-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;
