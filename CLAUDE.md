# Project Name

**You are working in the Bridge Habit Map project.** Always be aware of this context — the user should not need to tell you which project this is.

## Project
<!-- TODO: Project name, path, description -->
- **Path**: `~/Casual_claude/ProjectName`
- **Launcher**: launched via `claudes` menu (option N) — see `~/Claude Generic/claude-sessions.sh`

## What It Does
<!-- TODO: One paragraph describing the project's purpose -->

 
## Quick Start
<!-- TODO: Steps to run the project -->
```bash
cd ~/Casual_claude/ProjectName
# TODO: add run commands
```

## Architecture
See `architecture.md` for system diagram, data model, architectural decisions, and component details.

## Template
If this project uses the browser-pwa-firebase template, see `~/Claude Generic/starters/browser-pwa-firebase/README.md` for what's generic vs app-specific. Cross-project patterns in `~/Claude Generic/reference/PATTERNS.md` and `~/Claude Generic/reference/PWA.md`.

## Tech Stack
<!-- TODO: List languages, frameworks, key libraries -->
| Layer | Technology |
|-------|------------|
| Language | <!-- TODO --> |
| UI | <!-- TODO --> |
| Backend | <!-- TODO --> |
| Database | <!-- TODO --> |
| Testing | <!-- TODO --> |

## Folder Structure
<!-- TODO: Update tree to match project -->
```
├── src/                  # Source code
├── tests/                # Test suites
├── docs/                 # Documentation
├── config/               # Configuration files
└── README.md
```

## Key Files
<!-- TODO: Add key files. Example from Superhuman project:
| File | Purpose |
|------|---------|
| `web/config.js` | App identity: states, collections, fields, section order, content rules |
| `web/app.js` | Orchestration: wires data, render, and suggestions modules |
| `web/data.js` | Firebase/Firestore data operations (queries, writes, purge) |
| `web/render.js` | DOM rendering, UI helpers, article card creation |
-->
| File | Purpose |
|------|---------|
| `architecture.md` | System architecture and decisions |

## Common Commands
<!-- TODO: Fill in project-specific commands -->
```bash
# Run
# TODO

# Test
# TODO

# Lint / Format
# TODO

# Deploy
# TODO
```

## Data / Backend
<!-- TODO: Database, APIs, external services. Remove if not applicable.
   Example from Superhuman:
   - **Project**: `superhuman-reader`
   - **Region**: `us-central1`
   - **Collections**: `newsletters`, `articles`, `suggestion_config`
   - **Service account key**: `firebase-service-account.json` (gitignored)
   - Deploy: `cd firebase && firebase deploy --only firestore`
-->

## PWA / Mobile
<!-- TODO: PWA setup, mobile considerations. Remove if not applicable -->

## Conventions
<!-- TODO: Project-specific coding style, naming, patterns -->
- <!-- TODO: Add conventions -->

## Lee Shortcuts

### Lee commit
1. Update `CLAUDE.md` if any structure or conventions changed
2. Stage and commit with a descriptive message (ask before committing)
3. Push to remote
4. Output `/usage`

### Lee slow
Test after each individual change. On failure, stop immediately and present 3 options:
1. **Review** — show what changed and what failed
2. **Fix** — attempt to fix the issue
3. **Restore** — revert to last working state

### Lee code review
1. Run linter/formatter first
2. Full review by severity:
   - **A — Bugs**: incorrect logic, crashes, data loss risks
   - **B — Dead code**: unused imports, unreachable branches, stale variables
   - **C — Consistency**: naming mismatches, style drift, mixed patterns
   - **D — Simplification**: verbose code that could be cleaner

## Session Workflow
- Proactively suggest updating `CLAUDE.md` when structure or conventions change
- Proactively suggest updating `architecture.md` when architectural decisions are made

## Testing
- Run the full test suite after making changes
- Never skip tests unless explicitly agreed with the user
- If tests fail, fix before moving on

## Planning
- Make incremental, low-risk changes
- Avoid big-bang refactors — break into small steps
- Test heavily at each step before proceeding

## Notes for Claude
<!-- TODO: Project-specific instructions, gotchas, things Claude should know -->
