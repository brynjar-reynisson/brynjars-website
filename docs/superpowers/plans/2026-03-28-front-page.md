# Front Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a clean light-themed React front page with the title "Brynjar's stuff" and three placeholder navigation cards (VST Plugins, Last Read, About Me).

**Architecture:** A Vite + React + TypeScript project in `frontend/`. Two components: `NavCard` (reusable card with icon, title, href) and `App` (page shell). Tailwind handles all styling. Vitest + React Testing Library for tests.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS v3, Vitest, @testing-library/react

---

## File Structure

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.tsx
    ├── index.css
    ├── App.tsx
    └── components/
        ├── NavCard.tsx
        └── __tests__/
            ├── NavCard.test.tsx
            └── App.test.tsx
```

---

### Task 1: Scaffold Vite + React + TypeScript project

**Files:**
- Create: `frontend/` (entire scaffold)

- [ ] **Step 1: Scaffold the project**

Run from the repo root:
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

- [ ] **Step 2: Verify it starts**

```bash
npm run dev
```
Expected: Vite dev server starts, browser shows default Vite+React page at `http://localhost:5173`.

Stop the server (`Ctrl+C`).

- [ ] **Step 3: Delete boilerplate content**

Delete these files (they're replaced in later tasks):
```bash
rm src/App.css src/assets/react.svg public/vite.svg
```

Replace `src/App.tsx` with an empty shell:
```tsx
export default function App() {
  return <div />
}
```

Replace `src/index.css` with an empty file (Tailwind directives come in Task 2):
```css
```

Replace `index.html` title:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Brynjar's stuff</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Commit**

```bash
cd ..
git add frontend/
git commit -m "feat: scaffold Vite + React + TypeScript frontend"
```

---

### Task 2: Configure Tailwind CSS

**Files:**
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Install Tailwind**

```bash
cd frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Expected: creates `tailwind.config.js` and `postcss.config.js`.

- [ ] **Step 2: Configure content paths in `frontend/tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 3: Add Tailwind directives to `frontend/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Verify Tailwind works**

Temporarily add a Tailwind class to `src/App.tsx`:
```tsx
export default function App() {
  return <div className="text-blue-500">hello</div>
}
```

Run:
```bash
npm run dev
```
Expected: browser shows blue "hello" text.

Revert `App.tsx` back to:
```tsx
export default function App() {
  return <div />
}
```

Stop server.

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend/tailwind.config.js frontend/postcss.config.js frontend/src/index.css frontend/package.json frontend/package-lock.json
git commit -m "feat: configure Tailwind CSS"
```

---

### Task 3: Add Vitest + React Testing Library

**Files:**
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/package.json` (via npm install)
- Create: `frontend/src/components/__tests__/` (directory, populated in Tasks 4 & 5)

- [ ] **Step 1: Install test dependencies**

```bash
cd frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: Configure Vitest in `frontend/vite.config.ts`**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

- [ ] **Step 3: Create `frontend/src/test-setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add test script to `frontend/package.json`**

In the `"scripts"` section, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify test runner works**

Create a smoke-test file `frontend/src/components/__tests__/smoke.test.ts`:
```ts
it('test runner works', () => {
  expect(1 + 1).toBe(2)
})
```

Run:
```bash
npm test
```
Expected: 1 test passes.

Delete `frontend/src/components/__tests__/smoke.test.ts`.

- [ ] **Step 6: Commit**

```bash
cd ..
git add frontend/vite.config.ts frontend/src/test-setup.ts frontend/package.json frontend/package-lock.json
git commit -m "feat: add Vitest and React Testing Library"
```

---

### Task 4: Implement NavCard component (TDD)

**Files:**
- Create: `frontend/src/components/NavCard.tsx`
- Create: `frontend/src/components/__tests__/NavCard.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/components/__tests__/NavCard.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import NavCard from '../NavCard'

describe('NavCard', () => {
  it('renders the icon', () => {
    render(<NavCard icon="🎛" title="VST Plugins" href="#" />)
    expect(screen.getByText('🎛')).toBeInTheDocument()
  })

  it('renders the title', () => {
    render(<NavCard icon="🎛" title="VST Plugins" href="#" />)
    expect(screen.getByText('VST Plugins')).toBeInTheDocument()
  })

  it('renders as a link with the given href', () => {
    render(<NavCard icon="🎛" title="VST Plugins" href="/vst" />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/vst')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test
```
Expected: 3 tests FAIL with "Cannot find module '../NavCard'".

- [ ] **Step 3: Implement `frontend/src/components/NavCard.tsx`**

```tsx
interface NavCardProps {
  icon: string
  title: string
  href: string
}

export default function NavCard({ icon, title, href }: NavCardProps) {
  return (
    <a
      href={href}
      className="flex flex-col items-center p-8 w-48 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-400 transition-all no-underline"
    >
      <span className="text-4xl mb-3">{icon}</span>
      <span className="text-base font-semibold text-gray-800">{title}</span>
    </a>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```
Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd ..
git add frontend/src/components/NavCard.tsx frontend/src/components/__tests__/NavCard.test.tsx
git commit -m "feat: add NavCard component"
```

---

### Task 5: Implement App component (TDD)

**Files:**
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/components/__tests__/App.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/components/__tests__/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import App from '../../App'

describe('App', () => {
  it('renders the page title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: "Brynjar's stuff" })).toBeInTheDocument()
  })

  it('renders the VST Plugins card', () => {
    render(<App />)
    expect(screen.getByText('VST Plugins')).toBeInTheDocument()
  })

  it('renders the Last Read card', () => {
    render(<App />)
    expect(screen.getByText('Last Read')).toBeInTheDocument()
  })

  it('renders the About Me card', () => {
    render(<App />)
    expect(screen.getByText('About Me')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend && npm test
```
Expected: 4 new tests FAIL (heading not found, cards not found).

- [ ] **Step 3: Implement `frontend/src/App.tsx`**

```tsx
import NavCard from './components/NavCard'

const NAV_ITEMS = [
  { icon: '🎛', title: 'VST Plugins', href: '#' },
  { icon: '📚', title: 'Last Read', href: '#' },
  { icon: '👤', title: 'About Me', href: '#' },
]

export default function App() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-10 px-4">
      <h1 className="text-4xl font-bold text-gray-900">Brynjar's stuff</h1>
      <div className="flex flex-col md:flex-row gap-6">
        {NAV_ITEMS.map((item) => (
          <NavCard key={item.title} icon={item.icon} title={item.title} href={item.href} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run all tests to verify they pass**

```bash
npm test
```
Expected: all 7 tests PASS (3 NavCard + 4 App).

- [ ] **Step 5: Verify visually in the browser**

```bash
npm run dev
```
Expected: browser at `http://localhost:5173` shows "Brynjar's stuff" heading with three cards below (🎛 VST Plugins, 📚 Last Read, 👤 About Me). Cards are side by side on desktop. Hover effect visible.

Stop server.

- [ ] **Step 6: Commit**

```bash
cd ..
git add frontend/src/App.tsx frontend/src/components/__tests__/App.test.tsx
git commit -m "feat: implement front page with title and nav cards"
```
