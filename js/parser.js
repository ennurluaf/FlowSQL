// ════════════════════════════════════════════════════════════════════════════
//  SQL PARSER
// ════════════════════════════════════════════════════════════════════════════

function parseSP(sql) {
  const nm = sql.match(
    /CREATE\s+(?:DEFINER\s*=\s*\S+\s+)?PROCEDURE\s+`?(\w+)`?/i,
  );
  const procName = nm ? nm[1] : "procedure";
  const pm = sql.match(
    /`?\w+`?\s*\(([\s\S]*?)\)\s*(?:BEGIN|COMMENT|READS|MODIFIES|DETERMINISTIC|NOT\s+DETERMINISTIC|LANGUAGE)/i,
  );
  const params = [];
  if (pm) {
    for (const p of splitP(pm[1])) {
      const m = p.trim().match(/(IN|OUT|INOUT)\s+`?(\w+)`?\s+(.+)/i);
      if (m)
        params.push({
          dir: m[1].toUpperCase(),
          name: m[2],
          type: m[3].trim().replace(/,\s*$/, ""),
        });
    }
  }
  const bm = sql.match(
    /BEGIN\s*([\s\S]*?)\s*(?:END\$\$|END\/\/|END;|END\s*$)/im,
  );
  return { procName, params, body: bm ? bm[1] : sql };
}

function splitP(s) {
  const parts = [];
  let depth = 0,
    cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

function parseBlock(sql) {
  const ast = [];
  let i = 0;
  const s = sql.trim();
  while (i < s.length) {
    const rest = s.slice(i);
    const tr = rest.trimStart();
    i += rest.length - tr.length;
    if (!tr) break;
    if (/^IF\b/i.test(tr)) {
      const r = parseIF(s, i);
      ast.push(r.node);
      i = r.end;
    } else if (/^DECLARE\b/i.test(tr)) {
      const semi = findSemi(s, i);
      i = semi + 1;
    } else {
      const semi = findSemi(s, i);
      const stmt = s.slice(i, semi).trim();
      if (stmt.length > 2 && !/^--/.test(stmt)) ast.push(stmtNode(stmt));
      i = semi + 1;
    }
    while (i < s.length && /[\s;]/.test(s[i])) i++;
  }
  return ast;
}

function findSemi(s, from) {
  let q = false;
  for (let i = from; i < s.length; i++) {
    if (s[i] === "'" && !q) q = true;
    else if (s[i] === "'" && q) q = false;
    if (!q && s[i] === ";") return i;
  }
  return s.length;
}

function parseIF(s, start) {
  const m = s.slice(start).match(/^IF\s+([\s\S]+?)\s+THEN\b/i);
  if (!m)
    return { node: { type: "process", label: "IF block" }, end: start + 2 };
  let pos = start + m[0].length;
  const branches = [];
  let cond = m[1].trim(),
    body = "",
    depth = 0;
  while (pos < s.length) {
    const ch = s.slice(pos);
    const up = ch.trimStart().toUpperCase();
    if (/^IF\b/.test(up)) depth++;
    if (/^END\s+IF\b/i.test(up) && depth === 0) {
      branches.push({ cond, body });
      const em = ch.match(/^END\s+IF\s*;?\s*/i);
      pos += em ? em[0].length : 6;
      break;
    }
    if (/^END\b/i.test(up) && depth > 0) depth--;
    if (depth === 0) {
      const eim = ch.trimStart().match(/^ELSEIF\s+([\s\S]+?)\s+THEN\b/i);
      if (eim) {
        branches.push({ cond, body });
        cond = eim[1].trim();
        body = "";
        pos += ch.length - ch.trimStart().length + eim[0].length;
        continue;
      }
      if (/^ELSE\b/i.test(up)) {
        branches.push({ cond, body });
        cond = "ELSE";
        body = "";
        pos += ch.length - ch.trimStart().length + 4;
        continue;
      }
    }
    body += s[pos++];
  }
  return { node: buildIF(branches, 0), end: pos };
}

function buildIF(branches, idx) {
  if (idx >= branches.length) return null;
  const b = branches[idx];
  if (b.cond === "ELSE")
    return { type: "else-block", children: parseBlock(b.body) };
  const no = buildIF(branches, idx + 1);
  return {
    type: "decision",
    label: fmtCond(b.cond),
    yes: parseBlock(b.body),
    no: no ? (no.type === "else-block" ? no.children : [no]) : [],
  };
}

function stmtNode(s) {
  const u = s.toUpperCase().trimStart();
  if (/^SET\b/.test(u)) return { type: "set", label: fmtSet(s) };
  if (/^INSERT\b/.test(u)) return { type: "insert", label: fmtInsert(s) };
  if (/^UPDATE\b/.test(u)) return { type: "update", label: fmtUpdate(s) };
  if (/^DELETE\b/.test(u)) return { type: "delete", label: fmtDelete(s) };
  if (/^SELECT\b/.test(u)) return { type: "select", label: fmtSelect(s) };
  return { type: "process", label: s.trim().slice(0, 55) };
}

function cl(s) {
  return s.replace(/\s+/g, " ").trim();
}
function fmtSet(s) {
  const m = s.match(/SET\s+(\w+)\s*=\s*(.+?)(?:;|$)/is);
  return m
    ? m[1] + " =\n" + cl(m[2]).replace(/'/g, "").slice(0, 22)
    : cl(s).slice(0, 40);
}
function fmtInsert(s) {
  const m = s.match(/INSERT\s+INTO\s+`?(\w+)`?/i);
  return "INSERT INTO\n" + (m ? m[1] : "table");
}
function fmtUpdate(s) {
  const m = s.match(/UPDATE\s+`?(\w+)`?/i);
  return "UPDATE\n" + (m ? m[1] : "table");
}
function fmtDelete(s) {
  const m = s.match(/DELETE\s+FROM\s+`?(\w+)`?/i);
  return "DELETE FROM\n" + (m ? m[1] : "table");
}
function fmtSelect(s) {
  const into = /INTO\s+(\w+)/i.exec(s);
  if (into) return "SELECT INTO\n" + into[1];
  const from = /FROM\s+`?(\w+)`?/i.exec(s);
  return "SELECT\n" + (from ? from[1] : "...");
}
function fmtCond(c) {
  c = cl(c);
  if (/EXISTS\s*\(/i.test(c))
    return c.replace(/EXISTS\s*\(/i, "EXISTS\n(").slice(0, 70);
  const parts = c.split(/\s+AND\s+/i);
  if (parts.length >= 2)
    return parts
      .map((p) => p.trim().slice(0, 30))
      .join("\nAND ")
      .slice(0, 70);
  return c.slice(0, 60);
}