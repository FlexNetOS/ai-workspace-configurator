# AI Workspace Configurator

Desktop setup assistant for Windows-first AI development environments.

## Stack
- Frontend: React + TypeScript + Vite
- Desktop packaging: Electron + electron-builder
- CI release: GitHub Actions (`.github/workflows/release.yml`)
- Shell standard: PowerShell 7+

## Local Development
```powershell
npm ci
npm run dev
```

Build web app only:
```powershell
npm run build
```

## Release Build Flow (Current)
Release packaging is now root-managed (no `npm install` inside `release/`).
`release/package-lock.json` is forbidden and must not exist in the repository.

GitHub release workflow:
- Builds web assets with `npm ci` + `npm run build`
- Installs packaging tools in CI using upgrade-only command:
  - `npm install --no-save electron@latest electron-builder@latest --ignore-scripts`
- Builds installers using:
  - `npx electron-builder --projectDir release --config release/electron-builder.yml --publish=never --win nsis --win portable --win zip`
- Old `release/` install flow is unsupported (do not run `npm install` or `npm ci` inside `release/`).

Expected release artifacts:
- `dist-electron/*.exe`
- `dist-electron/*.zip`

## Verified Upgrade Checklist (2026-04-23)
- [x] `release/package-lock.json` is forbidden and excluded to eliminate `EINTEGRITY` placeholder risk.
- [x] `release/package.json` reduced to metadata-only.
- [x] `release/electron-builder.yml` exists and is the single builder config.
- [x] Workflow builds from root and uses `--projectDir release`.
- [x] Workflow includes lockfile guard for `sha1-PLASH`.
- [x] Workflow enforces PowerShell (`pwsh`) on runners.
- [x] Changelog system added under `.changelog`.
- [x] AI changelog skill package added under `.agents/SKILL`.

## Changelog + Audit Workflow
Primary docs:
- `.changelog/CHANGELOG.MD`
- `.changelog/file-changelog-table.csv`
- `.changelog/reports-notes/`

AI navigation + automation:
- `.agents/README.md`
- `.agents/SKILL/SKILL.md`
- `.agents/SKILL/slash-commands/changelog-sync.md`
- `.agents/SKILL/hooks/preflight.ps1`
- `.agents/SKILL/hooks/postupdate.ps1`

## Repository Pointers
- App shell: `release/electron/main.js`
- Frontend entry: `src/main.tsx`
- Main UI: `src/App.tsx`
- Release workflow: `.github/workflows/release.yml`
- Release builder config: `release/electron-builder.yml`
