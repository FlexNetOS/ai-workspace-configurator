# /changelog-sync

Synchronize changelog artifacts after code changes.

## Intent
- Produce a complete `.changelog` update in one pass.
- Keep release evidence and file-level records consistent.

## Execution Flow
1. Run `hooks/preflight.ps1`.
2. Read current implementation diff.
3. Update `.changelog/file-changelog-table.csv`.
4. Update `.changelog/CHANGELOG.MD`.
5. Create or update the latest report in `.changelog/reports-notes/`.
6. Run `hooks/postupdate.ps1`.

## Required Artifacts
- `.changelog/CHANGELOG.MD`
- `.changelog/file-changelog-table.csv`
- `.changelog/reports-notes/*.md`

## Failure Rules
- If preflight fails, stop and report exactly which file/path is missing.
- If post-update verification fails, do not mark the task complete.
