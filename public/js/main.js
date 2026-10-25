/* Taller de Despiece · Arrastre de medidas sobre el dibujo, copiar pedido e inicio de la app. */

const svg = $("render");
let drag = null;
function svgPt(e) {
  const p = svg.createSVGPoint();
  p.x = e.clientX;
  p.y = e.clientY;
  return p.matrixTransform(svg.getScreenCTM().inverse());
}
svg.addEventListener("pointerdown", (e) => {
  const h = e.target.closest("[data-h]");
  if (!h) return;
  e.preventDefault();
  svg.setPointerCapture(e.pointerId);
  const k = h.dataset.h;
  drag = { k, p0: svgPt(e), v0: S[k], vb: lastVB };
  $("hintText").textContent = `${CDEF[k].label}: ${fmt(S[k])} mm`;
});
svg.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const p = svgPt(e),
    dx = p.x - drag.p0.x,
    dy = p.y - drag.p0.y;
  const d = drag.k === "W" ? dx : drag.k === "H" ? -dy : (dx * KC - dy * KS) / (KC * KC + KS * KS);
  const [mn, mx] = rangeOf(drag.k),
    v = clamp(Math.round((drag.v0 + d) / 10) * 10, mn, mx);
  if (v !== S[drag.k]) {
    S[drag.k] = v;
    $("hintText").textContent = `${CDEF[drag.k].label}: ${fmt(v)} mm`;
    render({ union: drag.vb });
  }
});
const end = () => {
  if (!drag) return;
  drag = null;
  render();
};
svg.addEventListener("pointerup", end);
svg.addEventListener("pointercancel", end);

$("copyBtn").addEventListener("click", () => {
  const ta = $("copytext"),
    btn = $("copyBtn");
  const done = () => {
    btn.textContent = "Pedido copiado";
    setTimeout(() => (btn.textContent = "Copiar pedido"), 1800);
  };
  const fallback = () => {
    ta.focus();
    ta.select();
    btn.textContent = "Texto seleccionado";
    setTimeout(() => (btn.textContent = "Copiar pedido"), 2200);
  };
  try {
    navigator.clipboard.writeText(ta.value).then(done, fallback);
  } catch (_) {
    fallback();
  }
});

readColors();
drawThumbs();
buildControls();
render();
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", readColors);
new MutationObserver(readColors).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});
if (document.fonts) document.fonts.ready.then(() => Object.values(tapes).forEach((t) => t.draw()));
