# Architecture

## Overview

Bridge Habit Map is a single-user, local-first PWA for building the habit of running a fixed mental checklist on every bridge hand. Two process sheets — **Declarer** and **Defender** — each have an **Auction phase** (shared) followed by an **Analysis phase** (pre-trick-1 plan, distinct per role). The user taps through each item to mark it consciously done; at hand end the app logs how complete the run was. Persistence is browser `localStorage`; no backend account, no Firebase. The app is built on the `~/Claude Generic/starters/browser-pwa-firebase` template at the **Simple PWA** tier.

## System Diagram

```
┌─────────────────────────────────┐
│  User (phone or laptop)         │
└────────────────────────┬────────┘
                         │
                         ▼
┌─────────────────────────────────┐
│  Browser UI (web/)              │
│  index.html → app.js            │
│  + checklists.js (data)         │
│  (no service worker — see below)│
│  ↳ tap-through screens          │
│  ↳ session state in memory      │
└────────────────────────┬────────┘
                         │
                         ▼
┌─────────────────────────────────┐
│  localStorage                   │
│  key: bhm.history.v1            │
│  value: [{at, role, branch,     │
│           done, total}, ...]    │
│  last 200 hands                 │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  server.py (HTTP/HTTPS :8791)   │
│  ↳ subclass of LocalAppHandler  │
│  ↳ static-only — no app POSTs   │
│  ↳ /health, /version            │
└─────────────────────────────────┘
```

No data ever leaves the device. The server only serves static files.

## File Structure

```
Bridge Habit Map/
├── VERSION                    # 0.3.10 — bumped via `lee version minor/major`
├── server.py                  # Thin handler subclass — points at web/, sets PORT 8791
├── server_base.py             # Generic HTTPS server (copied from template)
├── certs/                     # Self-signed cert.pem + key.pem (drop in for iOS install)
├── checklists-draft.md        # Source-tagged scrape dump used to build the checklists
├── architecture.md            # This file
├── CLAUDE.md                  # Project instructions for Claude Code
│
└── web/                       # Everything served to the browser
    ├── index.html             # Shell + PWA meta tags + manifest link
    ├── styles.css             # Standard PWA palette + checklist UI
    ├── manifest.json          # PWA manifest (standalone, "any" orientation)
    ├── checklists.js          # CHECKLISTS data object (edit freely)
    └── app.js                 # Screens, state, localStorage; unregisters any stale SW on boot
```

## Data Model

No backend. Two in-memory + one persisted structure.

### In-memory: `session` (one per hand)
```js
{
  role: 'declarer' | 'defender',
  declarerBranch: 'nt' | 'suit' | null,
  ticks: { [itemId]: true },
  startedAt: timestamp,
}
```

### In-memory: `CHECKLISTS` (static, loaded from `checklists.js`)
The **seeded** source of truth. User edits never mutate this object — they live in `localStorage["bhm.edits.v1"]` and are applied at render time via `applyEdits(sectionKey)`.
```js
{
  auction:        { title, subtitle, groups: [{ title, display?, items: [{id, text}] }] },  // shared; display:true groups render as bullet rows, not checkboxes
  declarerCommon: { ... },   // always shown in declarer analysis (both branches)
  declarerNT:     { ... },   // shown when NT branch picked
  declarerSuit:   { ... },   // shown when Suit branch picked
  defender:       { ... },   // unified defender analysis
}
```

### Persisted: `localStorage["bhm.history.v1"]` (most recent first, capped at 200)
| Field    | Type   | Description                                  |
|----------|--------|----------------------------------------------|
| `at`     | Number | Unix ms when the hand was logged             |
| `role`   | String | `"declarer"` or `"defender"`                 |
| `branch` | String | `"nt"`, `"suit"`, or `null` (defender)       |
| `done`   | Number | Items ticked                                 |
| `total`  | Number | Items presented this hand (varies by branch) |

### Persisted: `localStorage["bhm.edits.v1"]` (overrides on top of `CHECKLISTS`)
User-made edits to the checklists (move / edit text / delete / add) live here as **patches** keyed by section + group. Applied at render time by `applyEdits(sectionKey)`. Seeded `web/checklists.js` is never mutated; "Reset all edits" wipes this key.

```js
{
  [sectionKey]: {
    [groupTitle]: {
      order:   ["id1", "id2", ...] | null,   // explicit order (overrides seeded order)
      text:    { [itemId]: "new text" },      // text overrides keyed by item id
      deleted: ["id3", ...],                   // tombstoned seeded items
      added:   [{ id, text }, ...]             // user-added items (ids prefixed "u_")
    }
  }
}
```

User-added items get ids of the form `u_<timestamp>_<n>` so they can never collide with seeded ids. Deleting a seeded item tombstones it; deleting a user-added item drops it from `added` entirely.

## Module Structure

| Module          | Purpose                                                  | Dependencies        |
|-----------------|----------------------------------------------------------|---------------------|
| `checklists.js` | Seeded checklist content — overlayed by edits at render | None                |
| `app.js`        | Screen renderers, session state, history; unregisters stale SWs | checklists.js |
| `styles.css`    | Standard PWA palette (`:root` vars) + checklist UI       | None                |
| `manifest.json` | PWA manifest                                             | None                |
| `server.py`     | Static file server (subclass of `LocalAppHandler`)       | `server_base.py`    |

`app.js` keeps a single module-level `currentRender` reference so item ticks can re-render the active screen without a routing system. No framework.

## Screen Flow

```
Home
 ├─[Declarer]────────► Auction ──► "Did we win the contract?"
 │                                  ├─ Yes ──► Analysis (NT | Suit) ──► Log ──► Home
 │                                  └─ No  ──► Analysis (defender)   ──► Log ──► Home
 ├─[Defender]────────► Auction ──► Analysis (defender) ──► Log ──► Home
 ├─[Edit Declarer]──► Editor (all 4 declarer sections stacked) ──► Home
 └─[Edit Defender]──► Editor (auction + defender stacked)        ──► Home
```

The Auction checklist is identical for both roles. Routing question only appears after the declarer-auction, because if you didn't win the contract you defend the hand instead.

## Editor

A separate edit-mode reachable from the Home stat strip ("Edit Declarer sheet" / "Edit Defender sheet"). Toggles a module-level `editMode` flag that swaps every checklist row from tap-to-tick into a row with four controls: **↑** move up, **↓** move down, **✎** edit text, **✕** delete. Each group ends with a **"+ Add item"** bar.

- **Edit / Add** open an inline `<textarea>` with **Enter** = save, **Shift+Enter** = newline, **Escape** = cancel.
- All mutations go through `editItemText`, `moveItem`, `deleteItem`, `addItem` — pure functions over `bhm.edits.v1`, no `CHECKLISTS` mutation.
- Edit state (`editingItemId`, `addingInGroup`) is cleared on `renderHome` but preserved across `renderEditor` re-renders.
- "Reset all edits" wipes `bhm.edits.v1` entirely (with `confirm()`).
- Taps don't toggle ticks while `editMode === true`.

## Server

| Endpoint          | Method | Description                                   |
|-------------------|--------|-----------------------------------------------|
| `/`               | GET    | Serves `web/index.html`                       |
| `/<asset>`        | GET    | Serves static files from `web/`               |
| `/health`         | GET    | `{"status": "ok"}` (used by iOS PWA shell)    |
| `/version`        | GET    | Reports the app version (from `server.py` prefix) |

No POST endpoints. The app is read-only from the server's perspective; all state lives client-side.

## Testing

| Suite          | Framework         | Count | What's tested                          |
|----------------|-------------------|-------|----------------------------------------|
| Smoke (manual) | chrome-devtools   | 1     | Full Declarer NT/Suit + Defender E2E   |

No automated tests yet. v1 was verified end-to-end via Chrome DevTools MCP driving the live app — Declarer Suit branch (25 items total, 3 ticked = 12%) and Defender (30 items, 0 ticked = 0%) both passed.

---

## Architectural Decisions

### Choices

- **Simple PWA tier** over Full PWA tier — Habit Map is single-user, single-device, has no email parsing, no inbox, no shared content. Firebase, the parser, and the suggestion engine would be dead weight. Simple tier gives us iOS install (manifest + apple meta) without the cost. (The cache-first service worker the tier ships with was dropped in v0.3.1 — see the SW decision note below.) (2026-06-02)
- **`localStorage` only** over Firebase Firestore — One device, no sync needs, no schema evolution risk. Re-evaluate if Lee wants phone↔laptop sync of hand history. (2026-06-02)
- **Vanilla DOM via `el()` helper** over framework — 5 screens, ~300 LOC of UI. React/Vue would dwarf the app. Matches template convention (no build step). (2026-06-02)
- **Single `currentRender` reference for re-renders** over a router — Toggles only need to re-render the active screen; explicit screen-render fns + one mutable reference is simpler than a routing table. (2026-06-02)
- **One-tap toggle on each item** over swipe / long-press / form controls — Habit-formation friction must be near-zero. Whole row is the tap target. (2026-06-02)
- **Declarer auction routes through "Did we win?"** over forcing role choice up front — Mirrors real bidding: you don't know which sheet to switch to until the auction ends. Defender role on Home skips this gate because they're defending regardless. (2026-06-02)
- **NT vs Suit branch picker on the Analysis screen** over two declarer roles on Home — Auction phase + common analysis steps are identical for NT and Suit; branching only at the trick-counting step keeps the home screen clean. (2026-06-02)
- **Opening lead folded into Defender Step 6** over a separate "On lead" sheet — A defender who's not on lead just skips those bullets; cleaner than maintaining a third sheet. (2026-06-02)
- **Active-vs-passive as a binary** over a richer "kind of defense" decision — Habit-building app, not a teaching tool. Two heuristics (long-suit declarer → active, balanced → passive) cover the common case. (2026-06-02)
- **Post-hand log captures completion %** over per-item review — Goal is "did I run the habit?", not "was each call correct?". Future hooks for richer post-hand notes left open. (2026-06-02)
- **History capped at 200 hands** over unbounded — A few seasons of club bridge. `localStorage` quota is ~5MB so this is generous; cap protects against an accidental loop bug filling storage. (2026-06-02)
- **Cache-first SW with no API path** over network-first — App is fully static + localStorage; nothing on the server changes per request. Cache-first is faster and works offline by default. (2026-06-02) — **SUPERSEDED, see below.**
- **Dropped the service worker entirely** over keeping cache-first SW — Once the app moved to GitHub Pages, the SW cache trapped users on stale shells (no way to push updates). `app.js` now actively unregisters any pre-existing SW and clears its caches on boot, so users stuck on v≤0.3.0 self-heal. Trade-off: no offline shell. Acceptable for a connected, single-user app. (2026-06-02)
- **Edits as patches on top of seeded `CHECKLISTS`** over mutating `web/checklists.js` — Keeps the seeded source intact so "Reset all edits" is one localStorage delete. Lets us promote popular user edits back into the seed by hand later. Patch shape (`order` / `text` / `deleted` / `added`) supports all 4 mutations without re-serialising the full tree. (2026-06-02)
- **Inline `<textarea>` for edit + add** over native `prompt()` modals — Better mobile UX; 16px font prevents iOS Safari zoom-on-focus; allows multi-line item text via Shift+Enter. (2026-06-02)
- **Editor as a dedicated screen** over inline edit-toggle on the running checklists — Avoids stale tick-state and accidental edits at the table; clean separation between "use" and "tune". (2026-06-02)

### Hardcoded Values

- Port: **8791** | Avoids common collisions on 8765/8080
- Health port: **8792** | One above main port (template convention)
- History cap: **200 hands** | localStorage quota safety margin
- Stat window: **7 days** | Matches "weekly review" cadence of competitive players
- Storage key: **`bhm.history.v1`** | `v1` suffix lets us version the schema in future
- APP_VERSION constant: **`X.Y.Z`** | Kept in lockstep with `VERSION` file via `lee version minor/major`
- Edits storage key: **`bhm.edits.v1`** | `v1` suffix lets us version the patch schema in future
- User-added item id prefix: **`u_<timestamp>_<n>`** | Guarantees no collision with seeded ids

### Bugs & Workarounds

- (none yet)

### Rejected

- **Firebase sync** — Out of scope for v1. Single device is fine until Lee actually wants laptop↔phone hand history. (2026-06-02)
- **Per-trick analysis loop on the defender sheet** — Originally considered, rejected in favour of one pre-trick-1 plan to keep the habit short and tappable. (2026-06-02)
- **Auto-launch the right sheet from the auction** — Considered routing straight into Analysis based on the contract Lee enters. Rejected because the manual "Did we win?" tap doubles as a forcing pause point. (2026-06-02)
