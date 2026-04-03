# Ollama Chat Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Ollama Chat" nav card as the first card on the home page, linking to a new placeholder `/ollama-chat` route.

**Architecture:** Add the card to the `NAV_ITEMS` array in `App.tsx`, create a minimal placeholder page component, and register the route. No changes needed to `NavCard` — it already handles internal routes.

**Tech Stack:** React, TypeScript, React Router v7, Vitest, @testing-library/react

---

## File Map

- Modify: `frontend/src/App.tsx` — add nav item and route
- Create: `frontend/src/pages/OllamaChat.tsx` — placeholder page
- Modify: `frontend/src/components/__tests__/App.test.tsx` — add card assertion

---

### Task 1: Placeholder page with test

**Files:**
- Create: `frontend/src/pages/__tests__/OllamaChat.test.tsx`
- Create: `frontend/src/pages/OllamaChat.tsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/pages/__tests__/OllamaChat.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OllamaChat from '../OllamaChat'

describe('OllamaChat', () => {
  it('renders the page heading', () => {
    render(<MemoryRouter><OllamaChat /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Ollama Chat' })).toBeInTheDocument()
  })

  it('renders the site title as a link back to home', () => {
    render(<MemoryRouter><OllamaChat /></MemoryRouter>)
    const heading = screen.getByRole('heading', { name: "Brynjar's Online Antics" })
    expect(heading).toBeInTheDocument()
    expect(heading.closest('a')).toHaveAttribute('href', '/')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test -- OllamaChat
```

Expected: FAIL — `OllamaChat` module not found.

- [ ] **Step 3: Create the placeholder page**

Create `frontend/src/pages/OllamaChat.tsx`:

```tsx
import { Link } from 'react-router-dom'

export default function OllamaChat() {
  return (
    <div className="min-h-screen bg-white px-6 py-12 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-10">
        <Link to="/" className="text-gray-900 no-underline hover:underline">
          Brynjar's Online Antics
        </Link>
      </h1>
      <h2 className="text-2xl font-semibold text-gray-800">Ollama Chat</h2>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test -- OllamaChat
```

Expected: PASS — 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/OllamaChat.tsx frontend/src/pages/__tests__/OllamaChat.test.tsx
git commit -m "feat: add OllamaChat placeholder page"
```

---

### Task 2: Wire up nav card and route

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/__tests__/App.test.tsx`

- [ ] **Step 1: Write the failing test**

Add to `frontend/src/components/__tests__/App.test.tsx`:

```tsx
it('renders the Ollama Chat card', () => {
  render(<MemoryRouter><App /></MemoryRouter>)
  expect(screen.getByText('Ollama Chat')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- App
```

Expected: FAIL — `Unable to find an element with the text: Ollama Chat`.

- [ ] **Step 3: Add nav item and route to App.tsx**

In `frontend/src/App.tsx`, add the import and update `NAV_ITEMS` and routes:

```tsx
import { Routes, Route } from 'react-router-dom'
import NavCard from './components/NavCard'
import LastRead from './pages/LastRead'
import VstPlugins from './pages/VstPlugins'
import GrandStaff from './pages/GrandStaff'
import CircleOfFifths from './pages/CircleOfFifths'
import About from './pages/About'
import OllamaChat from './pages/OllamaChat'

const NAV_ITEMS = [
  { icon: '💬', title: 'Ollama Chat', to: '/ollama-chat' },
  { icon: '🎛', title: 'VST Plugins', to: '/vst-plugins' },
  { icon: '🔍', title: 'DigitalMe', to: 'https://digitalme.breynisson.org/' },
  { icon: '📚', title: 'Last Read', to: '/last-read' },
  { icon: '👤', title: 'About Me', to: '/about' },
]
```

And in the `<Routes>` block, add:

```tsx
<Route path="/ollama-chat" element={<OllamaChat />} />
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npm test
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.tsx frontend/src/components/__tests__/App.test.tsx
git commit -m "feat: add Ollama Chat as first nav card"
```
