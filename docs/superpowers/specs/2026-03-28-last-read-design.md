# Last Read Page Design

**Date:** 2026-03-28

## Overview

Add a "Last Read" page to the site. The page fetches data from a Node.js backend that runs a Python script and displays what each boy last read, in a card-per-boy layout.

## Architecture

Two new pieces:
- `backend/` — Node.js + TypeScript + Express API server
- Frontend additions — React Router, new `LastRead` page, updated `NavCard` href

The frontend fetches `GET /api/last-read` from the backend. The backend spawns `python last_read.py --json` in the script's directory and returns the parsed JSON.

---

## Backend

### Stack
- Node.js + TypeScript
- Express
- `ts-node` or compiled JS for running

### Location
`backend/` at the project root.

### Structure
```
backend/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts
```

### Endpoint: `GET /api/last-read`

- Spawns `python last_read.py --json` using `child_process.execFile` in the directory specified by the `LAST_READ_DIR` environment variable
- Default value of `LAST_READ_DIR` for local dev: `C:\Users\Lenovo\misc_projects\last-read`
- Parses stdout as JSON and returns it with `Content-Type: application/json`
- On error (non-zero exit, parse failure): returns `500` with `{ "error": "Failed to fetch reading data" }`

### Configuration
- Port: `3001`
- CORS: enabled for `http://localhost:5173` (dev frontend)
- `LAST_READ_DIR` env var controls the script directory

### JSON shape returned by Python script
```json
[
  {
    "name": "Viktor",
    "pages": "23-24",
    "weekday_icelandic": "Fimmtudagur",
    "weekday_english": "Thursday"
  },
  {
    "name": "Alexander",
    "pages": "126-127",
    "weekday_icelandic": "Miðvikudagur",
    "weekday_english": "Wednesday"
  }
]
```

---

## Frontend

### New dependencies
- `react-router-dom`

### Routing
`main.tsx` wraps the app in `<BrowserRouter>`. `App.tsx` defines routes:
- `/` → front page (existing content, unchanged visually)
- `/last-read` → `LastRead` page

### Updated NavCard
The "Last Read" entry in `NAV_ITEMS` in `App.tsx` changes from `href: '#'` to `href: '/last-read'`.

### New component: `LastRead.tsx`

Location: `frontend/src/pages/LastRead.tsx`

Structure:
- `<h1>` — "Brynjar's stuff", styled identically to the front page h1, wrapped in a `<Link to="/">` so it navigates back to the front page
- Fetches `http://localhost:3001/api/last-read` on mount
- While loading: shows "Loading..."
- On error: shows "Could not load reading data."
- On success: renders one card per entry with:
  - Boy's name (bold)
  - Pages read (e.g. "Pages 23–24")
  - Day (e.g. "Thursday · Fimmtudagur")
- Cards are non-clickable `<div>` elements, styled consistently with the site's clean/light aesthetic (white background, `1px` border, `border-radius: 8px`)
- Cards laid out in a row on desktop (`md:flex-row`), stacked on mobile

### New component: `ReadingCard.tsx`

Location: `frontend/src/components/ReadingCard.tsx`

Props:
```ts
interface ReadingEntry {
  name: string
  pages: string
  weekday_english: string
  weekday_icelandic: string
}
```

Renders a non-clickable card `<div>` with the entry's data.

---

## What Is Not In Scope

- Authentication
- Caching the Python script output
- Auto-refresh / polling
- Deploying the backend
- Any page other than the front page and Last Read
