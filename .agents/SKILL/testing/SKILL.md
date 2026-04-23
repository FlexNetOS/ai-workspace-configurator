# Testing Skill

Purpose: guide test creation for components, stores, and services.

## When To Use
- Adding new feature components.
- Modifying stores.
- Adding services.

## Inputs
- Implementation file to test.

## Outputs
- Test file in `tests/`.

## Operating Rules
1. Name: `<subject>.test.ts(x)`.
2. Mock external APIs and services.
3. Wrap routed components in `HashRouter`.
4. Test store logic directly (not via UI).
5. Use Testing Library queries (`getBy`/`findBy`).
6. One `describe` block per subject.
