# TODO Card — Design Spec

**Date:** 2026-04-08

## Summary

Add a TODO nav card to the home page, positioned between the DigitalMe and About Me cards. The card links to a stub `/todo` route with a placeholder page.

## Changes

### `frontend/src/App.tsx`

- Add `{ icon: '📋', title: 'TODO', to: '/todo' }` to `NAV_ITEMS`, inserted before the `About Me` entry.
- Add `<Route path="/todo" element={<Todo />} />` to the `<Routes>` block.
- Import `Todo` from `./pages/Todo`.

### `frontend/src/pages/Todo.tsx` (new file)

Stub page following the same layout pattern as `About.tsx`:
- Site title as a link back to `/`
- `<h2>TODO</h2>` heading
- Short placeholder message (e.g. "Coming soon.")
