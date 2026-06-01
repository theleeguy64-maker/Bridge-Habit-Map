# Architecture

## Overview
<!-- TODO: One paragraph — what the system does, who it's for, how it runs -->

## System Diagram
<!-- TODO: ASCII art showing data flow between components. Example from Superhuman: -->
```
┌─────────────────────────────────┐
│  Input Source                   │  (e.g. email, API, file drop)
└────────────────────────┬────────┘
                         │
                         ▼
┌─────────────────────────────────┐     ┌──────────────────────────┐
│  parser.py                      │────▶│  Firestore               │
│  - Validate input               │     │  ┌──────────────────┐   │
│  - Parse content                │     │  │ newsletters      │   │
│  - Extract articles/items       │     │  │ articles         │   │
│  - Upload to Firestore          │     │  └──────────────────┘   │
└─────────────────────────────────┘     └──────────────────────────┘
                                                   ▲
┌─────────────────────────────────┐                │
│  server.py                      │                │
│  HTTPS :8765 + HTTP :8766       │                │
│  - Serves web/ static files     │                │
│  - POST endpoints               │                │
│  - Dynamic CORS (iOS-ready)     │                │
└────────────────────────┬────────┘                │
                         │                         │
                         ▼                         │
┌─────────────────────────────────┐                │
│  Browser UI                     │────────────────┘
│  web/index.html + style.css     │  Firebase Web SDK (self-hosted)
│  app.js → data.js, render.js,   │  Direct Firestore queries
│  suggestions.js                 │
└─────────────────────────────────┘
```

## File Structure
<!-- TODO: Annotated tree of project files. If based on browser-pwa-firebase template: -->
```
ProjectName/
├── parser.py                     # Parser (entry point, app-specific extractors)
├── parser_base.py                # Generic email/text utilities (reusable)
├── parser_config.py              # App-specific constants (sections, tags, extractors)
├── server_base.py                # Reusable local HTTPS server (generic)
├── server.py                     # App-specific server endpoints (thin subclass)
│
├── web/                          # UI assets (served by server.py)
│   ├── index.html                # HTML skeleton (toolbar, content, modals)
│   ├── style.css                 # All CSS styling (CSS variables for theming)
│   ├── config.js                 # App identity, states, collections, content rules
│   ├── app.js                    # Orchestration (wires modules, event setup)
│   ├── data.js                   # Firebase/Firestore data operations
│   ├── render.js                 # DOM rendering, UI helpers, article cards
│   ├── suggestions.js            # Rule matching, loading, promotion logic
│   ├── firebase-config.js        # Firebase Web SDK config + re-exports
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service worker (cache-first for shell)
│
├── analysis/                     # Suggestion analysis scripts
│   └── config.py                 # Analysis thresholds + existing rules
│
├── firebase/                     # Firebase project config
│   ├── firebase.json
│   ├── firestore.rules
│   └── firestore.indexes.json
│
├── certs/                        # HTTPS certs (gitignored)
├── inbox/                        # Incoming files
├── processed/                    # Processed files
└── tests/
```

## Data Model
<!-- TODO: Define your Firestore collections -->

### Collection: `newsletters`
| Field | Type | Description |
|-------|------|-------------|
| `email_date` | Timestamp | Date from source |
| `subject` | String | Subject/title |
| `source_filename` | String | Original filename |
| `review_completed` | Boolean | True when all items reviewed |
| `article_count` | Number | Count of extracted items |

### Collection: `articles`
| Field | Type | Description |
|-------|------|-------------|
| `newsletter_id` | String | FK to newsletters doc |
| `section` | String | Section name |
| `item_order` | Number | Display order |
| `title` | String | Item title |
| `summary` | String | Short summary |
| `article_html` | String | Full body with links |
| `links` | Array | `[{text, url}]` |
| `tags` | Array | Content category tags |
| `is_picked` | Boolean | User saved this |
| `is_rejected` | Boolean | User dismissed this |

## Module Structure

| Module | Purpose | Dependencies |
|--------|---------|-------------|
| `config.js` | App identity — states, collections, fields, section order, content rules | None |
| `app.js` | Orchestration — event wiring, view loading, cross-module coordination | config, data, render, suggestions |
| `data.js` | Firebase/Firestore operations — queries, writes, purge, real-time | config, firebase-config |
| `render.js` | DOM manipulation — renderers, cards, modals, UI helpers | config (SECTION_ORDER) |
| `suggestions.js` | Rule matching — hardcoded, statistical, AI rules, promotion | config, firebase-config, data |

## Server

Two-layer Python server: `server_base.py` (reusable) + `server.py` (app-specific subclass).

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serves index.html |
| `/health` | GET | Returns `{"status": "ok"}` |
| `/version` | GET | Returns `{"version": N}` from sw.js |
<!-- TODO: Add app-specific POST endpoints -->

## Testing
| Suite | Framework | Count | What's Tested |
|-------|-----------|-------|---------------|
| <!-- TODO --> | pytest | <!-- TODO --> | <!-- TODO --> |

---

## Architectural Decisions

A living record of every choice made and why. Each entry is self-contained.

**Format**: `- **[What was chosen]** over [alternative] — [why] (YYYY-MM-DD)`

### Choices
<!-- Add decisions as they are made -->
- **Self-hosted Firebase SDK** over CDN — offline reliability, no external dependency for local-first app
- **ES modules** over bundler — no build step, simpler debugging
- **Two-port design** (8765 HTTPS + 8766 HTTP) — iOS standalone PWA doesn't trust self-signed certs for fetch
- **`config.js` single source of app identity** over scattered hardcoded strings — enables reuse by swapping one file
- **Separated generic/app-specific code** (`parser_base.py` + `parser_config.py`) — swap config files to reuse skeleton

### Hardcoded Values
<!-- Add values as they are set. Format: description: **value** | rationale -->

### Bugs & Workarounds
<!-- Add bugs as encountered -->

### Rejected
<!-- Add rejections as they happen -->
