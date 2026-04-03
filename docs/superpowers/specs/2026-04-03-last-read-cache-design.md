# Last-Read Cache Design

## Goal

Pre-fetch reading data on backend startup, cache it in memory, and refresh every 10 minutes. The frontend shows a "loading" state when the cache is still being populated and retries automatically.

## Architecture

A new `lastReadCache.ts` module owns the cache state and polling logic, keeping it isolated from the route handler. `index.ts` imports `getCache` and `startPolling`, calls `startPolling` at startup (outside test mode), and the `/api/last-read` endpoint returns cached data or a 503 `{ pending: true }` response while the cache is null.

The frontend `LastRead.tsx` handles the new 503+pending state by showing "Loading, this may take a while…" and retrying after 3 seconds.

## Components

### `backend/src/lastReadCache.ts` (new)

- `ReadingEntry` type (name, pages, weekday_english, weekday_icelandic)
- `cache: ReadingEntry[] | null` — starts null
- `populate(): Promise<void>` — spawns the Python script, parses stdout, sets cache; logs errors without throwing
- `getCache(): ReadingEntry[] | null` — returns current cache value
- `startPolling(intervalMs: number): void` — calls `populate()` immediately, then repeats on `setInterval`

### `backend/src/index.ts` (modified)

- Import `getCache`, `startPolling` from `./lastReadCache`
- Call `startPolling(10 * 60 * 1000)` inside the `NODE_ENV !== 'test'` block
- `/api/last-read` handler: if `getCache()` is null return `res.status(503).json({ pending: true })`, else `res.json(getCache())`
- Remove the inline `execFile` call from the route handler

### `frontend/src/pages/LastRead.tsx` (modified)

- On fetch response: if `status === 503` and body has `pending: true`, set a "pending" UI state showing "Loading, this may take a while…" and schedule a retry via `setTimeout(fetchData, 3000)`
- Other non-ok responses show the existing "Could not load reading data." error message
- No change to the happy path rendering

## Data Flow

```
startup → startPolling() → populate() → Python script → cache set
request → getCache() null? → 503 { pending: true }
                          → data? → 200 + JSON

frontend fetch → 503 pending → show message + retry in 3s → ...
              → 200 → render cards
              → other error → show error
```

## Error Handling

- `populate()` catches Python script errors and JSON parse errors — logs them, leaves cache unchanged (null on first run, stale on subsequent runs)
- Frontend only retries on 503+pending; all other errors show the error message immediately

## Testing

- `lastReadCache.ts`: unit tests for `populate()` success, `populate()` with script error, `populate()` with bad JSON, `getCache()` before/after populate, `startPolling()` calls populate immediately
- `index.ts` `/api/last-read`: test returns 503+pending when cache null, test returns 200+data when cache populated (mock `getCache`)
- `LastRead.tsx`: test renders pending message on 503+pending, test retries after timeout, test renders cards on success, test renders error on other failures
