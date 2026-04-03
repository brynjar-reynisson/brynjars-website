# Ollama Chat UI — Design Spec

**Date:** 2026-04-03

## Summary

Build a streaming chat UI on the existing `/ollama-chat` placeholder page. The user types a message, sends it, and sees the assistant's response stream in progressively. Session-only — no persistence between page loads.

## Architecture

All logic lives in `frontend/src/pages/OllamaChat.tsx`. No new components or hooks needed — the page is self-contained.

### State

```ts
messages: { role: 'user' | 'assistant', content: string }[]
input: string
isStreaming: boolean
```

### Data Flow

1. User submits (Send button or Enter key)
2. User message appended to `messages`, `input` cleared, `isStreaming` set to `true`
3. Empty assistant message appended to `messages`
4. `fetch('POST /api/chat', { message })` called
5. `response.body.getReader()` reads chunks; each decoded chunk appended to the last assistant message in state
6. On stream end: `isStreaming` set to `false`
7. On error: last assistant message set to `"Error: could not reach Ollama"`, `isStreaming` set to `false`

## UI

- Site title (`Brynjar's Online Antics`) as link back to `/` — existing page pattern
- `Ollama Chat` page heading
- Scrollable message history above input:
  - User messages: right-aligned
  - Assistant messages: left-aligned
- Input area:
  - `<textarea>` for multi-line input
  - Send button — disabled while `isStreaming` is true
  - Enter submits; Shift+Enter inserts newline
  - Input and button disabled while `isStreaming` is true

## Error Handling

- Fetch failure or non-ok response: set assistant message content to `"Error: could not reach Ollama"`
- Always set `isStreaming` to `false` in a finally block

## Testing

- Mock `fetch` to return a readable stream; verify user and assistant messages appear
- Verify Enter key submits
- Verify Shift+Enter does not submit
- Verify Send button is disabled while `isStreaming` is true

## Out of Scope

- Conversation history persistence across page loads
- Multi-turn context (each message is sent as a standalone prompt)
- Model selection UI
