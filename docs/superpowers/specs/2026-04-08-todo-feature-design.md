# TODO Feature — Design Spec

**Date:** 2026-04-08

## Summary

Replace the `/todo` stub page with a full two-panel TODO editor. The backend reads and writes `.txt` files from a `TODO` folder in its working directory. The frontend shows a file list in a left sidebar and a text editor on the right with autosave.

---

## Backend

### New module: `backend/src/todoFiles.ts`

Handles all file system operations for the TODO folder.

**Configuration:**
- `TODO_DIR` — path to the TODO folder, set via `TODO_DIR` env var, defaults to `./TODO` (relative to backend working directory)

**Exports:**
- `ensureDir()` — creates `TODO_DIR` if it does not exist
- `ensureDefaultFile()` — if `TODO_DIR` is empty, creates `<YYYY>-<M>-<D>-TODO.txt` with today's date (called at startup)
- `listFiles()` — returns `{ filename: string, name: string }[]` sorted ascending by filename (which sorts by date). `name` is the filename with the date prefix (`YYYY-M-D-`) and `.txt` extension removed.
- `readFile(filename: string)` → `Promise<string>` — reads and returns file content
- `createFile(name: string)` → `Promise<{ filename: string, name: string }>` — creates `<YYYY>-<M>-<D>-<name>.txt` with today's date and empty content, returns the new entry
- `saveFile(filename: string, content: string)` → `Promise<void>` — writes content to the file
- `renameFile(oldFilename: string, newName: string)` → `Promise<{ filename: string }>` — renames the file on disk, keeping the original date prefix and replacing only the name part. Returns the new filename.

**Filename format:** `<year>-<month_number>-<day>-<name>.txt`
- Example: `2026-4-8-TODO.txt` (no zero-padding)

### Routes added to `backend/src/index.ts`

| Method | Path | Body | Response |
|--------|------|------|----------|
| `GET` | `/api/todo` | — | `{ filename, name }[]` |
| `GET` | `/api/todo/:filename` | — | `{ content: string }` |
| `POST` | `/api/todo` | `{ name: string }` | `{ filename, name }` |
| `PUT` | `/api/todo/:filename` | `{ content: string }` | `204` |
| `PATCH` | `/api/todo/:filename` | `{ name: string }` | `{ filename: string }` |

All routes return `500` on unexpected errors.

### Startup

In `index.ts`, inside the `if (process.env.NODE_ENV !== 'test')` block, call `await ensureDir()` then `await ensureDefaultFile()` before `app.listen()`.

---

## Frontend

### Layout

`Todo.tsx` is rewritten as a full-height, full-width two-panel layout (`h-screen flex`):

- **Left sidebar** — fixed width (`w-64`), flex column:
  - Site title ("Brynjar's Online Antics") as a `<Link to="/">` at the top
  - A `+` button to create a new file, positioned at the top of the sidebar
  - A scrollable list of file names (without date prefix), one per row
  - Active file is visually highlighted
  - Clicking a non-active file selects it and loads its content
  - Clicking the already-active file switches it into inline rename mode: the label becomes an `<input>` pre-filled with the current name, commits on Enter or blur, calls `PATCH /api/todo/:filename`, updates state with the new filename

- **Right panel** — `flex-1`, full height:
  - A full-height `<textarea>` for editing the selected file's content
  - No explicit save button

### Hook: `frontend/src/hooks/useTodoFiles.ts`

Owns all API state and calls.

**State:**
- `files: { filename: string, name: string }[]`
- `selectedFilename: string | null`
- `content: string`

**Behavior:**
- On mount: calls `GET /api/todo`, sets `files`, selects the first file and fetches its content via `GET /api/todo/:filename`
- Selecting a file calls `GET /api/todo/:filename` and updates `content`

**Exposed:**
- `files`, `selectedFilename`, `content`, `setContent`
- `selectFile(filename: string)` — fetches and loads content
- `createFile(name: string)` — calls `POST /api/todo`, prepends new entry to `files`, selects it with empty content
- `saveFile(content: string)` — calls `PUT /api/todo/:filename` with current `selectedFilename`
- `renameFile(oldFilename: string, newName: string)` — calls `PATCH /api/todo/:filename`, updates `files` and `selectedFilename` in state with the new filename

### Autosave

In `Todo.tsx`, a `useRef` holds the latest `content` value (updated on every keystroke). On textarea `focus`, a `setInterval` is started that calls `saveFile(contentRef.current)` every 10 seconds. On `blur`, the interval is cleared. This avoids stale closure issues with the interval callback.

### Creating a new file

Pressing `+` calls `createFile('New')`. The backend date-prefixes it. If a file named `New` already exists on the same day, the backend appends a counter suffix (e.g., `New-2`) to avoid collision.

---

## Error Handling

- Backend: all routes catch errors and return `500 { error: string }`
- Frontend: API errors are silently swallowed for autosave. List/load errors are not shown in the UI for this iteration (no error state).

---

## Not in scope

- Deleting files from the UI
- Conflict resolution if files are modified externally while the editor is open
- Multiple files open at once
