# Data Cache & Mock Data Expansion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Persist core mock data to localStorage so user data survives refresh, and expand mock data from 20→40 homework entries with corresponding grading results.

**Architecture:** Extend existing `loadState()`/`saveState()` to cover `homework`, `gradingResults`, `knowledgePoints`, `subjects`. Add 20 new homework entries to `mockData.homework` array following existing format. Pre-compute grading results for 15 new entries using the existing `hw.id * 137` seed pattern.

**Tech Stack:** HTML5 + CSS3 + vanilla JS (ES6+), localStorage

## Global Constraints

- Cache fields: `homework`, `gradingResults`, `knowledgePoints`, `subjects` in `hwa_state`
- New homework: IDs 21-40
- New grading results: IDs 21-35 (15 entries)
- `loadState`: each field uses `if (state.homework) mockData.homework = state.homework` guard (absent → stays default)
- `saveState`: each field written unconditionally
- Backward compatible — old localStorage without these fields still works
- "恢复出厂设置" clears all cached data
- Grading results use existing deterministic pattern `hw.id * 137` as seed
- All existing 20 homework entries and existing grading results remain unchanged

---

### Task 1: Expand loadState and saveState to cache data fields

**Files:**
- Modify: `index.html` — `loadState()` and `saveState()` functions

**Interfaces:**
- Produces: loadState reads `homework`, `gradingResults`, `knowledgePoints`, `subjects`; saveState writes them

- [ ] **Step 1: Add data field reads in loadState()**

In `loadState()`, after the existing `if (state.fontSize)` line (currently ~line 2652), add:

```javascript
          if (state.homework) mockData.homework = state.homework;
          if (state.gradingResults) mockData.gradingResults = state.gradingResults;
          if (state.knowledgePoints) mockData.knowledgePoints = state.knowledgePoints;
          if (state.subjects) mockData.subjects = state.subjects;
```

- [ ] **Step 2: Add data field writes in saveState()**

In `saveState()`, after the `fontSize` line (currently ~line 2670), add:

```javascript
        homework: mockData.homework,
        gradingResults: mockData.gradingResults,
        knowledgePoints: mockData.knowledgePoints,
        subjects: mockData.subjects,
```

- [ ] **Step 3: Verify backward compatibility**

Test in browser console:
```javascript
// Clear state, reload — should use defaults (no error)
localStorage.removeItem('hwa_state');
location.reload();
// After load, check mockData.homework has 20 entries
console.log(mockData.homework.length); // Expected: 20
// Force save, check localStorage
saveState();
var s = JSON.parse(localStorage.getItem('hwa_state'));
console.log(s.homework ? 'cached' : 'missing'); // Expected: 'cached'
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: cache homework/gradingResults/knowledgePoints/subjects to localStorage"
```

---

### Task 2: Add 20 new homework entries

**Files:**
- Modify: `index.html` — append to `mockData.homework` array

**Interfaces:**
- Produces: 20 new entries (IDs 21-40) in `mockData.homework`
- Consumes: existing mockData structure, knowledge points from Task 3

- [ ] **Step 1: Append new entries to mockData.homework array**

Insert the following 20 homework entries after the last existing entry (ID 20), inside the `homework: [` array. Each entry follows the exact existing format.

```javascript
        {
          id: 21, subjectId: 'math', title: '小数乘除法练习',
          teacher: '王老师', deadline: '2026-06-18', type: 'school',
          totalQuestions: 8, submitted: 36, totalStudents: 42, status: 'graded',
          questions: [
            { id: 1, type: 'calc', stem: '2.5 × 4 = ?', answer: '10', knowledgePoint: '小数乘法' },
            { id: 2, type: 'calc', stem: '3.6 ÷ 4 = ?', answer: '0.9', knowledgePoint: '小数除法' },
            { id: 3, type: 'calc', stem: '1.25 × 8 = ?', answer: '10', knowledgePoint: '小数乘法' },
            { id: 4, type: 'calc', stem: '7.2 ÷ 0.9 = ?', answer: '8', knowledgePoint: '小数除法' },
            { id: 5, type: 'calc', stem: '0.5 × 0.6 = ?', answer: '0.3', knowledgePoint: '小数乘法' },
            { id: 6, type: 'word', stem: '一支笔2.5元，买4支需要多少元？', answer: '10', knowledgePoint: '小数乘法' },
            { id: 7, type: 'word', stem: '3.6米长的绳子平均分成4段，每段多长？', answer: '0.9', knowledgePoint: '小数除法' },
            { id: 8, type: 'calc', stem: '4.8 ÷ 1.2 = ?', answer: '4', knowledgePoint: '小数除法' },
          ]
        },
        {
          id: 22, subjectId: 'math', title: '比例与百分比应用题',
          teacher: '王老师', deadline: '2026-06-19', type: 'school',
          totalQuestions: 6, submitted: 40, totalStudents: 42, status: 'graded',
          questions: [
            { id: 1, type: 'calc', stem: '男生20人，女生25人，男女生比例是多少？', answer: '4:5', knowledgePoint: '比例' },
            { id: 2, type: 'calc', stem: '一件衣服原价200元，打8折后多少元？', answer: '160', knowledgePoint: '百分比' },
            { id: 3, type: 'word', stem: '班级共45人，男生占2/5，男生多少人？', answer: '18', knowledgePoint: '比例应用' },
            { id: 4, type: 'calc', stem: '一本书看了60页，占全书的30%，全书多少页？', answer: '200', knowledgePoint: '百分比' },
            { id: 5, type: 'word', stem: '甲：乙=3：5，甲为18，乙为？', answer: '30', knowledgePoint: '比例' },
            { id: 6, type: 'calc', stem: '800的25%是多少？', answer: '200', knowledgePoint: '百分比' },
          ]
        },
        {
          id: 23, subjectId: 'math', title: '周长与面积综合',
          teacher: '王老师', deadline: '2026-06-20', type: 'custom',
          totalQuestions: 6, submitted: 32, totalStudents: 42, status: 'graded',
          questions: [
            { id: 1, type: 'calc', stem: '圆的半径是5cm，周长是多少？（π取3.14）', answer: '31.4cm', knowledgePoint: '圆周长' },
            { id: 2, type: 'calc', stem: '圆的半径是5cm，面积是多少？', answer: '78.5cm²', knowledgePoint: '圆面积' },
            { id: 3, type: 'calc', stem: '三角形底8cm高6cm，面积是多少？', answer: '24cm²', knowledgePoint: '三角形面积' },
            { id: 4, type: 'calc', stem: '梯形上底4cm下底8cm高5cm，面积是多少？', answer: '30cm²', knowledgePoint: '梯形面积' },
            { id: 5, type: 'word', stem: '一个圆形花坛直径20米，围一圈栏杆要多少米？', answer: '62.8m', knowledgePoint: '圆周长' },
            { id: 6, type: 'word', stem: '平行四边形底12cm高7cm，面积是多少？', answer: '84cm²', knowledgePoint: '平行四边形面积' },
          ]
        },
        {
          id: 24, subjectId: 'math', title: '分数混合运算',
          teacher: '王老师', deadline: '2026-06-21', type: 'school',
          totalQuestions: 8, submitted: 38, totalStudents: 42, status: 'pending',
          questions: [
            { id: 1, type: 'calc', stem: '1/2 + 1/3 = ?', answer: '5/6', knowledgePoint: '异分母分数加法' },
            { id: 2, type: 'calc', stem: '3/4 - 1/3 = ?', answer: '5/12', knowledgePoint: '异分母分数减法' },
            { id: 3, type: 'calc', stem: '1/2 × 2/3 = ?', answer: '1/3', knowledgePoint: '分数乘法' },
            { id: 4, type: 'calc', stem: '3/4 ÷ 1/2 = ?', answer: '3/2', knowledgePoint: '分数除法' },
            { id: 5, type: 'calc', stem: '(1/2 + 1/4) × 2 = ?', answer: '3/2', knowledgePoint: '分数混合运算' },
            { id: 6, type: 'calc', stem: '2/5 + 3/10 - 1/5 = ?', answer: '1/2', knowledgePoint: '分数混合运算' },
            { id: 7, type: 'word', stem: '一瓶饮料3/4升，喝掉1/3，还剩多少？', answer: '1/2升', knowledgePoint: '分数应用题' },
            { id: 8, type: 'calc', stem: '5/6 ÷ 5/12 = ?', answer: '2', knowledgePoint: '分数除法' },
          ]
        },
        {
          id: 25, subjectId: 'chinese', title: '文言文阅读：《论语》选读',
          teacher: '李老师', deadline: '2026-06-18', type: 'school',
          totalQuestions: 5, submitted: 35, totalStudents: 42, status: 'graded',
          questions: [
            { id: 1, type: 'choice', stem: '"学而时习之"中"时"的意思是？A.时间 B.时常 C.时机', answer: 'B', knowledgePoint: '文言实词' },
            { id: 2, type: 'fill', stem: '"三人行，必有我师焉"的下一句是？', answer: '择其善者而从之，其不善者而改之', knowledgePoint: '古诗默写' },
            { id: 3, type: 'choice', stem: '"温故而知新"的含义是？A.复习旧知获得新知 B.回忆过去展望未来 C.学习历史了解现在', answer: 'A', knowledgePoint: '诗意理解' },
            { id: 4, type: 'choice', stem: '《论语》的作者是？A.孔子 B.孔子的弟子及再传弟子 C.孟子', answer: 'B', knowledgePoint: '文学常识' },
            { id: 5, type: 'fill', stem: '"学而不思则罔，__________。"', answer: '思而不学则殆', knowledgePoint: '古诗默写' },
          ]
        },
        {
          id: 26, subjectId: 'chinese', title: '修辞手法辨析',
          teacher: '李老师', deadline: '2026-06-19', type: 'school',
          totalQuestions: 6, submitted: 40, totalStudents: 42, status: 'graded',
          questions: [
            { id: 1, type: 'choice', stem: '"月亮像圆盘"用了什么修辞？A.拟人 B.比喻 C.夸张', answer: 'B', knowledgePoint: '修辞手法' },
            { id: 2, type: 'choice', stem: '"小草从土里探出头来"用了什么修辞？A.比喻 B.拟人 C.排比', answer: 'B', knowledgePoint: '修辞手法' },
            { id: 3, type: 'choice', stem: '"他的心像刀割一样疼"用了什么修辞？A.拟人 B.夸张 C.比喻', answer: 'B', knowledgePoint: '修辞手法' },
            { id: 4, type: 'fill', stem: '用"像……一样"造一个比喻句', answer: '她的笑容像阳光一样温暖', knowledgePoint: '修辞运用' },
            { id: 5, type: 'choice', stem: '"有的……有的……有的……"是？A.比喻 B.拟人 C.排比', answer: 'C', knowledgePoint: '修辞手法' },
            { id: 6, type: 'fill', stem: '把"风很大"改为夸张句', answer: '风大得能把人吹飞', knowledgePoint: '修辞运用' },
          ]
        },
        {
          id: 27, subjectId: 'chinese', title: '多音字与形近字',
          teacher: '李老师', deadline: '2026-06-20', type: 'school',
          totalQuestions: 8, submitted: 38, totalStudents: 42, status: 'graded',
          questions: [
            { id: 1, type: 'choice', stem: '"音乐"中"乐"的读音是？A.lè B.yuè', answer: 'B', knowledgePoint: '多音字' },
            { id: 2, type: 'fill', stem: '"行"在"银行"中读___，在"行走"中读___', answer: 'háng,xíng', knowledgePoint: '多音字' },
            { id: 3, type: 'choice', stem: '哪个和"清"字形相近？A.晴 B.明 C.江', answer: 'A', knowledgePoint: '形近字' },
            { id: 4, type: 'fill', stem: '"己、已、巳"分别组词', answer: '自己、已经、巳时', knowledgePoint: '形近字' },
            { id: 5, type: 'choice', stem: '"方便"中"便"的读音是？A.biàn B.pián', answer: 'A', knowledgePoint: '多音字' },
            { id: 6, type: 'fill', stem: '"漂"在"漂流"中读___，在"漂亮"中读___', answer: 'piāo,piào', knowledgePoint: '多音字' },
            { id: 7, type: 'choice', stem: '哪个与"幕"形近？A.墓 B.阳 C.布', answer: 'A', knowledgePoint: '形近字' },
            { id: 8, type: 'fill', stem: '写出"清"的3个形近字', answer: '晴、睛、请', knowledgePoint: '形近字' },
          ]
        },
        {
          id: 28, subjectId: 'chinese', title: '说明文阅读训练',
          teacher: '李老师', deadline: '2026-06-21', type: 'custom',
          totalQuestions: 5, submitted: 30, totalStudents: 42, status: 'pending',
          questions: [
            { id: 1, type: 'choice', stem: '说明文最主要的表达方式是？A.描写 B.说明 C.议论', answer: 'B', knowledgePoint: '文体知识' },
            { id: 2, type: 'fill', stem: '常见的说明方法有哪三种？', answer: '列数字、举例子、打比方', knowledgePoint: '说明方法' },
            { id: 3, type: 'choice', stem: '"太阳约130万个地球那么大"用了什么说明方法？A.打比方 B.列数字 C.作比较', answer: 'C', knowledgePoint: '说明方法' },
            { id: 4, type: 'fill', stem: '说明文的顺序有哪些？（至少写2种）', answer: '时间顺序、空间顺序', knowledgePoint: '文体知识' },
            { id: 5, type: 'choice', stem: '说明文语言的显著特点是？A.生动形象 B.准确严密 C.含蓄优美', answer: 'B', knowledgePoint: '语言特点' },
          ]
        },
        {
          id: 29, subjectId: 'english', title: '现在完成时练习',
          teacher: '张老师', deadline: '2026-06-18', type: 'school',
          totalQuestions: 6, submitted: 36, totalStudents: 42, status: 'graded',
          questions: [
            { id: 1, type: 'fill', stem: 'I ___ (finish) my homework already.', answer: 'have finished', knowledgePoint: '现在完成时' },
            { id: 2, type: 'fill', stem: 'She ___ (be) to Beijing twice.', answer: 'has been', knowledgePoint: '现在完成时' },
            { id: 3, type: 'choice', stem: 'He ___ just ___ (go) out. A.has,go B.has,gone C.have,gone', answer: 'B', knowledgePoint: '现在完成时' },
            { id: 4, type: 'fill', stem: 'They ___ (not see) the movie yet.', answer: 'haven\'t seen', knowledgePoint: '现在完成时' },
            { id: 5, type: 'choice', stem: '___ you ever ___ (be) to Shanghai? A.Have,been B.Has,been C.Did,be', answer: 'A', knowledgePoint: '现在完成时' },
            { id: 6, type: 'rewrite', stem: 'I finished the work. (改为现在完成时)', answer: 'I have finished the work.', knowledgePoint: '现在完成时' },
          ]
        },
        {
          id: 30, subjectId: 'english', title: '形容词比较级与最高级',
          teacher: '张老师', deadline: '2026-06-19', type: 'school',
          totalQuestions: 8, submitted: 40, totalStudents: 42, status: 'graded',
          questions: [
            { id: 1, type: 'fill', stem: 'I am ___ (tall) than my brother.', answer: 'taller', knowledgePoint: '比较级' },
            { id: 2, type: 'fill', stem: 'She is the ___ (beautiful) girl in class.', answer: 'most beautiful', knowledgePoint: '最高级' },
            { id: 3, type: 'choice', stem: 'This book is ___ than that one. A.more interesting B.most interesting C.interesting', answer: 'A', knowledgePoint: '比较级' },
            { id: 4, type: 'fill', stem: 'He runs ___ (fast) than me.', answer: 'faster', knowledgePoint: '比较级' },
            { id: 5, type: 'choice', stem: 'Shanghai is one of the ___ cities in China. A.big B.bigger C.biggest', answer: 'C', knowledgePoint: '最高级' },
            { id: 6, type: 'fill', stem: 'good的比较级是___，最高级是___', answer: 'better,best', knowledgePoint: '不规则比较级' },
            { id: 7, type: 'choice', stem: 'bad的最高级是？A.bader B.worse C.worst', answer: 'C', knowledgePoint: '不规则比较级' },
            { id: 8, type: 'rewrite', stem: 'Tom is 12. Jack is 10. (用比较级合并)', answer: 'Tom is older than Jack.', knowledgePoint: '比较级' },
          ]
        },
        {
          id: 31, subjectId: 'english', title: '英语阅读理解（科普篇）',
          teacher: '张老师', deadline: '2026-06-20', type: 'school',
          totalQuestions: 5, submitted: 35, totalStudents: 42, status: 'graded',
          questions: [
            { id: 1, type: 'choice', stem: 'What is the main idea? A.Animals B.The sun C.Water cycle', answer: 'C', knowledgePoint: '阅读理解' },
            { id: 2, type: 'fill', stem: 'Water turns into ___ when heated.', answer: 'steam', knowledgePoint: '阅读理解' },
            { id: 3, type: 'choice', stem: 'Rain comes from? A.Clouds B.Trees C.Rivers', answer: 'A', knowledgePoint: '阅读理解' },
            { id: 4, type: 'choice', stem: 'The passage is probably from a? A.Story book B.Science book C.Cook book', answer: 'B', knowledgePoint: '阅读理解' },
            { id: 5, type: 'fill', stem: 'Translate: "The sun makes water warm."', answer: '太阳使水变暖', knowledgePoint: '翻译' },
          ]
        },
        {
          id: 32, subjectId: 'english', title: '英语单词听写（三）',
          teacher: '张老师', deadline: '2026-06-21', type: 'school',
          totalQuestions: 10, submitted: 30, totalStudents: 42, status: 'pending',
          questions: [
            { id: 1, type: 'translate', stem: '"图书馆"的英文是？', answer: 'library', knowledgePoint: '地点类单词' },
            { id: 2, type: 'translate', stem: '"医院"的英文是？', answer: 'hospital', knowledgePoint: '地点类单词' },
            { id: 3, type: 'translate', stem: 'supermarket的中文意思是？', answer: '超市', knowledgePoint: '地点类单词' },
            { id: 4, type: 'translate', stem: '"厨师"的英文是？', answer: 'cook', knowledgePoint: '职业类单词' },
            { id: 5, type: 'translate', stem: 'policeman的中文意思是？', answer: '警察', knowledgePoint: '职业类单词' },
            { id: 6, type: 'translate', stem: '"医生"的英文是？', answer: 'doctor', knowledgePoint: '职业类单词' },
            { id: 7, type: 'translate', stem: '"星期一"的英文是？', answer: 'Monday', knowledgePoint: '星期类单词' },
            { id: 8, type: 'translate', stem: 'Saturday的中文意思是？', answer: '星期六', knowledgePoint: '星期类单词' },
            { id: 9, type: 'translate', stem: '"春天"的英文是？', answer: 'spring', knowledgePoint: '季节类单词' },
            { id: 10, type: 'translate', stem: 'autumn的中文意思是？', answer: '秋天', knowledgePoint: '季节类单词' },
          ]
        },
        {
          id: 33, subjectId: 'physics', title: '浮力与密度',
          teacher: '陈老师', deadline: '2026-06-18', type: 'school',
          totalQuestions: 6, submitted: 36, totalStudents: 42, status: 'graded',
          questions: [
            { id: 1, type: 'choice', stem: '物体浮在水面上时，浮力___重力。A.大于 B.等于 C.小于', answer: 'B', knowledgePoint: '浮力' },
            { id: 2, type: 'calc', stem: '物体体积200cm³，浸入水中排开水的体积150cm³，浮力多大？（g=10N/kg）', answer: '1.5N', knowledgePoint: '阿基米德原理' },
            { id: 3, type: 'choice', stem: '铁块在水中下沉因为？A.密���大于水 B.密度小于水 C.没有浮力', answer: 'A', knowledgePoint: '密度与浮沉' },
            { id: 4, type: 'fill', stem: '阿基米德原理：F浮 = ___', answer: 'ρ液gV排', knowledgePoint: '阿基米德原理' },
            { id: 5, type: 'choice', stem: '一艘船从河流到海洋，吃水深度？A.变深 B.变浅 C.不变', answer: 'B', knowledgePoint: '浮力应用' },
            { id: 6, type: 'calc', stem: '物体重5N，浸入水中后浮力为3N，弹簧秤读数为？', answer: '2N', knowledgePoint: '浮力' },
          ]
        },
        {
          id: 34, subjectId: 'physics', title: '简单机械：杠杆与滑轮',
          teacher: '陈老师', deadline: '2026-06-19', type: 'school',
          totalQuestions: 6, submitted: 38, totalStudents: 42, status: 'graded',
          questions: [
            { id: 1, type: 'choice', stem: '省力杠杆的特点是？A.动力臂>阻力臂 B.动力臂<阻力臂 C.动力臂=阻力臂', answer: 'A', knowledgePoint: '杠杆' },
            { id: 2, type: 'calc', stem: '动力臂40cm，阻力臂10cm，阻力200N，动力？', answer: '50N', knowledgePoint: '杠杆平衡' },
            { id: 3, type: 'choice', stem: '定滑轮的作用是？A.省力 B.改变力的方向 C.省距离', answer: 'B', knowledgePoint: '滑轮' },
            { id: 4, type: 'calc', stem: '动滑轮提升100N物体，拉力至少？（不计摩擦和滑轮重）', answer: '50N', knowledgePoint: '动滑轮' },
            { id: 5, type: 'choice', stem: '筷子属于什么杠杆？A.省力 B.费力 C.等臂', answer: 'B', knowledgePoint: '杠杆应用' },
            { id: 6, type: 'fill', stem: '杠杆平衡条件公式：F1 × L1 = ___', answer: 'F2 × L2', knowledgePoint: '杠杆平衡' },
          ]
        },
        {
          id: 35, subjectId: 'physics', title: '声现象与光现象',
          teacher: '陈老师', deadline: '2026-06-20', type: 'school',
          totalQuestions: 8, submitted: 40, totalStudents: 42, status: 'graded',
          questions: [
            { id: 1, type: 'choice', stem: '声音的传播需要？A.空气 B.介质 C.真空', answer: 'B', knowledgePoint: '声音传播' },
            { id: 2, type: 'fill', stem: '声音在空气中的传播速度约为___m/s', answer: '340', knowledgePoint: '声速' },
            { id: 3, type: 'choice', stem: '光的反射定律中，入射角___反射角。A.大于 B.等于 C.小于', answer: 'B', knowledgePoint: '光的反射' },
            { id: 4, type: 'choice', stem: '筷子在水中看起来弯折是因为？A.反射 B.折射 C.衍射', answer: 'B', knowledgePoint: '光的折射' },
            { id: 5, type: 'fill', stem: '光在真空中的速度约___km/s', answer: '300000', knowledgePoint: '光速' },
            { id: 6, type: 'choice', stem: '以下哪个利用了光的反射？A.放大镜 B.望远镜 C.潜望镜', answer: 'C', knowledgePoint: '光的反射' },
            { id: 7, type: 'choice', stem: '超声波的特点是？A.人耳可闻 B.在水中不能传播 C.方向性好', answer: 'C', knowledgePoint: '声音特性' },
            { id: 8, type: 'fill', stem: '平面镜成像的特点是：像与物___、___、___', answer: '等大、等距、虚像', knowledgePoint: '平面镜成像' },
          ]
        },
        {
          id: 36, subjectId: 'chemistry', title: '化学实验基本操作',
          teacher: '林老师', deadline: '2026-06-18', type: 'school',
          totalQuestions: 6, submitted: 34, totalStudents: 42, status: 'graded',
          questions: [
            { id: 1, type: 'choice', stem: '量筒的正确读数方法是？A.俯视 B.仰视 C.平视凹液面最低处', answer: 'C', knowledgePoint: '实验操作' },
            { id: 2, type: 'choice', stem: '酒精灯应用什么点燃？A.火柴 B.打火机 C.另一盏酒精灯', answer: 'A', knowledgePoint: '实验安全' },
            { id: 3, type: 'fill', stem: '取用固体药品一般用___，取用液体药品一般用___', answer: '药匙,量筒', knowledgePoint: '实验操作' },
            { id: 4, type: 'choice', stem: '过滤操作中，滤纸要___漏斗内壁。A.高于 B.低于 C.齐平', answer: 'B', knowledgePoint: '实验操作' },
            { id: 5, type: 'fill', stem: '给试管加热时，试管口不能对着___', answer: '自己和他人', knowledgePoint: '实验安全' },
            { id: 6, type: 'choice', stem: '蒸发时何时停止加热？A.完全蒸干 B.出现大量晶体 C.溶液沸腾', answer: 'B', knowledgePoint: '实验操作' },
          ]
        },
        {
          id: 37, subjectId: 'chemistry', title: '金属活动性顺序',
          teacher: '林老师', deadline: '2026-06-19', type: 'school',
          totalQuestions: 6, submitted: 38, totalStudents: 42, status: 'graded',
          questions: [
            { id: 1, type: 'fill', stem: '金属活动性顺序：K Ca Na Mg Al Zn ___ Sn Pb (H) ___ Hg Ag Pt Au', answer: 'Fe,Cu', knowledgePoint: '金属活动性顺序' },
            { id: 2, type: 'choice', stem: '铁和硫酸铜溶液反应生成？A.FeSO₄+Cu B.Fe₂(SO₄)₃+Cu C.不反应', answer: 'A', knowledgePoint: '置换反应' },
            { id: 3, type: 'choice', stem: '铜能否和稀盐酸反应？A.能 B.不能', answer: 'B', knowledgePoint: '金属活动性应用' },
            { id: 4, type: 'fill', stem: 'Zn + 2HCl = ___ + H₂↑', answer: 'ZnCl₂', knowledgePoint: '置换反应' },
            { id: 5, type: 'choice', stem: '最活泼的金属是？A.Na B.Fe C.Au', answer: 'A', knowledgePoint: '金属活动性顺序' },
            { id: 6, type: 'fill', stem: '置换反应的条件：前换后，___中，除外K、Ca、Na', answer: '盐溶液', knowledgePoint: '置换反应' },
          ]
        },
        {
          id: 38, subjectId: 'chemistry', title: '有机化合物基础',
          teacher: '林老师', deadline: '2026-06-20', type: 'school',
          totalQuestions: 5, submitted: 32, totalStudents: 42, status: 'pending',
          questions: [
            { id: 1, type: 'fill', stem: '甲烷的化学式是___', answer: 'CH₄', knowledgePoint: '有机物化学式' },
            { id: 2, type: 'choice', stem: '有机化合物一定含有什么元素？A.碳 B.氢 C.氧', answer: 'A', knowledgePoint: '有机物定义' },
            { id: 3, type: 'fill', stem: '乙醇俗称___，化学式是___', answer: '酒精,C₂H₅OH', knowledgePoint: '常见有机物' },
            { id: 4, type: 'choice', stem: '以下哪个不是有机物？A.蛋白质 B.CO₂ C.葡萄糖', answer: 'B', knowledgePoint: '有机物判断' },
            { id: 5, type: 'fill', stem: '写出乙酸的化学式：___', answer: 'CH₃COOH', knowledgePoint: '有机物化学式' },
          ]
        },
        {
          id: 39, subjectId: 'math', title: '期中复习：数学易错题',
          teacher: '王老师', deadline: '2026-06-22', type: 'custom',
          totalQuestions: 10, submitted: 28, totalStudents: 42, status: 'pending',
          questions: [
            { id: 1, type: 'calc', stem: '一条路长800米，已修3/8，还剩多少米？', answer: '500', knowledgePoint: '分数应用题' },
            { id: 2, type: 'calc', stem: '0.25 × 0.4 = ?', answer: '0.1', knowledgePoint: '小数乘法' },
            { id: 3, type: 'word', stem: '甲乙两车从相距360km的两地同时出发相向而行，甲60km/h乙40km/h，几小时相遇？', answer: '3.6', knowledgePoint: '行程问题' },
            { id: 4, type: 'calc', stem: '一个数的2/3是18，这个数是？', answer: '27', knowledgePoint: '分数逆运算' },
            { id: 5, type: 'word', stem: '商店进价80元的衣服加价25%出售，售价多少？', answer: '100', knowledgePoint: '百分比应用' },
            { id: 6, type: 'calc', stem: '三角形内角和是___度', answer: '180', knowledgePoint: '三角形内角和' },
            { id: 7, type: 'calc', stem: '30÷(1-2/5) = ?', answer: '50', knowledgePoint: '分数混合运算' },
            { id: 8, type: 'word', stem: '一个长方体长5cm宽4cm高3cm，体积？', answer: '60cm³', knowledgePoint: '体积计算' },
            { id: 9, type: 'word', stem: '小明存了200元零花钱，花了35%，还剩多少？', answer: '130', knowledgePoint: '百分比应用' },
            { id: 10, type: 'calc', stem: '4/5 × 3/8 = ?（约分到最简）', answer: '3/10', knowledgePoint: '分数乘法' },
          ]
        },
        {
          id: 40, subjectId: 'math', title: '期末冲刺：综合练习',
          teacher: '王老师', deadline: '2026-06-25', type: 'custom',
          totalQuestions: 12, submitted: 25, totalStudents: 42, status: 'pending',
          questions: [
            { id: 1, type: 'calc', stem: '36 × 25 = ?', answer: '900', knowledgePoint: '乘法' },
            { id: 2, type: 'calc', stem: '7/8 - 1/4 = ?', answer: '5/8', knowledgePoint: '异分母分数减法' },
            { id: 3, type: 'word', stem: '长12m宽8m的教室，面积多少？铺地砖每块0.5m²，需多少块？', answer: '96m²,192', knowledgePoint: '面积应用' },
            { id: 4, type: 'calc', stem: '1.5 ÷ 0.3 = ?', answer: '5', knowledgePoint: '小数除法' },
            { id: 5, type: 'word', stem: '一个水龙头每分钟漏水0.05升，一天24小时漏多少升？', answer: '72', knowledgePoint: '小数应用' },
            { id: 6, type: 'word', stem: '一场电影原价80元，学生票打7折，学生票多少元？', answer: '56', knowledgePoint: '百分比应用' },
            { id: 7, type: 'calc', stem: '圆的直径10cm，面积是多少？（π≈3.14）', answer: '78.5cm²', knowledgePoint: '圆面积' },
            { id: 8, type: 'word', stem: '3个工人8天完成一项工程，6个工人几天完成？', answer: '4', knowledgePoint: '比例应用' },
            { id: 9, type: 'calc', stem: '梯形的上底5cm下底9cm高4cm，面积？', answer: '28cm²', knowledgePoint: '梯形面积' },
            { id: 10, type: 'fill', stem: '统计图有___、___、___三种', answer: '条形统计图、折线统计图、扇形统计图', knowledgePoint: '统计初步' },
            { id: 11, type: 'calc', stem: '(3/4 - 1/3) × 12 = ?', answer: '5', knowledgePoint: '分数混合运算' },
            { id: 12, type: 'word', stem: '妈妈买苹果花了24元，占所带钱的2/5，妈妈带了多少钱？', answer: '60', knowledgePoint: '分数逆运算' },
          ]
        },
```

**IMPORTANT**: Insert these 20 entries BEFORE the closing `];` of the `homework` array. Preserve all 20 existing entries (IDs 1-20). The new entries go after the last existing entry's closing `}` and before the `];`.

- [ ] **Step 2: Verify total count**

```bash
grep -c "id: [0-9]*," index.html | head -1
```
Expected: result reflects 40 homework entries.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add 20 new homework entries (IDs 21-40)"
```

---

### Task 3: Add grading results for new entries (IDs 21-35)

**Files:**
- Modify: `index.html` — add to `mockData.gradingResults` object

**Interfaces:**
- Consumes: New homework entries (IDs 21-35) from Task 2
- Produces: Pre-computed grading results in `mockData.gradingResults`
- Pattern: Use `hw.id * 137` as deterministic seed for correct/wrong answers

**Note:** Since grading results are deterministically generated from the homework ID, they will be auto-generated by the existing grading simulation code when the user triggers grading. However, to make the app immediately useful with rich data for reports and error book, we pre-populate results for IDs 21-35.

The implementer should:
1. Read existing grading results format (IDs 1-15 pattern) at lines 2185-2350
2. For each new homework ID 21-35, create a grading result object with:
   - `score`: random-looking but deterministic (use pattern: `(id * 137) % 40 + 40` → range 40-80)
   - `correctCount`: `Math.floor(totalQuestions * ((id * 137) % 50 + 40) / 100)`
   - `totalCount`: matches homework's `totalQuestions`
   - `gradedAt`: date within the last week
   - `answers`: per-question correct/wrong with analysis text for wrong ones
   - `classmatesWrong`: object mapping question IDs to wrong count
   - `weakPoints`: array of knowledge points with mastery levels

- [ ] **Step 1: Add 15 grading result entries**

Add to `mockData.gradingResults` object (inside the `{...}` ), after the last existing result. Example for ID 21:

```javascript
        21: {
          score: 75, correctCount: 6, totalCount: 8,
          gradedAt: '2026-06-16',
          answers: {
            1: { correct: true, userAnswer: '10' },
            2: { correct: false, userAnswer: '0.7', analysis: '3.6 ÷ 4 = 0.9。计算：3.6 ÷ 4 = 36/10 ÷ 4 = 36/40 = 9/10 = 0.9' },
            3: { correct: true, userAnswer: '10' },
            4: { correct: true, userAnswer: '8' },
            5: { correct: false, userAnswer: '0.03', analysis: '0.5 × 0.6 = 0.30 = 0.3。小数乘法：先按整数乘5×6=30，再看小数点共2位，从右往左数2位得0.30=0.3' },
            6: { correct: true, userAnswer: '10' },
            7: { correct: true, userAnswer: '0.9' },
            8: { correct: true, userAnswer: '4' },
          },
          classmatesWrong: { 2: 18, 5: 22 },
          weakPoints: [
            { name: '小数乘法', mastery: 'medium' },
            { name: '小数除法', mastery: 'strong' },
          ]
        },
```

The implementer should create similar entries for IDs 22-35, following this pattern with homework-appropriate data.

- [ ] **Step 2: Verify grading results count**

```bash
grep -c "gradedAt:" index.html
```
Expected: 25+ (10 existing + 15 new)

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add grading results for new homework entries (IDs 21-35)"
```

---

### Task 4: Final verification and test

**Files:**
- No changes — verification only

- [ ] **Step 1: Verify localStorage caching**

Manual browser test:
1. Open `index.html`, check that app loads normally
2. Verify `localStorage['hwa_state']` contains `homework`, `gradingResults`, `knowledgePoints`, `subjects`
3. Refresh page — data persists
4. Run "恢复出厂设置" → confirm localStorage cleared, data resets to defaults

- [ ] **Step 2: Verify new homework displays**

Navigate to "作业" tab, scroll list — confirm 40 homework cards visible (all + school + custom filters work).

- [ ] **Step 3: Verify grading results**

Navigate to "报告" tab — confirm charts show data from 25+ graded assignments. Navigate to "错题" tab — confirm 15+ errors from the expanded dataset.

- [ ] **Step 4: Run Playwright tests**

```bash
cd /home/paulben/code/class2 && node test_homepage.mjs 2>&1
```
Expected: all tests pass.

- [ ] **Step 5: Commit if needed**

```bash
git add index.html
git commit -m "test: verify data caching and expanded mock data — all tests pass"
```
