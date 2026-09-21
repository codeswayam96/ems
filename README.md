# EMS Frontend — Employee Management System

> **apps/ems-frontend** · Next.js 16 · React 19 · TypeScript · PWA  
> A full-featured, offline-capable Employee Management System built on the CodeSwayam platform. Covers the complete HR lifecycle: attendance, payroll, tasks, teams, meetings, performance, and analytics.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Features](#features)
5. [Application Routes](#application-routes)
6. [Internal API Routes](#internal-api-routes)
7. [Data Models](#data-models)
8. [Component Inventory](#component-inventory)
9. [Services Layer](#services-layer)
10. [Library Layer](#library-layer)
11. [PWA & Offline Support](#pwa--offline-support)
12. [Authentication & SSO](#authentication--sso)
13. [Permission System](#permission-system)
14. [Environment Variables](#environment-variables)
15. [Development Setup](#development-setup)
16. [Code Examples](#code-examples)
17. [Project Structure](#project-structure)

---

## Overview

The EMS Frontend is the web client for CodeSwayam's Employee Management System. It is a Next.js 16 App Router application that gives HR departments, managers, and employees a unified interface for the full employment lifecycle.

Key design principles:

- **Offline-capable.** A registered Service Worker caches critical routes and data so the app remains usable on flaky or absent network connections.
- **SSO-first.** Authentication is delegated entirely to `@codeswayam/auth` — the app never handles credentials directly.
- **Role-aware.** A centralized permission system gates every sensitive action, from viewing payroll data to running payroll processing.
- **API-route proxied.** All external data calls go through Next.js internal API routes (`/api/*`), keeping backend URLs and JWT secrets server-side only.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Browser (Client)                              │
│                                                                        │
│  ┌────────────────┐   ┌──────────────────┐   ┌─────────────────────┐  │
│  │  Next.js App   │   │  Service Worker  │   │  PWA Manifest       │  │
│  │  Router (RSC)  │   │  public/sw.js    │   │  public/manifest    │  │
│  │                │   │  (cache/offline) │   │  .json              │  │
│  └───────┬────────┘   └──────────────────┘   └─────────────────────┘  │
│          │                                                             │
│  ┌───────▼──────────────────────────────────────────────────────────┐  │
│  │                     Client Components                            │  │
│  │  Sidebar · DataTable · Modals · MetricCard · Charts             │  │
│  └───────┬──────────────────────────────────────────────────────────┘  │
│          │ fetch() to /api/*                                           │
└──────────┼─────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                 Next.js Server (API Routes — /api/*)                  │
│                                                                      │
│  Route handlers verify JWT (JWT_SECRET), call lib/db.ts,            │
│  and return typed JSON responses. Backend URL never                  │
│  exposed to the browser.                                             │
│                                                                      │
│  /api/attendance  /api/tasks  /api/teams  /api/meetings              │
│  /api/payroll     /api/tracking  /api/users  /api/dashboard          │
│  /api/performance /api/payroll/salary-config  /api/ems-profile       │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     External Services                                │
│                                                                      │
│  ┌──────────────────┐   ┌──────────────────────────────────────┐    │
│  │  EMS Backend API │   │  CodeSwayam Auth Service             │    │
│  │  NEXT_PUBLIC_    │   │  NEXT_PUBLIC_AUTH_URL                │    │
│  │  API_URL         │   │  (SSO, JWT issuance, /auth/callback) │    │
│  └──────────────────┘   └──────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
User visits any protected route
         │
         ▼
Next.js Middleware  (lib/auth.ts + @codeswayam/auth)
         │
         ├── Cookie has valid JWT?  ──► Yes ──► Render route
         │
         └── No ──► Redirect to NEXT_PUBLIC_AUTH_URL/login
                              │
                        User authenticates
                              │
                        Redirect to /auth/callback?token=...
                              │
                         lib/sso.ts handles callback:
                           • Validates token
                           • Sets httpOnly cookie
                           • Redirects to /dashboard
```

### Data Flow (Client → API Route → Backend)

```
React Component
    │
    ▼
lib/api-client.ts  (wraps fetch, attaches cookie-based auth)
    │
    ▼
/api/<domain>  (Next.js Route Handler — server-side)
    │
    ├── Reads JWT_SECRET from env (never in client bundle)
    ├── Verifies JWT from cookie
    ├── Checks lib/permissions.ts
    │
    ▼
NEXT_PUBLIC_API_URL  ──►  EMS Backend (REST)
    │
    ▼
Response (JSON) ──► Route Handler ──► Client Component
```

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Next.js | 16 | App Router, RSC, API routes, SSR |
| UI Runtime | React | 19 | Component model, Server Components |
| Language | TypeScript | Latest | Full-stack type safety |
| Auth | @codeswayam/auth | 2.5.1 | SSO / JWT middleware and client |
| PWA | Custom Service Worker | — | Offline caching, background sync |
| HTTP Client | lib/api-client.ts | — | Typed fetch wrapper for API routes |
| Database Client | lib/db.ts | — | Server-side database access |

---

## Features

### HR Dashboard
The `/dashboard` page aggregates key HR metrics into a set of `MetricCard` widgets: headcount, open positions, attendance rate today, pending leave requests, overdue tasks, and upcoming meetings. All metrics are fetched from `/api/dashboard` on load.

### Employee Directory & Management
The `/users` page provides a searchable, filterable table of all employees backed by `DataTable`. Managers with the appropriate permission can open `UserActionModal` to update roles, status, department, or reporting structure.

### Attendance & Leave Management
`/attendance` surfaces three sub-views:
- **Daily attendance** — clock-in/clock-out status grid
- **Leave requests** — pending approvals queue via `LeaveRequestModal`
- **Leave balance** — per-employee entitlement and consumption via `LeaveBalanceWidget`

### Task Management
`/tasks` is a full task board:
- Create tasks (`CreateTaskModal`) with assignee, due date, priority, and description
- Edit existing tasks (`EditTaskModal`)
- View full task history and comments (`TaskDetailModal`)
- Status tracking: Open → In Progress → Review → Done

### Team Management & Org Chart
- `/teams` — Create and manage teams (`CreateTeamModal`), assign members, set leads
- `/org-chart` — Visual, zoomable org chart showing reporting hierarchy

### Meeting Scheduling
`/meetings` provides a meeting management interface with `CreateMeetingModal` for scheduling, attendee management, and agenda tracking. Integrates with the `/calendar` unified view.

### Payroll
`/payroll` is the most complex module:
- **Salary configuration** (`SalaryConfigModal`) — define base pay, allowances, and deductions per employee
- **Run payroll** (`RunPayrollModal`) — process a pay period, preview totals before committing
- **Payslip detail** (`PayslipDetail`) — generated payslips with full breakdowns

### Time Tracking
`/tracking` allows employees to log time entries against tasks or projects via `LogTimeModal`. Reports aggregate hours by person, team, or project over configurable date ranges.

### Performance Reviews
`/performance` manages review cycles — create and complete review forms, assign ratings, and track review history per employee.

### HR Analytics
`/analytics` renders charts for headcount trends, turnover rate, attendance rate over time, leave utilization, and task completion rates.

### Announcements
`/announcements` — company-wide broadcast management. Create, schedule, pin, and archive announcements.

### PWA / Offline Mode
The registered Service Worker pre-caches the app shell and key static assets. The `/offline` page is served when a navigation request fails with no cached response.

---

## Application Routes

| Route | Description | Auth Required |
|---|---|---|
| `/dashboard` | KPI metrics overview — headcount, attendance rate, open tasks, upcoming meetings | Yes |
| `/users` | Employee directory — search, filter, view profiles, manage roles | Yes |
| `/attendance` | Attendance tracking, leave requests queue, and leave balance summaries | Yes |
| `/tasks` | Task board — create, assign, update status, view history | Yes |
| `/teams` | Team listing — create teams, assign members and leads, view composition | Yes |
| `/meetings` | Meeting list — schedule, view attendees, manage agendas | Yes |
| `/calendar` | Unified calendar showing meetings, deadlines, and leave | Yes |
| `/payroll` | Payroll management — salary config, run payroll, view payslips | Yes (Payroll role) |
| `/tracking` | Time tracking — log time entries, view reports by person or project | Yes |
| `/org-chart` | Visual organizational chart with hierarchy | Yes |
| `/analytics` | HR analytics — charts for attendance, turnover, headcount, and tasks | Yes |
| `/performance` | Performance review management — create reviews, assign ratings | Yes |
| `/announcements` | Company announcements — create, schedule, archive | Yes |
| `/settings` | Application settings — profile, notifications, integrations | Yes |
| `/auth/callback` | SSO callback — receives token, sets session cookie, redirects to `/dashboard` | No |
| `/offline` | Offline fallback page served by Service Worker when network is unavailable | No |

---

## Internal API Routes

All data mutations from client components go through these Next.js route handlers. They run server-side, validate the JWT using `JWT_SECRET`, enforce permissions, and proxy to the EMS backend.

| Method | Path | Description |
|---|---|---|
| GET, POST | `/api/attendance` | List attendance records; create a clock-in/clock-out entry |
| GET, POST | `/api/tasks` | List tasks with filters; create a new task |
| PATCH, DELETE | `/api/tasks/[id]` | Update or delete a task |
| GET, POST | `/api/teams` | List teams; create a team |
| PATCH, DELETE | `/api/teams/[id]` | Update or delete a team |
| GET, POST | `/api/meetings` | List meetings; create a meeting |
| PATCH, DELETE | `/api/meetings/[id]` | Update or delete a meeting |
| GET, POST | `/api/payroll` | List payroll runs; trigger a new payroll run |
| GET | `/api/payroll/[id]` | Get payroll run detail with payslips |
| GET, PUT | `/api/payroll/salary-config` | Get and update salary configurations |
| GET, POST | `/api/tracking` | List time entries; create a time log entry |
| GET, PATCH | `/api/users` | List users; update user details |
| GET | `/api/dashboard` | Aggregate KPI metrics for the dashboard |
| GET | `/api/performance` | List performance reviews |
| POST | `/api/performance` | Submit a performance review |
| GET, PUT | `/api/ems-profile` | Get and update the authenticated user's EMS profile |

---

## Data Models

### `EmsUser`
Represents an employee in the system.

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier (UUID) |
| `email` | string | Work email address |
| `name` | string | Full name |
| `role` | enum | `admin` · `manager` · `employee` |
| `department` | string | Department name |
| `managerId` | string? | ID of reporting manager |
| `joinDate` | Date | Employment start date |
| `status` | enum | `active` · `inactive` · `on_leave` |

### `Attendance`
A daily attendance record for one employee.

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `userId` | string | FK → EmsUser |
| `date` | Date | Attendance date |
| `clockIn` | DateTime? | Clock-in timestamp |
| `clockOut` | DateTime? | Clock-out timestamp |
| `status` | enum | `present` · `absent` · `late` · `half_day` · `on_leave` |
| `notes` | string? | Optional notes |

### `LeaveBalance`
Per-employee leave entitlement and usage.

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `userId` | string | FK → EmsUser |
| `leaveType` | enum | `annual` · `sick` · `casual` · `unpaid` |
| `year` | number | Calendar year |
| `entitled` | number | Total days entitled |
| `used` | number | Days consumed |
| `pending` | number | Days in pending requests |

### `Task`
A work item assigned to one or more employees.

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `title` | string | Task title |
| `description` | string? | Markdown description |
| `assigneeId` | string | FK → EmsUser |
| `creatorId` | string | FK → EmsUser |
| `teamId` | string? | FK → Team |
| `priority` | enum | `low` · `medium` · `high` · `critical` |
| `status` | enum | `open` · `in_progress` · `review` · `done` |
| `dueDate` | Date? | Due date |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

### `Team`
A group of employees.

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `name` | string | Team name |
| `leadId` | string | FK → EmsUser (team lead) |
| `memberIds` | string[] | FK[] → EmsUser |
| `department` | string | Associated department |
| `createdAt` | DateTime | Creation timestamp |

### `Meeting`
A scheduled meeting with attendees.

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `title` | string | Meeting title |
| `organizer` | string | FK → EmsUser |
| `attendeeIds` | string[] | FK[] → EmsUser |
| `startTime` | DateTime | Start time |
| `endTime` | DateTime | End time |
| `location` | string? | Room or video link |
| `agenda` | string? | Meeting agenda (Markdown) |
| `status` | enum | `scheduled` · `completed` · `cancelled` |

### `TimeEntry`
A single time tracking log entry.

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `userId` | string | FK → EmsUser |
| `taskId` | string? | FK → Task |
| `date` | Date | Work date |
| `hours` | number | Hours logged |
| `description` | string? | Work description |
| `createdAt` | DateTime | Entry creation time |

### `SalaryConfig`
Per-employee salary structure.

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `userId` | string | FK → EmsUser |
| `baseSalary` | number | Monthly base salary (in currency minor units) |
| `currency` | string | ISO 4217 currency code (e.g. `INR`, `USD`) |
| `allowances` | `{name: string, amount: number}[]` | Named allowances (HRA, transport, etc.) |
| `deductions` | `{name: string, amount: number}[]` | Named deductions (tax, PF, insurance) |
| `effectiveFrom` | Date | Configuration effective date |

### `Payslip`
A generated payslip for one pay period.

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `userId` | string | FK → EmsUser |
| `payPeriodStart` | Date | Period start date |
| `payPeriodEnd` | Date | Period end date |
| `grossPay` | number | Total gross earnings |
| `totalDeductions` | number | Total deductions |
| `netPay` | number | Net pay (grossPay - totalDeductions) |
| `breakdown` | `SalaryConfig` snapshot | Config snapshot at time of run |
| `generatedAt` | DateTime | Payslip generation timestamp |

### `Sheet`
A spreadsheet-style data record (flexible tabular data storage used for HR data imports/exports).

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `name` | string | Sheet name |
| `columns` | `{key: string, label: string, type: string}[]` | Column definitions |
| `rows` | `Record<string, unknown>[]` | Row data |
| `createdAt` | DateTime | Creation time |

### `Activity`
Audit log entry for any entity change.

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `entityType` | string | Entity type (e.g. `task`, `payroll`) |
| `entityId` | string | ID of the entity that changed |
| `actorId` | string | FK → EmsUser who made the change |
| `action` | string | Action verb (`created`, `updated`, `deleted`) |
| `diff` | object? | Before/after snapshot of changed fields |
| `timestamp` | DateTime | When the action occurred |

### `Announcement`
A company-wide broadcast.

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `title` | string | Announcement title |
| `body` | string | Announcement content (Markdown) |
| `authorId` | string | FK → EmsUser |
| `publishedAt` | DateTime? | Publish time (null = draft) |
| `pinned` | boolean | Whether to pin at the top |
| `targetRoles` | string[]? | Restrict visibility to specific roles |

---

## Component Inventory

### Layout & Navigation

| Component | File | Description |
|---|---|---|
| Sidebar | `components/Sidebar.tsx` (~7.5 KB) | Full-width left sidebar with grouped navigation links for all major sections. Collapses to icon-only mode on smaller viewports. Highlights the active route and renders role-gated links (e.g., Payroll only for authorized roles). |
| PremiumLoader | `components/PremiumLoader.tsx` | Branded full-screen loading overlay used during initial auth checks and heavy data loads. |
| LoadingSpinner | `components/LoadingSpinner.tsx` | Lightweight inline spinner for component-level loading states. |

### Shared UI Components

| Component | File | Description |
|---|---|---|
| DataTable | `components/DataTable.tsx` | Generic, sortable, filterable, paginated table. Accepts column definitions and row data. Used across Users, Tasks, Meetings, Payroll, and Time Tracking pages. |
| MetricCard | `components/MetricCard.tsx` | KPI card with title, value, unit, trend indicator (up/down/neutral), and optional sparkline. Used on the Dashboard. |
| StatusBadge | `components/StatusBadge.tsx` | Colored pill badge mapping status enums to human-readable labels with semantic colors. |
| EmptyState | `components/EmptyState.tsx` | Friendly empty state illustration and CTA displayed when a data list is empty. |
| ConfirmDialog | `components/ConfirmDialog.tsx` | Modal confirmation dialog for destructive actions. Accepts title, message, and confirm/cancel callbacks. |
| AccessDenied | `components/AccessDenied.tsx` | Full-page or inline component rendered when the user lacks the required permission for a route or action. |

### Domain-Specific Components

#### Attendance

| Component | Description |
|---|---|
| `LeaveBalanceWidget` | Donut chart + table showing leave entitlement vs. usage per type for the selected employee. |
| `LeaveRequestModal` | Modal form for submitting a leave request: type, dates, reason. Includes day-count preview and balance impact. |

#### Payroll

| Component | Description |
|---|---|
| `SalaryConfigModal` | Full salary structure editor. Allows adding/removing allowances and deductions with real-time gross/net preview. |
| `RunPayrollModal` | Payroll run wizard: select pay period, preview totals for all employees, confirm and execute. Shows a diff if any salary configs changed since the last run. |
| `PayslipDetail` | Read-only payslip viewer with full earnings/deductions breakdown, printable layout. |

#### Tasks

| Component | Description |
|---|---|
| `CreateTaskModal` | New task form: title, description (Markdown), assignee picker, team, priority, due date. |
| `EditTaskModal` | Edit existing task fields. Pre-populated from the selected task record. |
| `TaskDetailModal` | Full task view with status timeline, comments thread, linked time entries, and activity log. |

#### Teams

| Component | Description |
|---|---|
| `CreateTeamModal` | Team creation form: name, department, lead selector, member multi-select. |

#### Meetings

| Component | Description |
|---|---|
| `CreateMeetingModal` | Meeting scheduler: title, date/time range picker, location, attendee multi-select, agenda editor. |

#### Time Tracking

| Component | Description |
|---|---|
| `LogTimeModal` | Time entry form: date, task picker, hours input (with validation), and description. Enforces max 24h per day. |

#### Users

| Component | Description |
|---|---|
| `UserActionModal` | Multi-action modal for user management: update role, department, status, or reporting manager. |

### Providers & Infrastructure

| Component | Description |
|---|---|
| `EmsProvider` | Top-level context provider. Holds the authenticated `EmsUser` profile, permissions object, and global app state. Fetches `/api/ems-profile` on mount. |
| `ConditionalAuthGuard` | Wrapper that checks auth state and either renders children or redirects to auth. Used in the root layout to protect all app routes. |
| `SwRegister` | Client component that registers `public/sw.js` on mount. Runs only in the browser. |

---

## Services Layer

Located under `services/`, these modules encapsulate business logic that coordinates multiple API calls or involves non-trivial transformations. They are called from API route handlers or server components, never directly from client components.

### `time-tracking.service.ts`

| Function | Description |
|---|---|
| `getTimeEntriesByUser(userId, from, to)` | Fetch and aggregate time entries for a user in a date range. Returns total hours and daily breakdown. |
| `getTimeEntriesByTask(taskId)` | All time entries logged against a specific task with per-user totals. |
| `createTimeEntry(payload)` | Validate business rules (max hours/day, task existence) and create the entry. |

### `meetings.service.ts`

| Function | Description |
|---|---|
| `createMeeting(payload)` | Create a meeting, validate no organizer/attendee conflicts, and send notifications. |
| `getMeetingsForUser(userId, from, to)` | Return all meetings the user is an organizer or attendee of in the range. |
| `cancelMeeting(id, actorId)` | Cancel a meeting and record the activity. |

### `tasks.service.ts`

| Function | Description |
|---|---|
| `createTask(payload)` | Create a task, validate assignee and team IDs, and log the creation activity. |
| `updateTaskStatus(id, status, actorId)` | Update status with permission check (only assignee or manager can advance status). Logs the transition. |
| `getTasksForUser(userId, filters)` | Return paginated, filtered tasks for a user. |

### `users.service.ts`

| Function | Description |
|---|---|
| `getUserById(id)` | Fetch a user from the database with their current salary config and team. |
| `updateUser(id, patch, actorId)` | Update user fields with audit logging. Validates manager role assignment. |
| `listUsers(filters)` | Return paginated, filterable user list with department and status filters. |

---

## Library Layer

### `lib/db.ts`

Server-only database client. Exports a singleton database connection used by API route handlers and services. Never imported on the client side.

### `lib/auth.ts`

Auth helper utilities for server-side route handlers:
- `getSession(request)` — extracts and validates the JWT from the request cookie using `JWT_SECRET`
- `requireAuth(request)` — throws a 401 response if no valid session
- `requireRole(request, role)` — throws a 403 response if the session user lacks the required role

### `lib/sso.ts`

SSO integration module. Handles the `/auth/callback` flow:
- Receives the token from the auth service redirect
- Validates the token signature
- Exchanges for a session cookie (`httpOnly`, `SameSite=strict`)
- Redirects the user to their original destination

### `lib/api-client.ts`

Client-side typed fetch wrapper for calling the internal `/api/*` route handlers:
- Attaches the session cookie automatically (credentials: 'include')
- Centralizes error handling — surfaces API error messages to the UI
- Provides typed request/response helpers for each domain

```typescript
// Rough shape of lib/api-client.ts
export class ApiClient {
  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(path, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(res.status, err.message);
    }
    return res.json();
  }

  tasks = {
    list: (filters?: TaskFilters) => this.request<Task[]>('/api/tasks?' + new URLSearchParams(filters as any)),
    create: (payload: CreateTaskPayload) => this.request<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: string, patch: Partial<Task>) => this.request<Task>(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  };

  // ... attendance, payroll, users, meetings, etc.
}

export const apiClient = new ApiClient();
```

### `lib/permissions.ts`

Role-based permission system. Defines what each role can do and exposes a `can(user, action, resource)` function used by both route handlers (server-side enforcement) and client components (UI gating).

```typescript
// Roles: 'admin' | 'manager' | 'employee'
// Actions: 'read' | 'create' | 'update' | 'delete' | 'run'
// Resources: 'payroll' | 'users' | 'tasks' | 'teams' | 'performance' | ...

export function can(user: EmsUser, action: Action, resource: Resource): boolean {
  // admin can do everything
  if (user.role === 'admin') return true;
  // permission matrix lookup
  return PERMISSION_MATRIX[user.role]?.[resource]?.includes(action) ?? false;
}
```

---

## PWA & Offline Support

The EMS Frontend is a Progressive Web App. Service Worker registration is handled by `SwRegister.tsx` (client component), which runs `navigator.serviceWorker.register('/sw.js')` on mount.

### Service Worker (`public/sw.js`)

**Caching strategy:**

| Asset Type | Strategy | Cache Name |
|---|---|---|
| App shell (HTML, JS, CSS) | Cache-first | `ems-shell-v1` |
| API responses (`/api/*`) | Network-first with cache fallback | `ems-api-v1` |
| Static assets (images, fonts) | Cache-first | `ems-assets-v1` |
| Navigation requests | Network-first, `/offline` fallback | — |

**Offline behavior:**
- The `/offline` route is pre-cached during the Service Worker install phase
- If a navigation request fails (no network, no cache), the user is shown `/offline`
- Read-only data (dashboards, reports) can be served from cache
- Write operations (task creation, time logging) queue via Background Sync and replay when connectivity is restored

### PWA Manifest (`public/manifest.json`)

```json
{
  "name": "EMS — Employee Management System",
  "short_name": "EMS",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0f172a",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## Authentication & SSO

Authentication is handled entirely by `@codeswayam/auth` v2.5.1. The application never stores or processes passwords.

**Flow summary:**

1. User navigates to any protected route
2. `ConditionalAuthGuard` (or middleware) detects no valid session cookie
3. User is redirected to `NEXT_PUBLIC_AUTH_URL/login?returnTo=<current-path>`
4. After successful login, auth service redirects to `/auth/callback?token=<jwt>`
5. `lib/sso.ts` validates the token, sets an `httpOnly` cookie, and redirects to `returnTo`
6. All subsequent API route calls read the session from the cookie server-side

**Session cookie:**
- `httpOnly` — inaccessible to JavaScript, prevents XSS token theft
- `SameSite=strict` — prevents CSRF attacks
- `Secure` in production (HTTPS only)
- Contains the full JWT signed with `JWT_SECRET`

---

## Permission System

Defined in `lib/permissions.ts`. Three roles with distinct capability sets:

| Permission | `employee` | `manager` | `admin` |
|---|---|---|---|
| View own profile | ✅ | ✅ | ✅ |
| View all employees | ❌ | ✅ | ✅ |
| Edit employee details | ❌ | ✅ (own team) | ✅ |
| Create/assign tasks | ✅ (self) | ✅ | ✅ |
| Edit any task | ❌ | ✅ (own team) | ✅ |
| View attendance (all) | ❌ | ✅ (own team) | ✅ |
| Approve leave requests | ❌ | ✅ | ✅ |
| View payroll | ❌ | ❌ | ✅ |
| Run payroll | ❌ | ❌ | ✅ |
| Edit salary config | ❌ | ❌ | ✅ |
| Manage teams | ❌ | ✅ (own team) | ✅ |
| View analytics | ❌ | ✅ (own team) | ✅ |
| Performance reviews | ❌ | ✅ | ✅ |
| Admin panel | ❌ | ❌ | ✅ |

---

## Environment Variables

Create `.env.local` in the project root. **Never commit this file.**

```env
# Public base URL for the EMS backend API
# Used by internal API routes to proxy requests to the backend
NEXT_PUBLIC_API_URL=https://api.ems.example.com

# Public URL for the CodeSwayam Auth service
# Used by middleware for login redirects and by lib/sso.ts for token exchange
NEXT_PUBLIC_AUTH_URL=https://auth.codeswayam.example.com

# Secret used to sign and verify JWT session cookies
# Must match the secret used by the auth service to issue tokens
# SERVER-SIDE ONLY — never prefix with NEXT_PUBLIC_
JWT_SECRET=your-256-bit-secret-here
```

| Variable | Scope | Required | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Client + Server | Yes | EMS backend API base URL. Prefixed `NEXT_PUBLIC_` for use in client-side API client code. |
| `NEXT_PUBLIC_AUTH_URL` | Client + Server | Yes | CodeSwayam Auth service URL. Used for login redirects and SSO callback handling. |
| `JWT_SECRET` | Server only | Yes | 256-bit secret for JWT verification. Used exclusively in server-side code (`lib/auth.ts`). **Must never be exposed to the client bundle.** |

> **Security:** `JWT_SECRET` must be a cryptographically random string of at least 32 bytes. Generate one with: `openssl rand -base64 32`

---

## Development Setup

### Prerequisites

- **Node.js** ≥ 20.x (LTS recommended)
- **npm** ≥ 10, **pnpm** ≥ 9, or **yarn** ≥ 4
- A running EMS backend (or access to a shared dev instance)
- CodeSwayam Auth service credentials for your dev environment

### Step 1 — Install Dependencies

```bash
# From the repo root (monorepo context):
cd apps/ems-frontend
npm install

# Or from the monorepo root using workspaces:
npm install --workspace=apps/ems-frontend
```

### Step 2 — Configure Environment

```bash
cp .env.example .env.local
# Fill in NEXT_PUBLIC_API_URL, NEXT_PUBLIC_AUTH_URL, JWT_SECRET
```

### Step 3 — Start Development Server

```bash
npm run dev
# Starts on http://localhost:3000 by default
```

### Step 4 — Verify Authentication Flow

1. Open `http://localhost:3000/dashboard`
2. You will be redirected to the Auth service login page
3. Log in with your dev credentials
4. You should land on `/dashboard` with the sidebar and KPI metrics loaded

### Service Worker in Development

Service Workers are disabled by default in Next.js development mode. To test offline behavior:

```bash
npm run build
npm run start   # Production mode — Service Worker will register
```

Then use Chrome DevTools → Application → Service Workers to inspect the registration.

### Linting & Type Checking

```bash
npm run lint          # ESLint with Next.js rules
npm run type-check    # TypeScript strict mode check
```

### Production Build

```bash
npm run build         # Outputs to .next/
npm run start         # Serves production build on port 3000
```

---

## Code Examples

### 1. SSO Auth Callback Handler

```typescript
// app/auth/callback/route.ts  (or page.tsx with redirect logic)
import { NextRequest, NextResponse } from 'next/server';
import { handleSsoCallback } from '@/lib/sso';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const returnTo = searchParams.get('returnTo') ?? '/dashboard';

  if (!token) {
    return NextResponse.redirect(new URL('/auth/error?reason=missing_token', request.url));
  }

  try {
    // lib/sso.ts validates the JWT, creates the session cookie
    const response = NextResponse.redirect(new URL(returnTo, request.url));
    await handleSsoCallback(token, response);
    return response;
  } catch {
    return NextResponse.redirect(new URL('/auth/error?reason=invalid_token', request.url));
  }
}

// lib/sso.ts
import { jwtVerify } from 'jose';

export async function handleSsoCallback(token: string, response: NextResponse) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  const { payload } = await jwtVerify(token, secret);

  response.cookies.set('ems-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  });

  return payload;
}
```

### 2. Attendance API Route

```typescript
// app/api/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { can } from '@/lib/permissions';
import db from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await requireAuth(request);  // throws 401 if not authenticated

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') ?? session.userId;
  const date = searchParams.get('date');

  // Employees can only view their own attendance
  if (userId !== session.userId && !can(session.user, 'read', 'attendance')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const records = await db.attendance.findMany({
    where: {
      userId,
      ...(date ? { date: new Date(date) } : {}),
    },
    orderBy: { date: 'desc' },
    take: 30,
  });

  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  const session = await requireAuth(request);
  const body = await request.json();

  const record = await db.attendance.create({
    data: {
      userId: session.userId,
      date: new Date(body.date),
      clockIn: body.clockIn ? new Date(body.clockIn) : null,
      clockOut: body.clockOut ? new Date(body.clockOut) : null,
      status: body.status,
      notes: body.notes,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
```

### 3. Payroll Calculation from SalaryConfig

```typescript
// services logic — called from /api/payroll route handler
import type { SalaryConfig, Payslip } from '@/lib/types';

export function calculatePayslip(
  config: SalaryConfig,
  payPeriodStart: Date,
  payPeriodEnd: Date
): Omit<Payslip, 'id' | 'generatedAt'> {
  const totalAllowances = config.allowances.reduce(
    (sum, a) => sum + a.amount,
    0
  );

  const totalDeductions = config.deductions.reduce(
    (sum, d) => sum + d.amount,
    0
  );

  const grossPay = config.baseSalary + totalAllowances;
  const netPay = grossPay - totalDeductions;

  return {
    userId: config.userId,
    payPeriodStart,
    payPeriodEnd,
    grossPay,
    totalDeductions,
    netPay,
    breakdown: config,   // snapshot of config at time of run
  };
}

// Usage in the /api/payroll route handler
const configs = await db.salaryConfig.findMany({ where: { active: true } });
const payslips = configs.map(config =>
  calculatePayslip(config, periodStart, periodEnd)
);
await db.payslip.createMany({ data: payslips });
```

### 4. Task Creation Modal

```tsx
// components/tasks/CreateTaskModal.tsx
'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (task: Task) => void;
}

export function CreateTaskModal({ open, onClose, onCreated }: CreateTaskModalProps) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    priority: 'medium' as const,
    dueDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.assigneeId) {
      setError('Title and assignee are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const task = await apiClient.tasks.create({
        ...form,
        dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
      });
      onCreated(task);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="create-task-title">
      <h2 id="create-task-title">Create Task</h2>
      {error && <p role="alert" className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="task-title">Title *</label>
        <input
          id="task-title"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          required
        />

        <label htmlFor="task-desc">Description</label>
        <textarea
          id="task-desc"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />

        {/* assignee picker, priority select, due date — omitted for brevity */}

        <button type="button" onClick={onClose}>Cancel</button>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create Task'}
        </button>
      </form>
    </div>
  );
}
```

---

## Project Structure

```
apps/ems-frontend/
├── src/
│   └── app/                          # Next.js App Router
│       ├── layout.tsx                # Root layout (EmsProvider, Sidebar, ConditionalAuthGuard)
│       ├── dashboard/page.tsx
│       ├── users/page.tsx
│       ├── attendance/page.tsx
│       ├── tasks/page.tsx
│       ├── teams/page.tsx
│       ├── meetings/page.tsx
│       ├── calendar/page.tsx
│       ├── payroll/page.tsx
│       ├── tracking/page.tsx
│       ├── org-chart/page.tsx
│       ├── analytics/page.tsx
│       ├── performance/page.tsx
│       ├── announcements/page.tsx
│       ├── settings/page.tsx
│       ├── auth/
│       │   └── callback/
│       │       └── route.ts          # SSO callback handler
│       ├── offline/page.tsx          # PWA offline fallback
│       └── api/                      # Internal API route handlers
│           ├── attendance/route.ts
│           ├── tasks/
│           │   ├── route.ts
│           │   └── [id]/route.ts
│           ├── teams/
│           │   ├── route.ts
│           │   └── [id]/route.ts
│           ├── meetings/
│           │   ├── route.ts
│           │   └── [id]/route.ts
│           ├── payroll/
│           │   ├── route.ts
│           │   ├── [id]/route.ts
│           │   └── salary-config/route.ts
│           ├── tracking/route.ts
│           ├── users/route.ts
│           ├── dashboard/route.ts
│           ├── performance/route.ts
│           └── ems-profile/route.ts
├── components/                       # Shared React components
│   ├── Sidebar.tsx
│   ├── PremiumLoader.tsx
│   ├── AccessDenied.tsx
│   ├── StatusBadge.tsx
│   ├── EmptyState.tsx
│   ├── ConfirmDialog.tsx
│   ├── DataTable.tsx
│   ├── MetricCard.tsx
│   ├── LoadingSpinner.tsx
│   ├── SwRegister.tsx
│   ├── providers/
│   │   ├── EmsProvider.tsx
│   │   └── ConditionalAuthGuard.tsx
│   ├── attendance/
│   │   ├── LeaveBalanceWidget.tsx
│   │   └── LeaveRequestModal.tsx
│   ├── payroll/
│   │   ├── SalaryConfigModal.tsx
│   │   ├── RunPayrollModal.tsx
│   │   └── PayslipDetail.tsx
│   ├── tasks/
│   │   ├── CreateTaskModal.tsx
│   │   ├── EditTaskModal.tsx
│   │   └── TaskDetailModal.tsx
│   ├── teams/
│   │   └── CreateTeamModal.tsx
│   ├── meetings/
│   │   └── CreateMeetingModal.tsx
│   ├── tracking/
│   │   └── LogTimeModal.tsx
│   └── users/
│       └── UserActionModal.tsx
├── services/                         # Business logic (server-side)
│   ├── time-tracking.service.ts
│   ├── meetings.service.ts
│   ├── tasks.service.ts
│   └── users.service.ts
├── lib/                              # Shared utilities
│   ├── db.ts                         # Database client (server-only)
│   ├── auth.ts                       # JWT validation helpers
│   ├── sso.ts                        # SSO callback handling
│   ├── api-client.ts                 # Client-side fetch wrapper
│   └── permissions.ts                # RBAC permission matrix
├── public/
│   ├── sw.js                         # Service Worker
│   ├── manifest.json                 # PWA manifest
│   └── icons/                        # PWA icons
├── .env.local                        # Local secrets (gitignored)
├── .env.example                      # Environment template
├── next.config.ts                    # Next.js configuration
├── vercel.json                       # Vercel deployment config
├── tsconfig.json
└── package.json
```

---

## Contributing

1. Branch from `main`: `feat/<topic>`, `fix/<topic>`, `chore/<topic>`
2. Run `npm run lint && npm run type-check` before opening a PR
3. API route changes must include corresponding type updates in `lib/types.ts`
4. Permission changes must be reflected in both `lib/permissions.ts` and the permission table in this README
5. PWA/Service Worker changes require manual offline testing before merge

---

*Built on the CodeSwayam platform. © CodeSwayam.*
