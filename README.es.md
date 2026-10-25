<h1 align="center">Taller de Despiece</h1>

<p align="center">
  Diseñá un mueble de melamina a medida en el navegador y obtené el despiece exacto, el plano de corte de cada placa y la lista de compras para la maderera.
</p>

<p align="center">
  <a href="https://taller-despiece.jaycodes.workers.dev"><strong>Ver demo</strong></a> ·
  <a href="README.md">Read in English</a> ·
  <a href="CHANGELOG.md">Registro de cambios</a>
</p>

<p align="center">
  <img alt="HTML5" src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white">
  <img alt="CSS3" src="https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black">
  <img alt="SVG y Canvas" src="https://img.shields.io/badge/SVG%20%2B%20Canvas-1c1f26">
  <img alt="Cloudflare Workers" src="https://img.shields.io/badge/Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white">
  <img alt="Sin dependencias" src="https://img.shields.io/badge/dependencias-0-f5c518">
</p>

<p align="center">
  <img src="docs/demo.gif" alt="Se estira una biblioteca con las cintas métricas, se abren las puertas de un placard y se cambia de mueble" width="820">
</p>

## Por qué lo hice

Hacer un mueble a medida tiene un paso aburrido y fácil de errar: pasar del dibujo a la lista de piezas. ¿Los laterales van enteros o entre la base y el techo? ¿Cuánto se descuenta por el espesor? ¿Qué lados llevan tapacanto? Herramientas como SketchUp con plugins o Polyboard lo resuelven, pero son pesadas para alguien que solo quiere una biblioteca.

Taller de Despiece hace esa cuenta en vivo. Elegís el mueble, lo estirás a medida y la app te dice cuántas placas comprar, cómo se corta cada una y qué herrajes necesitás.

## Funcionalidades

| | |
|---|---|
| **11 muebles paramétricos** | Biblioteca, escritorio, cómoda, mesa de luz, placard, rack TV, bajo mesada, alacena, zapatero, mesa ratona y banco. |
| **Medidas con cinta métrica** | Arrastrás una cinta, los puntos amarillos sobre el dibujo o escribís la medida exacta en milímetros. |
| **Armado interior** | Estantes, divisiones, cajones, puertas, zócalo, fondo, cajonera y faldón. |
| **Dibujo 3D interactivo** | Al pasar el mouse por una puerta o cajón se resalta; con un clic se abre con animación, o se abre todo junto. |
| **Despiece** | Cada pieza con medida, cantidad y qué lados llevan tapacanto, con un dibujito. |
| **Plano de corte** | Piezas acomodadas en placas de 2600 × 1830 mm, con sierra, refilado y sentido de la veta. |
| **Lista de compras** | Placas, fondo, metros de tapacanto, bisagras, correderas, soportes y tornillos. |
| **Avisos de carpintería** | Estantes que se van a pandear, puertas demasiado anchas, falta de fondo o faldón, muebles altos que hay que fijar a la pared. |
| **Pedido listo para mandar** | Con un clic copiás el despiece en texto para WhatsApp o mail. |
| **Modo claro y oscuro** | Sigue la configuración del sistema. Anda en celular, con teclado y con movimiento reducido. |

<p align="center">
  <img src="docs/screenshots/doors-open.png" alt="Placard de roble con las dos puertas abiertas junto a los controles" width="820">
</p>

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/cut-list.png" alt="Lista de compras y tabla de despiece"><br><sub>Lista de compras y despiece con tapacanto por lado.</sub></td>
    <td width="50%"><img src="docs/screenshots/cutting-plan.png" alt="Plano de corte en tres placas"><br><sub>Plano de corte en guillotina. Lo rayado es sobrante.</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/drawers.png" alt="Cómoda de nogal con cajones abiertos"><br><sub>Los cajones se deslizan y se resaltan al pasar el mouse.</sub></td>
    <td><img src="docs/screenshots/desk.png" alt="Escritorio grafito con cajonera"><br><sub>Escritorio con cajonera y faldón.</sub></td>
  </tr>
</table>

<table>
  <tr>
    <td width="62%"><img src="docs/screenshots/dark-mode.png" alt="Rack TV en modo oscuro"><br><sub>Modo oscuro.</sub></td>
    <td width="19%"><img src="docs/screenshots/mobile.png" alt="Vista en celular"></td>
    <td width="19%"><img src="docs/demo-mobile.gif" alt="Demo en celular"></td>
  </tr>
</table>

## Aspectos técnicos

**Modelo paramétrico de muebles.** Cada tipo de mueble es una función generadora. A partir de ancho, alto, profundidad, espesor y opciones produce a la vez la lista de piezas y las cajas 3D del dibujo, así que nunca se contradicen. Resuelve uniones, zócalos, cajas de cajón y elige el largo de corredera según la profundidad disponible.

**Optimizador de corte.** Heurística de bin packing 2D con cortes en guillotina, que es como trabaja una escuadradora. Ordena las piezas por el lado más largo y las ubica con el criterio de menor sobrante, descontando sierra y refilado. Rota piezas salvo que el material tenga veta.

**Motor 3D hecho a mano.** Sin WebGL ni librerías 3D. Las cajas se proyectan en perspectiva oblicua sobre SVG. El orden de dibujo sale de un ordenamiento topológico por comparación de profundidad (algoritmo del pintor) y las caras ocultas se descartan por el signo de su área proyectada. Las puertas son prismas que giran sobre la bisagra, y el encuadre se interpola mientras se abren para que nada salte.

**Slider propio de cinta métrica.** Hecho en Canvas con escalado por densidad de píxeles. Soporta arrastre con inercia, rueda horizontal y teclado (flechas, Shift, Re Pág/Av Pág, Inicio/Fin), y expone `role="slider"` con valores ARIA en vivo.

**Sistema de diseño.** Tokens de color y tipografía con paleta clara y oscura, grilla responsive que se apila en celular, soporte de `prefers-reduced-motion` y foco visible con teclado. El último diseño queda guardado en `localStorage`.

**Sin build.** Unas 2.500 líneas de JavaScript y CSS sin frameworks, separadas por responsabilidad, publicadas como archivos estáticos en Cloudflare Workers.

## Estructura del proyecto

```
public/
├── index.html          Estructura y metadatos (Open Graph, favicon)
├── css/styles.css      Tokens de diseño, layout y componentes
└── js/
    ├── config.js       Placa, materiales, catálogo de muebles, estado
    ├── model.js        Generadores paramétricos de muebles
    ├── render3d.js     Proyección oblicua, puertas y cajones
    ├── cutting.js      Bin packing en guillotina y dibujo de placas
    ├── tape.js         Componente de cinta métrica
    ├── render.js       Despiece, compras, avisos, texto del pedido
    ├── controls.js     Controles, catálogo y materiales
    ├── interactions.js Hover, clic y teclado en puertas y cajones
    └── main.js         Arrastre sobre el dibujo, copiar pedido, inicio
docs/                   Capturas y GIFs de este README
wrangler.jsonc          Configuración de Cloudflare Workers
```

## Correrlo local

Abrí `public/index.html` en el navegador, o usá el servidor de desarrollo de Workers:

```bash
npx wrangler dev
```

## Publicar

```bash
npx wrangler login
npx wrangler deploy
```

## Próximas actualizaciones

Cada una pasa al [registro de cambios](CHANGELOG.md) cuando sale.

- [ ] Exportar el despiece y el plano de corte en PDF
- [ ] Presupuesto estimado con lista de precios editable
- [ ] Links para compartir un diseño guardado
- [ ] Muebles de varios cuerpos (por ejemplo, placard de dos módulos)
- [ ] Frentes de cajón embutidos y uniones configurables
- [ ] Tests unitarios del modelo de muebles y del optimizador de corte
- [ ] Versión en React con react-three-fiber y vista 3D real

## Limitaciones

El despiece asume un solo método de armado: laterales enteros, techo y base entre los laterales y puertas superpuestas. El plano de corte es una heurística, así que el optimizador de una maderera puede ahorrar una placa. La ferretería es estimada. Confirmá siempre las medidas antes de cortar.

## Autor

Diseñado y desarrollado por **Juan Cruz (Jay)**, desarrollador frontend en Mar del Plata, Argentina.
<!-- Agregá tus links: LinkedIn, portfolio, email -->

© 2026 Juan Cruz. Todos los derechos reservados.
