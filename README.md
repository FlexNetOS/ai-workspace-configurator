# AI Workspace Configurator

Desktop setup assistant for Windows-first AI development environments.

## APP Purpose & Desired Output
**Target User: Non-technical e.g., Grade School students & Grandparents can use this APP**
- This project is a “AI Workspace Configurator” app designed to be the first-run bootstrap after installing/booting a clean OS (and also usable on an already-running OS). 
- Focuses on kicking off an end-to-end, automated setup by dynamically detecting the machine’s hardware and environment and converting that into a reliable, structured “system profile” that drives the rest of the configuration workflow.
- Detects hardware + system context (CPU/GPU, RAM, disk, OS/distro, drivers, network state, attached devices, virtualization/container hints, etc.).
- Normalizes findings into a single machine profile (a consistent data payload the rest of the pipeline can trust).
- Establishes prerequisites for the full setup by determining what’s possible/recommended on this specific machine (e.g., local LLM viability, GPU acceleration options, storage requirements, preferred install paths).
- With hardware detection, the configurator can automatically choose the right installation plan and defaults for each machine—making the overall experience hands-off and repeatable, especially on a fresh OS where nothing is preconfigured.
- Produces an authoritative, machine-specific “starting point” that enables the configurator to perform end-to-end AI workspace setup and configuration with minimal user input, whether immediately post-boot on a clean system or as a retrofit on an existing install.

## Stack
- Frontend: React + TypeScript + Vite
- Desktop packaging: Electron + electron-builder
- CI release: GitHub Actions (`.github/workflows/release.yml`)
- Shell standard: (Windows)PowerShell 7+, (WSL2,Linux)ZSH

## App Flow & User Experience Overview
1. Install configurator + initialize logs/artifacts
2. User selects provider + policy → generate plan preview
3. Create rollback checkpoint (restore point + snapshots)
4. Verify permissions/security/install readiness (admin, UAC, virtualization, reboot pending)
5. Install latest PowerShell via MSI + verify
6. 6Run Windows Update loop + upgrade all apps (winget) until fully current
7. Auto-discover hardware/drivers/network → inventory artifacts
8. Identify each device; user-assisted vendor login/registration + serial/warranty + resource tagging
9. Link accounts (Docker, GitHub, HF, OpenRouter, Notion, Google, Cloudflare, …) + validate
10. User approves final plan
11. Apply configs + run idempotent install scripts (resume-safe)
12. Install stack: Docker → WSL2 → IDE/terminal → distro/home scaffolding → llama.cpp → models → CLIs
13. Run E2E tests
14. Provision sandbox/dev/sim environment
15. Hardware tests + tuning + optional BIOS adjustments

## Local Development

### Quick Start (Recommended)
```powershell
pwsh scripts/setup-dev.ps1
```
This script verifies prerequisites, fixes PATH, bootstraps `.env`, installs dependencies, and runs a smoke build.

### Manual Setup
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
