# Ollama Model Selector — Design Spec

**Date:** 2026-04-04

## Overview

Add a settings button to the Ollama Chat page that lets the user select which Ollama model to use. The preference is persisted in a cookie. The settings panel is designed to be extensible with more settings in the future.

## Architecture

### Approach: `SettingsPanel` component + `useOllamaSettings` hook

Three files are added or modified:

| File | Change |
|------|--------|
| `backend/src/index.ts` | Add `GET /api/models`; update `POST /api/chat` to accept optional `model` |
| `frontend/src/hooks/useOllamaSettings.ts` | New hook — model list, selected model, cookie persistence |
| `frontend/src/components/SettingsPanel.tsx` | New component — gear button + slide-in panel |
| `frontend/src/pages/OllamaChat.tsx` | Integrate hook and panel |

---

## Backend

### `GET /api/models`

Calls `ollama.list()` and returns model names as a sorted (alphabetical) string array.

```json
["codellama", "llama3.2", "mistral"]
```

### `POST /api/chat` (updated)

Accepts an optional `model` field in the request body. If provided, it overrides the `OLLAMA_MODEL` env var for that request. If absent, the env var default is used as before.

```json
{
  "messages": [...],
  "model": "mistral"
}
```

---

## `useOllamaSettings` hook

Location: `frontend/src/hooks/useOllamaSettings.ts`

### State

- `models: string[]` — fetched from `GET /api/models` on mount, alphabetically sorted by the backend.
- `model: string | null` — the currently selected model name, or `null` when the default is active.

### Cookie behaviour

- Cookie name: `ollama_model`
- Expiry: 1 year
- Flags: `SameSite=Strict`
- On init: reads the cookie. If absent, or if the saved name is not in the fetched model list, `model` is set to `null` and no cookie is written.
- `setModel(name: string)` — sets `model` and writes the cookie.
- `setModel(null)` — sets `model` to `null` and removes the cookie.

### Return value

```ts
{ model: string | null, setModel: (m: string | null) => void, models: string[] }
```

---

## `SettingsPanel` component

Location: `frontend/src/components/SettingsPanel.tsx`

### Props

```ts
{
  model: string | null
  setModel: (m: string | null) => void
  models: string[]
  isOpen: boolean
  onClose: () => void
}
```

### Behaviour

- Renders a gear icon button (⚙). `OllamaChat` places it top-right, in a flex row with the "Ollama Chat" heading on the left.
- When `isOpen` is true, a panel slides in from the right (fixed-position, CSS transition). A semi-transparent backdrop covers the rest of the page; clicking it closes the panel. An `×` button inside the panel also closes it.
- **Model section**: a `<select>` with "Default" as the first option, followed by the alphabetical model list. Selecting an option calls `setModel(value)` or `setModel(null)` for "Default".
- The panel is structured to accommodate future settings sections below the model selector.

---

## `OllamaChat` integration

Changes to `frontend/src/pages/OllamaChat.tsx`:

- Calls `useOllamaSettings()` to get `{ model, setModel, models }`.
- Adds `isSettingsOpen: boolean` state.
- Header row becomes a flex row: "Ollama Chat" heading on the left, gear button (rendered by `SettingsPanel`) on the right.
- Renders `<SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} ... />`.
- In `sendMessage`, `model` is included in the request body only when non-null:
  ```ts
  body: JSON.stringify({ messages: [...messages, userMessage], ...(model ? { model } : {}) })
  ```

---

## Error handling

- If `GET /api/models` fails, `models` is an empty array and `model` stays `null`. The chat still works using the backend default.
- If `POST /api/chat` receives an unrecognised model name, Ollama will return an error which surfaces as the existing "Error: could not reach Ollama" message.

---

## Out of scope

- No server-side session or user account — cookie only.
- No model download / management UI.
- No validation of model names beyond checking against the fetched list.
