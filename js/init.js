// ── CANVAS ELEMENTS ──────────────────────────────────────────────────────────
const cv = document.getElementById("c");
const cx = cv.getContext("2d");

// ── APP STATE ────────────────────────────────────────────────────────────────
let nodes = [],
  arrows = [],
  nextId = 1;
let camX = 0,
  camY = 0,
  camZ = 1;
let tool = "select",
  selected = null;
let dragging = null,
  panning = false;
let panStart = { x: 0, y: 0 },
  panCam = { x: 0, y: 0 };
let connectSrc = null,
  tempMouse = { x: 0, y: 0 };
let showGrid = true;
let history = [],
  histIdx = -1;
let ctxNodeTarget = null,
  ctxArrowTarget = null;
let spaceDown = false;

// Multi-select
let multiSelected = new Set();
let rubberBand = null; // {x0,y0,x1,y1} world coords while selecting
let multiDragStart = null; // {mx,my, origins:[{id,x,y}]} while moving group

// ── THEMES ───────────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    nb: "#13151c",
    ns: "#2f3547",
    nt: "#dde2f0",
    db: "#160e2a",
    ds: "#7b5ea7",
    sb: "#0e1a2a",
    ss: "#5b7fff",
    ib: "#0d2219",
    is: "#3ecfb0",
    ub: "#1f1a09",
    us: "#ffa94d",
    xb: "#200f0f",
    xs: "#ff4f6a",
    eb: "#131a33",
    es: "#5b7fff",
    qb: "#0e1a2a",
    qs: "#5b7fff",
    aw: "#3a4258",
    ay: "#5b7fff",
    an: "#a06cf8",
    lb: "#13151c",
  },
  light: {
    nb: "#f5f6fa",
    ns: "#b0b8cc",
    nt: "#1a1d27",
    db: "#f0eaff",
    ds: "#8b5cf6",
    sb: "#eaf0ff",
    ss: "#3b6cf8",
    ib: "#e6faf5",
    is: "#059669",
    ub: "#fffbea",
    us: "#d97706",
    xb: "#fff1f2",
    xs: "#e11d48",
    eb: "#eef2ff",
    es: "#4f46e5",
    qb: "#eaf0ff",
    qs: "#3b6cf8",
    aw: "#94a3b8",
    ay: "#3b6cf8",
    an: "#8b5cf6",
    lb: "#f5f6fa",
  },
  mono: {
    nb: "#111",
    ns: "#555",
    nt: "#eee",
    db: "#111",
    ds: "#bbb",
    sb: "#111",
    ss: "#fff",
    ib: "#111",
    is: "#888",
    ub: "#111",
    us: "#888",
    xb: "#111",
    xs: "#888",
    eb: "#111",
    es: "#888",
    qb: "#111",
    qs: "#888",
    aw: "#555",
    ay: "#ddd",
    an: "#999",
    lb: "#111",
  },
  amber: {
    nb: "#1a1200",
    ns: "#5a3e00",
    nt: "#ffd97a",
    db: "#1a1200",
    ds: "#ffa94d",
    sb: "#1a1200",
    ss: "#ffcc44",
    ib: "#001a0e",
    is: "#44cc88",
    ub: "#1a1200",
    us: "#ffcc44",
    xb: "#1a0000",
    xs: "#ff6644",
    eb: "#001020",
    es: "#44aaff",
    qb: "#001020",
    qs: "#44aaff",
    aw: "#5a3e00",
    ay: "#ffa94d",
    an: "#ff6644",
    lb: "#1a1200",
  },
};
let T = THEMES.dark;

const BG_COLORS = [
  "#0b0d12",
  "#0d1117",
  "#f5f6fa",
  "#fff8f0",
  "#0a0f0a",
  "#1a0d20",
  "#0a1020",
  "#1a0a00",
];
let canvasBg = "#0b0d12";

// Node dimensions
const NW = 160,
  NH = 60,
  DW = 180,
  DH = 88,
  FONT = 13,
  LH = 17;

let GY = 90,
  GX = 240;