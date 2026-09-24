// ════════════════════════════════════════════════════════════════════════════
//  COORDINATE TRANSFORMS
// ════════════════════════════════════════════════════════════════════════════

function toW(sx, sy) {
  return { x: (sx - camX) / camZ, y: (sy - camY) / camZ };
}
function toS(wx, wy) {
  return { x: wx * camZ + camX, y: wy * camZ + camY };
}

// ════════════════════════════════════════════════════════════════════════════
//  NODE GEOMETRY
// ════════════════════════════════════════════════════════════════════════════

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(p) {
    return new Point(this.x + p.x, this.y + p.y);
  }

  sub(p) {
    return new Point(this.x - p.x, this.y - p.y);
  }

  mul(s) {
    return new Point(this.x * s, this.y * s);
  } 

  midpoint(p) {
    return new Point((this.x + p.x) / 2, (this.y + p.y) / 2);
  }

  polar(r, theta) {
    return new Point(this.x + r * Math.cos(theta), this.y + r * Math.sin(theta));
  }
}

function nRect(n) {
  if (n.type === "decision")
    return { x: n.x - DW / 2, y: n.y - DH / 2, w: DW, h: DH };
  const lines = wrap(n.label, NW - 20, FONT);
  const h = Math.max(NH, lines.length * LH + 28);
  return { x: n.x - NW / 2, y: n.y - h / 2, w: NW, h };
}

function nH(n) {
  if (n.type === "decision") return DH;
  const l = wrap(n.label, NW - 20, FONT);
  return Math.max(NH, l.length * LH + 28);
}

function ports(n) {
  const r = nRect(n);
  return [
    { id: "t", x: n.x, y: r.y },
    { id: "b", x: n.x, y: r.y + r.h },
    { id: "l", x: r.x, y: n.y },
    { id: "r", x: r.x + r.w, y: n.y },
  ];
}

function bestPort(from, to) {
  const ps = ports(from);
  let b = ps[0],
    bd = Infinity;
  for (const p of ps) {
    const d = Math.hypot(p.x - to.x, p.y - to.y);
    if (d < bd) {
      bd = d;
      b = p;
    }
  }
  return b;
}

function hitNode(wx, wy) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (n.type === "decision") {
      if (Math.abs(wx - n.x) / (DW / 2) + Math.abs(wy - n.y) / (DH / 2) <= 1.05)
        return n;
    } else {
      const r = nRect(n);
      if (wx >= r.x && wx <= r.x + r.w && wy >= r.y && wy <= r.y + r.h)
        return n;
    }
  }
  return null;
}

function hitArrow(wx, wy) {
  for (let i = arrows.length - 1; i >= 0; i--) {
    const a = arrows[i];
    const s = nodes.find((n) => n.id === a.src);
    const d = nodes.find((n) => n.id === a.dst);
    if (!s || !d) continue;
    const sp = bestPort(s, d),
      dp = bestPort(d, s);
    if (ptSegDist(wx, wy, sp.x, sp.y, dp.x, dp.y) < 8 / camZ) return a;
  }
  return null;
}

function ptSegDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax,
    dy = by - ay,
    l2 = dx * dx + dy * dy;
  if (!l2) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}