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

## Release Command Workflow

Use this sequence when publishing from `master` and creating a release tag.

### Commands
```bash
git push origin master
git tag v3.6.3
git push origin v3.6.3
```

### Command Notes
- `git push origin master`: push the latest branch state first.
- `git tag v3.6.3`: create the release tag locally.
- `git push origin v3.6.3`: publish the tag to GitHub and trigger the release workflow.

### Recorded Run (2026-04-23)
- `git push origin master` -> `Everything up-to-date`
- `git tag v3.6.3` -> `tag created locally`
- `git push origin v3.6.3` -> `new tag pushed to GitHub`

### Verification
- Confirm the tag exists locally: `git tag --list v3.6.3`
- Confirm the tag exists remotely: `git ls-remote --tags origin v3.6.3`
