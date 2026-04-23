# AI Workspace Configurator — Agent Compliance Contract

> **MANDATORY**: Before modifying any file in this repository, you MUST read the following documents in order:
> 1. `README.md` (project overview, stack, release flow)
> 2. `.changelog/README.md` (changelog workflow and guardrails)
> 3. `.agents/README.md` (AI navigation and skill entrypoints)
> 4. This file (`AGENTS.md`) — coding standards and architecture rules
>
> Failure to follow these instructions will result in non-compliant changes.

---

## 1. Project Identity

**AI Workspace Configurator** is a Windows-first desktop setup assistant for AI development environments. It is a React + TypeScript + Vite web app packaged as an Electron desktop application, with deployment to GitHub Pages.

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v3 + shadcn/ui
- **State**: Zustand with `persist` middleware
- **Animations**: Framer Motion (variants pattern exclusively)
- **Desktop**: Electron + electron-builder
- **CI/CD**: GitHub Actions
- **Shell standard**: PowerShell 7+
- **Test**: Vitest + jsdom + Testing Library

---

## 2. Mandatory Pre-Flight Checklist

Before every edit session, confirm:

- [ ] `README.md` has been read and understood
- [ ] `.changelog/README.md` has been read and understood
- [ ] `.agents/README.md` has been read and understood
- [ ] If modifying release workflow, packaging, or deployment: run `.agents/SKILL/hooks/preflight.ps1`
- [ ] If adding a new feature: check `.agents/SKILL/` for relevant skill guidance

---

## 3. Coding Standards

### 3.1 TypeScript

- **Strict mode enabled** (`noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`)
- Use `type` imports for types: `import type { Foo } from './foo'`
- Never use `any`. If you need flexibility, use `unknown` with type guards.
- Prefer `interface` for public APIs, `type` for unions/utility types.

### 3.2 Imports & Paths

- **Always use `@/` aliases**. Never use relative paths like `../../components/Foo`.
  - `@/components/ui/button` ✅
  - `../components/ui/button` ❌
- Group imports in this order:
  1. React / framework imports
  2. Third-party libraries
  3. `@/` aliases (components, hooks, stores, services, lib)
  4. Relative imports (only if absolutely necessary)

### 3.3 State Management

- **Zustand for all app state**. Never use React Context for application state.
- One store per domain: `src/store/<domain>Store.ts`
- Use `persist` middleware only for state that must survive reloads.
- When reading from a store, use selectors: `useWizardStore(s => s.currentStep)` not `useWizardStore()`
- Every store with `persist` MUST define `STORAGE_VERSION` and migration logic.

### 3.4 Components

- **UI primitives**: Use shadcn/ui components in `src/components/ui/`. Never create raw `<button>` or `<input>` elements.
  - Install new primitives with: `npx shadcn add <component>`
- **Feature components**: Go in `src/components/`. Name them clearly (e.g., `ChatPanel.tsx`, `HardwareRegistry.tsx`).
- **Pages**: Go in `src/pages/`. Pages are thin wrappers that compose feature components.
- **Animations**: Use Framer Motion variants. Never use raw CSS `@keyframes` in component files.
  ```tsx
  const variants = { initial: { opacity: 0 }, animate: { opacity: 1 } }
  <motion.div variants={variants} initial="initial" animate="animate" />
  ```
- **Inline functions**: If passed as props or deps, wrap in `useCallback`.
- **Effects with empty deps**: Must include a comment explaining why: `// eslint-disable-line react-hooks/exhaustive-deps`

### 3.5 Hooks

- Extract logic into `src/hooks/` when:
  - The same pattern appears in 2+ components
  - A component exceeds ~150 lines of non-JSX logic
  - Logic involves `useEffect`, `useRef`, or complex `useState` coordination
- Naming convention: `use<Domain><Action>` (e.g., `useHardwareScan`, `useChatEngine`)
- Every custom hook MUST have cleanup logic where applicable (`useEffect` return).

### 3.6 Styling

- **Tailwind CSS only**. No inline `style={{}}` except for dynamic values.
- Use the custom theme tokens defined in `tailwind.config.js`:
  - Colors: `deep-space`, `surface`, `electric-blue`, `cyan-brand`, `success`, `warning`, `error`
  - Fonts: `font-sans` (Inter), `font-mono` (JetBrains Mono), `font-terminal`
- For conditional classes, use `cn()` from `@/lib/utils` (clsx + tailwind-merge).

---

## 4. Architecture Rules

### 4.1 Directory Boundaries

| Directory | Purpose | Examples |
|-----------|---------|----------|
| `src/pages/` | Route-level pages | `Wizard.tsx`, `Dashboard.tsx` |
| `src/components/` | Feature components | `ChatPanel.tsx`, `Terminal.tsx` |
| `src/components/ui/` | shadcn/ui primitives | `button.tsx`, `dialog.tsx` |
| `src/components/steps/` | Wizard step components | `Step1.tsx`, `Step2.tsx` |
| `src/hooks/` | Reusable logic hooks | `useChatEngine.ts`, `useDebounce.ts` |
| `src/store/` | Zustand state stores | `wizardStore.ts`, `chatStore.ts` |
| `src/services/` | External API calls | `geminiService.ts` |
| `src/lib/` | Utility / generation logic | `generators.ts`, `utils.ts` |
| `src/assets/` | Static assets & AI context | `ai_context.ts` |
| `tests/` | Test files | `App.test.tsx`, `geminiService.test.ts` |
| `public/scripts/` | End-user PowerShell scripts | `bootstrap.ps1`, `InstallStack.ps1` |
| `scripts/` | Developer automation | `setup-dev.ps1` |
| `release/` | Electron packaging metadata | `package.json`, `electron-builder.yml` |
| `.agents/` | AI navigation & skills | `AGENTS.md`, `SKILL/` |
| `.changelog/` | Release history & audit | `CHANGELOG.MD`, `reports-notes/` |

### 4.2 Wizard.tsx Monolith Rule

`Wizard.tsx` is actively being refactored. **No new step logic may be added to `Wizard.tsx`.**

- Each step must be a standalone component in `src/components/steps/Step<N>.tsx`
- `Wizard.tsx` only contains: step routing, shared layout, and step composition
- If adding a new step, create `src/components/steps/Step<N>.tsx` and register it in `Wizard.tsx`

### 4.3 Server / API Layer

- `server.ts` is the Express OAuth server. It handles auth sessions for Google, GitHub, HuggingFace, and Notion.
- Never add frontend routes to `server.ts`.
- Never call `server.ts` functions from the frontend directly.

### 4.4 Electron Main Process

- `release/electron/main.js` is the Electron main process.
- IPC handlers are the only bridge between frontend and native OS APIs.
- Never import Node.js modules in frontend code.

---

## 5. Testing Rules

- Every new feature component MUST have a test in `tests/`.
- Test file naming: `<subject>.test.ts(x)`
- Use Vitest + Testing Library + jsdom.
- Mock external APIs and services. Never hit real endpoints in tests.
- For Zustand stores, test the store logic directly (not via components).
- For components, wrap in `HashRouter` if they use routing.

---

## 6. Forbidden Patterns

These will cause immediate rejection in code review:

| Pattern | Why Forbidden | Alternative |
|---------|--------------|-------------|
| `any` type | Loses type safety | Use `unknown` + type guards |
| Relative paths (`../../`) | Breaks refactoring, hard to read | Use `@/` aliases |
| React Context for app state | Performance issues, debugging pain | Use Zustand |
| Raw HTML elements (`<button>`, `<input>`) | Inconsistent design system | Use shadcn/ui primitives |
| CSS `@keyframes` in component files | Animation inconsistency | Use Framer Motion variants |
| `Math.random()` in render | Non-deterministic, causes hydration issues | Use `useMemo` with seeded random, or move to event handlers |
| Component definitions inside other components | Resets state on every render, performance issues | Define components at module level |
| `release/package-lock.json` | Causes EINTEGRITY failures in CI | Keep release/package.json metadata-only |
| `npm install` inside `release/` | Creates orphaned lockfiles | Install in CI only with `--no-save` |
| `alert()` for errors | Blocks UI, poor UX | Use `sonner` toasts or error boundaries |
| Direct `localStorage` access | Bypasses Zustand persistence, causes sync bugs | Use Zustand `persist` middleware |

---

## 7. Changelog & Audit Obligations

### 7.1 Every Change Must Update Changelog

For any change touching:
- Release workflow
- Packaging configuration
- Deployment behavior
- Breaking changes to stores or APIs

You MUST:
1. Update `.changelog/file-changelog-table.csv` with exact file-level actions
2. Update `.changelog/CHANGELOG.MD` with user-facing summary
3. Add an audit note in `.changelog/reports-notes/` if release pipeline files changed

### 7.2 Skill Packages

Relevant skills are in `.agents/SKILL/`:
- `changelog/` — changelog maintenance
- `component-dev/` — component development patterns
- `hook-dev/` — hook extraction patterns
- `state-management/` — Zustand store patterns
- `testing/` — testing conventions
- `release/` — release workflow guide

Read the relevant SKILL.md before making changes in that domain.

---

## 8. Environment & Setup

### 8.1 Required Tools

- Node.js >= 20.0.0
- npm (bundled with Node.js)
- PowerShell 7+
- Git

### 8.2 Recommended PATH Entries

```
F:\.local\node        (Node.js binaries)
F:\.local\bin         (pnpm, standalone tools)
F:\Tools\CLI          (GitHub CLI gh.exe)
C:\Program Files\PowerShell\7\  (PowerShell 7)
```

### 8.3 Setup Script

Run `scripts/setup-dev.ps1` after cloning to verify prerequisites, fix PATH, bootstrap `.env`, install dependencies, and run a smoke build.

---

## 9. Release Workflow

### 9.1 Triggering a Release

```powershell
git push origin master
git tag v<major>.<minor>.<patch>
git push origin v<major>.<minor>.<patch>
```

### 9.2 What the Workflow Does

1. Validates no `release/package-lock.json` exists
2. Validates no `sha1-PLASH` placeholders in lockfiles
3. Runs `npm ci` + `npm run build`
4. Installs electron-builder + electron in CI
5. Builds NSIS installer, portable executable, and ZIP
6. Uploads artifacts to GitHub Release

### 9.3 Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `npm ci` fails | `package-lock.json` out of sync with `package.json` | Run `npm install` and commit updated lockfile |
| Electron build fails | `publisherName` in wrong config section or missing `package.json` in `files` | Check `release/electron-builder.yml` |
| `ENOENT release/release/electron-builder.yml` | Config path wrong for electron-builder v26+ | Use `--config ../release/electron-builder.yml` |

---

## 10. Quick Reference

| Task | Command |
|------|---------|
| Start dev server | `npm run dev` |
| Start API server | `npm run dev:api` |
| Build production | `npm run build` |
| Run tests | `npm run test` |
| Run linter | `npm run lint` |
| Install shadcn component | `npx shadcn add <component>` |
| Run dev setup | `pwsh scripts/setup-dev.ps1` |
