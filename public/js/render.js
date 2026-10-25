/* Taller de Despiece · Render general: despiece, compras, avisos, resumen y texto del pedido. */

const cantoTxt = (e) =>
  !e || (!e.L && !e.A)
    ? "Sin canto"
    : [
        e.L ? `${e.L} largo${e.L > 1 ? "s" : ""}` : "",
        e.A ? `${e.A} corto${e.A > 1 ? "s" : ""}` : "",
      ]
        .filter(Boolean)
        .join(" + ");
function cantoIcon(e) {
  const L = e?.L || 0,
    A = e?.A || 0;
  return (
    `<svg class="canto" viewBox="0 0 30 18" aria-hidden="true"><rect x="3" y="3" width="24" height="12" fill="var(--paper)" stroke="var(--line-strong)" stroke-width="1"/>` +
    (L >= 1 ? '<line x1="3" y1="3" x2="27" y2="3" class="b"/>' : "") +
    (L >= 2 ? '<line x1="3" y1="15" x2="27" y2="15" class="b"/>' : "") +
    (A >= 1 ? '<line x1="27" y1="3" x2="27" y2="15" class="b"/>' : "") +
    (A >= 2 ? '<line x1="3" y1="3" x2="3" y2="15" class="b"/>' : "") +
    `</svg>`
  );
}
const plural = (n, a, b) => (n === 1 ? a : b);
let lastVB = null;
function render(opts = {}) {
  const m = build(),
    mat = MATS[S.mat];
  lastVB = drawRender(m, $("render"), { handles: true, union: opts.union });
  const main = m.parts.filter((p) => p.sheet === "main"),
    fondo = m.parts.filter((p) => p.sheet === "fondo");
  main.forEach((p, i) => (p.id = i + 1));
  let rows = "";
  for (const p of main)
    rows += `<tr><td><span class="tag">P${p.id}</span></td><td>${p.name}</td><td class="num">${p.qty}</td><td class="num dim">${fmt(p.L)} × ${fmt(p.A)}</td><td>${mat.canto ? `<span class="cantocell">${cantoIcon(p.edges)}${cantoTxt(p.edges)}</span>` : '<span class="cantocell">Se pinta</span>'}</td></tr>`;
  for (const p of fondo)
    rows += `<tr class="sub"><td><span class="tag">3 mm</span></td><td>${p.name} (fibrofácil)</td><td class="num">${p.qty}</td><td class="num dim">${fmt(p.L)} × ${fmt(p.A)}</td><td><span class="cantocell">Sin canto</span></td></tr>`;
  $("parts").innerHTML = rows;
  const total = main.reduce((a, p) => a + p.qty, 0);
  $("pieceCount").textContent = `${total} piezas en ${mat.name.toLowerCase()} de ${S.e} mm`;

  const items = [];
  main.forEach((p) => {
    for (let i = 0; i < p.qty; i++) items.push({ id: p.id, L: p.L, A: p.A, w: p.L, h: p.A });
  });
  const res = pack(items, !mat.veta);
  $("sheets").innerHTML =
    res.sheets
      .map((s, i) => {
        const used = Math.round(
          (s.placed.reduce((a, p) => a + p.rw * p.rh, 0) / (SHEET_L * SHEET_A)) * 100,
        );
        return `<figure class="sheet"><figcaption><b>Placa ${i + 1} de ${res.sheets.length}</b><span class="use">${s.placed.length} piezas, se usa el ${used}% <span><i style="width:${used}%"></i></span></span></figcaption>${sheetSVG(s, i, mat)}</figure>`;
      })
      .join("") || '<p class="note">Sin piezas para cortar.</p>';

  const hw = m.hw,
    cantoM = mat.canto
      ? main.reduce((a, p) => a + p.qty * ((p.edges?.L || 0) * p.L + (p.edges?.A || 0) * p.A), 0) /
        1000
      : 0,
    cantoBuy = Math.ceil(cantoM * 1.1);
  const scr = Math.max(2, Math.round(m.D / 150)),
    screws = hw.joints * 2 * scr,
    slidePairs = hw.slides.reduce((a, s) => a + s.qty, 0);
  const nS = res.sheets.length,
    nF = fondo.reduce((a, p) => a + p.qty, 0);
  let li = `<li class="main"><span class="qty">${nS}<em>${plural(nS, "placa", "placas")}</em></span><span>${mat.name} de ${S.e} mm<small>Placa de 2600 × 1830 mm${mat.veta ? ", con veta a lo largo" : ""}</small></span></li>`;
  if (fondo.length)
    li += `<li><span>Fibrofácil 3 mm<small>${fondo.map((p) => `${p.qty} × ${fmt(p.L)} × ${fmt(p.A)}`).join(", ")}</small></span><span class="qty">${nF} ${plural(nF, "corte", "cortes")}</span></li>`;
  if (mat.canto)
    li += `<li><span>Tapacanto PVC 22 mm al tono<small>${cantoM.toFixed(1).replace(".", ",")} m justos más 10% de margen</small></span><span class="qty">${cantoBuy} m</span></li>`;
  for (const s of hw.slides)
    li += `<li><span>Correderas telescópicas de ${s.len} mm<small>Un par por cajón</small></span><span class="qty">${s.qty} ${plural(s.qty, "par", "pares")}</span></li>`;
  if (hw.hinges)
    li += `<li><span>Bisagras cazoleta 35 mm, codo 0<small>${hw.hingesPer} por puerta</small></span><span class="qty">${hw.hinges}</span></li>`;
  if (hw.handles)
    li += `<li><span>Manijas o tiradores</span><span class="qty">${hw.handles}</span></li>`;
  if (hw.supports)
    li += `<li><span>Soportes de estante<small>4 por estante, regulables</small></span><span class="qty">${hw.supports}</span></li>`;
  li += `<li><span>Tornillos 4 × 50 para aglomerado<small>Uniones de la estructura</small></span><span class="qty">${screws}</span></li>`;
  if (hw.drawerScrews)
    li += `<li><span>Tornillos 3,5 × 30<small>Armado de cajones</small></span><span class="qty">${hw.drawerScrews}</span></li>`;
  if (hw.hinges || slidePairs)
    li += `<li><span>Tornillos 3,5 × 16<small>Bisagras y correderas</small></span><span class="qty">${hw.hinges * 4 + slidePairs * 12}</span></li>`;
  if (hw.nails || fondo.length)
    li += `<li><span>Clavos o grampas para fondos</span><span class="qty">~${hw.nails + (fondo.length ? slidePairs * 12 : 0)}</span></li>`;
  if (hw.legs) li += `<li><span>Regatones o patas</span><span class="qty">${hw.legs}</span></li>`;
  $("buy").innerHTML = li;

  const w = [...m.warns];
  if (S.mat === "mdf")
    w.push("El MDF crudo no lleva tapacanto: los cantos se masillan, se lijan y se pintan.");
  res.bad.forEach((b) =>
    w.push(`La pieza P${b.id} (${b.L} × ${b.A}) no entra en una placa de 2600 × 1830.`),
  );
  $("warns").innerHTML = w.map((t) => `<div class="warn">${t}</div>`).join("");

  $("stats").innerHTML =
    `<span class="stat"><b>${nS}</b>${plural(nS, "placa", "placas")}</span><span class="stat"><b>${total}</b>piezas</span>` +
    (mat.canto ? `<span class="stat"><b>${cantoBuy}</b>m de canto</span>` : "") +
    (w.length
      ? `<span class="stat alert"><b>${w.length}</b>${plural(w.length, "aviso", "avisos")}</span>`
      : "");

  let t = `Hola! Quiero cotizar este despiece (${TYPES[S.type].label.toLowerCase()} de ${m.W} × ${m.H} × ${m.D} mm).\nMaterial: ${mat.name} ${S.e} mm\n\n`;
  for (const p of main)
    t += `P${p.id} · ${p.qty} u · ${p.L} × ${p.A} mm · ${p.name}${mat.canto && p.edges && (p.edges.L || p.edges.A) ? " · canto " + cantoTxt(p.edges) : ""}\n`;
  if (fondo.length) {
    t += "\nFibrofácil 3 mm:\n";
    for (const p of fondo) t += `${p.qty} u · ${p.L} × ${p.A} mm · ${p.name}\n`;
  }
  t += `\nLargo a favor de la veta.${mat.canto ? ` Tapacanto 22 mm al tono (~${cantoBuy} m).` : ""}\nSegún mi cálculo entra en ${nS} ${plural(nS, "placa", "placas")} de 2600 × 1830.`;
  $("copytext").value = t;
  syncControls();
  save();
  applyHover();
}
