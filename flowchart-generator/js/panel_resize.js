// ════════════════════════════════════════════════════════════════════════════
//  PANEL RESIZE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Horizontal resize – drag the handle between the side panel and the canvas.
 * Updates the CSS custom property --panel-w on :root.
 */
function initHorizontalResize() {
  const handle = document.getElementById("hresizeHandle");
  const panel = document.getElementById("panel");
  let draggingH = false,
    startX = 0,
    startW = 0;

  handle.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    draggingH = true;
    startX = e.clientX;
    startW = panel.getBoundingClientRect().width;
    handle.classList.add("dragging");
    document.body.classList.add("resizing-h");
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!draggingH) return;
    const delta = e.clientX - startX;
    const newW = Math.max(180, Math.min(600, startW + delta));
    document.documentElement.style.setProperty("--panel-w", newW + "px");
    panel.style.width = newW + "px";
    resize(); // re-size canvas after panel width changes
  });

  window.addEventListener("mouseup", () => {
    if (!draggingH) return;
    draggingH = false;
    handle.classList.remove("dragging");
    document.body.classList.remove("resizing-h");
  });
}

/**
 * Vertical resize – drag the handle between two .vsec sections.
 * Adjusts their pixel heights so the panel height stays constant.
 */
function initVerticalResizes() {
  document.querySelectorAll(".vresize-handle").forEach((handle) => {
    let draggingV = false,
      startY = 0,
      prevH = 0,
      nextH = 0;
    let prevSec = null,
      nextSec = null;

    handle.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      const prevId = handle.dataset.prev;
      const nextId = handle.dataset.next;
      prevSec = document.getElementById(prevId);
      nextSec = document.getElementById(nextId);
      if (!prevSec || !nextSec) return;

      draggingV = true;
      startY = e.clientY;
      prevH = prevSec.getBoundingClientRect().height;
      nextH = nextSec.getBoundingClientRect().height;

      handle.classList.add("dragging");
      document.body.classList.add("resizing-v");
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!draggingV) return;
      const delta = e.clientY - startY;
      const minH = 40; // minimum section height in px
      const newPrev = Math.max(minH, prevH + delta);
      const newNext = Math.max(minH, nextH - delta);
      prevSec.style.height = newPrev + "px";
      prevSec.style.flexShrink = "0";
      nextSec.style.height = newNext + "px";
      nextSec.style.flexShrink = "0";
    });

    window.addEventListener("mouseup", () => {
      if (!draggingV) return;
      draggingV = false;
      handle.classList.remove("dragging");
      document.body.classList.remove("resizing-v");
      prevSec = null;
      nextSec = null;
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════
//  CANVAS RESIZE
// ════════════════════════════════════════════════════════════════════════════

function resize() {
  const wrap = document.getElementById("canvasWrap");
  cv.width = wrap.clientWidth;
  cv.height = wrap.clientHeight;
  draw();
}
window.addEventListener("resize", resize);