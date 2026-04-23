# Agent Workspace Guide

Use this folder for AI-facing navigation, repeatable workflows, and local skills.

## ⚠️ CRITICAL: Read Root AGENTS.md First

Before modifying any file in this repository, you **MUST** read the root `AGENTS.md` file. It contains:
- Mandatory pre-flight checklist
- Coding standards and architecture rules
- Forbidden patterns
- Testing rules
- Directory boundaries

**Entrypoint order:**
1. `../README.md` — project overview
2. `../.changelog/README.md` — changelog workflow
3. `./README.md` — AI navigation (this folder)
4. `../AGENTS.md` — coding standards and compliance

## Local Entrypoints
- Fast navigation: `./README.md`
- Changelog skill package: `./SKILL/`
- Release + audit source: `../.changelog/`
