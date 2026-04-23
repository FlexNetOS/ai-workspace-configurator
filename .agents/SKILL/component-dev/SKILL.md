# Component Development Skill

Purpose: guide component creation using shadcn/ui, Framer Motion, and Tailwind.

## When To Use
- Creating new UI components.
- Modifying existing components.
- Adding shadcn/ui primitives.

## Inputs
- Component requirements.
- Design references.

## Outputs
- Properly structured TSX component file.

## Operating Rules
1. Always use shadcn/ui primitives first.
2. Use Framer Motion variants for animations.
3. Use `cn()` for conditional classes.
4. Export components as named exports.
5. Props interface must be exported as `interface Props`.
6. Never define components inside other components.
