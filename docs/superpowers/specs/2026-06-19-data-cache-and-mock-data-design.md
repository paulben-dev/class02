# Data Cache & Mock Data Expansion — Design Spec

**Date:** 2026-06-19
**Status:** approved

## Overview

Two related improvements:
1. Persist all core mock data to localStorage so user operations survive page refresh
2. Expand mock data: 20→40 homework entries, more grading results, richer error book

## Part 1: Local Data Cache

### Data to Cache

All core data under `mockData` that changes during use:

| Field | Type | Description |
|-------|------|-------------|
| `homework` | Array | Homework list (may grow with user additions) |
| `gradingResults` | Object | Keyed by homework ID, grading output per homework |
| `knowledgePoints` | Array | Knowledge point mastery tracking |
| `subjects` | Array | Subject definitions |

### Persistence Strategy

- **Cold start (first visit):** Use hardcoded defaults in `mockData`. Auto-save to localStorage on first `saveState()`.
- **Warm start (returning):** `loadState()` checks `state.homework`, `state.gradingResults`, etc. If present in localStorage, use cached version. If absent, fall back to defaults (backward compatible).
- **Save:** `saveState()` always writes all four data fields alongside existing user settings.
- **Storage key:** Same `hwa_state` key — all state in one JSON blob.
- **Migration:** New fields gracefully absent from old localStorage — defaults kick in.

### Changes to loadState/saveState

```javascript
// loadState: add data field reads
if (state.homework) mockData.homework = state.homework;
if (state.gradingResults) mockData.gradingResults = state.gradingResults;
if (state.knowledgePoints) mockData.knowledgePoints = state.knowledgePoints;
if (state.subjects) mockData.subjects = state.subjects;

// saveState: add data field writes
homework: mockData.homework,
gradingResults: mockData.gradingResults,
knowledgePoints: mockData.knowledgePoints,
subjects: mockData.subjects,
```

### Scope
- Does NOT change any UI
- Does NOT change grading logic
- Backward compatible — clears on "恢复出厂设置"

---

## Part 2: Expanded Mock Data

### New Homework Entries (20→40)

**Existing (keep all 20):**
- Math: 4 份 (分数加减、小数、三角形面积、分数应用题)
- Chinese: 4 份 (古诗默写、字词成语、阅读理解、作文)
- English: 4 份 (动词时态、单词、句型、阅读理解)
- Physics: 4 份 (光学、力学、电路、牛顿定律)
- Chemistry: 4 份 (物质变化、方程式、溶解度、酸碱盐)

**New (add 20):**

| # | Subject | Title | Type | Questions |
|---|---------|-------|------|-----------|
| 21 | math | 乘法口诀应用 | school | 8 |
| 22 | math | 周长与面积计算 | school | 6 |
| 23 | math | 小数乘除法练习 | school | 8 |
| 24 | math | 比例与百分比 | school | 6 |
| 25 | chinese | 文言文阅读：《论语》 | school | 5 |
| 26 | chinese | 修辞手法辨析 | school | 6 |
| 27 | chinese | 多音字与形近字 | school | 8 |
| 28 | chinese | 说明文阅读训练 | school | 5 |
| 29 | english | 现在完成时练习 | school | 6 |
| 30 | english | 形容词比较级与最高级 | school | 8 |
| 31 | english | 英语阅读理解（科普） | school | 5 |
| 32 | english | 英语单词听写（三） | school | 10 |
| 33 | physics | 浮力与密度 | school | 6 |
| 34 | physics | 简单机械：杠杆与滑轮 | school | 6 |
| 35 | physics | 声现象与光现象 | school | 8 |
| 36 | chemistry | 化学实验操作 | school | 6 |
| 37 | chemistry | 金属活动性顺序 | school | 6 |
| 38 | chemistry | 有机化合物基础 | school | 5 |
| 39 | custom | 期中复习：数学易错题 | custom | 10 |
| 40 | custom | 期末冲刺：综合练习 | custom | 12 |

### New Grading Results

Add pre-computed grading results for 15 more homework entries (IDs 21-35), generated with the same deterministic seed pattern (`hw.id * 137`). Each result includes per-question correct/wrong, knowledge point mappings, and overall score.

### Expanded Error Book

With 25 graded homeworks (10 existing + 15 new), the error book naturally grows to 15+ distinct error entries across all 5 subjects.
