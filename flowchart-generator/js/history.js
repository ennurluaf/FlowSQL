// ════════════════════════════════════════════════════════════════════════════
//  HISTORY (undo / redo)
// ════════════════════════════════════════════════════════════════════════════

function snap() {
  const s = JSON.stringify({ nodes, arrows });
  if (histIdx < history.length - 1) history = history.slice(0, histIdx + 1);
  history.push(s);
  if (history.length > 80) history.shift();
  histIdx = history.length - 1;
}

function undo() {
  if (histIdx <= 0) return;
  histIdx--;
  const s = JSON.parse(history[histIdx]);
  nodes = s.nodes;
  arrows = s.arrows;
  selected = null;
  draw();
  updateProps();
}

function redo() {
  if (histIdx >= history.length - 1) return;
  histIdx++;
  const s = JSON.parse(history[histIdx]);
  nodes = s.nodes;
  arrows = s.arrows;
  selected = null;
  draw();
  updateProps();
}