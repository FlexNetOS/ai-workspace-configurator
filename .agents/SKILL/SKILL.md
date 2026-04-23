# CHANGELOG Skill

Purpose: maintain `.changelog` with consistent structure, evidence, and release-safe updates.

## When To Use
- Any change touching release workflow, packaging, or deployment behavior.
- Any user request to update changelog files or release audit notes.

## Inputs
- Implementation diff and changed file list.
- Release impact notes (if any).
- Date in `YYYY-MM-DD`.

## Outputs
- Updated `.changelog/CHANGELOG.MD`
- Updated `.changelog/file-changelog-table.csv`
- New/updated note in `.changelog/reports-notes/`

## Slash Commands
- `/changelog-sync`
  - Documented in `./slash-commands/changelog-sync.md`
  - Runs preflight checks, updates changelog files, then runs post-update hooks.

## Hooks
- `preflight` hook: `./hooks/preflight.ps1`
  - Validates required folders/files exist.
  - Blocks execution if required changelog files are missing.
- `postupdate` hook: `./hooks/postupdate.ps1`
  - Verifies all required changelog artifacts were touched.
  - Emits a concise summary for audit notes.

## Operating Rules
1. Keep CSV machine-readable (no markdown, no backticks).
2. Keep changelog user-readable (concise bullets by category).
3. Every release workflow change must produce one audit note.
4. Never downgrade dependencies to fix release failures unless explicitly requested.
