# brynjars-website

Personal website for Brynjars.

## Stack

- **Frontend:** React + TypeScript
- **Backend:** Node.js + TypeScript
- **Other:** Python script for school reading tracker

## Project Structure

- `frontend/` — React + TypeScript SPA (Vite, Tailwind CSS v4, React Router v7)
- `backend/` — Node.js + TypeScript API server (Express, port 3001)

## Features

- Links to VST plugins made by Brynjars
- School reading tracker: `/last-read` page fetches from `GET /api/last-read` on the backend (port 3001), which spawns `python last_read.py --json` in the directory set by `LAST_READ_DIR` env var (default: `C:\Users\Lenovo\misc_projects\last-read`). Displays one card per boy with name, pages, and weekday.

## Conventions

- Both frontend and backend use TypeScript
- Follow existing code patterns when adding to either side
