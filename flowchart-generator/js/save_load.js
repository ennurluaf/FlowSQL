// ════════════════════════════════════════════════════════════════════════════
//  SAVE / LOAD
// ════════════════════════════════════════════════════════════════════════════

function savePNG() {
  if (!nodes.length) return;
  let mx = Infinity,
    my = Infinity,
    Mx = -Infinity,
    My = -Infinity;
  for (const n of nodes) {
    const r = nRect(n);
    mx = Math.min(mx, r.x);
    my = Math.min(my, r.y);
    Mx = Math.max(Mx, r.x + r.w);
    My = Math.max(My, r.y + r.h);
  }
  const pad = 60,
    W = (Mx - mx + pad * 2) * 2,
    H = (My - my + pad * 2) * 2;
  const oc = document.createElement("canvas");
  oc.width = W;
  oc.height = H;
  const ot = oc.getContext("2d");
  ot.scale(2, 2);
  ot.fillStyle = canvasBg;
  ot.fillRect(0, 0, W / 2, H / 2);
  ot.translate(pad - mx, pad - my);
  const origDesc = Object.getOwnPropertyDescriptor(window, "cx");
  Object.defineProperty(window, "cx", {
    value: ot,
    configurable: true,
    writable: true,
  });
  for (const a of arrows) drawArrow(a);
  for (const n of nodes) drawNode(n);
  if (origDesc) Object.defineProperty(window, "cx", origDesc);
  else delete window.cx;
  const a2 = document.createElement("a");
  a2.download = "flowchart.png";
  a2.href = oc.toDataURL();
  a2.click();
}

function saveSVG() {
  if (!nodes.length) return;
  let mx = Infinity,
    my = Infinity,
    Mx = -Infinity,
    My = -Infinity;
  for (const n of nodes) {
    const r = nRect(n);
    mx = Math.min(mx, r.x);
    my = Math.min(my, r.y);
    Mx = Math.max(Mx, r.x + r.w);
    My = Math.max(My, r.y + r.h);
  }
  const pad = 60,
    W = Mx - mx + pad * 2,
    H = My - my + pad * 2,
    ox = pad - mx,
    oy2 = pad - my;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="background:${canvasBg}">`;
  svg += `<defs><marker id="ah" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="${T.aw}"/></marker></defs>`;
  for (const a of arrows) {
    const s = nodes.find((n) => n.id === a.src),
      d = nodes.find((n) => n.id === a.dst);
    if (!s || !d) continue;
    const sp = bestPort(s, d),
      dp = bestPort(d, s);
    const col = a.label === "YES" ? T.ay : a.label === "NO" ? T.an : T.aw;
    const dy = dp.y - sp.y;
    svg += `<path d="M${sp.x + ox},${sp.y + oy2} C${sp.x + ox},${sp.y + oy2 + dy * 0.5} ${dp.x + ox},${dp.y + oy2 - dy * 0.5} ${dp.x + ox},${dp.y + oy2}" stroke="${col}" stroke-width="1.5" fill="none" marker-end="url(#ah)"/>`;
    if (a.label)
      svg += `<text x="${(sp.x + dp.x) / 2 + ox}" y="${(sp.y + dp.y) / 2 + oy2}" text-anchor="middle" dominant-baseline="middle" fill="${col}" font-size="11" font-family="monospace" font-weight="700">${a.label}</text>`;
  }
  for (const n of nodes) {
    const c = n.cc || nColors(n.type, null);
    if (n.type === "decision") {
      const px = n.x + ox,
        py = n.y + oy2;
      svg += `<polygon points="${px},${py - DH / 2} ${px + DW / 2},${py} ${px},${py + DH / 2} ${px - DW / 2},${py}" fill="${c.f}" stroke="${c.s}" stroke-width="1.5"/>`;
      svg += `<text x="${px}" y="${py}" text-anchor="middle" dominant-baseline="middle" fill="${c.s}" font-size="${FONT}" font-family="Syne,sans-serif" font-weight="600">${(n.label || "").replace(/\n/g, " ")}</text>`;
    } else {
      const r = nRect(n);
      const isT = n.type === "start" || n.type === "end";
      svg += `<rect x="${r.x + ox}" y="${r.y + oy2}" width="${r.w}" height="${r.h}" rx="${isT ? r.h / 2 : 6}" fill="${c.f}" stroke="${c.s}" stroke-width="1.5"/>`;
      svg += `<text x="${n.x + ox}" y="${n.y + oy2}" text-anchor="middle" dominant-baseline="middle" fill="${c.s}" font-size="${FONT}" font-family="Syne,sans-serif" font-weight="600">${(n.label || "").replace(/\n/g, " ")}</text>`;
    }
  }
  svg += "</svg>";
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const a = document.createElement("a");
  a.download = "flowchart.svg";
  a.href = URL.createObjectURL(blob);
  a.click();
}

function saveJSON() {
  const data = { version: 2, nodes, arrows, canvasBg };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.download = "flowchart.json";
  a.href = URL.createObjectURL(blob);
  a.click();
}

function triggerLoad() {
  document.getElementById("jsonFile").click();
}

function onLoadJSON(e) {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = (ev) => {
    try {
      const d = JSON.parse(ev.target.result);
      nodes = d.nodes || [];
      arrows = d.arrows || [];
      if (d.canvasBg) canvasBg = d.canvasBg;
      nextId =
        Math.max(...[...nodes, ...arrows].map((x) => x.id || 0), nextId) + 1;
      snap();
      fitAll();
    } catch (er) {
      alert("Invalid JSON: " + er.message);
    }
  };
  r.readAsText(f);
  e.target.value = "";
}