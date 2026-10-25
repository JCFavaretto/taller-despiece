/* Taller de Despiece · Dibujo en proyección oblicua (SVG): orden de pintado, caras visibles, puertas y cajones animables. */

const K = 0.5,
  ANG = (35 * Math.PI) / 180,
  KC = K * Math.cos(ANG),
  KS = K * Math.sin(ANG);
function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}
function hexShade(hex, t) {
  let [r, g, b] = rgb(hex);
  const m = t > 0 ? 255 : 0,
    a = Math.abs(t);
  return (
    "#" +
    [r, g, b]
      .map((v) =>
        Math.round(v + (m - v) * a)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
function lum(hex) {
  const [r, g, b] = rgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
function cmp(a, b) {
  const E = 0.01;
  if (a.x2 <= b.x1 + E) return -1;
  if (b.x2 <= a.x1 + E) return 1;
  if (a.z2 <= b.z1 + E) return -1;
  if (b.z2 <= a.z1 + E) return 1;
  if (a.y2 <= b.y1 + E) return -1;
  if (b.y2 <= a.y1 + E) return 1;
  return 0;
}
function order(bs) {
  const n = bs.length,
    ind = Array(n).fill(0),
    adj = bs.map(() => []);
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const r = cmp(bs[i], bs[j]);
      if (r < 0) {
        adj[i].push(j);
        ind[j]++;
      } else if (r > 0) {
        adj[j].push(i);
        ind[i]++;
      }
    }
  const q = [],
    out = [];
  ind.forEach((d, i) => {
    if (!d) q.push(i);
  });
  while (q.length) {
    q.sort((a, b) => a - b);
    const i = q.shift();
    out.push(bs[i]);
    for (const j of adj[i]) if (!--ind[j]) q.push(j);
  }
  if (out.length < n)
    bs.forEach((b) => {
      if (!out.includes(b)) out.push(b);
    });
  return out;
}

const OPEN_ANG = (95 * Math.PI) / 180;
let OPEN = {},
  PROG = {},
  ACT = {},
  hoverId = null,
  kbFocus = null,
  animRaf = 0,
  defaultHint = "";
function prismOf(b, thumb) {
  const p = thumb || !b.act ? 0 : PROG[b.id] || 0;
  let tf = (x, z) => [x, z];
  if (p > 0 && b.act.type === "door") {
    const th = p * OPEN_ANG,
      co = Math.cos(th),
      si = Math.sin(th),
      L = b.act.hinge === "L",
      hx = L ? b.x1 : b.x2,
      hz = b.z1;
    tf = (x, z) => {
      const dx = L ? x - hx : hx - x,
        dz = z - hz,
        rx = dx * co - dz * si,
        rz = dx * si + dz * co;
      return [L ? hx + rx : hx - rx, hz + rz];
    };
  } else if (p > 0 && b.act.type === "drawer") {
    const o = p * b.act.dz;
    tf = (x, z) => [x, z + o];
  }
  const c = [
      [b.x1, b.z2],
      [b.x2, b.z2],
      [b.x2, b.z1],
      [b.x1, b.z1],
    ].map(([x, z]) => tf(x, z)),
    xs = c.map((q) => q[0]),
    zs = c.map((q) => q[1]);
  return {
    b,
    c,
    tf,
    x1: Math.min(...xs),
    x2: Math.max(...xs),
    z1: Math.min(...zs),
    z2: Math.max(...zs),
    y1: b.y1,
    y2: b.y2,
  };
}
const area2 = (pp) => {
  let s = 0;
  for (let i = 0; i < pp.length; i++) {
    const a = pp[i],
      q = pp[(i + 1) % pp.length];
    s += a[0] * q[1] - q[0] * a[1];
  }
  return s / 2;
};
const ptsStr = (pp) => pp.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
const ICONS = {
  door0:
    '<path d="M-.42 -.5H.08V.5H-.42Z" fill="none" stroke="var(--tape-ink)" stroke-width=".11" stroke-linejoin="round"/><path d="M.08 -.5L.44 -.32V.68L.08 .5Z" fill="var(--tape-ink)"/>',
  door1:
    '<path d="M-.3 -.5H.3V.5H-.3Z" fill="var(--tape-ink)"/><circle cx=".16" cy=".02" r=".07" fill="var(--tape)"/>',
  drawer0:
    '<path d="M-.5 .1H.5V.5H-.5Z" fill="none" stroke="var(--tape-ink)" stroke-width=".11" stroke-linejoin="round"/><path d="M0 -.56V-.06M-.2 -.26L0 -.06L.2 -.26" fill="none" stroke="var(--tape-ink)" stroke-width=".11" stroke-linecap="round" stroke-linejoin="round"/>',
  drawer1:
    '<path d="M-.5 .1H.5V.5H-.5Z" fill="none" stroke="var(--tape-ink)" stroke-width=".11" stroke-linejoin="round"/><path d="M0 -.06V-.56M-.2 -.36L0 -.56L.2 -.36" fill="none" stroke="var(--tape-ink)" stroke-width=".11" stroke-linecap="round" stroke-linejoin="round"/>',
};
function drawRender(m, svg, o = {}) {
  const D = m.D,
    P = (x, y, z) => [x + (D - z) * KC, -y - (D - z) * KS],
    mat = MATS[S.mat];
  const big = Math.max(m.W, m.H, m.D),
    sw = o.thumb ? big / 80 : big / 520;
  const drawerFill = hexShade(mat.fill === "#f2f0ea" ? "#d9d4c7" : mat.fill, 0.25);
  const pts = [],
    badges = {};
  let g = "";
  if (!o.thumb) ACT = {};
  for (const pr of order(m.boxes.map((b) => prismOf(b, o.thumb)))) {
    const b = pr.b,
      base = b.kind === "back" ? "#a88f6c" : b.kind === "drawer" ? drawerFill : mat.fill;
    const inter = !o.thumb && b.act && b.kind === "door";
    let faces = "",
      hl = "",
      best = null,
      bestA = 0,
      frontVis = false;
    for (let i = 0; i < 4; i++) {
      const a = pr.c[i],
        q = pr.c[(i + 1) % 4];
      const pp = [
          P(a[0], pr.y1, a[1]),
          P(q[0], pr.y1, q[1]),
          P(q[0], pr.y2, q[1]),
          P(a[0], pr.y2, a[1]),
        ],
        ar = area2(pp);
      if (ar >= -1e-6) continue;
      if (i === 0) frontVis = true;
      const dx = q[0] - a[0],
        dz = q[1] - a[1],
        len = Math.hypot(dx, dz) || 1,
        nx = -dz / len,
        nz = dx / len;
      const t = nz >= -0.01 ? -0.24 * Math.abs(nx) * (nx > 0 ? 1 : 0.6) : -0.32,
        s = ptsStr(pp);
      pp.forEach((p) => pts.push(p));
      faces += `<polygon points="${s}" fill="${hexShade(base, t)}"/>`;
      hl += `<polygon points="${s}"/>`;
      if (-ar > bestA) {
        bestA = -ar;
        best = pp;
      }
    }
    const tp = pr.c.map(([x, z]) => P(x, pr.y2, z)),
      ts = ptsStr(tp);
    tp.forEach((p) => pts.push(p));
    faces += `<polygon points="${ts}" fill="${hexShade(base, 0.14)}"/>`;
    hl += `<polygon points="${ts}"/>`;
    let handle = "";
    if (inter && frontVis) {
      const w = b.x2 - b.x1,
        h = b.y2 - b.y1;
      let a, c;
      if (b.act.type === "drawer") {
        const cx = b.x1 + w / 2,
          cy = b.y1 + h * 0.62,
          hlen = Math.min(80, w * 0.15);
        a = [cx - hlen, cy];
        c = [cx + hlen, cy];
      } else {
        const hx = b.act.hinge === "L" ? b.x2 - 40 : b.x1 + 40,
          hy = b.y1 + h * 0.55;
        a = [hx, hy - 60];
        c = [hx, hy + 60];
      }
      const A = pr.tf(a[0], b.z2),
        Cc = pr.tf(c[0], b.z2),
        pa = P(A[0], a[1], A[1]),
        pc = P(Cc[0], c[1], Cc[1]);
      handle = `<line x1="${pa[0]}" y1="${pa[1]}" x2="${pc[0]}" y2="${pc[1]}" stroke="var(--fg)" stroke-width="${big / 170}" stroke-linecap="round"/>`;
    }
    const grp = `<g stroke="var(--fg)" stroke-width="${sw}" stroke-linejoin="round">${faces}</g>${handle}`;
    if (inter) {
      ACT[b.id] = b.act;
      const verb = OPEN[b.id] ? "Cerrar" : "Abrir";
      g += `<g class="act" data-id="${b.id}" tabindex="0" role="button" aria-label="${verb} ${b.act.label}">${grp}<g class="hl" stroke-width="${sw * 2.4}">${hl}</g></g>`;
      if (best)
        badges[b.id] = {
          x: best.reduce((s, p) => s + p[0], 0) / 4,
          y: best.reduce((s, p) => s + p[1], 0) / 4,
          act: b.act,
          right: best[0][0] > P(m.W * 0.62, 0, m.D)[0],
        };
    } else g += grp;
  }
  if (!o.thumb) {
    const fs = big * 0.042,
      off = fs * 1.6,
      dc = "var(--cota)",
      s2 = big / 480,
      front = m.D + (m.boxes.some((b) => b.kind === "door") ? m.e : 0);
    const dim = (a, b, label, dx, dy, anchor) => {
      const p = P(...a),
        q = P(...b),
        x1 = p[0] + dx,
        y1 = p[1] + dy,
        x2 = q[0] + dx,
        y2 = q[1] + dy;
      pts.push([x1, y1], [x2, y2]);
      const mx = (x1 + x2) / 2,
        my = (y1 + y2) / 2,
        ang = Math.atan2(y2 - y1, x2 - x1),
        tk = fs * 0.35,
        tx = Math.cos(ang + Math.PI / 4) * tk,
        ty = Math.sin(ang + Math.PI / 4) * tk;
      return (
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${dc}" stroke-width="${s2}"/>` +
        `<line x1="${x1 - tx}" y1="${y1 - ty}" x2="${x1 + tx}" y2="${y1 + ty}" stroke="${dc}" stroke-width="${s2 * 1.6}"/><line x1="${x2 - tx}" y1="${y2 - ty}" x2="${x2 + tx}" y2="${y2 + ty}" stroke="${dc}" stroke-width="${s2 * 1.6}"/>` +
        `<text x="${mx + (anchor === "end" ? -fs * 0.4 : anchor === "start" ? fs * 0.4 : 0)}" y="${my + (anchor === "middle" ? fs * 1.2 : fs * 0.35)}" font-size="${fs}" fill="${dc}" text-anchor="${anchor}" font-family="Archivo, sans-serif" font-weight="700">${fmt(label)}</text>`
      );
    };
    const gx = Math.min(...pts.map((p) => p[0])),
      gy = Math.max(...pts.map((p) => p[1]));
    g += dim(
      [0, 0, front],
      [m.W, 0, front],
      m.W,
      0,
      Math.max(off * 0.6, gy - P(0, 0, front)[1] + off * 0.5),
      "middle",
    );
    g += dim(
      [0, 0, m.D],
      [0, m.H, m.D],
      m.H,
      Math.min(-off, gx - P(0, 0, m.D)[0] - off * 0.5),
      0,
      "end",
    );
    g += dim([m.W, 0, m.D], [m.W, 0, 0], m.D, off * 0.7, 0, "start");
    pts.push(
      [P(0, 0, m.D)[0] - off - fs * 3.4, 0],
      [P(m.W, 0, 0)[0] + off + fs * 3.6, 0],
      [0, P(0, 0, m.D)[1] + off + fs * 1.7],
    );
    const R = big * 0.042,
      lf = R * 0.78;
    for (const [id, bd] of Object.entries(badges)) {
      const open = !!OPEN[id],
        txt = `${open ? "Cerrar" : "Abrir"} ${bd.act.type === "door" ? "puerta" : "cajón"}`,
        lw = txt.length * lf * 0.56 + lf * 1.5,
        lx = bd.right ? -R * 1.3 - lw : R * 1.3;
      g +=
        `<g class="badge" data-for="${id}" transform="translate(${bd.x.toFixed(1)} ${bd.y.toFixed(1)})"><g class="lab"><rect x="${lx}" y="${-lf * 0.9}" width="${lw}" height="${lf * 1.8}" rx="${lf * 0.9}"/><text x="${lx + lf * 0.75}" y="${lf * 0.33}" font-size="${lf}">${txt}</text></g>` +
        `<g class="bi"><circle r="${R}" fill="var(--tape)" stroke="var(--tape-ink)" stroke-width="${R * 0.1}"/><g transform="scale(${R})">${ICONS[bd.act.type + (open ? 1 : 0)]}</g></g></g>`;
    }
    if (o.handles) {
      const r = big * 0.024,
        hs = [
          ["W", P(m.W, m.H / 2, front)],
          ["H", P(m.W / 2, m.H, front)],
          ["D", P(m.W, m.H, 0)],
        ];
      g += hs
        .map(
          ([k, p]) =>
            `<g class="handle" data-h="${k}" aria-label="Arrastrar ${CDEF[k].label.toLowerCase()}"><circle class="hit" cx="${p[0]}" cy="${p[1]}" r="${r * 2.6}"/><circle class="dot" cx="${p[0]}" cy="${p[1]}" r="${r}" stroke-width="${r * 0.28}"/>` +
            `<path d="${k === "W" ? `M${p[0] - r * 0.45} ${p[1]}h${r * 0.9}` : k === "H" ? `M${p[0]} ${p[1] - r * 0.45}v${r * 0.9}` : `M${p[0] - r * 0.35} ${p[1] + r * 0.3}l${r * 0.7} ${-r * 0.6}`}" stroke="var(--tape-ink)" stroke-width="${r * 0.24}" stroke-linecap="round" pointer-events="none"/></g>`,
        )
        .join("");
      hs.forEach(([, p]) => pts.push([p[0] + r * 2, p[1] - r * 2], [p[0] - r * 2, p[1] + r * 2]));
    }
  }
  const xs = pts.map((p) => p[0]),
    ys = pts.map((p) => p[1]),
    pad = big * (o.thumb ? 0.04 : 0.03);
  let vb = [Math.min(...xs) - pad, Math.min(...ys) - pad, 0, 0];
  vb[2] = Math.max(...xs) + pad - vb[0];
  vb[3] = Math.max(...ys) + pad - vb[1];
  if (o.union) {
    const u = o.union,
      x0 = Math.min(u[0], vb[0]),
      y0 = Math.min(u[1], vb[1]);
    vb = [
      x0,
      y0,
      Math.max(u[0] + u[2], vb[0] + vb[2]) - x0,
      Math.max(u[1] + u[3], vb[1] + vb[3]) - y0,
    ];
  }
  if (o.fixedVB) vb = o.fixedVB;
  svg.setAttribute("viewBox", vb.join(" "));
  svg.innerHTML = g;
  return vb;
}
