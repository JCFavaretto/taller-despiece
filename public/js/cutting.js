/* Taller de Despiece · Optimización de corte en guillotina (bin packing 2D) y dibujo del plano de cada placa. */

function pack(items, allowRot) {
  const SW = SHEET_L - 2 * REFILE + KERF,
    SH = SHEET_A - 2 * REFILE + KERF,
    sheets = [],
    bad = [];
  items = [...items].sort(
    (a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h) || b.w * b.h - a.w * a.h,
  );
  const find = (free, w, h) => {
    let best = null;
    free.forEach((r, ri) => {
      for (const [ww, hh, rot] of allowRot
        ? [
            [w, h, false],
            [h, w, true],
          ]
        : [[w, h, false]]) {
        if (ww <= r.w && hh <= r.h) {
          const s = r.w * r.h - ww * hh,
            ss = Math.min(r.w - ww, r.h - hh);
          if (!best || s < best.s || (s === best.s && ss < best.ss))
            best = { ri, w: ww, h: hh, rot, s, ss };
        }
      }
    });
    return best;
  };
  for (const it of items) {
    const w = it.w + KERF,
      h = it.h + KERF;
    let best = null,
      si = -1;
    sheets.forEach((sh, i) => {
      const f = find(sh.free, w, h);
      if (f && (!best || f.s < best.s)) {
        best = f;
        si = i;
      }
    });
    if (!best) {
      const sh = { free: [{ x: 0, y: 0, w: SW, h: SH }], placed: [] },
        f = find(sh.free, w, h);
      if (!f) {
        bad.push(it);
        continue;
      }
      sheets.push(sh);
      best = f;
      si = sheets.length - 1;
    }
    const sh = sheets[si],
      r = sh.free.splice(best.ri, 1)[0],
      rw = r.w - best.w,
      bh = r.h - best.h;
    const nf =
      rw < bh
        ? [
            { x: r.x + best.w, y: r.y, w: rw, h: best.h },
            { x: r.x, y: r.y + best.h, w: r.w, h: bh },
          ]
        : [
            { x: r.x + best.w, y: r.y, w: rw, h: r.h },
            { x: r.x, y: r.y + best.h, w: best.w, h: bh },
          ];
    nf.forEach((f) => {
      if (f.w > KERF && f.h > KERF) sh.free.push(f);
    });
    sh.placed.push({
      ...it,
      x: r.x + REFILE,
      y: r.y + REFILE,
      rw: best.rot ? it.h : it.w,
      rh: best.rot ? it.w : it.h,
    });
  }
  return { sheets, bad };
}
function sheetSVG(sh, i, mat) {
  const ink = lum(mat.fill) > 0.55 ? "#1c1f26" : "#f6f4ef",
    edge = hexShade(mat.fill, -0.45);
  let s =
    `<svg viewBox="-12 -12 ${SHEET_L + 24} ${SHEET_A + 24}" role="img" aria-label="Placa ${i + 1}: ${sh.placed.length} piezas">` +
    `<defs><pattern id="hatch${i}" width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="36" height="36" fill="var(--paper)"/><line x1="0" y1="0" x2="0" y2="36" stroke="var(--hatch)" stroke-width="10"/></pattern></defs>` +
    `<rect x="0" y="0" width="${SHEET_L}" height="${SHEET_A}" rx="6" fill="url(#hatch${i})" stroke="var(--line-strong)" stroke-width="6"/>`;
  for (const p of sh.placed) {
    const small = Math.min(p.rw, p.rh),
      fs = clamp(small * 0.2, 34, 96),
      cx = p.x + p.rw / 2,
      cy = p.y + p.rh / 2;
    s += `<rect x="${p.x}" y="${p.y}" width="${p.rw}" height="${p.rh}" fill="${mat.fill}" stroke="${edge}" stroke-width="5"/>`;
    if (small >= 70) {
      const vert = p.rh > p.rw * 1.6 && p.rw < 260,
        room = vert ? p.rh : p.rw,
        two = room > 500 && small > 150;
      s +=
        `<g${vert ? ` transform="rotate(-90 ${cx} ${cy})"` : ""} font-family="Archivo, sans-serif" text-anchor="middle" fill="${ink}">` +
        `<text x="${cx}" y="${cy + (two ? -fs * 0.15 : fs * 0.35)}" font-size="${fs}" font-weight="800">P${p.id}</text>` +
        (two
          ? `<text x="${cx}" y="${cy + fs * 0.95}" font-size="${fs * 0.62}" font-weight="500">${p.L} × ${p.A}</text>`
          : "") +
        `</g>`;
    }
  }
  return s + "</svg>";
}
