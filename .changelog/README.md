# .changelog Quick Navigation

Use this folder as the single source of truth for release-related change history and AI audit notes.

## Fast Links
- Main changelog: `./CHANGELOG.MD`
- File-level table: `./file-changelog-table.csv`
- Audit notes: `./reports-notes/`

## Update Order (Recommended)
1. Update implementation files first.
2. Update `file-changelog-table.csv` with exact file-level actions.
3. Update `CHANGELOG.MD` with user-facing summary.
4. Add an audit note in `reports-notes/` for review evidence.

## Guardrails
- Never use markdown formatting inside CSV cells.
- Keep entries factual and dated (`YYYY-MM-DD`).
- If a release pipeline file changes, always add one audit note in `reports-notes/`.
