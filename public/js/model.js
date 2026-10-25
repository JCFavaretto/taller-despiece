/* Taller de Despiece · Modelo paramétrico: genera las piezas y cajas 3D de cada mueble a partir de las medidas. */

function newModel(W, H, D, e) {
  const M = {
    W,
    H,
    D,
    e,
    parts: [],
    boxes: [],
    warns: [],
    hw: {
      joints: 0,
      hinges: 0,
      hingesPer: 0,
      handles: 0,
      slides: [],
      supports: 0,
      legs: 0,
      nails: 0,
      drawerScrews: 0,
    },
  };
  M.add = (name, L, A, qty, edges, sheet = "main") => {
    if (qty > 0) M.parts.push({ name, L: Math.round(L), A: Math.round(A), qty, edges, sheet });
  };
  M.nd = 0;
  M.box = (x, y, z, w, h, d, kind = "panel") => {
    const b = { x1: x, y1: y, z1: z, x2: x + w, y2: y + h, z2: z + d, kind };
    M.boxes.push(b);
    return b;
  };
  M.warn = (t) => M.warns.push(t);
  return M;
}
function pickSlide(maxD) {
  let r = 250;
  for (const x of [250, 300, 350, 400, 450, 500, 550]) if (x <= maxD) r = x;
  return r;
}
function drawerSet(M, { x0, iw, ys, hf, D, frontX, frontW }) {
  const e = M.e,
    n = ys.length,
    slide = pickSlide(D - 25),
    bw = iw - 26,
    bh = Math.max(60, Math.round(hf - 50));
  M.add("Frente de cajón", frontW, hf, n, { L: 2, A: 2 });
  M.add("Lateral de cajón", slide, bh, 2 * n, { L: 1, A: 0 });
  M.add("Frente y contrafrente de cajón", bw - 2 * e, bh, 2 * n, { L: 1, A: 0 });
  M.add("Fondo de cajón", bw, slide, n, null, "fondo");
  ys.forEach((y) => {
    const id = "c" + M.nd++,
      act = { type: "drawer", id, dz: Math.min(slide * 0.75, 380), label: "el cajón" };
    const ib = M.box(x0 + 13, y + 22, D - slide, bw, bh, slide - 2, "drawer"),
      fb = M.box(frontX, y, D, frontW, hf, e, "door");
    ib.id = fb.id = id;
    ib.act = fb.act = act;
  });
  M.hw.slides.push({ len: slide, qty: n });
  M.hw.handles += n;
  M.hw.drawerScrews += 8 * n;
  if (hf < 90)
    M.warn(
      `Los frentes de cajón quedan de ${fmt(hf)} mm: muy bajos para que entre algo. Sacá un cajón o subí el alto.`,
    );
}
function genCaja(W, H, D) {
  const e = S.e,
    zh = S.zocalo,
    M = newModel(W, H, D, e),
    { add, box, hw } = M;
  add("Lateral", H, D, 2, { L: 1, A: 0 });
  box(0, 0, 0, e, H, D);
  box(W - e, 0, 0, e, H, D);
  add("Techo", W - 2 * e, D, 1, { L: 1, A: 0 });
  box(e, H - e, 0, W - 2 * e, e, D);
  add("Base", W - 2 * e, D, 1, { L: 1, A: 0 });
  box(e, zh, 0, W - 2 * e, e, D);
  hw.joints += 4;
  if (zh) {
    add("Zócalo", W - 2 * e, zh, 1, { L: 0, A: 0 });
    box(e, 0, D - e - 10, W - 2 * e, zh, e);
    hw.joints += 2;
  } else hw.legs = 4;
  const IW = W - 2 * e,
    yb = zh + e,
    yt = H - e,
    n = S.drawers,
    full = n > 0 && S.doors === 0 && S.shelves === 0;
  let lowTop = yt,
    doorTop = H - 2;
  if (n > 0) {
    const hf = full ? (H - zh - 4 - (n - 1) * 3) / n : 170,
      ys = [];
    if (full) {
      for (let i = 0; i < n; i++) ys.push(zh + 2 + i * (hf + 3));
    } else {
      for (let i = 0; i < n; i++) ys.push(H - 2 - (i + 1) * hf - i * 3);
      const yF = ys[n - 1];
      lowTop = yF - 1.5 - e;
      doorTop = yF - 3;
      add("Separador", IW, D, 1, { L: 1, A: 0 });
      box(e, lowTop, 0, IW, e, D);
      hw.joints += 2;
    }
    drawerSet(M, { x0: e, iw: IW, ys, hf, D, frontX: 2, frontW: W - 4 });
  }
  const LH = lowTop - yb;
  if (!full) {
    if (LH < 150) M.warn("Con tantos cajones no queda lugar abajo. Sacá un cajón o subí el alto.");
    else {
      const nc = S.divs + 1,
        cw = (IW - S.divs * e) / nc;
      if (S.divs) {
        add("Divisor", LH, D, S.divs, { L: 1, A: 0 });
        for (let i = 0; i < S.divs; i++) box(e + (i + 1) * cw + i * e, yb, 0, e, LH, D);
        hw.joints += 2 * S.divs;
      }
      if (S.shelves) {
        const sd = D - 20,
          gap = (LH - S.shelves * e) / (S.shelves + 1);
        add("Estante", cw - 1, sd, S.shelves * nc, { L: 1, A: 0 });
        for (let c = 0; c < nc; c++) {
          const x0 = e + c * (cw + e);
          for (let k = 0; k < S.shelves; k++)
            box(x0 + 0.5, yb + gap * (k + 1) + e * k, 0, cw - 1, e, sd);
        }
        hw.supports += 4 * S.shelves * nc;
        const lim = e === 18 ? 800 : 650;
        if (cw - 1 > lim)
          M.warn(
            `Los estantes miden ${fmt(cw - 1)} mm. En ${e} mm se pandean con peso pasados los ${lim / 10} cm: sumá una división.`,
          );
        if (gap < 120)
          M.warn(
            `Entre estantes quedan ${fmt(gap)} mm. Es poco hasta para zapatos: sacá un estante.`,
          );
      }
      if (S.doors) {
        const DH = doorTop - (zh + 2),
          DW = S.doors === 1 ? W - 4 : (W - 7) / 2;
        add("Puerta", DH, DW, S.doors, { L: 2, A: 2 });
        for (let i = 0; i < S.doors; i++) {
          const b = box(2 + i * (DW + 3), zh + 2, D, DW, DH, e, "door"),
            id = "p" + i;
          b.id = id;
          b.act = {
            type: "door",
            id,
            hinge: S.doors === 1 || i === 0 ? "L" : "R",
            label:
              S.doors === 1 ? "la puerta" : i === 0 ? "la puerta izquierda" : "la puerta derecha",
          };
        }
        const hp = DH <= 900 ? 2 : DH <= 1500 ? 3 : 4;
        hw.hinges += hp * S.doors;
        hw.hingesPer = hp;
        hw.handles += S.doors;
        if (DW > 600)
          M.warn(
            `Cada puerta mide ${fmt(DW)} mm de ancho. Puertas tan anchas pesan y se descuelgan: ${S.doors === 1 ? "mejor 2 puertas" : "achicá el ancho o partí en dos módulos"}.`,
          );
        if (DH > 2000)
          M.warn(
            `Puertas de ${fmt(DH)} mm de alto tienden a torcerse. Usá 4 bisagras o partí la puerta en dos.`,
          );
      }
    }
  }
  if (S.fondo) {
    add("Fondo", H - zh - 2, W - 2, 1, null, "fondo");
    box(1, zh + 1, -3, W - 2, H - zh - 2, 3, "back");
    hw.nails += Math.ceil((2 * (H - zh + W)) / 100);
  } else if (H > 900)
    M.warn(
      "Sin fondo la caja se descuadra con el uso. El fibrofácil clavado atrás es lo que la mantiene a escuadra.",
    );
  if (H > 1600 && D < 350)
    M.warn("Es alto y poco profundo: fijalo a la pared para que no se vuelque.");
  return M;
}
function genDesk(W, H, D) {
  const e = S.e,
    M = newModel(W, H, D, e),
    { add, box, hw } = M,
    CW = 420,
    LH = H - e;
  add("Tapa", W, D, 1, { L: 2, A: 2 });
  box(0, H - e, 0, W, e, D);
  add("Pata lateral", LH, D, 2, { L: 1, A: 0 });
  box(0, 0, 0, e, LH, D);
  box(W - e, 0, 0, e, LH, D);
  hw.joints += 4;
  hw.legs = 4;
  let xL = e,
    xR = W - e;
  if (S.cajonera) {
    const left = S.cajonera === 1,
      xi = left ? CW - e : W - CW,
      bx = left ? e : W - CW + e,
      bw = CW - 2 * e,
      base = 60;
    add("Lateral de cajonera", LH, D, 1, { L: 1, A: 0 });
    box(xi, 0, 0, e, LH, D);
    add("Base de cajonera", bw, D, 1, { L: 1, A: 0 });
    box(bx, base, 0, bw, e, D);
    hw.joints += 4;
    const n = S.drawers,
      zone = LH - base + 2 - 2,
      hf = (zone - (n - 1) * 3) / n,
      ys = [];
    for (let i = 0; i < n; i++) ys.push(base - 2 + i * (hf + 3));
    drawerSet(M, { x0: bx, iw: bw, ys, hf, D, frontX: left ? 2 : W - CW + 2, frontW: CW - 4 });
    if (left) xL = CW;
    else xR = W - CW;
  }
  if (S.faldon) {
    const fw = xR - xL;
    add("Faldón", fw, 300, 1, { L: 1, A: 0 });
    box(xL, H - e - 300, 80, fw, 300, e);
    hw.joints += 2;
  } else
    M.warn(
      "Sin faldón el escritorio se mueve de lado a lado al escribir. Es la pieza que lo rigidiza.",
    );
  if (xR - xL > 1200 && S.e === 18)
    M.warn(
      `La tapa queda con ${fmt(xR - xL)} mm sin apoyo y en 18 mm va a flechar con el monitor. Sumá un refuerzo debajo o una pata central.`,
    );
  if (W - (S.cajonera ? CW : 0) < 600)
    M.warn("Queda poco lugar para las piernas: dejá al menos 60 cm libres.");
  return M;
}
function genMesa(W, H, D) {
  const e = S.e,
    M = newModel(W, H, D, e),
    { add, box, hw } = M;
  add("Tapa", W, D, 1, { L: 2, A: 2 });
  box(0, H - e, 0, W, e, D);
  add("Lateral", H - e, D, 2, { L: 2, A: 0 });
  box(0, 0, 0, e, H - e, D);
  box(W - e, 0, 0, e, H - e, D);
  hw.joints += 4;
  hw.legs = 4;
  if (S.bandeja) {
    add("Estante inferior", W - 2 * e, D, 1, { L: 2, A: 0 });
    box(e, 90, 0, W - 2 * e, e, D);
    hw.joints += 2;
  } else
    M.warn(
      "Sin estante inferior los laterales quedan sueltos abajo y la mesa se ladea. Sumalo o poné un travesaño.",
    );
  if (W - 2 * e > 1000 && S.e === 18)
    M.warn(`La tapa salva ${fmt(W - 2 * e)} mm entre laterales: en 18 mm puede flechar con peso.`);
  return M;
}
function build(type = S.type) {
  const T = TYPES[type];
  const W = clamp(S.W, ...T.r.W),
    H = clamp(S.H, ...T.r.H),
    D = clamp(S.D, ...T.r.D);
  return T.gen === "desk"
    ? genDesk(W, H, D)
    : T.gen === "mesa"
      ? genMesa(W, H, D)
      : genCaja(W, H, D);
}
