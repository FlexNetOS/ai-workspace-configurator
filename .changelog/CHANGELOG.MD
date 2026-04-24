# Changelog

All notable changes to this repository should be documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versioning follows SemVer.

## [Unreleased]

### Added
- Added model dropdown to Chat UI header that displays connected AI providers and their models after verification.
- Added `selectedProviderId` to chat store to persist the user's chosen chat provider.
- Added external Electron builder config at `release/electron-builder.yml`.
- Added `public/scripts/bootstrap.cmd` launcher to run setup scripts without requiring execution policy changes.
- Added `.changelog` documentation and audit structure:
  - `.changelog/README.md`
  - `.changelog/file-changelog-table.csv`
  - `.changelog/reports-notes/README.md`
  - `.changelog/reports-notes/2026-04-23-release-audit.md`
- Added AI-maintained changelog skill package at `.agents/SKILL` with:
  - skill entrypoint
  - slash command documentation
  - preflight and post-update hook scripts
  - skill config manifest

### Changed
- Refactored GitHub release workflow to run from repository root with `pwsh` shell defaults.
- Added lockfile guard step to fail CI when placeholder integrity values (`sha1-PLASH`) are detected.
- Updated release packaging command to use `--projectDir release` and central `release/electron-builder.yml`.
- Hardened installer targets to build `nsis`, `portable`, and `zip` in a single consistent flow.
- Simplified `release/package.json` to metadata-only with explicit private flag.
- Updated download/install UI guidance to prefer `bootstrap.cmd` and avoid pipe-to-iex execution.
- Made Preflight (`CheckOnly`) the default path in `bootstrap.cmd` and updated UI copy to identify Preflight-first as the recommended flow.

### Fixed
- Fixed GitHub release build failure caused by fake integrity hashes in `release/package-lock.json` (`EINTEGRITY`).
- Fixed packaging path assumptions by bundling scripts/configs into locations expected by `release/electron/main.js`.
- Fixed bootstrap flow to sync missing companion scripts (copy from bundle or download) and respect `-Mode` for `CheckOnly`/`InstallOnly`.
- Fixed `Install-App.ps1` elevation path to re-launch via `-File` instead of pipe-to-iex and removed `-UseBasicParsing` for pwsh compatibility.
- Fixed default VHDX/WSL directory behavior so choosing a workspace drive (e.g. `F:\`) keeps state under that workspace instead of creating `C:\Users\<user>\WSL` by default.

### Removed
- Removed dependency on `release/package-lock.json` and release-local `npm install` flow.

## [3.6.0] - 2026-04-23

### Notes
- Baseline release branch now uses a root-managed Electron toolchain and centralized release config.
