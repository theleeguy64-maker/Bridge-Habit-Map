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
├── VERSION                    # 0.1.0 — bumped via lee version
├── server.py                  # Thin handler subclass (port 8791)
├── server_base.py             # From ~/Claude Generic template
├── certs/                     # Self-signed cert for iOS install (empty until generated)
├── architecture.md
├── checklists-draft.md        # Source-tagged scrape dump used to seed the lists
└── web/
    ├── index.html             # Shell + PWA meta tags
    ├── styles.css             # Standard PWA palette
    ├── manifest.json          # PWA manifest
    ├── sw.js                  # Cache-first service worker
    ├── checklists.js          # CHECKLISTS data — edit freely
    └── app.js                 # Screens, state, history, SW registration
```

## Key Files
| File                 | Purpose                                                      |
|----------------------|--------------------------------------------------------------|
| `web/checklists.js`  | All checklist content. Edit text/order/grouping here.        |
| `web/app.js`         | Screen renderers + session/history + SW registration         |
| `web/styles.css`     | Standard palette in `:root`, all UI styling                  |
| `web/sw.js`          | Cache-first SW. Bump `SHELL_CACHE` on every code change.     |
| `server.py`          | Static server config. Set port, web dir, version prefix.     |
| `architecture.md`    | Screen flow, data model, architectural decisions             |
| `checklists-draft.md`| Source-tagged scrape dump (curation reference, not runtime)  |

## Common Commands
```bash
# Run dev server
python3 server.py

# Bump shell cache after web/ changes — keep in lockstep:
#   1. VERSION file (use lee version minor / major)
#   2. APP_VERSION in web/app.js
#   3. SHELL_CACHE in web/sw.js

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
Simple PWA tier (offline-capable shell, no Firebase). To install on iPhone:
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
- **Version lockstep on every web/ change.** Bump `VERSION`, `APP_VERSION` (app.js), and `SHELL_CACHE` (sw.js) together, or the home-screen PWA serves a stale shell.
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
