# brynjars-website

Personal website for Brynjar.

## Stack

- **Frontend:** React + TypeScript
- **Backend:** Node.js + TypeScript
- **Other:** Python script for school reading tracker

## Project Structure

- `frontend/` — React + TypeScript SPA (Vite, Tailwind CSS v4, React Router v7)
- `backend/` — Node.js + TypeScript API server (Express, port 3001)

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `HomePage` | Nav cards linking to all sections |
| `/ollama-chat` | `OllamaChat` | Ollama chat UI |
| `/last-read` | `LastRead` | School reading tracker |
| `/vst-plugins` | `VstPlugins` | Plugin gallery (card grid) |
| `/vst-plugins/grand-staff` | `GrandStaff` | Grand Staff MIDI Visualizer detail page |
| `/vst-plugins/circle-of-fifths` | `CircleOfFifths` | Interactive Circle of Fifths detail page |
| `/todo` | `Todo` | Two-panel TODO editor (sidebar + autosave textarea) |
| `/about` | `About` | Personal bio, work history, education, links |

The home page also has a nav card linking externally to `https://digitalme.breynisson.org/` (DigitalMe).

## Features

- **VST Plugins:** `/vst-plugins` shows a card grid of two plugins. Each card links to a detail page with screenshots, feature list, download link, and credits.
  - **Grand Staff MIDI Visualizer** (`/vst-plugins/grand-staff`): Visualizes MIDI notes on a grand staff with chord name display, key signature selection, 1000+ chord patterns, themes, and DAW automation support. Free, Windows 64-bit, open source on GitHub.
  - **Interactive Circle of Fifths** (`/vst-plugins/circle-of-fifths`): Visual music theory tool showing modes and chord info. Works as standalone app and VST (no audio/MIDI processing). Free, Windows 64-bit, open source on GitHub.
- **School reading tracker:** `/last-read` page fetches from `GET /api/last-read` on the backend (port 3001), which spawns `python last_read.py --json` in the directory set by `LAST_READ_DIR` env var (default: `C:\Users\Lenovo\misc_projects\last-read`). Displays one card per boy with name, pages, and weekday.
- **Ollama chat:** `/ollama-chat` page streams responses from a local Ollama instance via `POST /api/chat`. A gear button (⚙) in the header opens a settings panel where the user can select the model. Available models are fetched from `GET /api/models` (calls `ollama.list()`). The selected model is persisted in an `ollama_model` cookie; when absent or invalid the backend default (`OLLAMA_MODEL` env var, default `llama3.2`) is used.
- **About page:** `/about` shows a personal bio, work history timeline (1999–present), education, and contact/social links.
- **TODO editor:** `/todo` page is a two-panel editor. Left sidebar lists `.txt` files from a `TODO` folder in the backend's working directory (configurable via `TODO_DIR` env var, defaults to `./TODO`). File names are formatted as `YYYY-MM-DD-<name>.txt`. Files are visible in read-only mode to all visitors. A lock icon (🔒/🔓) in the sidebar header opens an inline password input; correct password unlocks full editing (rename, create, save). Session token persisted to `TODO_DIR/.session` and `localStorage`. Password hash stored in `backend/.env` as `HASHED_PASSWORD` (argon2id). Backend API: `GET/POST /api/todo`, `GET/PUT/PATCH /api/todo/:filename`, `POST/GET /api/todo/auth`.

## Conventions

- Both frontend and backend use TypeScript
- Follow existing code patterns when adding to either side
