# Release Skill

Purpose: guide release workflow execution and troubleshooting.

## When To Use
- Preparing to release.
- Debugging release failures.
- Modifying release configuration.

## Inputs
- Version number.
- Change summary.

## Outputs
- Tagged release on GitHub.

## Operating Rules
1. Push `master` first, then tag.
2. Tag format: `v<major>.<minor>.<patch>`.
3. Never create `release/package-lock.json`.
4. Update changelog before tagging.
5. If electron-builder config changes, run local smoke build first.
