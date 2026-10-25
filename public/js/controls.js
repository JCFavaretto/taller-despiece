/* Taller de Despiece · Construcción y sincronización de controles, catálogo y materiales. */

function buildControls() {
  Object.values(tapes).forEach((t) => cancelAnimationFrame(t.raf));
  tapes = {};
  const keys = CTRL[TYPES[S.type].gen],
    dims = keys.filter((k) => CDEF[k].unit),
    rest = keys.filter((k) => !CDEF[k].unit);
  $("dims").innerHTML = dims
    .map((k) => {
      const c = CDEF[k],
        [mn, mx] = rangeOf(k);
      return (
        `<div class="ctl" data-k="${k}"><div class="ctl-head"><label for="n_${k}">${c.label}</label><span class="val"><input id="n_${k}" type="number" inputmode="numeric" min="${mn}" max="${mx}" step="10">mm</span></div>` +
        `<div class="tape" id="tape_${k}" role="slider" tabindex="0" aria-label="${c.label}" aria-valuemin="${mn}" aria-valuemax="${mx}"><canvas></canvas><i class="cursor"></i></div>` +
        `<div class="range-ends"><span>Desde ${fmt(mn / 10)} cm</span><span>hasta ${fmt(mx / 10)} cm</span></div></div>`
      );
    })
    .join("");
  $("opts").innerHTML = rest
    .map((k) => {
      const c = CDEF[k];
      if (c.t === "range") {
        const [mn, mx] = rangeOf(k),
          st = [];
        for (let i = mn; i <= mx; i++) st.push(`<span data-s="${i}">${i}</span>`);
        return (
          `<div class="ctl" data-k="${k}"><div class="ctl-head"><label for="r_${k}">${c.label}</label><span class="val count"><input id="n_${k}" type="number" inputmode="numeric" min="${mn}" max="${mx}" step="1" aria-label="${c.label}"></span></div>` +
          `<input type="range" id="r_${k}" min="${mn}" max="${mx}" step="1"><div class="steps" aria-hidden="true">${st.join("")}</div></div>`
        );
      }
      if (c.t === "seg")
        return `<div class="ctl${c.opts.length > 3 || k === "cajonera" ? " wide" : ""}" data-k="${k}"><span class="lbl">${c.label}</span><div class="seg" data-key="${k}" role="group" aria-label="${c.label}">${c.opts.map(([v, l]) => `<button type="button" data-v="${v}">${l}</button>`).join("")}</div></div>`;
      return `<div class="ctl wide" data-k="${k}"><label class="switch">${c.label}<input type="checkbox" id="t_${k}"></label></div>`;
    })
    .join("");
  dims.forEach((k) => {
    const n = $("n_" + k);
    n.addEventListener("input", () => {
      const v = +n.value,
        [mn, mx] = rangeOf(k);
      if (n.value !== "" && v >= mn && v <= mx) {
        S[k] = v;
        render();
      }
    });
    n.addEventListener("change", () => {
      const [mn, mx] = rangeOf(k);
      S[k] = clamp(+n.value || mn, mn, mx);
      render();
    });
    n.addEventListener("focus", () => n.select());
    tapes[k] = makeTape(k);
  });
  rest.forEach((k) => {
    const c = CDEF[k];
    if (c.t === "range") {
      const r = $("r_" + k),
        n = $("n_" + k);
      r.addEventListener("input", () => {
        S[k] = +r.value;
        render();
      });
      n.addEventListener("input", () => {
        const v = +n.value,
          [mn, mx] = rangeOf(k);
        if (n.value !== "" && v >= mn && v <= mx) {
          S[k] = v;
          render();
        }
      });
      n.addEventListener("change", () => {
        const [mn, mx] = rangeOf(k);
        S[k] = clamp(+n.value || mn, mn, mx);
        render();
      });
      n.addEventListener("focus", () => n.select());
    } else if (c.t === "seg")
      document.querySelector(`.seg[data-key="${k}"]`).addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (b) {
          S[k] = +b.dataset.v;
          render();
        }
      });
    else
      $("t_" + k).addEventListener("change", (e) => {
        S[k] = e.target.checked;
        render();
      });
  });
}
function syncControls() {
  const T = TYPES[S.type];
  CTRL[T.gen].forEach((k) => {
    const c = CDEF[k];
    if (c.t === "range") {
      const [mn, mx] = rangeOf(k);
      S[k] = clamp(S[k], mn, mx);
      const n = $("n_" + k);
      if (document.activeElement !== n) n.value = S[k];
      if (c.unit) {
        tapes[k]?.sync();
      } else {
        const r = $("r_" + k);
        r.value = S[k];
        r.style.setProperty("--p", ((S[k] - mn) / (mx - mn || 1)) * 100 + "%");
        document
          .querySelectorAll(`.ctl[data-k="${k}"] .steps span`)
          .forEach((s) => s.classList.toggle("on", +s.dataset.s === S[k]));
      }
    } else if (c.t === "seg")
      document
        .querySelectorAll(`.seg[data-key="${k}"] button`)
        .forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.v === S[k])));
    else $("t_" + k).checked = !!S[k];
  });
  const vis = (k, v) => {
    const el = document.querySelector(`.ctl[data-k="${k}"]`);
    if (el) el.hidden = !v;
  };
  if (T.gen === "caja") vis("divs", !(S.drawers > 0 && S.doors === 0 && S.shelves === 0));
  if (T.gen === "desk") vis("drawers", S.cajonera > 0);
  document
    .querySelectorAll("#esp button")
    .forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.v === S.e)));
  document
    .querySelectorAll("#mats .sw")
    .forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.m === S.mat)));
  document
    .querySelectorAll("#types .type")
    .forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.t === S.type)));
  const ids = Object.keys(ACT);
  $("openAll").hidden = !ids.length;
  $("openAll").textContent = ids.some((id) => !OPEN[id]) ? "Abrir todo" : "Cerrar todo";
  defaultHint = ids.length
    ? `Arrastrá los puntos amarillos o ${HOVER ? "hacé clic en" : "tocá"} ${ids.some((id) => ACT[id].type === "door") ? "una puerta" : "un cajón"}`
    : "Arrastrá los puntos amarillos";
}
function drawThumbs() {
  const keep = { ...S };
  $("types").innerHTML = Object.entries(TYPES)
    .map(
      ([k, T]) =>
        `<button type="button" class="type" data-t="${k}"><svg aria-hidden="true"></svg><span>${T.label}</span></button>`,
    )
    .join("");
  document.querySelectorAll("#types .type").forEach((b) => {
    const T = TYPES[b.dataset.t];
    Object.assign(S, { ...BASE, mat: keep.mat, e: keep.e, type: b.dataset.t }, T.d);
    drawRender(build(), b.querySelector("svg"), { thumb: true });
  });
  S = keep;
}
$("types").addEventListener("click", (e) => {
  const b = e.target.closest(".type");
  if (!b || b.dataset.t === S.type) return;
  const T = TYPES[b.dataset.t];
  S = { ...BASE, mat: S.mat, e: S.e, type: b.dataset.t, ...T.d };
  cancelAnimationFrame(animRaf);
  OPEN = {};
  PROG = {};
  hoverId = null;
  buildControls();
  render();
});
$("mats").innerHTML = Object.entries(MATS)
  .map(
    ([k, m]) =>
      `<button type="button" class="sw" data-m="${k}"><i class="${m.veta ? "veta" : ""}" style="background-color:${m.fill}"></i>${m.short}</button>`,
  )
  .join("");
$("mats").addEventListener("click", (e) => {
  const b = e.target.closest(".sw");
  if (b) {
    S.mat = b.dataset.m;
    drawThumbs();
    render();
  }
});
$("esp").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (b) {
    S.e = +b.dataset.v;
    render();
  }
});
