// ════════════════════════════════════════════════════════════════════════════
//  GENERATE FROM SQL
// ════════════════════════════════════════════════════════════════════════════

function generateFromSQL() {
  const sql = document.getElementById("sqlIn").value.trim();
  const err = document.getElementById("errBar");
  err.style.display = "none";
  if (!sql) {
    err.textContent = "Paste a procedure first.";
    err.style.display = "block";
    return;
  }
  try {
    const { procName, body } = parseSP(sql);
    const ast = parseBlock(body);
    const start = mkNode("start", procName, 120, 60);
    const { nodes: bn, arrows: ba } = layoutAST(ast, 40, 150);
    chainArr(bn, ba);
    const endY = mxY(bn) + GY;
    const end = mkNode("end", "RETURN", 120, endY + 40);
    const all = [start, ...bn, end];
    const aa = [...ba];
    const first = bn.find((n) => !n._m);
    if (first)
      aa.push({ id: nextId++, src: start.id, dst: first.id, label: "" });
    else aa.push({ id: nextId++, src: start.id, dst: end.id, label: "" });
    const last = [...bn].filter((n) => !n._m).sort((a, b) => b.y - a.y)[0];
    if (last) aa.push({ id: nextId++, src: last.id, dst: end.id, label: "" });
    const clean = cleanMerges(all, aa);
    nodes = clean.nodes;
    arrows = clean.arrows;
    snap();
    fitAll();
  } catch (e) {
    err.textContent = "Error: " + e.message;
    err.style.display = "block";
    console.error(e);
  }
}

function clearCanvas() {
  nodes = [];
  arrows = [];
  selected = null;
  multiSelected.clear();
  rubberBand = null;
  multiDragStart = null;
  snap();
  draw();
  updateProps();
}

function clearAll() {
  clearCanvas();
  const sqlIn = document.getElementById("sqlIn");
  if (sqlIn) sqlIn.value = "";
  const err = document.getElementById("errBar");
  if (err) err.style.display = "none";
}