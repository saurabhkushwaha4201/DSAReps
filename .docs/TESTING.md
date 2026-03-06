# Testing Documentation

## 1. Testing Objective
Validate that the DSA Revision Tracker system behaves correctly across its backend API, web dashboard, and Chrome extension, with a focus on authentication, scheduling logic, data integrity, and error handling.

## 2. Testing Scope
- **Backend API**: Authentication, problems, revisions, user settings, and health endpoints.
- **Scheduling Logic**: Daily triage and stability-based scheduling.
- **Data Persistence**: MongoDB documents for users, problems, and revision logs.
- **Frontend Integration**: Dashboard API integration and extension background messaging.

Out of scope:
- Third-party systems reliability (Google OAuth availability).
- UI/UX visual acceptance (can be covered separately).

## 3. Test Environment Setup
- Node.js and npm installed.
- MongoDB available (local or Atlas).
- Google OAuth credentials configured for web and extension.

### Backend
1. `cd backend`
2. `npm install`
3. Create `backend/.env` with required variables.
4. Start API: `npm run dev`

### Dashboard
1. `cd dashboard`
2. `npm install`
3. Create `dashboard/.env`.
4. Start: `npm run dev`

### Extension
1. `cd Frontend`
2. `npm install`
3. Build watch: `npm run dev` (outputs to `Frontend/dist`).
4. Load unpacked extension from `Frontend/dist` in Chrome.

Optional scripts:
- `backend/scripts/verify-backend.js` for sanity verification of DB and services.
- `backend/scripts/seed-portfolio-data.js` for demo data.

## 4. API Endpoint Testing Matrix
The following endpoints are extracted from actual Express routes.

### Auth
**Endpoint**: `/api/auth/google`
- **Method**: `POST`
- **Description**: Exchange Google credential for backend JWT.
- **Test Cases**:
  - Valid: valid Google ID token in `credential`.
  - Invalid: missing `credential`.
  - Invalid: malformed/expired Google token.
- **Expected Status Codes**: `200`, `400`, `401`
- **Expected Response Structure**:
  - `200`: `{ token, user: { id, email, name, avatar, notificationTime } }`
  - `400/401`: `{ message }`
- **Database Impact Verification**:
  - New user created when `googleId` not found.
  - Existing user reused when `googleId` exists.

**Endpoint**: `/api/auth/google`
- **Method**: `GET`
- **Description**: Initiate Google OAuth flow.
- **Test Cases**:
  - Valid: no query or `source=extension`.
- **Expected Status Codes**: `302`
- **Expected Response Structure**: Redirect to Google OAuth URL.
- **Database Impact Verification**: None.

**Endpoint**: `/api/auth/google/callback`
- **Method**: `GET`
- **Description**: OAuth callback handler; issues backend JWT.
- **Test Cases**:
  - Valid: OAuth `code` with `state`.
  - Invalid: missing/invalid `code`.
- **Expected Status Codes**: `302`
- **Expected Response Structure**:
  - Redirect to `https://<EXTENSION_ID>.chromiumapp.org/auth?token=...` if `source=extension`.
  - Redirect to `http://localhost:5175/login?token=...` otherwise.
- **Database Impact Verification**:
  - New user created on first login.
  - Existing user reused on subsequent logins.

### Problems
**Endpoint**: `/api/problems`
- **Method**: `POST`
- **Description**: Save a new problem for the authenticated user.
- **Test Cases**:
  - Valid: new unique problem URL for user.
  - Invalid: missing required fields (`platform`, `title`, `url`, `difficulty`, `attemptType`).
  - Edge: duplicate URL for same user (idempotent save).
- **Expected Status Codes**: `201`, `200`, `400`, `500`
- **Expected Response Structure**:
  - `201`: `{ success: true, problem }`
  - `200` duplicate: `{ success: true, isDuplicate: true, problem }`
- **Database Impact Verification**:
  - New `Problem` document inserted on first save.
  - No new document on duplicate save.

**Endpoint**: `/api/problems`
- **Method**: `GET`
- **Description**: List problems with pagination.
- **Test Cases**:
  - Valid: default query (no params).
  - Valid: `page` and `limit` values.
  - Edge: page beyond total pages.
- **Expected Status Codes**: `200`, `500`
- **Expected Response Structure**:
  - `{ problems, total, page, totalPages, hasMore }`
- **Database Impact Verification**: None.

**Endpoint**: `/api/problems/today`
- **Method**: `GET`
- **Description**: Daily triage list (anti-avalanche).
- **Test Cases**:
  - Valid: user has due or manual override problems.
  - Edge: no due problems.
- **Expected Status Codes**: `200`, `500`
- **Expected Response Structure**:
  - `{ success: true, problems, count }`
- **Database Impact Verification**: None.

**Endpoint**: `/api/problems/stats`
- **Method**: `GET`
- **Description**: Heatmap, weak clusters, streak stats.
- **Test Cases**:
  - Valid: user with revision logs.
  - Edge: user with no logs.
- **Expected Status Codes**: `200`, `500`
- **Expected Response Structure**:
  - `{ success: true, heatmap, weakClusters, streak, longestStreak, totalProblems }`
- **Database Impact Verification**: None.

**Endpoint**: `/api/problems/:id/revise`
- **Method**: `POST`
- **Description**: Apply revision rating and update schedule.
- **Test Cases**:
  - Valid: rating in `FORGOT|SLOW|CLEAN`.
  - Invalid: rating outside allowed values.
  - Invalid: problem not found or belongs to another user.
- **Expected Status Codes**: `200`, `400`, `404`, `500`
- **Expected Response Structure**:
  - `{ success: true, problem }` on success.
- **Database Impact Verification**:
  - `Problem` updated with new stability score, interval, and `nextReviewDate`.
  - `RevisionLog` created.
  - Manual override flags cleared.
  - Streak may update if daily goal met.

**Endpoint**: `/api/problems/:id/reschedule`
- **Method**: `PUT`
- **Description**: Manual override review date.
- **Test Cases**:
  - Valid: `date` today or future (<= 90 days).
  - Invalid: missing `date`.
  - Invalid: date in the past or > 90 days.
- **Expected Status Codes**: `200`, `400`, `404`, `500`
- **Expected Response Structure**:
  - `{ success: true, problem }`
- **Database Impact Verification**:
  - `Problem.isManualOverride = true` and `manualOverrideDate` set.

**Endpoint**: `/api/problems/:id/notes`
- **Method**: `PATCH`
- **Description**: Update problem notes.
- **Test Cases**:
  - Valid: notes string.
  - Invalid: problem not found or belongs to another user.
- **Expected Status Codes**: `200`, `404`, `500`
- **Expected Response Structure**:
  - `{ success: true, notes }`
- **Database Impact Verification**:
  - `Problem.notes` updated.

**Endpoint**: `/api/problems/:id/archive`
- **Method**: `PATCH`
- **Description**: Archive a problem.
- **Test Cases**:
  - Valid: active problem.
  - Invalid: problem not found.
- **Expected Status Codes**: `200`, `404`, `500`
- **Expected Response Structure**:
  - `{ success: true, problem }`
- **Database Impact Verification**:
  - `Problem.status = archived`, `archivedAt` set.

**Endpoint**: `/api/problems/:id/unarchive`
- **Method**: `PATCH`
- **Description**: Restore archived problem.
- **Test Cases**:
  - Valid: archived problem.
  - Invalid: problem not found.
- **Expected Status Codes**: `200`, `404`, `500`
- **Expected Response Structure**:
  - `{ success: true, problem }`
- **Database Impact Verification**:
  - `Problem.status = active`, `archivedAt = null`.

### Revisions
**Endpoint**: `/api/revisions`
- **Method**: `POST`
- **Description**: Create revision log.
- **Test Cases**:
  - Valid: `problemId`, `rating` (see model enum), optional `timeTaken` and `device`.
  - Invalid: non-existent `problemId`.
- **Expected Status Codes**: `200`, `404`, `500`
- **Expected Response Structure**:
  - `{ success: true }`
- **Database Impact Verification**:
  - `RevisionLog` created.

**Endpoint**: `/api/revisions/stats`
- **Method**: `GET`
- **Description**: Dashboard stats summary.
- **Test Cases**:
  - Valid: user with logs.
  - Edge: user with no logs.
- **Expected Status Codes**: `200`, `500`
- **Expected Response Structure**:
  - `{ totalRevisions, totalProblems, streak }`
- **Database Impact Verification**: None.

**Endpoint**: `/api/reviews`
- **Method**: `POST`
- **Description**: Alternate route for revision creation.
- **Test Cases**: Same as `/api/revisions` POST.
- **Expected Status Codes**: `200`, `404`, `500`
- **Expected Response Structure**: `{ success: true }`
- **Database Impact Verification**: Same as `/api/revisions` POST.

**Endpoint**: `/api/dashboard/stats`
- **Method**: `GET`
- **Description**: Alternate route for revision stats.
- **Test Cases**: Same as `/api/revisions/stats`.
- **Expected Status Codes**: `200`, `500`
- **Expected Response Structure**: `{ totalRevisions, totalProblems, streak }`
- **Database Impact Verification**: None.

### User Settings
**Endpoint**: `/api/user/settings`
- **Method**: `GET`
- **Description**: Fetch revision intervals and daily goal.
- **Test Cases**:
  - Valid: authenticated user.
  - Invalid: user not found.
- **Expected Status Codes**: `200`, `404`, `500`
- **Expected Response Structure**:
  - `{ success: true, settings: { revisionIntervals, dailyGoal } }`
- **Database Impact Verification**: None.

**Endpoint**: `/api/user/settings`
- **Method**: `PUT`
- **Description**: Update revision intervals and daily goal.
- **Test Cases**:
  - Valid: `dailyGoal` between 1 and 10.
  - Valid: `revisionIntervals` between 1 and 30 with `hard <= medium <= easy`.
  - Invalid: missing or invalid values.
- **Expected Status Codes**: `200`, `400`, `404`, `500`
- **Expected Response Structure**:
  - `{ success: true, settings: { revisionIntervals, dailyGoal } }`
- **Database Impact Verification**:
  - `User.revisionIntervals` and/or `User.dailyGoal` updated.

### Health
**Endpoint**: `/`
- **Method**: `GET`
- **Description**: Health check.
- **Test Cases**: Valid request.
- **Expected Status Codes**: `200`
- **Expected Response Structure**: Plain text response.
- **Database Impact Verification**: None.

## 5. Authentication & Authorization Testing
- Verify JWT required for all protected routes:
  - `/api/problems/*`
  - `/api/revisions/*`
  - `/api/user/*`
  - `/api/reviews`
  - `/api/dashboard/stats`
- Test missing `Authorization` header returns `401` with `Authorization token missing`.
- Test invalid/expired JWT returns `401` with `Invalid or expired token`.
- Verify user isolation: accessing another user’s problem by ID returns `404`.

## 6. Negative Testing Scenarios
- Submit malformed JSON payloads to POST/PUT/PATCH routes.
- Use invalid enum values (`difficulty`, `attemptType`, `rating`).
- Use empty strings for required fields.
- Use invalid object IDs in `:id` routes.

## 7. Edge Case Testing
- Save problem with same URL after soft-delete (should allow re-add if `isDeleted` true).
- Daily triage with only manual overrides vs only algorithmic picks.
- Reschedule to exactly today and exactly 90 days out.
- Revise when `stabilityScore` is near 0 or 100.
- Get stats with zero revisions and zero problems.

## 8. Security Validation Checks
- Ensure JWT is required and validated on all protected routes.
- Verify no sensitive secrets are exposed in responses or error messages.
- Confirm CORS behavior matches deployment needs (currently permissive).
- Confirm extension OAuth redirect uses `EXTENSION_ID` and only returns token via redirect.

## 9. Performance Validation Expectations
- Verify typical API responses complete within acceptable thresholds under local load.
- Validate `/api/problems/stats` aggregation performance on large datasets.
- Check that daily triage queries use indexes (manual override + due problems).

## 10. Error Handling Validation
- Unhandled routes return `404` with `{ message: 'Route not found' }`.
- Server errors return `500` with `{ message: 'Internal server error' }` (and `error` in non-production).
- Controller-specific errors return descriptive messages (e.g., validation errors).

## 11. Logging Verification
- Confirm startup logs: `[DB] Connected`, `[SERVER] Running on port ...`.
- Verify error logs for controller failures (e.g., `[PROBLEM] Save error`).
- For auth flow: verify logs for OAuth callback and token generation.

## 12. Pass / Fail Criteria
- **Pass**: All required endpoints respond with expected status codes and structures, data changes match expected DB state, and security checks pass.
- **Fail**: Any endpoint returns unexpected status codes, incorrect DB updates, or security bypass (missing JWT enforcement).

## 13. Final Testing Checklist
- Backend starts without errors and connects to DB.
- OAuth flow works for both web and extension.
- Protected routes reject missing/invalid JWTs.
- Problem CRUD and triage logic behave as specified.
- Stats endpoints return correct aggregates.
- User settings validation enforces limits and ordering.
- Extension can save problems and fetch daily tasks.
- Dashboard handles expired sessions and redirects to login.
- Error responses and logs are consistent with controller logic.
