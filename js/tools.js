// ════════════════════════════════════════════════════════════════════════════
//  CONTEXT MENUS
// ════════════════════════════════════════════════════════════════════════════

function showMenu(id, x, y) {
  const m = document.getElementById(id);
  m.style.display = "block";
  m.style.left = Math.min(x, innerWidth - 190) + "px";
  m.style.top = Math.min(y, innerHeight - 220) + "px";
}

function closeMenus() {
  ["ctxNode", "ctxArrow"].forEach(
    (id) => (document.getElementById(id).style.display = "none"),
  );
}

function ctxRename() {
  closeMenus();
  if (ctxNodeTarget) startEdit(ctxNodeTarget);
}
function ctxChangeType() {
  closeMenus();
  if (!ctxNodeTarget) return;
  const types = [
    "process",
    "decision",
    "start",
    "end",
    "insert",
    "update",
    "delete",
    "set",
    "select",
  ];
  const i = types.indexOf(ctxNodeTarget.type);
  ctxNodeTarget.type = types[(i + 1) % types.length];
  snap();
  draw();
}
function ctxDuplicate() {
  closeMenus();
  if (!ctxNodeTarget) return;
  nodes.push({
    ...ctxNodeTarget,
    id: nextId++,
    x: ctxNodeTarget.x + 30,
    y: ctxNodeTarget.y + 30,
  });
  snap();
  draw();
}
function ctxStartConnect() {
  closeMenus();
  if (!ctxNodeTarget) return;
  setTool("connect");
  connectSrc = ctxNodeTarget;
  draw();
}let editEl = null;

function ctxNodeLabel(n) {
  if (editEl) editEl.remove();
  const ta = document.createElement("textarea");
  ta.className = "inline-edit";
  ta.value = n.label;
  const r = nRect(n),
    s = toS(r.x, r.y);
  ta.style.left = s.x + "px";
  ta.style.top = s.y + "px";
  ta.style.width = r.w * camZ + 10 + "px";
  ta.style.minHeight = r.h * camZ + 6 + "px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  editEl = ta;

  function commit() {
    n.label = ta.value.trim() || n.label;
    ta.remove();
    editEl = null;
    snap();
    draw();
    updateProps();
  }
  ta.addEventListener("blur", commit);
  ta.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commit();
    }
    if (e.key === "Escape") {
      ta.remove();
      editEl = null;
    }
  });
}

function ctxArrowLabel() {
  closeMenus();
  if (!ctxArrowTarget) return;
  const a = ctxArrowTarget;
  const s = nodes.find((n) => n.id === a.src);
  const d = nodes.find((n) => n.id === a.dst);
  if (!s || !d) return;

  // Position the edit box at the arrow's label midpoint
  const sp = bestPort(s, d);
  const dp = bestPort(d, s);
  const mx = (sp.x + dp.x) / 2;
  const my = (sp.y + dp.y) / 2;
  const screen = toS(mx, my);

  if (editEl) editEl.remove();
  const ta = document.createElement("textarea");
  ta.className = "inline-edit";
  ta.value = a.label || "";
  ta.style.left = screen.x - 50 + "px";
  ta.style.top = screen.y - 16 + "px";
  ta.style.width = "100px";
  ta.style.minHeight = "32px";
  ta.style.textAlign = "center";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  editEl = ta;

  function commit() {
    a.label = ta.value.trim();
    ta.remove();
    editEl = null;
    snap();
    draw();
    updateProps();
  }
  ta.addEventListener("blur", commit);
  ta.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commit();
    }
    if (e.key === "Escape") {
      ta.remove();
      editEl = null;
    }
  });
}
function ctxArrowFlip() {
  closeMenus();
  if (!ctxArrowTarget) return;
  const t = ctxArrowTarget.src;
  ctxArrowTarget.src = ctxArrowTarget.dst;
  ctxArrowTarget.dst = t;
  snap();
  draw();
}
function ctxDeleteArrow() {
  closeMenus();
  if (!ctxArrowTarget) return;
  arrows = arrows.filter((a) => a.id !== ctxArrowTarget.id);
  ctxArrowTarget = null;
  selected = null;
  snap();
  draw();
  updateProps();
}

// ════════════════════════════════════════════════════════════════════════════
//  TOOL SWITCHING
// ════════════════════════════════════════════════════════════════════════════

function setTool(t) {
  tool = t;
  document.getElementById("toolSel").classList.toggle("on", t === "select");
  document.getElementById("toolCon").classList.toggle("on", t === "connect");
  if (t === "select") connectSrc = null;
  cv.style.cursor = t === "connect" ? "crosshair" : "default";
  draw();
}

function deleteSelected() {
  if (multiSelected.size > 0) {
    // Remove arrows connected to ANY selected node
    arrows = arrows.filter(
      (a) => !multiSelected.has(a.src) && !multiSelected.has(a.dst),
    );

    // Remove all selected nodes
    nodes = nodes.filter((n) => !multiSelected.has(n.id));

    // Clear selection
    multiSelected.clear();
    selected = null;
    closeMenus();
    snap();
    draw();
    updateProps();
    return;
  }

  // Single delete
  if (!selected) return;

  if (selected.type === "node") {
    nodes = nodes.filter((n) => n.id !== selected.id);
    arrows = arrows.filter(
      (a) => a.src !== selected.id && a.dst !== selected.id,
    );
  } else {
    arrows = arrows.filter((a) => a.id !== selected.id);
  }

  selected = null;
  closeMenus();
  snap();
  draw();
  updateProps();
}