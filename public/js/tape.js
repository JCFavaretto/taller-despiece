/* Taller de Despiece · Componente de cinta métrica en Canvas: arrastre con inercia, rueda y teclado. */

const PX = 0.5; // px por mm
let tapes = {},
  C = {};
function readColors() {
  const cs = getComputedStyle(document.documentElement),
    v = (n) => cs.getPropertyValue(n).trim();
  C = { tape: v("--tape"), ink: v("--tape-ink"), red: v("--tape-red"), metal: v("--muted") };
  Object.values(tapes).forEach((t) => t.draw());
}
function makeTape(k) {
  const host = $("tape_" + k),
    cv = host.querySelector("canvas"),
    ctx = cv.getContext("2d");
  const T = { k, host, pos: S[k], busy: false, active: false, raf: 0 };
  T.range = () => rangeOf(k);
  T.draw = () => {
    const dpr = window.devicePixelRatio || 1,
      w = host.clientWidth,
      h = host.clientHeight;
    if (!w) return;
    const W2 = Math.round(w * dpr),
      H2 = Math.round(h * dpr);
    if (cv.width !== W2 || cv.height !== H2) {
      cv.width = W2;
      cv.height = H2;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const [mn, mx] = T.range(),
      cx = w / 2,
      X = (mm) => cx + (mm - T.pos) * PX,
      top = 7,
      bh = h - 15;
    const x0 = Math.max(-2, X(mn)),
      x1 = Math.min(w + 2, X(mx));
    ctx.fillStyle = "rgba(0,0,0,.18)";
    ctx.fillRect(x0, top + bh, x1 - x0, 2);
    ctx.fillStyle = C.tape;
    ctx.fillRect(x0, top, x1 - x0, bh);
    if (X(mn) > -6) {
      ctx.fillStyle = C.metal;
      ctx.fillRect(X(mn) - 7, top - 3, 7, bh + 6);
    }
    if (X(mx) < w + 6) {
      ctx.fillStyle = C.ink;
      ctx.fillRect(X(mx), top, 3, bh);
    }
    const from = Math.max(mn, Math.ceil((T.pos - cx / PX) / 10) * 10),
      to = Math.min(mx, T.pos + cx / PX);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    for (let mm = Math.ceil(from / 10) * 10; mm <= to; mm += 10) {
      const x = Math.round(X(mm)),
        L = mm % 100 === 0 ? bh * 0.46 : mm % 50 === 0 ? bh * 0.3 : bh * 0.17;
      ctx.fillStyle = C.ink;
      ctx.fillRect(x, top, 1, L);
      if (mm % 100 === 0) {
        const m1 = mm % 1000 === 0;
        ctx.fillStyle = m1 ? C.red : C.ink;
        ctx.font = `${m1 ? 800 : 700} ${m1 ? 13 : 12}px Archivo, sans-serif`;
        ctx.fillText(m1 ? `${mm / 1000} m` : String(mm / 10), x, top + bh - 6);
      }
    }
  };
  T.move = (d) => {
    const [mn, mx] = T.range();
    T.pos = clamp(T.pos + d, mn, mx);
    T.draw();
    const v = clamp(Math.round(T.pos / 10) * 10, mn, mx);
    if (v !== S[k]) {
      S[k] = v;
      render();
    }
  };
  T.settle = () => {
    T.busy = false;
    T.pos = S[k];
    T.draw();
    host.setAttribute("aria-valuenow", S[k]);
  };
  T.sync = () => {
    if (!T.busy) {
      T.pos = S[k];
      T.draw();
    }
    host.setAttribute("aria-valuenow", S[k]);
    host.setAttribute("aria-valuetext", `${S[k]} milímetros`);
  };
  host.addEventListener("pointerdown", (e) => {
    if (e.button) return;
    cancelAnimationFrame(T.raf);
    host.setPointerCapture(e.pointerId);
    T.active = T.busy = true;
    T.lx = e.clientX;
    T.lt = performance.now();
    T.vel = 0;
    host.classList.add("dragging");
    host.focus({ preventScroll: true });
  });
  host.addEventListener("pointermove", (e) => {
    if (!T.active) return;
    const now = performance.now(),
      dx = e.clientX - T.lx,
      dt = Math.max(1, now - T.lt);
    T.vel = 0.7 * (dx / dt) + 0.3 * T.vel;
    T.lx = e.clientX;
    T.lt = now;
    T.move(-dx / PX);
  });
  const up = () => {
    if (!T.active) return;
    T.active = false;
    host.classList.remove("dragging");
    if (!REDUCE && Math.abs(T.vel) > 0.12 && performance.now() - T.lt < 80) {
      let v = T.vel,
        last = performance.now();
      const step = (now) => {
        const dt = now - last;
        last = now;
        T.move((-v * dt) / PX);
        v *= Math.pow(0.993, dt);
        const [mn, mx] = T.range();
        if (Math.abs(v) > 0.02 && T.pos > mn && T.pos < mx) T.raf = requestAnimationFrame(step);
        else T.settle();
      };
      T.raf = requestAnimationFrame(step);
    } else T.settle();
  };
  host.addEventListener("pointerup", up);
  host.addEventListener("pointercancel", up);
  host.addEventListener(
    "wheel",
    (e) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!d) return;
      e.preventDefault();
      cancelAnimationFrame(T.raf);
      T.busy = true;
      T.move((d / PX) * 0.5);
      clearTimeout(T.wt);
      T.wt = setTimeout(T.settle, 160);
    },
    { passive: false },
  );
  host.addEventListener("keydown", (e) => {
    const [mn, mx] = T.range(),
      st = e.shiftKey ? 100 : 10;
    let v = S[k];
    if (e.key === "ArrowRight" || e.key === "ArrowUp") v += st;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") v -= st;
    else if (e.key === "PageUp") v += 100;
    else if (e.key === "PageDown") v -= 100;
    else if (e.key === "Home") v = mn;
    else if (e.key === "End") v = mx;
    else return;
    e.preventDefault();
    S[k] = clamp(v, mn, mx);
    render();
  });
  new ResizeObserver(() => T.draw()).observe(host);
  return T;
}
