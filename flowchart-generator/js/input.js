// ════════════════════════════════════════════════════════════════════════════
//  INPUT EVENTS
// ════════════════════════════════════════════════════════════════════════════

// ── Keyboard ─────────────────────────────────────────────────────────────────
window.addEventListener("keydown", (e) => {
  // Guard: don't intercept when typing in an input
  const typing = e.target.matches("input,textarea,select");

  if (e.code === "Space" && !typing) {
    spaceDown = true;
    cv.style.cursor = "grab";
  }
  if (
    (e.key === "Delete" || e.key === "Backspace" || e.key === "x") &&
    !typing
  ) {
    deleteSelected();
  }
  if (e.ctrlKey && e.key === "a" && !typing) {
    e.preventDefault();
    multiSelected = new Set(nodes.map((n) => n.id));
    selected = null;
    draw();
    updateProps();
  }
  if (e.ctrlKey && e.key === "z") {
    e.preventDefault();
    undo();
  }
  if (e.ctrlKey && (e.key === "y" || e.key === "Z")) {
    e.preventDefault();
    redo();
  }
  if (e.key === "Escape") {
    selected = null;
    multiSelected.clear();
    rubberBand = null;
    multiDragStart = null;
    connectSrc = null;
    if (tool === "connect") setTool("select");
    closeMenus();
    draw();
    updateProps();
  }
if (e.key === "c" && !typing) {
  const selNode = selected?.type === "node"
    ? nodes.find((n) => n.id === selected.id)
    : null;

  if (selNode && tool !== "connect") {
    connectSrc = selNode;
    tempMouse = { x: selNode.x, y: selNode.y };
    setTool("connect");
  } else {
    setTool(tool === "connect" ? "select" : "connect");
  }
}
  if (e.key === "g" && !typing) {
    showGrid = !showGrid;
    draw();
  }
  if (e.key === "e" && !typing) {
    exportJSON();
  }
  if (e.key === "i" && !typing) {
    importJSON();
  }
  if (e.key === "f" && !typing) {
    fitAll();
  }
});

window.addEventListener("keyup", (e) => {
  if (e.code === "Space") {
    spaceDown = false;
    cv.style.cursor = "default";
  }
});

// ── Context menu ──────────────────────────────────────────────────────────────
cv.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const w = toW(e.offsetX, e.offsetY);
  closeMenus();
  const n = hitNode(w.x, w.y);
  const a = !n && hitArrow(w.x, w.y);
  if (n) {
    ctxNodeTarget = n;
    selected = { type: "node", id: n.id };
    const delItem = document.getElementById("ctxDeleteItem");
    if (delItem) {
      const count = multiSelected.size;
      const label = count > 1 ? `Delete ${count} Nodes` : "Delete Node";
      delItem.lastChild.textContent = "  " + label;
    }
    showMenu("ctxNode", e.clientX, e.clientY);
  } else if (a) {
    ctxArrowTarget = a;
    selected = { type: "arrow", id: a.id };
    showMenu("ctxArrow", e.clientX, e.clientY);
  }
  updateProps();
  draw();
});

// ── Mouse down ────────────────────────────────────────────────────────────────
let didDrag = false;

cv.addEventListener("mousedown", (e) => {
  if (e.button === 2) return;
  closeMenus();
  didDrag = false;
  const w = toW(e.offsetX, e.offsetY);

  // Pan: middle button or space held
  if (e.button === 1 || spaceDown) {
    panning = true;
    panStart = { x: e.clientX, y: e.clientY };
    panCam = { x: camX, y: camY };
    cv.style.cursor = "grabbing";
    return;
  }

  // Connect tool
  if (tool === "connect") {
    const n = hitNode(w.x, w.y);
    if (n) {
      if (!connectSrc) {
        connectSrc = n;
        tempMouse = { x: n.x, y: n.y };
      } else if (n.id !== connectSrc.id) {
        addArrow(connectSrc.id, n.id, "");
        connectSrc = null;
        snap();
      }
      draw();
    } else {
      connectSrc = null;
      draw();
    }
    return;
  }

  const n = hitNode(w.x, w.y);

  // Node inside multi-selection → start group drag
  if (n && multiSelected.has(n.id)) {
    multiDragStart = {
      mx: w.x,
      my: w.y,
      origins: nodes
        .filter((nd) => multiSelected.has(nd.id))
        .map((nd) => ({ id: nd.id, x: nd.x, y: nd.y })),
    };
    return;
  }

  // Single node → select + drag
  if (n) {
    multiSelected.clear();
    selected = { type: "node", id: n.id };
    dragging = { id: n.id, ox: w.x - n.x, oy: w.y - n.y };
    updateProps();
    draw();
    return;
  }

  // Arrow
  const a = hitArrow(w.x, w.y);
  if (a) {
    multiSelected.clear();
    selected = { type: "arrow", id: a.id };
    updateProps();
    draw();
    return;
  }

  // Empty canvas → rubber-band
  multiSelected.clear();
  selected = null;
  rubberBand = { x0: w.x, y0: w.y, x1: w.x, y1: w.y };
  updateProps();
  draw();
});

// ── Mouse move ────────────────────────────────────────────────────────────────
cv.addEventListener("mousemove", (e) => {
  const w = toW(e.offsetX, e.offsetY);
  tempMouse = w;
  updateProps();

  if (panning) {
    camX = panCam.x + (e.clientX - panStart.x);
    camY = panCam.y + (e.clientY - panStart.y);
    draw();
    return;
  }

  if (multiDragStart) {
    didDrag = true;
    const dx = w.x - multiDragStart.mx,
      dy = w.y - multiDragStart.my;
    for (const o of multiDragStart.origins) {
      const nd = nodes.find((x) => x.id === o.id);
      if (nd) {
        nd.x = o.x + dx;
        nd.y = o.y + dy;
      }
    }
    draw();
    return;
  }

  if (dragging) {
    didDrag = true;
    const n = nodes.find((x) => x.id === dragging.id);
    if (n) {
      n.x = w.x - dragging.ox;
      n.y = w.y - dragging.oy;
    }
    draw();
    return;
  }

  if (rubberBand) {
    rubberBand.x1 = w.x;
    rubberBand.y1 = w.y;
    const rx0 = Math.min(rubberBand.x0, rubberBand.x1);
    const rx1 = Math.max(rubberBand.x0, rubberBand.x1);
    const ry0 = Math.min(rubberBand.y0, rubberBand.y1);
    const ry1 = Math.max(rubberBand.y0, rubberBand.y1);
    multiSelected.clear();
    for (const nd of nodes) {
      const r = nRect(nd);
      if (r.x + r.w > rx0 && r.x < rx1 && r.y + r.h > ry0 && r.y < ry1)
        multiSelected.add(nd.id);
    }
    draw();
    return;
  }

  if (tool === "connect" && connectSrc) {
    draw();
    return;
  }

  const n = hitNode(w.x, w.y);
  const a = !n && hitArrow(w.x, w.y);
  const inMulti = n && multiSelected.has(n.id);
  cv.style.cursor =
    inMulti || n ? "move" : a ? "pointer" : spaceDown ? "grab" : "default";
  updateProps();
});

// ── Mouse up ──────────────────────────────────────────────────────────────────
cv.addEventListener("mouseup", () => {
  if (multiDragStart && didDrag) snap();
  multiDragStart = null;
  if (dragging && didDrag) snap();
  dragging = null;
  rubberBand = null;
  if (panning) {
    panning = false;
    cv.style.cursor = "default";
  }
  draw();
});

// ── Double click (inline rename) ──────────────────────────────────────────────
cv.addEventListener("dblclick", (e) => {
  const w = toW(e.offsetX, e.offsetY);
  const n = hitNode(w.x, w.y);
  if (n) {
    ctxNodeLabel(n);
    return;
  }
  const a = hitArrow(w.x, w.y);
  if (a) {
    ctxArrowTarget = a;
    ctxArrowLabel();
  }
});

// ── Scroll to zoom ────────────────────────────────────────────────────────────
cv.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();

    if (multiSelected.size > 0) {
      const delta = e.deltaY > 0 ? -10 : 10;
      if (e.ctrlKey) {
        if (e.shiftKey) {
          GX = Math.max(40, Math.min(600, GX + delta));
        } else {
          GY = Math.max(20, Math.min(400, GY + delta));
        }
        redistributeSpacing();
      } else {
        if (e.shiftKey) {
          controlPosition(delta, 0);
        } else {
          controlPosition(0, delta);
        }
      }
      return;
    }

    // Normal scroll → zoom
    const f = e.deltaY > 0 ? 0.88 : 1.12;
    camX = e.offsetX - (e.offsetX - camX) * f;
    camY = e.offsetY - (e.offsetY - camY) * f;
    camZ = Math.max(0.15, Math.min(4, camZ * f));
    document.getElementById("zoomDisp").textContent =
      Math.round(camZ * 100) + "%";
    draw();
  },
  { passive: false },
);

document.addEventListener("click", (e) => {
  if (!e.target.closest(".ctx-menu")) closeMenus();
});
