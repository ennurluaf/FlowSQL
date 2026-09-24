// ════════════════════════════════════════════════════════════════════════════
//  PROPERTIES PANEL
// ════════════════════════════════════════════════════════════════════════════

const FILLS = [
  "#13151c",
  "#160e2a",
  "#0d2219",
  "#1f1a09",
  "#200f0f",
  "#131a33",
  "#1a0f00",
  "#0e1a2a",
  "#2a1a2a",
  "#1a2a1a",
  "#f5f6fa",
  "#fff8f0",
];
const STROKES = [
  "#5b7fff",
  "#a06cf8",
  "#3ecfb0",
  "#ffa94d",
  "#ff4f6a",
  "#f8c74f",
  "#ff7eb3",
  "#44ddff",
  "#aaffaa",
  "#ff9955",
  "#fff",
  "#94a3b8",
];

function updateProps() {
  const panel = document.getElementById("propPanel");
  const info = document.getElementById("selInfo");

  // Multi-select summary
  if (multiSelected.size > 0) {
    info.textContent = multiSelected.size + " nodes selected";
    panel.innerHTML = `
      <div class="sec-label" style="margin-bottom:12px">${multiSelected.size} nodes selected</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="font-size:11px;color:var(--text3)">Drag any highlighted node to move the whole group.</div>
        <button class="btn btn-danger" onclick="deleteSelected()">Delete All Selected</button>
      </div>`;
    return;
  }

  // Nothing selected
  if (!selected) {
    panel.innerHTML = `
      <div class="no-sel">
        <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path d="M15 3h6v6M14 10l7-7M9 21H3v-6M10 14l-7 7"/>
        </svg>
        Select a node or arrow<br>to edit its properties
      </div>`;
    info.textContent = "No selection";
    return;
  }

  // Node selected
  if (selected.type === "node") {
    const n = nodes.find((x) => x.id === selected.id);
    if (!n) return;
    info.textContent = "Node: " + n.type;
    const c = n.cc || nColors(n.type, null);
    const nodeTypes = ["process", "decision", "start", "end", "insert", "update", "delete", "set", "select"];
    function createOptions(t) {
      const selectedIf = (t) => (n.type === t ? " selected" : "");
      return `<option value="${t}"${selectedIf(t)}>${t}</option>`;
    }
    const selectEl = nodeTypes.map(createOptions).join("");
    panel.innerHTML = `
      <div class="prop-row">
        <div class="prop-label">Label</div>
        <textarea class="prop-in" id="pl" rows="3">${n.label || ""}</textarea>
      </div>
      <div class="prop-row">
        <div class="prop-label">Type</div>
        <select class="prop-in" id="pt">
          ${selectEl}
        </select>
      </div>
      <div class="prop-row">
        <div class="prop-label">Fill</div>
        <div class="color-grid" id="fillG"></div>
      </div>
      <div class="prop-row">
        <div class="prop-label">Border</div>
        <div class="color-grid" id="strokeG"></div>
      </div>
      <div style="margin-top:8px;display:flex;flex-direction:column;gap:5px">
        <button class="btn btn-ghost"  onclick="resetColor()">Reset Color</button>
        <button class="btn btn-danger" onclick="deleteSelected()">Delete Node</button>
      </div>`;

    const fg = document.getElementById("fillG");
    FILLS.forEach((col) => {
      const sw = document.createElement("div");
      sw.className = "color-swatch" + (c.f === col ? " sel" : "");
      sw.style.background = col;
      sw.onclick = () => {
        n.cc = { ...(n.cc || c), f: col };
        snap();
        draw();
        updateProps();
      };
      fg.appendChild(sw);
    });

    const sg = document.getElementById("strokeG");
    STROKES.forEach((col) => {
      const sw = document.createElement("div");
      sw.className = "color-swatch" + (c.s === col ? " sel" : "");
      sw.style.background = col;
      sw.onclick = () => {
        n.cc = { ...(n.cc || c), s: col };
        snap();
        draw();
        updateProps();
      };
      sg.appendChild(sw);
    });

    document.getElementById("pl").oninput = (e) => {
      n.label = e.target.value;
      draw();
    };
    document.getElementById("pl").onblur = () => snap();
    document.getElementById("pt").onchange = (e) => {
      n.type = e.target.value;
      snap();
      draw();
    };

    // Arrow selected
  } else {
    const a = arrows.find((x) => x.id === selected.id);
    if (!a) return;
    const s = nodes.find((n) => n.id === a.src);
    const d = nodes.find((n) => n.id === a.dst);
    info.textContent = "Arrow: " + (s?.type || "?") + " → " + (d?.type || "?");

    panel.innerHTML = `
      <div class="prop-row">
        <div class="prop-label">Label</div>
        <input class="prop-in" id="al" value="${a.label || ""}">
      </div>
      <div class="prop-row">
        <div class="prop-label">Quick Labels</div>
        <div class="row" style="flex-wrap:wrap;gap:5px">
          ${["YES", "NO", "", "ERROR", "OK"]
            .map(
              (l) => `<button class="btn btn-ghost"
              style="flex:none;padding:4px 9px;font-size:11px"
              onclick="setAL('${l}')">${l || "(none)"}</button>`,
            )
            .join("")}
        </div>
      </div>
      <div style="margin-top:8px;display:flex;flex-direction:column;gap:5px">
        <button class="btn btn-ghost"  onclick="flipSelectedArrow()">Flip Direction</button>
        <button class="btn btn-danger" onclick="deleteSelected()">Delete Arrow</button>
      </div>`;

    document.getElementById("al").oninput = (e) => {
      a.label = e.target.value;
      draw();
    };
    document.getElementById("al").onblur = () => snap();
  }
}

function setAL(l) {
  if (!selected || selected.type !== "arrow") return;
  const a = arrows.find((x) => x.id === selected.id);
  if (!a) return;
  a.label = l;
  const el = document.getElementById("al");
  if (el) el.value = l;
  snap();
  draw();
}

function resetColor() {
  if (!selected || selected.type !== "node") return;
  const n = nodes.find((x) => x.id === selected.id);
  if (n) {
    delete n.cc;
    snap();
    draw();
    updateProps();
  }
}

function flipSelectedArrow() {
  if (!selected || selected.type !== "arrow") return;
  ctxArrowTarget = arrows.find((x) => x.id === selected.id);
  ctxArrowFlip();
  ctxArrowTarget = null;
}

// ════════════════════════════════════════════════════════════════════════════
//  NODE FACTORY
// ════════════════════════════════════════════════════════════════════════════

function addArrow(src, dst, label) {
  arrows.push({ id: nextId++, src, dst, label: label || "" });
}

function mkNode(type, label, x, y) {
  return { id: nextId++, type, label, x, y };
}

function addNodeManual() {
  const t = document.getElementById("addNodeType").value;
  const wx = (cv.width / 2 - camX) / camZ;
  const wy = (cv.height / 2 - camY) / camZ;
  nodes.push(mkNode(t, t.toUpperCase(), wx, wy));
  snap();
  draw();
}

// ════════════════════════════════════════════════════════════════════════════
//  EXAMPLE SQL
// ════════════════════════════════════════════════════════════════════════════

function loadExample() {
  document.getElementById("sqlIn").value = `CREATE PROCEDURE sp_loginUser (
    IN  in_username     VARCHAR(50),
    IN  in_passwordHash VARCHAR(255),
    OUT out_userId      INT,
    OUT out_result      VARCHAR(30)
)
BEGIN
    DECLARE v_storedHash VARCHAR(255);
    DECLARE v_isLocked   BOOLEAN;
    DECLARE v_userId     INT;
    SELECT pk_user, passwordHash, isLocked
    INTO   v_userId, v_storedHash, v_isLocked
    FROM   User WHERE username = in_username LIMIT 1;
    IF v_userId IS NULL THEN
        INSERT INTO LoginAttempt (fk_user_attempts, username, success)
        VALUES (NULL, in_username, FALSE);
        SET out_result = 'NOT_FOUND';
        SET out_userId = NULL;
    ELSEIF v_isLocked THEN
        INSERT INTO LoginAttempt (fk_user_attempts, username, success)
        VALUES (v_userId, in_username, FALSE);
        SET out_result = 'LOCKED';
        SET out_userId = NULL;
    ELSE
        IF v_storedHash = in_passwordHash THEN
            UPDATE User SET failedAttempts = 0 WHERE pk_user = v_userId;
            INSERT INTO LoginAttempt (fk_user_attempts, username, success)
            VALUES (v_userId, in_username, TRUE);
            SET out_result = 'SUCCESS';
            SET out_userId = v_userId;
        ELSE
            INSERT INTO LoginAttempt (fk_user_attempts, username, success)
            VALUES (v_userId, in_username, FALSE);
            SET out_result = 'INVALID_CREDENTIALS';
            SET out_userId = NULL;
        END IF;
    END IF;
END`;
}