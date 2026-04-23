# Hooks Architecture

## When to Use What

### Local State (`useState`)
Use for UI-only state that is:
- A toggle, form input, or local animation state
- Not shared with other components
- Not needed after component unmounts

### Store State (Zustand)
Use for state that is:
- Shared across 2+ components
- Needed after page reload (use `persist`)
- Complex domain state with actions (e.g., wizard progress, chat history)

### Custom Hook (`src/hooks/`)
Extract when:
- The same pattern appears in 2+ components
- A component exceeds ~150 lines of non-JSX logic
- Logic involves `useEffect`, `useRef`, or complex `useState` coordination

## Naming Convention

`use<Domain><Action>`

Examples:
- `useHardwareScan` — scans hardware via WMI
- `useChatEngine` — orchestrates local + AI chat responses
- `useDebounce` — debounces a value

## Rules

1. Every custom hook must have cleanup logic where applicable (`useEffect` return).
2. Return an object or tuple, never a single primitive.
3. Type the return value explicitly.
4. Document parameters and return shape in JSDoc.
5. Hooks must be pure — no side effects outside `useEffect`.
