# State Management Skill

Purpose: guide Zustand store creation and modification.

## When To Use
- Creating new stores.
- Adding state to existing stores.
- Migrating persisted data.

## Inputs
- Domain requirements.
- State shape.

## Outputs
- Store file in `src/store/`.

## Operating Rules
1. One store per domain.
2. Use `persist` only for reload-surviving state.
3. Define `STORAGE_VERSION` and migration for persisted stores.
4. Export typed store hook and typed state interface.
5. Use selectors when reading from components.
6. Never store sensitive tokens in persisted state.
