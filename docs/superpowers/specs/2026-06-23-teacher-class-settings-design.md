# Teacher Class Settings Design

**Date**: 2026-06-23
**Status**: approved

## Goal

Add a settings page to the teacher app where teachers can configure which classes they teach. This replaces the current behavior where teachers see ALL classes with a many-to-many teacher-class relationship that accurately reflects real school structures.

## Background

Currently the database uses `classes.teacher_id` (one teacher per class), but the API returns ALL classes to any teacher — the `teacher_id` column is not used for filtering. This design introduces a proper many-to-many junction table and scopes all class-aware views to only the teacher's assigned classes.

## Database Changes

### New table: `teacher_classes`

```sql
CREATE TABLE teacher_classes (
  teacher_id INT NOT NULL,
  class_id INT NOT NULL,
  PRIMARY KEY (teacher_id, class_id),
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);
```

### Migration

Existing `classes.teacher_id` data is migrated into `teacher_classes` so current teachers retain their class assignments.

## Backend Changes

### New routes: `server/routes/teacher.js`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/teacher/classes` | teacher | Returns `{ class_ids: [1, 2, 3] }` for the current teacher |
| `PUT` | `/api/teacher/classes` | teacher | Body: `{ class_ids: [1, 2, 3] }`. Replaces all assignments atomically (delete all + insert new). |

### Modified: `GET /api/classes`

For teacher role: only return classes where the teacher is in `teacher_classes`. For parent role: unchanged (classes of their children).

### Mount in `server/index.js`

```js
app.use('/api/teacher', require('./routes/teacher'));
```

## Frontend Changes

### New page: `teacher/src/pages/Settings.jsx` + `Settings.css`

- Fetches all classes (for the picker) via a new API client method or `GET /api/classes?all=1`
- Fetches currently assigned class IDs via `GET /api/teacher/classes`
- Displays a checkbox list grouped by grade level
- Save button calls `PUT /api/teacher/classes`
- Toast on success, redirect or refresh global class state

### New API functions in `teacher/src/api/client.js`

```js
getTeacherClasses: () => api.get('/teacher/classes'),
updateTeacherClasses: (classIds) => api.put('/teacher/classes', { class_ids: classIds }),
```

### Sidebar: `teacher/src/components/Layout.jsx`

- Add "设置" nav item with a gear icon, linking to `/settings`
- Place it above or below the existing nav items

### Routing: `teacher/src/App.jsx`

- Add `<Route path="/settings" element={<Settings />} />` inside the authenticated layout

### Impact on existing pages

No frontend changes needed for Dashboard, AssignHomework, or GradingList. Once `GET /api/classes` returns only assigned classes, these pages automatically reflect the correct scope.

## Edge Cases

1. **No classes assigned**: Teacher sees empty states on Dashboard/GradingList with a prompt to visit Settings.
2. **All classes deselected**: Allowed — teacher sees no classes until they add at least one.
3. **First login after migration**: Teachers get their migrated `classes.teacher_id` assignments. If none, they see empty states and must visit Settings.
4. **Multiple teachers per class**: Supported naturally — each teacher only sees their own homework within the shared class.
