// ════════════════════════════════════════════════════════════════════════════
//  ZOOM / FIT
// ════════════════════════════════════════════════════════════════════════════

function zoomBy(d) {
  const cx2 = cv.width / 2,
    cy2 = cv.height / 2;
  const nz = Math.max(0.15, Math.min(4, camZ + d));
  camX = cx2 - ((cx2 - camX) * nz) / camZ;
  camY = cy2 - ((cy2 - camY) * nz) / camZ;
  camZ = nz;
  document.getElementById("zoomDisp").textContent =
    Math.round(camZ * 100) + "%";
  draw();
}

function fitAll() {
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
  const p = 60,
    W = cv.width,
    H = cv.height;
  const sz = Math.min(
    (W - p * 2) / (Mx - mx || 1),
    (H - p * 2) / (My - my || 1),
    1.5,
  );
  camZ = sz;
  camX = p - mx * sz + (W - p * 2 - (Mx - mx) * sz) / 2;
  camY = p - my * sz + (H - p * 2 - (My - my) * sz) / 2;
  document.getElementById("zoomDisp").textContent =
    Math.round(camZ * 100) + "%";
  draw();
}