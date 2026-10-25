/* Taller de Despiece · Configuración: placa, materiales, catálogo de muebles, controles y estado. */

const SHEET_L = 2600,
  SHEET_A = 1830,
  REFILE = 10,
  KERF = 4;
const MATS = {
  blanco: { name: "Melamina blanca", short: "Blanca", fill: "#f2f0ea", veta: false, canto: true },
  roble: { name: "Melamina roble", short: "Roble", fill: "#c79a66", veta: true, canto: true },
  nogal: { name: "Melamina nogal", short: "Nogal", fill: "#7d5a3c", veta: true, canto: true },
  grafito: {
    name: "Melamina grafito",
    short: "Grafito",
    fill: "#666b70",
    veta: false,
    canto: true,
  },
  mdf: { name: "MDF crudo", short: "MDF", fill: "#b9996d", veta: false, canto: false },
};
const TYPES = {
  biblioteca: {
    label: "Biblioteca",
    gen: "caja",
    d: { W: 800, H: 1800, D: 300, shelves: 4, divs: 0, doors: 0, drawers: 0, zocalo: 70 },
    r: { W: [300, 2400], H: [400, 2500], D: [200, 500] },
  },
  escritorio: {
    label: "Escritorio",
    gen: "desk",
    d: { W: 1200, H: 750, D: 600, cajonera: 2, drawers: 3, faldon: true },
    r: { W: [800, 2000], H: [700, 800], D: [450, 800] },
  },
  comoda: {
    label: "Cómoda",
    gen: "caja",
    d: { W: 900, H: 850, D: 450, shelves: 0, divs: 0, doors: 0, drawers: 4, zocalo: 70 },
    r: { W: [400, 1400], H: [500, 1300], D: [350, 550] },
  },
  luz: {
    label: "Mesa de luz",
    gen: "caja",
    d: { W: 450, H: 550, D: 400, shelves: 1, divs: 0, doors: 0, drawers: 1, zocalo: 0 },
    r: { W: [300, 700], H: [350, 750], D: [300, 500] },
  },
  placard: {
    label: "Placard",
    gen: "caja",
    d: { W: 1000, H: 2000, D: 550, shelves: 3, divs: 1, doors: 2, drawers: 0, zocalo: 70 },
    r: { W: [500, 2400], H: [1200, 2500], D: [400, 650] },
  },
  rack: {
    label: "Rack TV",
    gen: "caja",
    d: { W: 1600, H: 450, D: 400, shelves: 0, divs: 2, doors: 0, drawers: 0, zocalo: 0 },
    r: { W: [800, 2400], H: [300, 700], D: [300, 550] },
  },
  bajo: {
    label: "Bajo mesada",
    gen: "caja",
    d: { W: 800, H: 820, D: 560, shelves: 1, divs: 0, doors: 2, drawers: 0, zocalo: 100 },
    r: { W: [300, 1200], H: [700, 900], D: [450, 600] },
  },
  alacena: {
    label: "Alacena",
    gen: "caja",
    d: { W: 800, H: 600, D: 320, shelves: 1, divs: 0, doors: 2, drawers: 0, zocalo: 0 },
    r: { W: [300, 1200], H: [300, 900], D: [250, 400] },
  },
  zapatero: {
    label: "Zapatero",
    gen: "caja",
    d: { W: 800, H: 1000, D: 320, shelves: 4, divs: 0, doors: 2, drawers: 0, zocalo: 70 },
    r: { W: [400, 1400], H: [500, 1800], D: [250, 400] },
  },
  ratona: {
    label: "Mesa ratona",
    gen: "mesa",
    d: { W: 1000, H: 420, D: 550, bandeja: true },
    r: { W: [600, 1500], H: [300, 550], D: [400, 800] },
  },
  banco: {
    label: "Banco",
    gen: "mesa",
    d: { W: 900, H: 450, D: 350, bandeja: true },
    r: { W: [400, 1800], H: [400, 500], D: [280, 450] },
  },
};
const CTRL = {
  caja: ["W", "H", "D", "shelves", "divs", "drawers", "doors", "zocalo", "fondo"],
  desk: ["W", "H", "D", "cajonera", "drawers", "faldon"],
  mesa: ["W", "H", "D", "bandeja"],
};
const CDEF = {
  W: { t: "range", label: "Ancho", unit: "mm", step: 10 },
  H: { t: "range", label: "Alto", unit: "mm", step: 10 },
  D: { t: "range", label: "Profundidad", unit: "mm", step: 10 },
  shelves: { t: "range", label: "Estantes por hueco", min: 0, max: 8, step: 1 },
  divs: { t: "range", label: "Divisiones", min: 0, max: 4, step: 1 },
  drawers: { t: "range", label: "Cajones", min: 0, max: 6, step: 1 },
  doors: {
    t: "seg",
    label: "Puertas",
    opts: [
      [0, "Sin"],
      [1, "1"],
      [2, "2"],
    ],
  },
  zocalo: {
    t: "seg",
    label: "Zócalo",
    opts: [
      [0, "No"],
      [70, "7 cm"],
      [100, "10 cm"],
    ],
  },
  cajonera: {
    t: "seg",
    label: "Cajonera",
    opts: [
      [0, "No"],
      [1, "Izquierda"],
      [2, "Derecha"],
    ],
  },
  fondo: { t: "toggle", label: "Fondo de fibrofácil" },
  faldon: { t: "toggle", label: "Faldón trasero" },
  bandeja: { t: "toggle", label: "Estante inferior" },
};
const BASE = {
  type: "biblioteca",
  mat: "blanco",
  e: 18,
  fondo: true,
  hideDoors: false,
  shelves: 0,
  divs: 0,
  doors: 0,
  drawers: 0,
  zocalo: 0,
  cajonera: 0,
  faldon: true,
  bandeja: true,
};
let S;
try {
  S = { ...BASE, ...TYPES.biblioteca.d, ...JSON.parse(localStorage.getItem("despiece2") || "{}") };
} catch (_) {
  S = { ...BASE, ...TYPES.biblioteca.d };
}
if (!TYPES[S.type]) S = { ...BASE, ...TYPES.biblioteca.d };
const save = () => {
  try {
    localStorage.setItem("despiece2", JSON.stringify(S));
  } catch (_) {}
};

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fmt = (n) => Math.round(n).toLocaleString("es-AR");
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
function rangeOf(k) {
  const T = TYPES[S.type];
  if (T.r[k]) return T.r[k];
  if (k === "drawers") return T.gen === "desk" ? [1, 5] : [0, 6];
  return [CDEF[k].min, CDEF[k].max];
}
