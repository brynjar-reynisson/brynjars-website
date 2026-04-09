# TODO Password Protection — Design Spec

**Date:** 2026-04-09

## Summary

Add password protection to the TODO editor. The backend verifies a password against a hashed value stored in `.env`, issues a persistent random token saved to a file, and guards all TODO routes. The frontend always renders the editor but keeps it read-only until authenticated. A lock icon in the sidebar header opens an inline password input; on success it unlocks to full editing.

---

## Backend

### New module: `backend/src/todoAuth.ts`

**Configuration:**
- `HASHED_PASSWORD` — read from env, contains the argon2id hash. The actual comparison logic (`verifyPassword`) is filled in manually by the user; only the function signature and wiring are set up here.
- Session file: stored at `<TODO_DIR>/.session` (i.e. same directory as the TODO files)

**Exports:**
- `verifyPassword(password: string): Promise<boolean>` — compares `password` against `process.env.HASHED_PASSWORD`. Implementation body left as a stub (returns `false`) for the user to fill in with the actual argon2 verification.
- `generateToken(): string` — returns 32 cryptographically random bytes as a hex string using `crypto.randomBytes(32).toString('hex')`
- `loadToken(): Promise<string | null>` — reads the token from the session file; returns `null` if the file does not exist (ENOENT) or cannot be read
- `saveToken(token: string): Promise<void>` — writes the token string to the session file

### New routes in `backend/src/index.ts`

**`POST /api/todo/auth`**
- Body: `{ password: string }`
- Returns 400 if `password` is missing or not a string
- Calls `verifyPassword(password)` — if false, returns 401 `{ error: 'Invalid password' }`
- If true: calls `generateToken()`, `saveToken(token)`, returns 200 `{ token }`
- Returns 500 on unexpected errors

**`GET /api/todo/auth`**
- Reads `Authorization: Bearer <token>` header
- Calls `loadToken()` and compares — returns 200 `{ valid: true }` if they match, 200 `{ valid: false }` otherwise
- Never returns 401 (used for client-side validation check only)

### Auth middleware for existing TODO routes

All 5 existing TODO routes gain a shared middleware function `requireTodoAuth`:
- Reads `Authorization: Bearer <token>` from request headers
- Calls `loadToken()` and compares; if missing or mismatched returns 401 `{ error: 'Unauthorized' }`
- Passes through to the route handler if valid

The middleware is defined once and applied to all 5 routes. The two new auth routes (`POST/GET /api/todo/auth`) are **not** protected by this middleware.

---

## Frontend

### New hook: `frontend/src/hooks/useTodoAuth.ts`

**State:**
- `isAuthenticated: boolean` — false until verified
- `isChecking: boolean` — true while the initial token validation fetch is in flight

**Behavior:**
- On mount: reads token from `localStorage` key `todo_token`. If present, calls `GET /api/todo/auth` with `Authorization: Bearer <token>` header. Sets `isAuthenticated` based on the `valid` field. Sets `isChecking = false` when done. If no token in localStorage, sets `isChecking = false` and `isAuthenticated = false` immediately.

**Exposed:**
- `isAuthenticated`, `isChecking`
- `login(password: string): Promise<boolean>` — calls `POST /api/todo/auth` with `{ password }`. On success (200): stores token in `localStorage` under `todo_token`, sets `isAuthenticated = true`, returns `true`. On 401 or error: returns `false`.
- `logout(): void` — removes `todo_token` from `localStorage`, sets `isAuthenticated = false`

### Changes to `frontend/src/hooks/useTodoFiles.ts`

All fetch calls in the hook include `Authorization: Bearer <token>` header, where the token is read from `localStorage.getItem('todo_token')`. The hook does not depend on auth state — it just sends whatever token is in localStorage (which may be absent if not logged in, causing 401s from the backend that are silently swallowed per existing error handling).

### Changes to `frontend/src/pages/Todo.tsx`

- Imports `useTodoAuth`
- `isChecking === true` → render nothing (blank while initial token validation completes)
- Otherwise always renders the full two-panel editor

**Lock icon in the sidebar header:**
- Sits next to the `+` button in the sidebar header
- Shows 🔒 when `!isAuthenticated`, 🔓 when `isAuthenticated`
- Clicking 🔒 toggles an inline password input open next to the icon
- The inline input is a `<input type="password">` with a submit button; submits on Enter or button click
- On submit: calls `login(password)`. If returns `false`, shows inline error "Incorrect password". On success: input closes, icon switches to 🔓.
- Clicking 🔓 does nothing (no logout UI in scope)

**Unauthenticated state:**
- File list is visible and files can be selected (read-only viewing)
- `<textarea>` has `readOnly={true}` — content visible, not editable
- `+` button click is a no-op when `!isAuthenticated`
- Inline rename does not activate on file click when `!isAuthenticated`

**Authenticated state:**
- Full editing enabled: textarea editable, `+` button works, inline rename works

---

## Error Handling

- Backend: `verifyPassword` errors propagate as 500
- Frontend: `login()` treats any non-200 response as a failed login (returns `false`)
- Frontend: 401 responses from TODO routes are silently swallowed (existing behavior)

---

## Not in scope

- Multiple users / multiple passwords
- Password change UI
- Session invalidation / logout UI (token persists indefinitely in localStorage and session file)
- Rate limiting on login attempts
