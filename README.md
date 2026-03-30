# brynjars-website

Brynjar's Online Antics — personal website, live at [breynisson.org](https://breynisson.org).

## What's on the site

- **VST Plugins** — pages for Grand Staff MIDI Visualizer and Interactive Circle of Fifths, with descriptions, screenshots, and download links
- **DigitalMe** — personal search engine at [digitalme.breynisson.org](https://digitalme.breynisson.org/)
- **Last Read** — shows what each boy last read for school, pulled from a Python script
- **About Me** — bio, work experience, education, and links

## Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS v4
- **Backend:** Node.js + TypeScript + Express (port 3001)
- **Routing:** React Router v7
- **Hosting:** Cloudflare Tunnel → Vite dev server on port 5173

## Running locally

### Prerequisites

- Node.js
- Python (with `last_read.py` in `C:\Users\Lenovo\misc_projects\last-read`)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at http://localhost:5173.

### Backend

```bash
cd backend
npm install
npm run dev
```

Runs at http://localhost:3001. The frontend proxies `/api/*` to the backend, so both must be running for Last Read to work.

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `LAST_READ_DIR` | `C:\Users\Lenovo\misc_projects\last-read` | Directory containing `last_read.py` |
| `PORT` | `3001` | Backend port |

### Tests

```bash
cd frontend && npm test
cd backend && npm test
```
