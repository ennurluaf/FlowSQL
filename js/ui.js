// ════════════════════════════════════════════════════════════════════════════
//  THEME / UI INIT
// ════════════════════════════════════════════════════════════════════════════

function initUI() {
  // Theme chips
  const tr = document.getElementById("themeRow");
  for (const [k, v] of Object.entries(THEMES)) {
    const b = document.createElement("button");
    b.className = "theme-chip" + (v === T ? " on" : "");
    b.textContent = k;
    b.onclick = () => {
      T = v;
      document
        .querySelectorAll(".theme-chip")
        .forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      draw();
    };
    tr.appendChild(b);
  }

  // Canvas background swatches
  const cg = document.getElementById("ccGrid");
  for (const bg of BG_COLORS) {
    const sw = document.createElement("div");
    sw.className = "cc-swatch" + (bg === canvasBg ? " sel" : "");
    sw.style.background = bg;
    sw.style.border =
      bg === "#f5f6fa" || bg === "#fff8f0"
        ? "2px solid #aaa"
        : "2px solid transparent";
    sw.onclick = () => {
      canvasBg = bg;
      document
        .querySelectorAll(".cc-swatch")
        .forEach((x) => x.classList.remove("sel"));
      sw.classList.add("sel");
      draw();
    };
    cg.appendChild(sw);
  }
}

function toggleGrid() {
  showGrid = !showGrid;
  document.getElementById("gridBtn").textContent =
    "Grid: " + (showGrid ? "ON" : "OFF");
  draw();
}

function showTab(name, btn) {
  document
    .querySelectorAll(".panel-body")
    .forEach((p) => p.classList.remove("on"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("on"));
  document.getElementById("tab-" + name).classList.add("on");
  btn.classList.add("on");
}