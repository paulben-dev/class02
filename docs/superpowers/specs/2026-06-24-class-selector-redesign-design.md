# Class Selector Redesign

**Date**: 2026-06-24
**Status**: approved

## Goal

Replace the current flat checkbox list in the Settings page with a compact tab-based class selector that scales to dozens of classes per grade.

## Design: Grade Tabs + Class Number Buttons

### Layout

```
┌─────────────────────────────────┐
│  [一年级] [二年级] [三年级] [四年级] [五年级] [六年级] │  ← 年级标签（pill）
│  三年级 · 已选 2 个班级     [全选] [清空] │  ← 操作栏
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐  │
│  │ 1│ │ 2│ │ 3│ │ 4│ │ 5│ │ 6│  │  ← 班级数字按钮
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘  │     6列网格
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐  │
│  │ 7│ │ 8│ │ 9│ │10│ │11│ │12│  │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘  │
│  当前已选：三年级2班、6班 · 四年级1班   │  ← 汇总栏
└─────────────────────────────────┘
```

### Behavior

- **Grade tab click**: switches the class button grid to that grade
- **Button click**: toggles selection (blue=selected, gray=unselected)
- **全选**: selects all classes in current grade
- **清空**: deselects all classes in current grade
- **Summary bar**: shows all selected classes across all grades, updating in real time
- **Grade tab badge**: shows count of selected classes per grade (e.g., "三年级 2")

### States

| State | Behavior |
|-------|----------|
| No classes in DB | Component not rendered, message "暂无可用班级" |
| Grade with 0 selected | Tab shows no badge, all buttons gray |
| All grades selected | All tabs show counts, all buttons blue |
| Save | Sends all selected class IDs via PUT as before |

## Files Changed

- `teacher/src/pages/Settings.jsx` — replace checkbox list with tab+button component
- `teacher/src/pages/Settings.css` — replace .settings-class-* styles with new component styles

## Backend

No changes. Existing `GET /api/classes?all=1` and `PUT /api/teacher/classes` unchanged.
