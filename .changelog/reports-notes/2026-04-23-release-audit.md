# 2026-04-23 Release Audit

## Context
- User requested migration from Option2 staging folder to real repo paths.
- Primary failure to prevent: `npm ERR! EINTEGRITY` caused by fake lockfile hash placeholders.

## Findings
- `release/package-lock.json` was removed from the working tree, but release process still needed hardening.
- `.changelog/CHANGELOG.MD` existed but was empty.
- `.changelog/reports-notes/` existed but had no guidance or evidence notes.
- `.agents/SKILL` existed as an empty directory.
- `release/electron-builder.yml` referenced `release/assets` icons that do not exist in repo.
- New packaging file layout needed to match `release/electron/main.js` runtime paths.

## Changes Applied
- Updated `.github/workflows/release.yml`:
  - enforce `pwsh` shell for all run steps
  - add lockfile placeholder guard (`sha1-PLASH`)
  - use `npm ci` for web dependencies
  - install Electron toolchain with `--no-save` and `@latest`
  - run electron-builder with `--projectDir release`
- Updated `release/electron-builder.yml`:
  - removed missing icon references
  - mapped `electron`, `dist`, `public/scripts`, and `public/configs` into package
  - output artifacts to `../dist-electron`
- Updated `release/package.json`:
  - metadata-only manifest, `private: true`
- Added `.changelog` structure and standardized content.
- Added `.agents` AI navigation and changelog skill package.

## Validation
- Static validation completed by inspecting all updated files and cross-checking paths.
- Packaging path alignment verified:
  - app main entry: `release/electron/main.js`
  - frontend payload path in app package: `dist/`
  - script extraction source in app package: `scripts/`
- Known external runtime validation not run in this session:
  - `npm ci`
  - `npm run build`
  - `npx electron-builder ...`

## Follow-Ups
- Run the release workflow once via `workflow_dispatch` and confirm artifacts upload.
- If branding icons are required, add real `.ico` assets and re-enable icon fields in `release/electron-builder.yml`.
