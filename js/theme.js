// ════════════════════════════════════════════════════════════════════════════
//  THEME TOGGLE (light / dark)
// ════════════════════════════════════════════════════════════════════════════

function initThemeToggle() {
  const root = document.documentElement;
  const btn = document.getElementById("themeToggle");
  const icon = document.getElementById("themeIcon");

  // Sun SVG path (shown in dark mode → click to go light)
  const sunPaths = `
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1"  x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1"  y1="12" x2="3"  y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;

  // Moon SVG path (shown in light mode → click to go dark)
  const moonPaths = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;

  function applyTheme(isLight) {
    if (isLight) {
      root.classList.add("light");
      icon.innerHTML = moonPaths;
      btn.title = "Switch to dark mode";
    } else {
      root.classList.remove("light");
      icon.innerHTML = sunPaths;
      btn.title = "Switch to light mode";
    }
    // Sync canvas theme colour with UI theme
    if (isLight && canvasBg === "#0b0d12") {
      canvasBg = "#f5f6fa";
    }
    if (!isLight && canvasBg === "#f5f6fa") {
      canvasBg = "#0b0d12";
    }
    // Update swatch selection if visible
    document.querySelectorAll(".cc-swatch").forEach((sw) => {
      sw.classList.toggle(
        "sel",
        sw.style.background === canvasBg ||
          sw.style.backgroundColor === canvasBg,
      );
    });
    draw();
  }

  // Restore saved preference
  const saved = localStorage.getItem("flowsql-theme");
  applyTheme(saved === "light");

  btn.addEventListener("click", () => {
    const isLight = !root.classList.contains("light");
    localStorage.setItem("flowsql-theme", isLight ? "light" : "dark");
    applyTheme(isLight);
  });
}