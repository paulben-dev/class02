# Teacher Web App + Backend Design

**Date**: 2026-06-22
**Status**: approved

## Goal

Add a teacher-facing web application with backend API to the existing parent-side mobile app. The teacher app covers homework assignment, grading, and lesson preparation. Both apps share data through a common REST API backed by MySQL.

## Architecture

```
class2/
├── index.html                  # 家长端（现有，逐步迁移到 API）
├── teacher/                    # 教师端 React SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── AssignHomework.tsx
│   │   │   ├── GradingList.tsx
│   │   │   └── GradingDetail.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api/
│   ├── package.json
│   └── vite.config.ts
├── server/                     # Node/Express 后端
│   ├── routes/
│   │   ├── auth.js
│   │   ├── homework.js
│   │   ├── grading.js
│   │   ├── questions.js
│   │   ├── reports.js
│   │   ├── errors.js
│   │   ├── practice.js
│   │   ├── subscription.js
│   │   └── user.js
│   ├── db/
│   │   ├── schema.sql
│   │   └── connection.js
│   ├── middleware/
│   │   └── auth.js
│   ├── package.json
│   └── index.js
└── package.json
```

**Tech Stack:**

| Layer | Technology |
|-------|-----------|
| Parent frontend | Existing `index.html` (vanilla JS) |
| Teacher frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express |
| Database | MySQL |
| Auth | JWT (bcrypt for passwords) |
| File storage | Local disk (/uploads) initially |

**Data Flow:**

```
Teacher (React) ─→ REST API ─→ Express ─→ MySQL
                                       │
Parent (index.html) ─→ same REST API ──┘
```

## Database Schema

### `users` — Users

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | |
| username | VARCHAR(50) UNIQUE | Login name |
| password_hash | VARCHAR(255) | bcrypt |
| role | ENUM('teacher','parent') | |
| display_name | VARCHAR(50) | |
| subject | VARCHAR(20) NULL | Teacher's subject (math/chinese/english/physics/chemistry) |
| created_at | TIMESTAMP DEFAULT NOW() | |

### `classes` — Classes

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | |
| name | VARCHAR(50) | e.g. "三年级2班" |
| grade_level | VARCHAR(20) | e.g. "三年级" |
| teacher_id | INT FK → users.id | Homeroom teacher |

### `students` — Students

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | |
| name | VARCHAR(50) | |
| class_id | INT FK → classes.id | |
| parent_id | INT FK → users.id | Linked parent account |
| student_number | VARCHAR(20) | |

### `questions` — Question Bank

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | |
| subject_id | VARCHAR(20) | math/chinese/english/physics/chemistry |
| type | ENUM('calc','word','choice','fill','translate','rewrite') | |
| stem | TEXT | Question text |
| answer | TEXT | Correct answer |
| options | JSON NULL | Choice options `["A.xxx","B.xxx"]` |
| knowledge_point | VARCHAR(100) | |
| difficulty | TINYINT | 1-5 |
| grade_level | VARCHAR(20) | Applicable grade |
| created_by | INT FK → users.id | |
| is_public | BOOLEAN DEFAULT TRUE | Shared to school bank |
| created_at | TIMESTAMP DEFAULT NOW() | |

### `homework` — Homework Assignments

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | |
| title | VARCHAR(200) | |
| subject_id | VARCHAR(20) | |
| teacher_id | INT FK → users.id | |
| class_id | INT FK → classes.id | |
| type | ENUM('school','custom') | |
| deadline | DATE | |
| status | ENUM('active','closed') DEFAULT 'active' | |
| created_at | TIMESTAMP DEFAULT NOW() | |

### `homework_questions` — Homework-Question Mapping

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | |
| homework_id | INT FK → homework.id | |
| question_id | INT FK → questions.id | |
| sort_order | INT | Question number |

### `homework_submissions` — Submissions & Grading

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | |
| homework_id | INT FK → homework.id | |
| student_id | INT FK → students.id | |
| score | INT NULL | |
| answers | JSON NULL | `{"1":{"correct":true,"userAnswer":"..."},...}` |
| status | ENUM('pending','submitted','graded') DEFAULT 'pending' | |
| submitted_at | TIMESTAMP NULL | |
| graded_at | TIMESTAMP NULL | |

### `knowledge_points` — Knowledge Point Tree

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | |
| name | VARCHAR(100) | |
| subject_id | VARCHAR(20) | |
| parent_id | INT NULL FK self | Hierarchical |

### `print_history` — Print Records

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | |
| user_id | INT FK → users.id | |
| title | VARCHAR(200) | |
| type | VARCHAR(50) | homework/error-book/practice |
| meta | JSON | Subject, homework ID, etc. |
| created_at | TIMESTAMP DEFAULT NOW() | |

### `subscriptions` — Subscriptions

| Column | Type | Notes |
|--------|------|-------|
| id | INT PK AUTO_INCREMENT | |
| user_id | INT FK → users.id UNIQUE | |
| tier | TINYINT DEFAULT 0 | 0=free, 1=basic, 2=premium |
| expires_at | DATE NULL | |
| auto_renew | BOOLEAN DEFAULT FALSE | |
| created_at | TIMESTAMP DEFAULT NOW() | |

## Complete API (35 endpoints)

### Auth (2)

```
POST /api/auth/login          → { token, user }
POST /api/auth/register       → { token, user }
```

### User & Profile (6)

```
GET    /api/user/profile              → { name, child, avatars }
PUT    /api/user/profile              → update display_name, child info
POST   /api/user/avatar               → upload parent avatar
POST   /api/user/child/avatar         → upload child avatar
GET    /api/user/preferences          → { fontSize }
PUT    /api/user/preferences          → update preferences
GET    /api/user/grading-history      → list all graded homework with scores
```

### Homework (5)

```
GET    /api/homework?class_id=&status=&type=   → paginated homework list
GET    /api/homework/:id                        → homework detail with questions
POST   /api/homework                            → create homework + attach questions
PUT    /api/homework/:id                        → edit homework
DELETE /api/homework/:id                        → delete
```

### Grading Pipeline (4)

```
POST   /api/grading/upload              → upload photo (multipart)
GET    /api/grading/status/:jobId       → poll grading progress
GET    /api/grading/result/:jobId       → get grading result
POST   /api/grading/submit              → submit photos for a homework
```

### Submissions (3)

```
GET    /api/submissions?homework_id=    → list submissions for a homework
GET    /api/submissions/:id             → single submission detail
POST   /api/submissions/:id/grade       → save grading result
GET    /api/homework/:id/stats          → class stats (avg score, per-question accuracy)
```

### Question Bank (4)

```
GET    /api/questions?subject=&kp=&difficulty=&keyword=&page=   → search
POST   /api/questions                       → create question
PUT    /api/questions/:id                   → edit question
DELETE /api/questions/:id                   → delete
```

### Reports (4)

```
GET    /api/reports/single/:homeworkId      → single homework report
GET    /api/reports/weekly                  → 7-day aggregated report
GET    /api/reports/monthly                 → 30-day aggregated report
POST   /api/reports/share                   → generate shareable link
```

### Error Book (2)

```
GET    /api/error-book?subject=&period=&page=   → paginated error list
GET    /api/error-book/summary                  → counts by subject & knowledge point
```

### Practice Generation (3)

```
POST   /api/practice/generate      → AI-generate practice from error patterns
POST   /api/practice/:id/regenerate → re-generate with different questions
GET    /api/practice/:id            → retrieve practice set
```

### Knowledge Points (2)

```
GET    /api/knowledge-points?subject_id=     → knowledge point tree
GET    /api/knowledge-points/:name/history   → mastery trend over time
```

### Subscription (5)

```
GET    /api/subscription/plans       → plan definitions with features & pricing
GET    /api/subscription/status      → current tier, expiry, auto-renew
POST   /api/subscription/checkout    → initiate payment
POST   /api/subscription/cancel      → cancel auto-renewal
POST   /api/subscription/upgrade     → upgrade tier (prorated)
```

### Print History (2)

```
GET    /api/print-history            → list print records
POST   /api/print-history            → record a print event
```

### Parent-Side Endpoints (2)

```
GET    /api/parent/homework?student_id=     → child's homework list
GET    /api/parent/submissions?student_id=  → child's grading results
```

## Implementation Phases

### Phase 1: Core Backend + Teacher MVP
- Database schema + connection
- Auth (JWT login/register)
- Homework CRUD
- Submissions + grading
- Question bank CRUD
- Teacher React app: Login → Dashboard → Assign → Grade

### Phase 2: Reports + Parent Integration
- Single/weekly/monthly reports
- Error book API
- Parent app migration (replace mockData reads with API calls)
- Knowledge point tracking

### Phase 3: Practice + Subscription
- AI practice generation
- Subscription plans + payment
- Tier gating (server-side enforcement)
- Print history persistence
- Avatars + file upload

## Out of Scope (for now)
- Real AI OCR grading (Phase 1 uses deterministic grading)
- WeChat Pay / Alipay integration (mock payment in Phase 3)
- Photo upload to cloud storage (local disk initially)
- Real-time notifications
- Admin dashboard
