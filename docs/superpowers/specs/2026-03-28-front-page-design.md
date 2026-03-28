# Front Page Design

**Date:** 2026-03-28

## Overview

A clean, light personal landing page with a title and three navigation cards linking to the site's sections. No content other than the title and the cards.

## Stack

- **Scaffold:** Vite + React + TypeScript (`npm create vite`, react-ts template)
- **Styling:** Tailwind CSS
- **Location:** `frontend/` directory at the project root

## Layout

Full-viewport-height page with content centered both horizontally and vertically. Title at top, three cards below in a horizontal row. On small screens the cards stack vertically.

## Components

### `NavCard.tsx`

A reusable card component.

Props:
- `icon: string` — emoji icon displayed at the top of the card
- `title: string` — card label
- `href: string` — link destination (placeholder `"#"` for now)

Renders an `<a>` tag styled as a card with a subtle border. On hover: light shadow and slight border color change.

### `App.tsx`

Renders the full page:
- `<h1>` — "Brynjar's stuff"
- Three `<NavCard>` components side by side:
  - 🎛 VST Plugins — `href="#"`
  - 📚 Last Read — `href="#"`
  - 👤 About Me — `href="#"`

## Styling

- Background: white (`#ffffff`)
- Cards: white background, `1px` border (`#e0e0e0`), `border-radius: 8px`
- Hover: subtle box-shadow, border shifts to `#bbb`
- Typography: system font stack, `h1` bold and large
- Responsive: cards in a row on `md+`, stacked on smaller screens

## What Is Not In Scope

- Routing (no React Router)
- Backend integration
- Any page other than the front page
- Real link destinations (all `href="#"` for now)
