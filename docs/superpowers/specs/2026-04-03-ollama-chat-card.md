# Ollama Chat Card — Design Spec

**Date:** 2026-04-03

## Summary

Add an "Ollama Chat" navigation card as the first card on the home page, linking to a new internal `/ollama-chat` route with a placeholder page.

## Changes

### `frontend/src/App.tsx`

- Add `{ icon: '💬', title: 'Ollama Chat', to: '/ollama-chat' }` as the first entry in `NAV_ITEMS`
- Import `OllamaChat` page component
- Add `<Route path="/ollama-chat" element={<OllamaChat />} />` to the route list

### `frontend/src/pages/OllamaChat.tsx` (new file)

- Placeholder page with a heading ("Ollama Chat")
- No functionality yet — page content to be built in a future iteration

## Out of Scope

- Actual Ollama chat functionality (future work)
- Ollama logo/branding assets (using 💬 emoji icon to match existing card style)
