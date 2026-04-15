# Design: Todo — Persist Last Opened File

## Summary

When the user revisits `/todo`, the file they had open during their last visit is automatically selected. If that file no longer exists, the first file in the list is selected instead.

## Scope

All changes are confined to `frontend/src/hooks/useTodoFiles.ts`. No backend changes. No changes to `Todo.tsx` or any other file.

## localStorage

**Key:** `todo_last_open`  
**Value:** Raw filename string, e.g. `2026-04-15-work.txt`  
**Scope:** Browser-local, not user-specific (single user, single browser assumed).

## Write Points

`localStorage.setItem('todo_last_open', filename)` is called in three places:

1. **`selectFile`** — at the top of the function, before the fetch. Covers all explicit user selections.
2. **`createFile`** — alongside the existing `setSelectedFilename(newFile.filename)` call.
3. **`renameFile`** — if the renamed file's old filename matches the stored key, write the new filename. This prevents the stored key from going stale after a rename.

## Read & Resolve on Load

Extract a helper `resolveInitialFile(list: TodoFile[]): string` inside the hook:

```ts
function resolveInitialFile(list: TodoFile[]): string {
  const stored = localStorage.getItem('todo_last_open')
  if (stored) {
    const match = list.find((f) => f.filename === stored)
    if (match) return match.filename
  }
  return list[0].filename
}
```

Both the initial `useEffect` and `loadFiles` currently call `selectFile(list[0].filename)`. Both are updated to call `selectFile(resolveInitialFile(list))` instead.

## Fallback Behaviour

If `todo_last_open` is absent or refers to a file not in the current list, `resolveInitialFile` returns `list[0].filename`. This handles:
- First visit (no key stored yet)
- File deleted on another client between visits
- File renamed (covered by write point 3, but also falls back gracefully if the rename write was missed)

## Out of Scope

- No expiry or TTL on the stored key.
- No per-user scoping (single user assumed).
- No scroll position or cursor position persistence.
