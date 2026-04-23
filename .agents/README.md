# Fast AI Navigation

## Priority Paths
- Release workflow: `../.github/workflows/release.yml`
- Electron release config: `../release/electron-builder.yml`
- Changelog root: `../.changelog/`
- Main changelog: `../.changelog/CHANGELOG.MD`
- File change table: `../.changelog/file-changelog-table.csv`
- Audit reports: `../.changelog/reports-notes/`

## AI Workflow (Short)
1. Inspect implementation diff first.
2. Update `.changelog/file-changelog-table.csv`.
3. Update `.changelog/CHANGELOG.MD`.
4. Add a report in `.changelog/reports-notes/`.

## Skill
- Changelog skill entrypoint: `./SKILL/SKILL.md`
- Slash command docs: `./SKILL/slash-commands/changelog-sync.md`
- Hooks: `./SKILL/hooks/`
