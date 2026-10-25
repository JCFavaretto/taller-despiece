/* Taller de Despiece · Interacción de puertas y cajones: hover, clic, teclado y animación. */

const HOVER = matchMedia("(hover:hover)").matches,
  scratch = document.createElementNS("http://www.w3.org/2000/svg", "svg");
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function animateTo() {
  const ids = Object.keys(ACT),
    from = {},
    target = {};
  ids.forEach((id) => {
    from[id] = PROG[id] || 0;
    target[id] = OPEN[id] ? 1 : 0;
  });
  $("openAll").textContent = ids.some((id) => !OPEN[id]) ? "Abrir todo" : "Cerrar todo";
  cancelAnimationFrame(animRaf);
  if (REDUCE) {
    Object.assign(PROG, target);
    render();
    return;
  }
  const vbFrom = lastVB.slice();
  Object.assign(PROG, target);
  const vbTo = drawRender(build(), scratch, { handles: true });
  Object.assign(PROG, from);
  const t0 = performance.now(),
    dur = 460;
  const step = (now) => {
    const t = Math.min(1, (now - t0) / dur),
      k = ease(t);
    ids.forEach((id) => (PROG[id] = from[id] + (target[id] - from[id]) * k));
    lastVB = drawRender(build(), $("render"), {
      handles: true,
      fixedVB: vbFrom.map((v, i) => v + (vbTo[i] - v) * k),
    });
    applyHover();
    if (t < 1) animRaf = requestAnimationFrame(step);
    else render();
  };
  animRaf = requestAnimationFrame(step);
}
function toggleOpen(id) {
  if (!ACT[id]) return;
  OPEN[id] = OPEN[id] ? 0 : 1;
  animateTo();
}
function applyHover() {
  const svgEl = $("render");
  svgEl.querySelectorAll(".on").forEach((el) => el.classList.remove("on"));
  if (hoverId && ACT[hoverId])
    svgEl
      .querySelectorAll(`[data-id="${hoverId}"],[data-for="${hoverId}"]`)
      .forEach((el) => el.classList.add("on"));
  if (!drag)
    $("hintText").textContent =
      hoverId && ACT[hoverId]
        ? `${HOVER ? "Clic" : "Tocá"} para ${OPEN[hoverId] ? "cerrar" : "abrir"} ${ACT[hoverId].label}`
        : defaultHint;
  if (kbFocus) {
    const el = svgEl.querySelector(`[data-id="${kbFocus}"]`);
    if (el && document.activeElement !== el) el.focus({ preventScroll: true });
  }
}
const idOf = (t) => {
  const el = t && t.closest ? t.closest("[data-id],[data-for]") : null;
  return el ? el.dataset.id || el.dataset.for : null;
};
$("render").addEventListener("pointerover", (e) => {
  if (drag) return;
  const id = idOf(e.target);
  if (id !== hoverId) {
    hoverId = id;
    applyHover();
  }
});
$("render").addEventListener("pointerleave", () => {
  if (hoverId) {
    hoverId = null;
    applyHover();
  }
});
$("render").addEventListener("click", (e) => {
  const id = idOf(e.target);
  if (id) toggleOpen(id);
});
$("render").addEventListener("keydown", (e) => {
  const id = e.target.dataset && e.target.dataset.id;
  if (id && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    kbFocus = id;
    toggleOpen(id);
  }
});
$("render").addEventListener("focusin", (e) => {
  const id = e.target.dataset && e.target.dataset.id;
  if (id && id !== hoverId) {
    hoverId = id;
    applyHover();
  }
});
document.addEventListener(
  "pointerdown",
  () => {
    kbFocus = null;
  },
  true,
);
$("openAll").addEventListener("click", () => {
  const ids = Object.keys(ACT),
    anyClosed = ids.some((id) => !OPEN[id]);
  ids.forEach((id) => (OPEN[id] = anyClosed ? 1 : 0));
  animateTo();
});
