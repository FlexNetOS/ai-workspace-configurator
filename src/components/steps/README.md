# Wizard Steps

Each step in the wizard is a standalone component in this directory.

## Rules

1. **No step logic in `Wizard.tsx`**. The main file only handles routing, layout, and step composition.
2. Each step file exports a **default component** named `Step<N>`.
3. Steps use shared animation variants from `./variants.ts`.
4. Steps receive no props — they read from `useWizardStore()` directly.
5. If a step needs local state (forms, toggles), use `useState` inside the step component.

## Extracting a New Step

1. Create `src/components/steps/Step<N>.tsx`
2. Import required icons from `lucide-react`
3. Import shared variants: `import { containerVariants, cardVariants } from './variants'`
4. Copy the step function body from `Wizard.tsx`
5. Export as default
6. In `Wizard.tsx`, replace the inline function with: `import Step<N> from './steps/Step<N>'`

## Current Status

| Step | Status | File |
|------|--------|------|
| 1 | ✅ Extracted | `Step1.tsx` |
| 2 | 🔲 Inline | `Wizard.tsx` |
| 3–15 | 🔲 Inline | `Wizard.tsx` |
