// Bridge Habit Map — app shell
// Screens: home → auction → routing? → declarer (NT/Suit) | defender → log → home

const APP_VERSION = "0.3.3";  // keep in lockstep with VERSION file (lee version minor/major)
const STORAGE_KEY = "bhm.history.v1";
const EDITS_KEY = "bhm.edits.v1";
const app = document.getElementById("app");

let editMode = false;            // global UI flag — toggled from Home
let editingItemId = null;        // when set, that row renders an inline textarea instead of static text
let addingInGroup = null;        // { sectionKey, groupTitle } — group with an open "+ Add item" textarea
let confirmingActionId = null;   // id of a destructive action mid-confirm (item id for delete, "reset-all" for reset)
let confirmingTimer = null;      // timeout handle that reverts the confirm state

// Unregister any previously installed service worker — we no longer ship one.
// Without this, browsers that installed a v≤0.3.0 SW will keep serving the
// cached shell forever and never see new deploys.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(regs => regs.forEach(r => r.unregister()))
    .catch(() => {});
  if (window.caches) {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
  }
}

// Session state — reset on each new hand
let session = null;
let currentRender = null;       // reference to current screen-render fn (for re-renders on toggle)

function newSession(role) {
  session = {
    role,                       // 'declarer' | 'defender'
    declarerBranch: null,       // 'nt' | 'suit' (declarer only)
    ticks: {},                  // itemId -> bool
    startedAt: Date.now(),
  };
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch { return []; }
}

function saveHand(record) {
  const h = loadHistory();
  h.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(h.slice(0, 200)));
}

function recentCompletionPct(days = 7) {
  const cutoff = Date.now() - days * 86400000;
  const recent = loadHistory().filter(h => h.at >= cutoff);
  if (!recent.length) return null;
  const total = recent.reduce((s, h) => s + h.total, 0);
  const done = recent.reduce((s, h) => s + h.done, 0);
  return { pct: Math.round((done / total) * 100), hands: recent.length };
}

// ---------- Edits (localStorage overrides on top of CHECKLISTS) ----------
// Shape: { [sectionKey]: { [groupTitle]: { order: [id,...], text: {id: str}, deleted: [id,...], added: [{id, text}] } } }
// Seeded items keep their ids; user-added items get ids "u_<timestamp>_<n>".

function loadEdits() {
  try { return JSON.parse(localStorage.getItem(EDITS_KEY)) || {}; }
  catch { return {}; }
}

function saveEdits(edits) {
  localStorage.setItem(EDITS_KEY, JSON.stringify(edits));
}

let _uidCounter = 0;
function newItemId() {
  _uidCounter += 1;
  return "u_" + Date.now() + "_" + _uidCounter;
}

function ensurePatch(edits, sectionKey, groupTitle) {
  if (!edits[sectionKey]) edits[sectionKey] = {};
  if (!edits[sectionKey][groupTitle]) {
    edits[sectionKey][groupTitle] = { order: null, text: {}, deleted: [], added: [] };
  }
  return edits[sectionKey][groupTitle];
}

// Apply edits over a section's groups and return the rendered shape used by renderGroups().
function applyEdits(sectionKey) {
  const src = CHECKLISTS[sectionKey];
  if (!src) return { groups: [] };
  const edits = loadEdits();
  const sectionEdits = edits[sectionKey] || {};

  const groups = src.groups.map(g => {
    const patch = sectionEdits[g.title] || {};
    const deletedSet = new Set(patch.deleted || []);
    const textMap = patch.text || {};
    const added = patch.added || [];

    // Build the union of seeded + added items, drop deleted, apply text overrides
    let items = g.items
      .filter(i => !deletedSet.has(i.id))
      .map(i => ({ id: i.id, text: textMap[i.id] || i.text }));
    for (const a of added) {
      if (!deletedSet.has(a.id)) items.push({ id: a.id, text: textMap[a.id] || a.text });
    }

    // Apply order if set; unknown ids (newly added since order was set) go to the end
    if (Array.isArray(patch.order) && patch.order.length) {
      const idx = new Map(patch.order.map((id, i) => [id, i]));
      items.sort((a, b) => {
        const ai = idx.has(a.id) ? idx.get(a.id) : 999 + items.indexOf(a);
        const bi = idx.has(b.id) ? idx.get(b.id) : 999 + items.indexOf(b);
        return ai - bi;
      });
    }

    return { title: g.title, items, _sectionKey: sectionKey };
  });

  return { groups };
}

function moveItem(sectionKey, groupTitle, itemId, dir) {
  const edits = loadEdits();
  const patch = ensurePatch(edits, sectionKey, groupTitle);
  const currentOrder = applyEdits(sectionKey).groups.find(g => g.title === groupTitle).items.map(i => i.id);
  const idx = currentOrder.indexOf(itemId);
  if (idx < 0) return;
  const swap = idx + dir;
  if (swap < 0 || swap >= currentOrder.length) return;
  [currentOrder[idx], currentOrder[swap]] = [currentOrder[swap], currentOrder[idx]];
  patch.order = currentOrder;
  saveEdits(edits);
}

function editItemText(sectionKey, groupTitle, itemId, newText) {
  const edits = loadEdits();
  const patch = ensurePatch(edits, sectionKey, groupTitle);
  patch.text[itemId] = newText;
  saveEdits(edits);
}

function deleteItem(sectionKey, groupTitle, itemId) {
  const edits = loadEdits();
  const patch = ensurePatch(edits, sectionKey, groupTitle);
  // If the deleted item was user-added, drop it from `added` rather than tombstoning
  const wasAdded = patch.added.some(a => a.id === itemId);
  if (wasAdded) {
    patch.added = patch.added.filter(a => a.id !== itemId);
  } else {
    if (!patch.deleted.includes(itemId)) patch.deleted.push(itemId);
  }
  delete patch.text[itemId];
  if (Array.isArray(patch.order)) patch.order = patch.order.filter(id => id !== itemId);
  saveEdits(edits);
}

function addItem(sectionKey, groupTitle, text) {
  const edits = loadEdits();
  const patch = ensurePatch(edits, sectionKey, groupTitle);
  const id = newItemId();
  patch.added.push({ id, text });
  if (Array.isArray(patch.order)) patch.order.push(id);
  saveEdits(edits);
  return id;
}

function resetAllEdits() {
  localStorage.removeItem(EDITS_KEY);
}

function armConfirm(id) {
  confirmingActionId = id;
  if (confirmingTimer) clearTimeout(confirmingTimer);
  confirmingTimer = setTimeout(() => {
    if (confirmingActionId === id) {
      confirmingActionId = null;
      confirmingTimer = null;
      if (currentRender) currentRender();
    }
  }, 3000);
}

function clearConfirm() {
  confirmingActionId = null;
  if (confirmingTimer) { clearTimeout(confirmingTimer); confirmingTimer = null; }
}

// ---------- Render helpers ----------

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  for (const k of kids.flat()) {
    if (k == null || k === false) continue;
    n.append(k.nodeType ? k : document.createTextNode(k));
  }
  return n;
}

function clear() { app.innerHTML = ""; }

function header(crumb, onBack) {
  const top = el("div", { class: "top" });
  if (onBack) {
    top.append(el("button", { class: "btn-back", onclick: onBack }, "← Back"));
  } else {
    top.append(el("div", {}, ""));
  }
  top.append(el("div", { class: "crumbs" }, crumb || ""));
  top.append(el("div", {}, ""));
  return top;
}

// ---------- Screen: Home ----------

function renderHome() {
  currentRender = renderHome;
  clear();
  editMode = false;                 // always start fresh on Home
  editingItemId = null;
  addingInGroup = null;
  clearConfirm();
  app.append(header("Bridge Habit Map"));

  const stat = recentCompletionPct(7);
  const statText = stat
    ? `Last 7 days: ${stat.pct}% across ${stat.hands} hand${stat.hands === 1 ? "" : "s"}`
    : "No hands logged yet";

  app.append(
    el("div", { class: "phase-head" },
      el("div", { class: "phase-name" }, "Pick a role"),
      el("div", { class: "phase-title" }, "Which sheet?")
    ),
    el("div", { class: "home-grid" },
      el("button", { class: "role-btn", onclick: () => startSession("auction") },
        el("div", { class: "role-title" }, "Auction"),
        el("div", { class: "role-sub" }, "Start a hand")
      ),
    ),
    el("div", { class: "stat-strip" },
      el("div", {}, statText),
      el("button", {
        class: "btn-back",
        style: "margin: 0; padding: 0;",
        onclick: renderHistory,
      }, "History →")
    ),
    el("div", { class: "version-tag-strip" }, "v" + APP_VERSION),
  );
}

function startSession(role) {
  newSession(role);
  renderAuction();
}

// ---------- Screen: Editor ----------

function renderEditor(role) {
  currentRender = () => renderEditor(role);
  editMode = true;
  clear();
  // Don't reset editingItemId / addingInGroup here — re-rendering during edit is expected
  const headerTitle = role === "declarer" ? "Edit Declarer"
                    : role === "defender" ? "Edit Defender"
                    : "Edit Auction";
  const phaseTitle  = role === "declarer" ? "Declarer sheet"
                    : role === "defender" ? "Defender sheet"
                    : "Auction sheet";
  app.append(header(headerTitle, () => { editMode = false; renderHome(); }));
  app.append(
    el("div", { class: "phase-head" },
      el("div", { class: "phase-name" }, "Editing"),
      el("div", { class: "phase-title" }, phaseTitle)
    )
  );

  const sections = role === "declarer"
    ? [
        { key: "auction",        label: "Auction (shared)" },
        { key: "declarerCommon", label: "Analysis — discipline & lead" },
        { key: "declarerNT",     label: "Analysis — NT branch" },
        { key: "declarerSuit",   label: "Analysis — Suit branch" },
      ]
    : role === "defender"
    ? [
        { key: "auction",  label: "Auction (shared)" },
        { key: "defender", label: "Analysis — defender" },
      ]
    : [
        { key: "auction", label: "Auction" },
      ];

  for (const s of sections) {
    app.append(el("div", { class: "section-divider" }, s.label));
    renderSection(s.key);
  }

  app.append(
    el("div", { class: "actions" },
      renderResetAllButton(),
      el("button", { class: "btn btn-primary", onclick: () => { editMode = false; renderHome(); } }, "Done")
    )
  );
}

// ---------- Screen: Auction ----------

function renderAuction() {
  currentRender = renderAuction;
  clear();
  const headerLabel = session.role === "declarer" ? "Declarer"
                    : session.role === "defender" ? "Defender"
                    : "Auction";
  app.append(header(headerLabel, renderHome));
  app.append(
    el("div", { class: "phase-head" },
      el("div", { class: "phase-name" }, session.role === "auction" ? "Drill" : "Phase 1 of 2"),
      el("div", { class: "phase-title" }, "Auction")
    )
  );

  renderSectionCols("auction");

  app.append(
    el("div", { class: "edit-strip" },
      el("button", { class: "btn-link", onclick: () => renderEditor("auction") }, "Edit Auction sheet"),
    ),
    el("div", { class: "phase-head", style: "margin-top: 18px;" },
      el("div", { class: "phase-name" }, "Next"),
    ),
    el("div", { class: "home-grid" },
      el("button", { class: "role-btn", onclick: () => { session.role = "declarer"; renderAnalysis(); } },
        el("div", { class: "role-title" }, "Declarer"),
        el("div", { class: "role-sub" }, "NT or Suit plan")
      ),
      el("button", { class: "role-btn", onclick: () => { session.role = "defender"; renderAnalysis(); } },
        el("div", { class: "role-title" }, "Defender"),
        el("div", { class: "role-sub" }, "Defense plan")
      ),
    ),
    el("div", { class: "actions" },
      el("button", { class: "btn btn-ghost", onclick: renderHome }, "Cancel"),
    )
  );
}

// ---------- Screen: Routing (declarer-only — won the contract?) ----------

function renderRouting() {
  clear();
  app.append(header("Declarer", renderAuction));
  app.append(
    el("div", { class: "phase-head" },
      el("div", { class: "phase-name" }, "After the auction"),
      el("div", { class: "phase-title" }, "Did we win the contract?")
    ),
    el("div", { class: "routing" },
      el("div", { class: "pair" },
        el("button", { class: "btn btn-primary", onclick: () => renderAnalysis() }, "Yes — plan"),
        el("button", {
          class: "btn",
          onclick: () => { session.role = "defender"; renderAnalysis(); }
        }, "No — defend"),
      )
    )
  );
}

// ---------- Screen: Analysis ----------

function renderAnalysis() {
  currentRender = renderAnalysis;
  clear();
  const isDec = session.role === "declarer";
  app.append(header(isDec ? "Declarer" : "Defender", renderAuction));
  app.append(
    el("div", { class: "phase-head" },
      el("div", { class: "phase-name" }, "Pre-trick 1"),
      el("div", { class: "phase-title" }, isDec ? "Declarer plan" : "Defense plan")
    )
  );

  if (isDec) {
    renderDeclarerBranchPicker();
    const keys = ["declarerCommon"];
    if (session.declarerBranch === "nt") keys.push("declarerNT");
    else if (session.declarerBranch === "suit") keys.push("declarerSuit");
    renderSectionCols(keys);
  } else {
    renderSectionCols("defender");
  }

  app.append(
    el("div", { class: "edit-strip" },
      el("button", {
        class: "btn-link",
        onclick: () => renderEditor(isDec ? "declarer" : "defender")
      }, isDec ? "Edit Declarer sheet" : "Edit Defender sheet"),
    ),
    el("div", { class: "actions" },
      el("button", { class: "btn btn-ghost", onclick: renderHome }, "Cancel"),
      el("button", { class: "btn btn-primary", onclick: finishHand }, "Finish hand")
    )
  );
}

function renderDeclarerBranchPicker() {
  const picker = el("div", { class: "branch-picker" },
    el("button", {
      class: "branch-btn" + (session.declarerBranch === "nt" ? " selected" : ""),
      onclick: () => { session.declarerBranch = "nt"; renderAnalysis(); }
    }, "Notrump"),
    el("button", {
      class: "branch-btn" + (session.declarerBranch === "suit" ? " selected" : ""),
      onclick: () => { session.declarerBranch = "suit"; renderAnalysis(); }
    }, "Suit"),
  );
  app.append(picker);
}

// ---------- Render section / groups ----------

function renderSection(sectionKey, parent) {
  const { groups } = applyEdits(sectionKey);
  const target = parent || app;
  for (const g of groups) {
    const groupEl = el("div", { class: "group" });
    if (g.title) groupEl.append(el("div", { class: "group-title" }, g.title));
    for (const item of g.items) {
      groupEl.append(renderItem(sectionKey, g.title, item));
    }
    if (editMode) {
      groupEl.append(renderAddItemBar(sectionKey, g.title));
    }
    target.append(groupEl);
  }
}

function renderSectionCols(sectionKeys) {
  const cols = el("div", { class: "checklist-cols" });
  for (const k of (Array.isArray(sectionKeys) ? sectionKeys : [sectionKeys])) {
    renderSection(k, cols);
  }
  app.append(cols);
}

function renderItem(sectionKey, groupTitle, item) {
  const done = !!session?.ticks[item.id];

  if (editMode && editingItemId === item.id) {
    return renderInlineEditor(sectionKey, groupTitle, item);
  }

  if (editMode) {
    return el("div", { class: "item edit-row" },
      el("div", { class: "item-text" }, item.text),
      el("div", { class: "item-edit-controls" },
        el("button", { class: "edit-btn", title: "Move up", "aria-label": "Move up",
          onclick: (e) => { e.stopPropagation(); moveItem(sectionKey, groupTitle, item.id, -1); currentRender(); }
        }, "↑"),
        el("button", { class: "edit-btn", title: "Move down", "aria-label": "Move down",
          onclick: (e) => { e.stopPropagation(); moveItem(sectionKey, groupTitle, item.id, 1); currentRender(); }
        }, "↓"),
        el("button", { class: "edit-btn", title: "Edit text", "aria-label": "Edit text",
          onclick: (e) => {
            e.stopPropagation();
            editingItemId = item.id;
            addingInGroup = null;
            currentRender();
          }
        }, "✎"),
        renderDeleteButton(sectionKey, groupTitle, item.id),
      )
    );
  }

  return el("div", {
    class: "item" + (done ? " done" : ""),
    onclick: () => toggle(item.id),
  },
    el("div", { class: "tick" }),
    el("div", { class: "item-text" }, item.text)
  );
}

function renderResetAllButton() {
  const armed = confirmingActionId === "reset-all";
  return el("button", {
    class: "btn btn-ghost" + (armed ? " btn-armed" : ""),
    onclick: () => {
      if (armed) {
        clearConfirm();
        resetAllEdits();
        currentRender();
      } else {
        armConfirm("reset-all");
        currentRender();
      }
    }
  }, armed ? "Tap again to reset" : "Reset all edits");
}

function renderDeleteButton(sectionKey, groupTitle, itemId) {
  const armed = confirmingActionId === itemId;
  return el("button", {
    class: "edit-btn edit-btn-del" + (armed ? " edit-btn-armed" : ""),
    title: armed ? "Tap again to confirm" : "Delete",
    "aria-label": armed ? "Confirm delete" : "Delete item",
    onclick: (e) => {
      e.stopPropagation();
      if (armed) {
        clearConfirm();
        deleteItem(sectionKey, groupTitle, itemId);
      } else {
        armConfirm(itemId);
      }
      currentRender();
    }
  }, armed ? "Confirm?" : "✕");
}

function renderInlineEditor(sectionKey, groupTitle, item) {
  const ta = el("textarea", {
    class: "inline-edit-textarea",
    "aria-label": "Edit item text",
    rows: "2",
  });
  ta.value = item.text;

  const save = () => {
    const next = ta.value.trim();
    if (next && next !== item.text) {
      editItemText(sectionKey, groupTitle, item.id, next);
    }
    editingItemId = null;
    currentRender();
  };
  const cancel = () => { editingItemId = null; currentRender(); };

  ta.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); }
    if (e.key === "Escape") { e.preventDefault(); cancel(); }
  });

  // Autofocus after mount
  setTimeout(() => { ta.focus(); ta.select(); }, 0);

  return el("div", { class: "item edit-row edit-row-editing" },
    ta,
    el("div", { class: "item-edit-controls" },
      el("button", { class: "edit-btn edit-btn-save", title: "Save", "aria-label": "Save", onclick: (e) => { e.stopPropagation(); save(); } }, "✓"),
      el("button", { class: "edit-btn", title: "Cancel", "aria-label": "Cancel", onclick: (e) => { e.stopPropagation(); cancel(); } }, "✕"),
    )
  );
}

function renderAddItemBar(sectionKey, groupTitle) {
  const open = addingInGroup && addingInGroup.sectionKey === sectionKey && addingInGroup.groupTitle === groupTitle;
  if (!open) {
    return el("div", { class: "add-item-bar", role: "button", tabindex: "0",
      onclick: () => {
        addingInGroup = { sectionKey, groupTitle };
        editingItemId = null;
        currentRender();
      }
    }, "+ Add item");
  }

  const ta = el("textarea", {
    class: "inline-edit-textarea",
    "aria-label": "New item text",
    rows: "2",
    placeholder: "New item…",
  });

  const save = () => {
    const text = ta.value.trim();
    if (text) addItem(sectionKey, groupTitle, text);
    addingInGroup = null;
    currentRender();
  };
  const cancel = () => { addingInGroup = null; currentRender(); };

  ta.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save(); }
    if (e.key === "Escape") { e.preventDefault(); cancel(); }
  });
  setTimeout(() => ta.focus(), 0);

  return el("div", { class: "item edit-row edit-row-editing add-row" },
    ta,
    el("div", { class: "item-edit-controls" },
      el("button", { class: "edit-btn edit-btn-save", title: "Add", "aria-label": "Add", onclick: (e) => { e.stopPropagation(); save(); } }, "✓"),
      el("button", { class: "edit-btn", title: "Cancel", "aria-label": "Cancel", onclick: (e) => { e.stopPropagation(); cancel(); } }, "✕"),
    )
  );
}

function toggle(id) {
  if (editMode) return;             // taps don't toggle in edit mode
  session.ticks[id] = !session.ticks[id];
  if (currentRender) currentRender();
}

// ---------- Finish + Log ----------

function sectionItemIds(sectionKey) {
  const ids = [];
  applyEdits(sectionKey).groups.forEach(g => g.items.forEach(i => ids.push(i.id)));
  return ids;
}

function allItemsForSession() {
  const ids = sectionItemIds("auction");
  if (session.role === "auction") {
    // Auction-only drill — no analysis section
  } else if (session.role === "declarer") {
    ids.push(...sectionItemIds("declarerCommon"));
    if (session.declarerBranch === "nt") ids.push(...sectionItemIds("declarerNT"));
    else if (session.declarerBranch === "suit") ids.push(...sectionItemIds("declarerSuit"));
  } else {
    ids.push(...sectionItemIds("defender"));
  }
  return ids;
}

function finishHand() {
  const ids = allItemsForSession();
  const done = ids.filter(i => session.ticks[i]).length;
  const total = ids.length;
  const record = {
    at: Date.now(),
    role: session.role,
    branch: session.declarerBranch,
    done,
    total,
  };
  saveHand(record);
  renderLog(record);
}

function verdict(pct) {
  if (pct >= 90) return "Locked in.";
  if (pct >= 70) return "Solid pass.";
  if (pct >= 50) return "Half the habit — keep going.";
  if (pct >= 25) return "Slipping. Slow down trick 1.";
  return "Reset. Pause before the next hand.";
}

function renderLog(record) {
  clear();
  app.append(header("Hand complete", null));
  const pct = Math.round((record.done / record.total) * 100);
  app.append(
    el("div", { class: "log-summary" },
      el("div", { class: "pct" }, pct + "%"),
      el("div", { class: "ratio" }, `${record.done} of ${record.total} steps`),
      el("div", { class: "verdict" }, verdict(pct)),
      el("div", { style: "display: flex; gap: 10px;" },
        el("button", { class: "btn", onclick: renderHistory }, "History"),
        el("button", { class: "btn btn-primary", onclick: renderHome }, "Done"),
      )
    )
  );
}

// ---------- Screen: History ----------

function renderHistory() {
  clear();
  app.append(header("History", renderHome));
  app.append(
    el("div", { class: "phase-head" },
      el("div", { class: "phase-name" }, "Last 200 hands"),
      el("div", { class: "phase-title" }, "History")
    )
  );

  const h = loadHistory();
  if (!h.length) {
    app.append(el("div", { class: "card" }, "No hands yet. Play one to start the streak."));
    return;
  }

  const card = el("div", { class: "card" });
  for (const row of h.slice(0, 50)) {
    const pct = Math.round((row.done / row.total) * 100);
    const when = new Date(row.at);
    const label = `${when.toLocaleDateString()} ${when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    const tag = row.role === "declarer"
      ? `Declarer${row.branch ? " (" + row.branch.toUpperCase() + ")" : ""}`
      : row.role === "auction" ? "Auction drill"
      : "Defender";
    card.append(
      el("div", { class: "history-row" },
        el("div", {},
          el("div", { class: "pct-mini" }, tag),
          el("div", { class: "when" }, label),
        ),
        el("div", { class: "pct-mini" }, pct + "%")
      )
    );
  }
  app.append(card);

  app.append(
    el("div", { class: "actions" },
      el("button", { class: "btn btn-ghost", onclick: () => {
        if (confirm("Clear all history? Cannot undo.")) {
          localStorage.removeItem(STORAGE_KEY);
          renderHome();
        }
      }}, "Clear all"),
      el("button", { class: "btn btn-primary", onclick: renderHome }, "Done"),
    )
  );
}

// ---------- Boot ----------

renderHome();
