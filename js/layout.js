// ════════════════════════════════════════════════════════════════════════════
//  LAYOUT ENGINE
// ════════════════════════════════════════════════════════════════════════════

function layoutAST(astNodes, startX, startY) {
  const rn = [],
    ra = [];
  let cy = startY;
  for (const n of astNodes) {
    if (n.type === "decision") {
      const id = nextId++;
      const dn = mkNode("decision", n.label, startX + NW / 2, cy + DH / 2);
      dn.id = id;
      rn.push(dn);
      cy += DH + GY;

      const yes = layoutAST(n.yes || [], startX, cy);
      const yb = mxY(yes.nodes);
      rn.push(...yes.nodes);
      ra.push(...yes.arrows);

      const noX = startX + NW + GX;
      const no = layoutAST(n.no || [], noX, cy - GY / 2);
      const nb2 = mxY(no.nodes);
      rn.push(...no.nodes);
      ra.push(...no.arrows);

      const my = Math.max(yb, nb2) + GY;
      const mid = nextId++;
      const mn = mkNode("process", "↓", startX + NW / 2, my);
      mn._m = true;
      mn.id = mid;

      const yf = yes.nodes.find((x) => !x._m);
      const nf = no.nodes.find((x) => !x._m);
      ra.push({ id: nextId++, src: id, dst: yf ? yf.id : mid, label: "YES" });
      if (nf) ra.push({ id: nextId++, src: id, dst: nf.id, label: "NO" });
      else ra.push({ id: nextId++, src: id, dst: mid, label: "NO" });

      const yl = [...yes.nodes]
        .filter((x) => !x._m)
        .sort((a, b) => b.y - a.y)[0];
      const nl = [...no.nodes]
        .filter((x) => !x._m)
        .sort((a, b) => b.y - a.y)[0];
      if (yl) ra.push({ id: nextId++, src: yl.id, dst: mid, label: "" });
      if (nl) ra.push({ id: nextId++, src: nl.id, dst: mid, label: "" });

      rn.push(mn);
      cy = my;
    } else {
      const h = nH(n);
      const nd = mkNode(n.type, n.label, startX + NW / 2, cy + h / 2);
      rn.push(nd);
      cy += h + GY;
    }
  }
  return { nodes: rn, arrows: ra, bottomY: cy };
}

function mxY(ns) {
  let m = 0;
  for (const n of ns) {
    if (n._m) m = Math.max(m, n.y);
    else m = Math.max(m, n.y + nH(n) / 2);
  }
  return m;
}

function chainArr(rn, ra) {
  const bx = {};
  for (const n of rn) {
    if (n._m) continue;
    const k = Math.round(n.x);
    if (!bx[k]) bx[k] = [];
    bx[k].push(n);
  }
  for (const col of Object.values(bx)) {
    col.sort((a, b) => a.y - b.y);
    for (let i = 0; i < col.length - 1; i++) {
      const a = col[i],
        b = col[i + 1];
      if (!ra.some((r) => r.src === a.id && r.dst === b.id) && b.y - a.y > 10)
        ra.push({ id: nextId++, src: a.id, dst: b.id, label: "" });
    }
  }
}

function cleanMerges(ns, as) {
  const mIds = new Set(ns.filter((n) => n._m).map((n) => n.id));
  const mMap = {};
  for (const m of ns.filter((n) => n._m)) {
    const out = as.find((a) => a.src === m.id && !mIds.has(a.dst));
    mMap[m.id] = out ? out.dst : null;
  }
  function res(id) {
    let c = id;
    const seen = new Set();
    while (mIds.has(c) && !seen.has(c)) {
      seen.add(c);
      c = mMap[c] || c;
      break;
    }
    return c;
  }
  const ca = as
    .filter((a) => !mIds.has(a.src))
    .map((a) => ({ ...a, dst: res(a.dst) }))
    .filter((a) => a.src !== a.dst);
  const seen2 = new Set();
  return {
    nodes: ns.filter((n) => !n._m),
    arrows: ca.filter((a) => {
      const k = `${a.src}-${a.dst}-${a.label}`;
      if (seen2.has(k)) return false;
      seen2.add(k);
      return true;
    }),
  };
}

function redistributeSpacing() {
  // Use multiSelected if anything is selected, otherwise all nodes
  const targetIds =
    multiSelected.size > 0 ? multiSelected : new Set(nodes.map((n) => n.id));

  const targets = nodes.filter((n) => targetIds.has(n.id));
  if (targets.length === 0) return;

  // Group targets into columns by rounded X
  const cols = {};
  for (const n of targets) {
    const key = Math.round(n.x);
    if (!cols[key]) cols[key] = [];
    cols[key].push(n);
  }

  // Redistribute Y within each column — anchor the topmost node, shift the rest
  for (const col of Object.values(cols)) {
    col.sort((a, b) => a.y - b.y);
    for (let i = 1; i < col.length; i++) {
      const prev = col[i - 1];
      const prevBottom = prev.y + nH(prev) / 2;
      col[i].y = prevBottom + GY + nH(col[i]) / 2;
    }
  }

  // Redistribute columns horizontally — anchor the leftmost column, shift the rest
  const colKeys = Object.keys(cols)
    .map(Number)
    .sort((a, b) => a - b);
  if (colKeys.length > 1) {
    const baseX = colKeys[0];
    for (let i = 1; i < colKeys.length; i++) {
      const oldX = colKeys[i];
      const newX = baseX + i * (NW + GX);
      const shift = newX - oldX;
      for (const n of cols[colKeys[i]]) {
        n.x += shift;
      }
    }
  }

  draw();
}

function controlPosition(deltaX, deltaY) {
  // Use multiSelected if anything is selected, otherwise all nodes
  const targetIds =
    multiSelected.size > 0 ? multiSelected : new Set(nodes.map((n) => n.id));

  const targets = nodes.filter((n) => targetIds.has(n.id));
  if (targets.length === 0) return;

  for (const n of targets) {
    n.x -= deltaX;
    n.y -= deltaY;
  }
  draw();
}