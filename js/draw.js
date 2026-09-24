// ════════════════════════════════════════════════════════════════════════════
//  DRAWING
// ════════════════════════════════════════════════════════════════════════════

function wrap(text, maxW, fs) {
  const cw = fs * 0.58,
    maxC = Math.floor(maxW / cw),
    lines = [];
  for (const raw of (text || "").split("\n")) {
    if (raw.length <= maxC) {
      lines.push(raw);
      continue;
    }
    let ln = "";
    for (const w of raw.split(" ")) {
      if (!ln) {
        ln = w;
        continue;
      }
      if ((ln + " " + w).length <= maxC) ln += " " + w;
      else {
        lines.push(ln);
        ln = w;
      }
    }
    if (ln) lines.push(ln);
  }
  return lines.length ? lines : [""];
}

function nColors(type, custom) {
  if (custom) return custom;
  const m = {
    start: { f: T.sb, s: T.ss },
    end: { f: T.sb, s: T.ss },
    process: { f: T.nb, s: T.ns },
    decision: { f: T.db, s: T.ds },
    insert: { f: T.ib, s: T.is },
    update: { f: T.ub, s: T.us },
    delete: { f: T.xb, s: T.xs },
    set: { f: T.eb, s: T.es },
    select: { f: T.qb, s: T.qs },
  };
  return m[type] || m.process;
}

function draw() {
  cx.clearRect(0, 0, cv.width, cv.height);
  cx.fillStyle = canvasBg;
  cx.fillRect(0, 0, cv.width, cv.height);
  if (showGrid) drawGrid();

  cx.save();
  cx.translate(camX, camY);
  cx.scale(camZ, camZ);

  for (const a of arrows) drawArrow(a);

  // Temp arrow while connecting
  if (connectSrc) {
    const sp = bestPort(connectSrc, tempMouse);
    cx.beginPath();
    cx.moveTo(sp.x, sp.y);
    cx.lineTo(tempMouse.x, tempMouse.y);
    cx.strokeStyle = T.ay;
    cx.lineWidth = 1.5 / camZ;
    cx.setLineDash([6 / camZ, 4 / camZ]);
    cx.stroke();
    cx.setLineDash([]);
  }

  for (const n of nodes) drawNode(n);

  // Multi-select halos
  if (multiSelected.size > 0) {
    cx.strokeStyle = "rgba(91,127,255,0.7)";
    cx.lineWidth = 2 / camZ;
    cx.setLineDash([6 / camZ, 3 / camZ]);
    for (const id of multiSelected) {
      const n = nodes.find((x) => x.id === id);
      if (!n) continue;
      if (n.type === "decision") {
        cx.beginPath();
        cx.moveTo(n.x, n.y - DH / 2 - 5);
        cx.lineTo(n.x + DW / 2 + 5, n.y);
        cx.lineTo(n.x, n.y + DH / 2 + 5);
        cx.lineTo(n.x - DW / 2 - 5, n.y);
        cx.closePath();
        cx.stroke();
      } else {
        const r = nRect(n);
        cx.beginPath();
        cx.roundRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8, 8);
        cx.stroke();
      }
    }
    cx.setLineDash([]);

    // Group bounding box
    let gx0 = Infinity,
      gy0 = Infinity,
      gx1 = -Infinity,
      gy1 = -Infinity;
    for (const id of multiSelected) {
      const n = nodes.find((x) => x.id === id);
      if (!n) continue;
      const r = nRect(n);
      gx0 = Math.min(gx0, r.x);
      gy0 = Math.min(gy0, r.y);
      gx1 = Math.max(gx1, r.x + r.w);
      gy1 = Math.max(gy1, r.y + r.h);
    }
    cx.strokeStyle = "rgba(91,127,255,0.3)";
    cx.lineWidth = 1 / camZ;
    cx.setLineDash([8 / camZ, 4 / camZ]);
    cx.beginPath();
    cx.roundRect(gx0 - 12, gy0 - 12, gx1 - gx0 + 24, gy1 - gy0 + 24, 10);
    cx.stroke();
    cx.setLineDash([]);

    // Count badge
    const bx = (gx0 + gx1) / 2,
      by = gy0 - 20;
    cx.font = `700 11px 'Syne',sans-serif`;
    const lbl = multiSelected.size + " selected";
    const tw = cx.measureText(lbl).width;
    cx.fillStyle = "rgba(91,127,255,0.85)";
    cx.beginPath();
    cx.roundRect(bx - tw / 2 - 6, by - 8, tw + 12, 16, 8);
    cx.fill();
    cx.fillStyle = "#fff";
    cx.textAlign = "center";
    cx.textBaseline = "middle";
    cx.fillText(lbl, bx, by);
  }

  if (tool === "connect") for (const n of nodes) drawPorts(n);

  // Rubber-band rectangle
  if (rubberBand) {
    const rx0 = Math.min(rubberBand.x0, rubberBand.x1);
    const rx1 = Math.max(rubberBand.x0, rubberBand.x1);
    const ry0 = Math.min(rubberBand.y0, rubberBand.y1);
    const ry1 = Math.max(rubberBand.y0, rubberBand.y1);
    cx.fillStyle = "rgba(91,127,255,0.07)";
    cx.beginPath();
    cx.roundRect(rx0, ry0, rx1 - rx0, ry1 - ry0, 4);
    cx.fill();
    cx.strokeStyle = "rgba(91,127,255,0.6)";
    cx.lineWidth = 1.5 / camZ;
    cx.setLineDash([5 / camZ, 3 / camZ]);
    cx.beginPath();
    cx.roundRect(rx0, ry0, rx1 - rx0, ry1 - ry0, 4);
    cx.stroke();
    cx.setLineDash([]);
  }

  cx.restore();
}

function drawGrid() {
  const step = 40 * camZ;
  const light = canvasBg === "#f5f6fa" || canvasBg === "#fff8f0";
  cx.strokeStyle = light ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.4)";
  cx.lineWidth = 0.5;
  cx.beginPath();
  for (let x = 0; x < cv.width; x += step) {
    cx.moveTo(x, 0);
    cx.lineTo(x, cv.height);
  }
  for (let y = 0; y < cv.height; y += step) {
    cx.moveTo(0, y);
    cx.lineTo(cv.width, y);
  }
  cx.stroke();
}

function drawNode(n) {
  const sel = selected?.type === "node" && selected.id === n.id;
  const c = nColors(n.type, n.cc);

  if (n.type === "decision") {
    if (sel) {
      cx.shadowColor = "#5b7fff";
      cx.shadowBlur = 18 * camZ;
    }
    cx.beginPath();
    cx.moveTo(n.x, n.y - DH / 2);
    cx.lineTo(n.x + DW / 2, n.y);
    cx.lineTo(n.x, n.y + DH / 2);
    cx.lineTo(n.x - DW / 2, n.y);
    cx.closePath();
    cx.fillStyle = c.f;
    cx.fill();
    cx.strokeStyle = sel ? "#fff" : c.s;
    cx.lineWidth = (sel ? 2.5 : 1.5) / camZ;
    cx.stroke();
    cx.shadowBlur = 0;
    drawTextBox(n.label, n.x, n.y, DW - 44, c.s);
  } else {
    const r = nRect(n);
    const isT = n.type === "start" || n.type === "end";
    const rx = isT ? r.h / 2 : 6;
    if (sel) {
      cx.shadowColor = "#5b7fff";
      cx.shadowBlur = 18 * camZ;
    }
    cx.beginPath();
    cx.roundRect(r.x, r.y, r.w, r.h, rx);
    cx.fillStyle = c.f;
    cx.fill();
    cx.strokeStyle = sel ? "#fff" : c.s;
    cx.lineWidth = (sel ? 2.5 : 1.5) / camZ;
    cx.stroke();
    cx.shadowBlur = 0;
    if (!isT) {
      cx.fillStyle = c.s;
      cx.globalAlpha = 0.75;
      cx.beginPath();
      cx.roundRect(r.x, r.y + 6, 3, r.h - 12, 1.5);
      cx.fill();
      cx.globalAlpha = 1;
    }
    drawTextBox(n.label, n.x, n.y, NW - 24, c.s);
  }
}

function drawTextBox(label, x, y, maxW, accent) {
  const lines = wrap(label, maxW, FONT);
  const total = lines.length * LH;
  const sy = y - total / 2 + LH * 0.5;
  cx.font = `600 ${FONT}px 'Syne',sans-serif`;
  cx.textAlign = "center";
  cx.textBaseline = "middle";
  for (let i = 0; i < lines.length; i++) {
    cx.fillStyle = i === 0 ? accent : T.nt;
    cx.fillText(lines[i], x, sy + i * LH);
  }
}

function drawPorts(n) {
  for (const p of ports(n)) {
    const r = 6 / camZ;
    cx.beginPath();
    cx.arc(p.x, p.y, r, 0, Math.PI * 2);
    cx.fillStyle = "#5b7fff";
    cx.fill();
    cx.strokeStyle = "#fff";
    cx.lineWidth = 1.5 / camZ;
    cx.stroke();
  }
}

cx.bezierCurve = (p0, p1, p2, p3) => {
  cx.moveTo(p0.x, p0.y);
  cx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
}

function transformToArrow(p, prev) {
  const ah = 9 / camZ, aa = 0.38; // size and angle of the arrowhead
  const angle = Math.atan2(p.y - prev.y, p.x - prev.x);
  const a1 = angle - aa, a2 = angle + aa;
  return {
    x: p.x,
    y: p.y,
    p1: { x: p.x - ah * Math.cos(a1), y: p.y - ah * Math.sin(a1) },
    p2: { x: p.x - ah * Math.cos(a2), y: p.y - ah * Math.sin(a2) },
  };
}

function drawArrow(a) {
  const s = nodes.find((n) => n.id === a.src);
  const d = nodes.find((n) => n.id === a.dst);
  if (!s || !d) return;
  const sp = bestPort(s, d);
  const dp = bestPort(d, s);
  const sel = selected?.type === "arrow" && selected.id === a.id;
  const col = a.label === "YES" ? T.ay : a.label === "NO" ? T.an : T.aw;
  const dx = dp.x - sp.x;
  const dy = dp.y - sp.y;
  const lx = (sp.x + dp.x) / 2,
    ly = (sp.y + dp.y) / 2;

  if (Math.abs(dx) > Math.abs(dy)) {
    // SIDE BY SIDE → horizontal curve
    const mx = sp.x + dx * 0.5;
    p1 = { x: mx, y: sp.y };
    p2 = { x: mx, y: dp.y };
  } else {
    // ABOVE/BELLOW → vertical curve
    const my = sp.y + dy * 0.5;
    p1 = { x: sp.x, y: my };
    p2 = { x: dp.x, y: my };
  }

  const arrow = transformToArrow(dp, p2);

  cx.beginPath();
  cx.bezierCurve(sp, p1, p2, arrow);
  cx.strokeStyle = sel ? "#fff" : col;
  cx.fillStyle = sel ? "#fff" : col;
  cx.lineWidth = (sel ? 2.5 : 1.5) / camZ;
  cx.stroke();
  cx.beginPath();
  cx.moveTo(arrow.x, arrow.y);
  cx.lineTo(arrow.p1.x, arrow.p1.y);
  cx.lineTo(arrow.p2.x, arrow.p2.y);
  cx.closePath();
  cx.fill();

  // Label
  if (a.label) {
    const fs = 11;
    cx.font = `700 ${fs}px 'IBM Plex Mono',monospace`;
    const tw = cx.measureText(a.label).width;
    const pad = 4 / camZ;
    cx.fillStyle = T.lb;
    cx.strokeStyle = col;
    cx.globalAlpha = 0.88;
    cx.beginPath();
    cx.roundRect(
      lx - tw / 2 - pad,
      ly - fs / 2 - pad,
      tw + pad * 2,
      fs + pad * 2,
      3 / camZ,
    );
    cx.fill();
    cx.stroke();
    cx.globalAlpha = 1;
    cx.fillStyle = col;
    cx.textAlign = "center";
    cx.textBaseline = "middle";
    cx.fillText(a.label, lx, ly);
  }

  // Selection midpoint dot
  if (sel) {
    cx.beginPath();
    cx.arc(lx, ly, 5 / camZ, 0, Math.PI * 2);
    cx.fillStyle = "#fff";
    cx.fill();
  }
}