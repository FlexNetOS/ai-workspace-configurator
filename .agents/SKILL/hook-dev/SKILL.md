# Hook Development Skill

Purpose: guide extraction and creation of custom React hooks.

## When To Use
- Component exceeds 150 lines of non-JSX logic.
- Pattern appears in 2+ components.
- Complex useEffect/useRef coordination.

## Inputs
- Component file with inline logic to extract.

## Outputs
- Standalone hook file in `src/hooks/`.

## Operating Rules
1. Naming: `use<Domain><Action>`.
2. Must have cleanup logic where applicable.
3. Return object or tuple, not single primitive.
4. Type the return value explicitly.
5. Document parameters and return shape in JSDoc.
