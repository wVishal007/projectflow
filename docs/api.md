# ProjectFlow API Reference

**Base URL:** `http://localhost:3001` (development) or your Render domain (production)  
**Content-Type:** `application/json`  
**Auth:** Bearer token in `Authorization` header (`Bearer <accessToken>`)

> **Production note:** In production (`NODE_ENV=production`), the server serves both the SPA and the API from the same origin.  
> Paths starting with `/api/v1/*` return JSON (the REST API).  
> All other paths serve the built React SPA (`client/dist/`).  
> This means your browser requests can use relative URLs — no separate frontend domain needed.

---

## Response Envelope

### Success
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": [
      { "field": "email", "message": "Invalid email address" }
    ]
  }
}
```

---

## Error Codes

| Code                    | Status | Description                    |
|-------------------------|--------|--------------------------------|
| `VALIDATION_ERROR`      | 400    | Request body failed validation |
| `AUTH_ERROR`            | 401    | Missing/invalid token or bad credentials |
| `FORBIDDEN`             | 403    | Not resource owner/no permission |
| `NOT_FOUND`             | 404    | Resource not found             |
| `CONFLICT`              | 409    | Duplicate resource (e.g. email) |
| `RATE_LIMIT_EXCEEDED`   | 429    | Too many requests              |
| `INTERNAL_ERROR`        | 500    | Unexpected server error        |

---

## Rate Limiting

| Limiter       | Window   | Max Requests | Scope                           |
|---------------|----------|--------------|---------------------------------|
| Global        | 15 min   | 100          | All routes                      |
| Auth          | 15 min   | 10           | `/register` and `/login` only   |

---

## Health

### `GET /health`
No auth. Returns server health status.

**Response 200:**
```json
{ "status": "ok", "timestamp": "2026-07-27T12:00:00.000Z" }
```

### `GET /health/live`
**Response 200:** `{ "status": "alive" }`

### `GET /health/ready`
**Response 200:** `{ "status": "ready", "database": "connected" }`  
**Response 503:** `{ "status": "not ready", "database": "disconnected" }`

---

## Authentication

### `POST /api/v1/auth/register`
Create a new account. (Auth rate limited: 10 req/15 min)

**Body:**
| Field    | Type   | Required | Notes                 |
|----------|--------|----------|-----------------------|
| name     | string | yes      | 2-100 chars            |
| email    | string | yes      | Valid email format     |
| password | string | yes      | 8-128 chars            |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "user": { "id": "uuid", "name": "John", "email": "john@example.com" }
  }
}
```

### `POST /api/v1/auth/login`
Sign in with credentials. (Auth rate limited: 10 req/15 min)

**Body:**
| Field    | Type   | Required |
|----------|--------|----------|
| email    | string | yes      |
| password | string | yes      |

**Response 200:** Same shape as register  
**Error 401:** `AUTH_ERROR` — "Invalid email or password"

### `POST /api/v1/auth/refresh`
Refresh an expired access token.

**Body:**
| Field        | Type   | Required |
|--------------|--------|----------|
| refreshToken | string | yes      |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

### `GET /api/v1/auth/me`
Get the current authenticated user.

**Headers:** `Authorization: Bearer <accessToken>`

**Response 200:**
```json
{
  "success": true,
  "data": { "id": "uuid", "name": "John", "email": "john@example.com", "avatarUrl": null, "createdAt": "2026-07-27T..." }
}
```

---

## Projects

All project endpoints require `Authorization: Bearer <accessToken>`.

### `GET /api/v1/projects`
List all projects owned by the authenticated user.

**Query Params:**
| Param     | Type   | Default | Description                    |
|-----------|--------|---------|--------------------------------|
| page      | int    | 1       | Page number                    |
| limit     | int    | 20      | Items per page (max 100)       |
| search    | string | —       | Search name and description    |
| sortBy    | string | —       | `created_at`, `updated_at`, `name` |
| sortOrder | string | desc    | `asc` or `desc`                |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Project Alpha",
      "description": "Description here",
      "color": "#3B82F6",
      "ownerId": "uuid",
      "createdAt": "2026-07-27T...",
      "updatedAt": "2026-07-27T...",
      "_count": { "tasks": 5 }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

### `POST /api/v1/projects`
Create a new project.

**Body:**
| Field       | Type   | Required | Notes          |
|-------------|--------|----------|----------------|
| name        | string | yes      | 1-200 chars    |
| description | string | no       | Max 2000 chars |
| color       | string | no       | Hex `#RRGGBB`  |

**Response 201:** Single project object

### `GET /api/v1/projects/:id`
Get a project by ID with task statistics.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "...project fields": "...",
    "taskStats": { "total": 10, "todo": 3, "inProgress": 2, "inReview": 1, "done": 3, "cancelled": 1 }
  }
}
```

### `PUT /api/v1/projects/:id`
Update a project. All body fields optional.

### `DELETE /api/v1/projects/:id`
Delete a project and all its tasks.

**Response 200:** `{ "success": true, "data": { "id": "uuid" } }`

---

## Tasks

All task endpoints require `Authorization: Bearer <accessToken>`.

### `GET /api/v1/tasks/project/:projectId`
List tasks for a project.

**Query Params:**
| Param      | Type   | Default | Description                                   |
|------------|--------|---------|-----------------------------------------------|
| page       | int    | 1       |                                                |
| limit      | int    | 20      | Max 100                                       |
| search     | string | —       | Search title and description                  |
| sortBy     | string | —       | `created_at`, `updated_at`, `title`, `priority`, `due_date`, `status` |
| sortOrder  | string | desc    | `asc` or `desc`                               |
| status     | enum   | —       | `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`, `CANCELLED` |
| priority   | enum   | —       | `LOW`, `MEDIUM`, `HIGH`, `URGENT`             |
| assigneeId | uuid   | —       | Filter by assignee                            |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Implement login",
      "description": "Add OAuth login flow",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "dueDate": "2026-08-01T...",
      "projectId": "uuid",
      "assigneeId": "uuid",
      "completedAt": null,
      "createdAt": "2026-07-27T...",
      "updatedAt": "2026-07-27T...",
      "assignee": { "id": "uuid", "name": "John", "email": "john@example.com" },
      "_count": { "comments": 3 }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

### `POST /api/v1/tasks/project/:projectId`
Create a task.

**Body:**
| Field       | Type   | Required | Default  | Notes           |
|-------------|--------|----------|----------|-----------------|
| title       | string | yes      | —        | 1-500 chars     |
| description | string | no       | —        | Max 5000 chars  |
| priority    | enum   | no       | `MEDIUM` | LOW/MEDIUM/HIGH/URGENT |
| assigneeId  | uuid   | no       | —        |                 |
| dueDate     | string | no       | —        | ISO 8601        |

**Response 201:** Single task object

### `GET /api/v1/tasks/:id`
Get a single task by ID.

### `PUT /api/v1/tasks/:id`
Update a task. All body fields optional.

| Field       | Type        | Notes                      |
|-------------|-------------|----------------------------|
| title       | string      | 1-500 chars                |
| description | string      | Max 5000 chars             |
| priority    | enum        | As above                   |
| assigneeId  | uuid or null| Pass `null` to unassign    |
| dueDate     | string/null | Pass `null` to clear       |

### `PATCH /api/v1/tasks/:id/status`
Update task status. Sets `completedAt` automatically when status becomes `DONE`.

**Body:**
| Field  | Type | Required | Notes                              |
|--------|------|----------|------------------------------------|
| status | enum | yes      | Any `TaskStatus` value             |

### `DELETE /api/v1/tasks/:id`
Delete a task.

**Response 200:** `{ "success": true, "data": { "id": "uuid" } }`

---

## Comments

All comment endpoints require `Authorization: Bearer <accessToken>`.

### `GET /api/v1/comments/task/:taskId`
Get comments for a task.

**Query Params:** `page` (int), `limit` (int, max 100)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "content": "This is a comment",
      "taskId": "uuid",
      "authorId": "uuid",
      "createdAt": "2026-07-27T...",
      "updatedAt": "2026-07-27T...",
      "author": { "id": "uuid", "name": "John", "email": "john@example.com" }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

### `POST /api/v1/comments/task/:taskId`
Add a comment to a task.

**Body:**
| Field   | Type   | Required | Notes           |
|---------|--------|----------|-----------------|
| content | string | yes      | 1-5000 chars    |

**Response 201:** Single comment object (with author)

### `DELETE /api/v1/comments/:id`
Delete a comment (only the author can delete).

**Response 200:** `{ "success": true, "data": { "id": "uuid" } }`

---

## Analytics

All analytics endpoints require `Authorization: Bearer <accessToken>`.

### `GET /api/v1/analytics/overview`
Get overall statistics for the authenticated user.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalProjects": 5,
    "totalTasks": 42,
    "tasksByStatus": { "todo": 10, "inProgress": 8, "inReview": 4, "done": 18, "cancelled": 2 },
    "completionRate": 42.86,
    "overdueTasks": 3,
    "recentTasks": [
      { "id": "uuid", "title": "Fix bug", "status": "DONE", "priority": "HIGH", "updatedAt": "2026-07-27T..." }
    ]
  }
}
```

### `GET /api/v1/analytics/projects/:id`
Get detailed analytics for a specific project.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "project": { "id": "uuid", "name": "Project Alpha" },
    "totalTasks": 10,
    "completionRate": 30,
    "tasksByStatus": { "todo": 3, "inProgress": 2, "inReview": 1, "done": 3, "cancelled": 1 },
    "tasksByPriority": { "low": 2, "medium": 4, "high": 3, "urgent": 1 },
    "tasksByAssignee": 2,
    "overdueTasks": 1,
    "recentlyCompleted": [ "...last 5 completed tasks" ]
  }
}
```

### `GET /api/v1/analytics/activity`
Get activity feed.

**Query Params:** `page` (int), `limit` (int, max 100), `projectId` (uuid, optional)

**Activity actions:** `created`, `updated`, `status_changed`, `completed`, `deleted`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "status_changed",
      "details": { "from": "TODO", "to": "IN_PROGRESS" },
      "taskId": "uuid",
      "userId": "uuid",
      "createdAt": "2026-07-27T...",
      "user": { "id": "uuid", "name": "John", "email": "john@example.com" },
      "task": { "id": "uuid", "title": "Fix bug", "project": { "id": "uuid", "name": "Project Alpha" } }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

---

## Endpoint Summary

| # | Method | Path                                    | Auth | Success Status |
|---|--------|-----------------------------------------|------|----------------|
| 1 | GET    | `/health`                               | No   | 200            |
| 2 | GET    | `/health/live`                          | No   | 200            |
| 3 | GET    | `/health/ready`                         | No   | 200            |
| 4 | POST   | `/api/v1/auth/register`                 | No   | 201            |
| 5 | POST   | `/api/v1/auth/login`                    | No   | 200            |
| 6 | POST   | `/api/v1/auth/refresh`                  | No   | 200            |
| 7 | GET    | `/api/v1/auth/me`                       | Yes  | 200            |
| 8 | GET    | `/api/v1/users/me`                      | Yes  | 200            |
| 9 | GET    | `/api/v1/projects`                      | Yes  | 200            |
|10 | POST   | `/api/v1/projects`                      | Yes  | 201            |
|11 | GET    | `/api/v1/projects/:id`                  | Yes  | 200            |
|12 | PUT    | `/api/v1/projects/:id`                  | Yes  | 200            |
|13 | DELETE | `/api/v1/projects/:id`                  | Yes  | 200            |
|14 | GET    | `/api/v1/tasks/project/:projectId`      | Yes  | 200            |
|15 | POST   | `/api/v1/tasks/project/:projectId`      | Yes  | 201            |
|16 | GET    | `/api/v1/tasks/:id`                     | Yes  | 200            |
|17 | PUT    | `/api/v1/tasks/:id`                     | Yes  | 200            |
|18 | PATCH  | `/api/v1/tasks/:id/status`              | Yes  | 200            |
|19 | DELETE | `/api/v1/tasks/:id`                     | Yes  | 200            |
|20 | GET    | `/api/v1/comments/task/:taskId`         | Yes  | 200            |
|21 | POST   | `/api/v1/comments/task/:taskId`         | Yes  | 201            |
|22 | DELETE | `/api/v1/comments/:id`                  | Yes  | 200            |
|23 | GET    | `/api/v1/analytics/overview`            | Yes  | 200            |
|24 | GET    | `/api/v1/analytics/projects/:id`        | Yes  | 200            |
|25 | GET    | `/api/v1/analytics/activity`            | Yes  | 200            |

**Total: 25 endpoints** (3 health, 4 auth, 1 user, 5 projects, 6 tasks, 3 comments, 3 analytics)
