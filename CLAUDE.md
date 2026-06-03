# Bridge Habit Map

**You are working in the Bridge Habit Map project.** Always be aware of this context — the user should not need to tell you which project this is.

## Project
- **Path**: `~/Bridge Habit Map`
- **Launcher**: launched via `claudes` menu — see `~/Claude Generic/claude-sessions.sh`
- **Weight**: Light (message threshold 25)

## What It Does
Single-user PWA for building the habit of running a fixed mental checklist on every bridge hand. Two process sheets — **Declarer** and **Defender** — each have a shared Auction phase followed by an Analysis phase (pre-trick-1 plan). User taps through items at the table; app logs completion % per hand. Pure local-first: no backend, no accounts, history in `localStorage`.

A built-in **editor** ("Edit Declarer sheet" / "Edit Defender sheet" on Home) lets the user move / edit / delete / add items per group. Edits are stored as patches in `localStorage["bhm.edits.v1"]` and applied over the seeded `web/checklists.js` at render time — so the seeded source is never mutated and a "Reset all edits" wipes back to it in one tap.

## Quick Start
```bash
cd "/Users/leeguy/Bridge Habit Map"
python3 server.py
# → http://localhost:8791
```

## Architecture
See `architecture.md` for screen flow, data model, file structure, and architectural decisions.

## Template
Built on `~/Claude Generic/starters/browser-pwa-firebase` at the **Simple PWA** tier. Key cross-project references:
- `~/Claude Generic/reference/PWA.md` → "Simple PWA Pattern" (sw.js, manifest, iOS install)
- `~/Claude Generic/reference/PATTERNS.md` → JavaScript / Web section, `:root` theming
- `~/Claude Generic/starters/browser-pwa-firebase/server_base.py` → reusable HTTPS server

## Tech Stack
| Layer    | Technology                                              |
|----------|---------------------------------------------------------|
| Language | Vanilla JavaScript (no build step), Python 3 for server |
| UI       | Hand-rolled DOM via an `el()` helper; CSS variables     |
| Backend  | None (server.py just serves static files)               |
| Database | `localStorage` (keys: `bhm.history.v1`, `bhm.edits.v1`) |
| Testing  | Manual E2E via Chrome DevTools MCP                      |

## Folder Structure
```
Bridge Habit Map/
├── VERSION                    # 0.3.10 — bumped via lee version
├── server.py                  # Thin handler subclass (port 8791)
├── server_base.py             # From ~/Claude Generic template
├── certs/                     # Self-signed cert for iOS install (empty until generated)
├── build-pdfs.py              # Generates 4 A4 print PDFs from web/checklists.js
├── pdfs/                      # Print-friendly sheets (auction/declarer-nt/declarer-suit/defender)
├── architecture.md
├── checklists-draft.md        # Source-tagged scrape dump used to seed the lists
└── web/
    ├── index.html             # Shell + PWA meta tags
    ├── styles.css             # Standard PWA palette
    ├── manifest.json          # PWA manifest
    ├── checklists.js          # CHECKLISTS data — edit freely
    └── app.js                 # Screens, state, history; unregisters any stale SW on boot
```

## Key Files
| File                 | Purpose                                                      |
|----------------------|--------------------------------------------------------------|
| `web/checklists.js`  | All checklist content. Edit text/order/grouping here.        |
| `web/app.js`         | Screen renderers + session/history; unregisters stale SWs    |
| `web/styles.css`     | Standard palette in `:root`, all UI styling                  |
| `build-pdfs.py`      | Generates the 4 print PDFs from `web/checklists.js`.         |
| `server.py`          | Static server config. Set port, web dir, version prefix.     |
| `architecture.md`    | Screen flow, data model, architectural decisions             |
| `checklists-draft.md`| Source-tagged scrape dump (curation reference, not runtime)  |

## Common Commands
```bash
# Run dev server
python3 server.py

# Bump version after web/ changes — keep in lockstep:
#   1. VERSION file (use lee version minor / major)
#   2. APP_VERSION in web/app.js
# (No service worker — there's no SHELL_CACHE to bump.)

# Regenerate print PDFs after editing web/checklists.js
python3 build-pdfs.py

# Smoke test in browser
open http://localhost:8791
```

## Data / Backend
None. All state is client-side `localStorage`. Two keys:

- **`bhm.history.v1`** — array of `{at, role, branch, done, total}`, most recent first, capped at 200. Per-hand completion log.
- **`bhm.edits.v1`** — `{ [sectionKey]: { [groupTitle]: { order, text, deleted, added } } }`. User edits to the checklists, applied over the seeded `CHECKLISTS` object at render time. Seeded `web/checklists.js` is never mutated.

User-added items get ids of the form `u_<timestamp>_<n>` so they can't collide with seeded ids. See `architecture.md` § Data Model for the full patch shape.

No Firebase. Re-evaluate only if cross-device sync of hand history is needed.

## PWA / Mobile
Deployed to GitHub Pages: https://theleeguy64-maker.github.io/Bridge-Habit-Map/
The service worker was dropped in v0.3.1 — no offline shell. `app.js` actively
unregisters any stale SW + clears caches on boot, so users on v≤0.3.0 self-heal.
iOS "Add to Home Screen" still works (manifest + apple meta kept). To install from
the local dev server on iPhone:
1. Generate self-signed cert into `certs/`:
   ```bash
   cd certs && openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 3650 -nodes \
     -subj "/CN=BridgeHabitMap" -addext "subjectAltName=DNS:$(hostname).local"
   ```
2. Generate `web/icon-180.png` and `web/icon-512.png` (see PWA.md → "Icon Generation with Pillow").
3. Trust cert on iPhone (PWA.md → "Install Certificate on iPhone").
4. Open `https://<mac-hostname>.local:8791/` in Safari → Share → Add to Home Screen.

## Conventions
- **Vanilla JS, no framework, no build step.** Match the template.
- **Theme via `:root` CSS variables only.** Never hardcode colors in component CSS.
- **Tap target = the whole row** (`.item`), not just a checkbox. One-tap toggle.
- **Single source of truth for checklist content** — `web/checklists.js`. Never duplicate item text into the DOM.
- **Version lockstep on every web/ change.** Bump `VERSION` and `APP_VERSION` (app.js) together so the version tag in the app reflects the deploy. (No service worker / `SHELL_CACHE` since v0.3.1.)
- **No comments unless WHY is non-obvious.** Item text is self-documenting.

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
