// Historias del paso 7, "Convivir con los pozos": vecinos que viven al lado de pozos, según la prensa local y
// el municipio. Cada historia tiene sus pozos (idpozo del Capítulo IV: el estado, la operadora y el barrio se
// leen de las fichas, no se escriben acá), un resumen y sus fuentes.
//
// Reglas (CLAUDE.md): las historias son la única parte de la pieza que cita prensa; siempre atribuida
// ("según publicó…") y con enlace; si hay fuente oficial va primero. Sin nombres de vecinos. Lo que el medio
// afirma (contaminación, pozos "sin sellar") va atribuido al medio, nunca como afirmación propia.
// TEXTOS PROVISORIOS: los escribió Claude a partir de las notas; los revisa Aldana.

import { ESTADOS } from './paleta.js';
import { cargarFicha, esc } from './data.js';
import { htmlFuente } from './fuentes.js';

// Fuentes de las historias. Primero la oficial (si hay), después la prensa, por fecha.
const N = {
  laNacion2002: { t: 'La Nación, 27/5/2002', url: 'https://www.lanacion.com.ar/sociedad/peligro-bajo-tierra-en-comodoro-rivadavia-nid399990/' },
  patagonico2015: { t: 'El Patagónico, 18/3/2015', url: 'https://www.elpatagonico.com/la-escuela-que-se-construyo-tres-pozos-petroleros-que-no-habian-sido-sellados-n773657' },
  muni20240625: { t: 'Municipalidad de Comodoro Rivadavia, 25/6/2024', url: 'https://www.comodoro.gov.ar/2024/06/25/coluccio-se-esta-evaluando-la-distancia-y-el-alcance-de-la-contingencia/' },
  chubut20240706: { t: 'El Chubut, 6/7/2024', url: 'https://www.elchubut.com.ar/regionales/2024-7-5-21-35-0-provincia-sanciono-a-ypf-por-el-derrame-de-hidrocarburos-en-bella-vista' },
  extremoSur20240711: { t: 'El Extremo Sur, 11/7/2024', url: 'https://www.elextremosur.com/nota/49898-derrames-y-pozos-abandonados-a-la-vuelta-de-la-esquina-una-ciudad-que-crecio-de-la-mano-del-petroleo/' },
  jornada20260121: { t: 'Diario Jornada, 21/1/2026', url: 'https://www.diariojornada.com.ar/409911/magazine/derrumbe_emergio_un_pozo_petrolero_dentro_de_su_casa' },
  chubut20260210: { t: 'El Chubut, 10/2/2026', url: 'https://www.elchubut.com.ar/regionales/2026-2-10-21-55-0-cerro-hermitte-aseguran-que-la-actividad-petrolera-no-fue-el-origen-de-los-deslizamientos' },
  adnsur20260227: { t: 'ADNSur, 27/2/2026', url: 'https://www.adnsur.com.ar/sociedad/cavaba-un-pozo-en-su-patio-de-la-zona-norte-de-comodoro-y-se-encontro-con-petroleo_a69a227fe66a78182fdf02017' },
  muni20240827: { t: 'Municipalidad de Comodoro Rivadavia, 27/8/2024', url: 'https://www.comodoro.gov.ar/2024/08/27/el-municipio-intervino-ante-un-nuevo-derrame-de-petroleo-en-un-yacimiento-ypf/' },
};

// relacion: 'fuente' = la fuente nombra el pozo; 'autores' = las notas no lo nombran y la relación con el
// registro la establecieron los autores (se aclara en la ventana y en Metodología).
export const HISTORIAS = [
  {
    id: 'escuela-169',
    foto: { nombre: 'escuela', credito: 'El Patagónico', url: N.patagonico2015.url, alt: 'Cartel de la Escuela Provincial N° 169 Estrella de Mar, del barrio Stella Maris, frente al edificio de la escuela' },
    titulo: 'La Escuela N° 169',
    rotulo: 'Gas en la Escuela 169',
    icono: 'escuela',
    pozos: [92810, 92730, 70082], // R-87, R-88, S/L-564
    relacion: 'autores',
    fecha: '2001–2002',
    texto: [
      'Un olor a gas persistente en la escuela del barrio Stella Maris obligó a suspender las clases y a trasladar a los alumnos a otro edificio. Según La Nación (mayo de 2002), estudios de Repsol YPF encontraron debajo de la cocina un pozo que nunca había sido sellado.',
      'El Patagónico (2015) ubica el hallazgo en abril de 2001 y cuenta que la escuela se había construido sobre tres pozos que, según el diario, no habían sido sellados. Funcionó casi diez años en sedes provisorias, hasta que la Provincia inauguró un edificio nuevo en diciembre de 2011.',
    ],
    fuentes: [N.laNacion2002, N.patagonico2015],
  },
  {
    id: 'bella-vista',
    foto: { nombre: 'bella-vista', credito: 'Municipalidad de Comodoro Rivadavia', url: N.muni20240625.url, alt: 'Crudo derramado entre pastizales y tierra removida; al fondo, casas y una camioneta' },
    titulo: 'Un derrame en Bella Vista Sur',
    rotulo: 'Crudo en Bella Vista',
    icono: 'gota',
    pozos: [161850], // YPF.Ch.BV-577(d)
    relacion: 'fuente',
    fecha: '25 de junio de 2024',
    texto: [
      'Según la Municipalidad, un derrame de crudo de YPF cubrió de madrugada al menos 600 metros, incluidos terrenos de vecinos. El municipio pidió cuidar a chicos y mascotas, y cuestionó el plan de contingencia de la empresa.',
      'En julio, la Secretaría de Ambiente de Chubut multó a YPF por la rotura de la línea de conducción del pozo BV-577(d), con la Disposición 011/2024, según El Chubut. Es un pozo que el registro declara en producción.',
    ],
    fuentes: [N.muni20240625, N.chubut20240706, N.extremoSur20240711],
  },
  {
    id: 'casa-325',
    foto: { nombre: 'pozo-sismografica', credito: 'video de un vecino, publicado por Diario Jornada', url: N.jornada20260121.url, alt: 'La boca de un pozo entre los escombros del piso roto de una casa' },
    titulo: 'Un pozo dentro de una casa',
    rotulo: 'Un pozo bajo el piso',
    icono: 'casa',
    pozos: [121326], // YPF.Ch.-325
    relacion: 'autores',
    fecha: 'enero de 2026',
    texto: [
      'Durante el deslizamiento del cerro Hermitte, que obligó a evacuar a más de 90 familias, un pozo petrolero rompió el piso de una casa del sector Sismográfica y quedó a la vista, según Diario Jornada.',
      'La nota atribuye el derrumbe a la inestabilidad del terreno, advertida por estudios geológicos de hace más de veinte años. En febrero, el secretario de Ambiente de Chubut afirmó que la actividad petrolera no fue el origen de los deslizamientos (El Chubut).',
    ],
    fuentes: [N.jornada20260121, N.chubut20260210],
  },
  {
    id: 'patio-724',
    foto: { nombre: 'pozo-arbol', credito: 'ADNSur', url: N.adnsur20260227.url, alt: 'Petróleo aflorando en un hueco de tierra, junto a un borde de cemento' },
    titulo: 'Petróleo en un patio',
    rotulo: 'Petróleo en el patio',
    icono: 'brote',
    pozos: [121660], // YPF.Ch.-724
    relacion: 'autores',
    fecha: 'febrero de 2026',
    texto: [
      'Un vecino de Km 5 cavaba en su patio para plantar un árbol y, a poco más de un metro de profundidad, empezó a brotar petróleo, según ADNSur. La familia no hizo la denuncia: lo tomó como algo normal.',
      'En la misma nota, el subsecretario de Ambiente municipal explicó que un pozo inactivo sigue abierto y puede tener surgencias, y anunció un pedido formal a la nueva operadora.',
    ],
    fuentes: [N.adnsur20260227],
  },
  {
    id: 'ch-679',
    foto: { nombre: 'derrame-laprida', credito: 'Municipalidad de Comodoro Rivadavia', url: N.muni20240827.url, alt: 'Vista aérea de un curso de agua con manchas de hidrocarburo, entre arbustos y tierra' },
    titulo: 'La surgencia del CH-679',
    rotulo: 'Surgencia en Laprida',
    icono: 'agua',
    pozos: [121621], // YPF.Ch.-679
    relacion: 'fuente',
    fecha: '25 de agosto de 2024',
    texto: [
      'Un derrame en Yacimiento Central, camino al barrio Laprida, afectó el suelo y parte del arroyo Belgrano. Según la Municipalidad, lo originó una surgencia del pozo CH-679, perforado en 1927 y abandonado —aparentemente— en 1962, antes de la Resolución SE 5/96.',
      'El municipio le exigió por acta a YPF estudios de integridad de sus pozos abandonados, elevó el caso a la Justicia y anunció un relevamiento de los pozos cercanos a viviendas.',
    ],
    fuentes: [N.muni20240827],
  },
];

// Íconos de los marcadores (trazo, en el color del texto; el borde del círculo lleva el color del estado
// declarado del pozo, como el marcador del Pozo N° 2). Dibujados a mano en SVG, viewBox 16 × 16.
const ICONOS = {
  escuela: 'M2 14.5h12M3 14.5V7.5L8 4.5l5 3v7M6.5 14.5v-3.5h3v3.5M8 4.5V1.5l2.6.8L8 3.1', // edificio con bandera
  gota: 'M8 1.8C8 1.8 3.6 7 3.6 10.1a4.4 4.4 0 0 0 8.8 0C12.4 7 8 1.8 8 1.8z', // gota de crudo
  casa: 'M2 8l6-5.5L14 8M3.5 6.8v7.7h9V6.8M8.4 14.5l-1.2-2.4 1.8-1.6-1.1-2', // casa con el piso partido
  brote: 'M8 14.5V7M8 9.2C8 6.6 5.8 5.3 3.2 5.3c0 2.4 2 3.9 4.8 3.9M8 7.6c0-2.6 2-4.3 4.8-4.3 0 2.9-2 4.3-4.8 4.3M4.5 14.5h7', // brote (cavaba para plantar un árbol)
  agua: 'M1.5 6.2c2-1.5 3.5 1.5 6.5 0s4.5 1.5 6.5 0M1.5 10.2c2-1.5 3.5 1.5 6.5 0s4.5 1.5 6.5 0', // arroyo
};
const svgIcono = (nombre) => (ICONOS[nombre]
  ? `<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONOS[nombre]}"/></svg>`
  : '');

/** Todas las fuentes de las historias, sin repetir (para Metodología). */
export const FUENTES_HISTORIAS = Object.values(N);

/** Todos los pozos de las historias (para el encuadre y los anillos del paso 7). */
export const POZOS_HISTORIAS = [...new Set(HISTORIAS.flatMap((h) => h.pozos))];

// ---- ventana de una historia (diálogo no modal, como la ficha de un pozo) ----
let mapa = null, margen = null, alCerrar = null;
let abierta = null, focoPrevio = null, pedido = 0;

/** Conecta las historias con el mapa: marcadores en el paso 7 y vuelo a los pozos al abrir una. */
export function conectarHistorias({ mapa: m, margen: fnMargen, alCerrar: fnCerrar }) {
  mapa = m; margen = fnMargen; alCerrar = fnCerrar;
  mapa.historias(HISTORIAS.map((h) => ({ ...h, svg: svgIcono(h.icono) })), abrirHistoria);
}

function dialogo() {
  const el = document.getElementById('historia');
  if (!el.dataset.listo) {
    el.dataset.listo = '1';
    el.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') cerrarHistoria(); });
  }
  return el;
}

// Tarjeta flotante (abajo a la derecha; en celular, hoja desde abajo): foto, título, fecha y el comienzo del
// texto; "Seguir leyendo" despliega el resto, los pozos y las fuentes. Flechas para pasar de historia.
const flecha = (dir) => `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${dir < 0 ? 'M10 3 L5 8 L10 13' : 'M6 3 L11 8 L6 13'}"/></svg>`;

export async function abrirHistoria(id, { desplegada = false } = {}) {
  const i = HISTORIAS.findIndex((x) => x.id === id);
  if (i < 0) return;
  const h = HISTORIAS[i];
  const el = dialogo();
  const este = ++pedido;
  if (!abierta) focoPrevio = document.activeElement;
  abierta = h;
  marcarActiva(h.id);
  mapa?.encuadrar(h.pozos, { padding: margen?.(), zoomMax: 15.5 });
  // los datos de cada pozo salen de las fichas (estado declarado, operadora, barrio)
  const fichas = await Promise.all(h.pozos.map((p) => cargarFicha(p).catch(() => null)));
  if (este !== pedido) return; // mientras cargaba, se abrió otra
  const barrios = [...new Set(fichas.map((f) => f?.b).filter(Boolean))];
  const meta = [h.fecha, barrios.length ? `Barrio ${barrios.join(' y ')}` : ''].filter(Boolean).join(' · ');
  const n = HISTORIAS.length;
  const anterior = HISTORIAS[(i - 1 + n) % n], siguiente = HISTORIAS[(i + 1) % n];
  const [primero, ...resto] = h.texto;
  const pozosTexto = `${h.pozos.length} ${h.pozos.length > 1 ? 'pozos' : 'pozo'}`;
  el.innerHTML = `
    ${h.foto ? `<img class="historia-foto" src="${import.meta.env.BASE_URL}img/historias/${esc(h.foto.nombre)}.webp" alt="${esc(h.foto.alt)}">` : ''}
    <div class="historia-cuerpo">
      <div class="historia-cabeza">
        <p class="kicker">Historia ${i + 1} de ${n}</p>
        <button type="button" class="cerrar" aria-label="Cerrar historia">×</button>
      </div>
      <h3 class="historia-titulo" id="historia-titulo">${esc(h.titulo)}</h3>
      ${meta ? `<p class="historia-meta">${esc(meta)}</p>` : ''}
      <p class="historia-lead">${esc(primero || '')}</p>
      <div class="historia-mas" id="historia-mas"${desplegada ? '' : ' hidden'}>
        ${resto.map((p) => `<p>${esc(p)}</p>`).join('')}
        <p class="historia-sub">${h.pozos.length > 1 ? 'Los pozos' : 'El pozo'}, según el registro</p>
        <ul class="historia-pozos">${fichas.map((f) => (f ? itemPozo(f) : '')).join('')}</ul>
        <p class="historia-nota">Estado declarado por la operadora ante la Secretaría de Energía; no describe el estado físico del pozo.${h.relacion === 'autores'
          ? ` Las notas no nombran ${h.pozos.length > 1 ? 'los pozos' : 'el pozo'}: la relación con el registro la establecieron los autores.` : ''}</p>
        ${h.fuentes.length ? `<p class="historia-sub">Fuentes</p><p class="historia-fuentes">${htmlFuente(h.fuentes)}</p>` : ''}
      </div>
      <button type="button" class="historia-leer" aria-expanded="${desplegada}" aria-controls="historia-mas">${desplegada ? 'Ver menos' : `Seguir leyendo · ${pozosTexto} · fuentes`}</button>
      <div class="historia-nav">
        <button type="button" class="historia-flecha" data-ir="${anterior.id}" aria-label="Historia anterior: ${esc(anterior.titulo)}">${flecha(-1)}</button>
        ${h.foto ? `<p class="historia-credito">Foto: ${htmlFuente([{ t: h.foto.credito, url: h.foto.url }])}</p>` : '<span></span>'}
        <button type="button" class="historia-flecha" data-ir="${siguiente.id}" aria-label="Historia siguiente: ${esc(siguiente.titulo)}">${flecha(1)}</button>
      </div>
    </div>`;
  el.classList.remove('hidden');
  el.scrollTop = 0;
  el.querySelector('.cerrar').addEventListener('click', () => cerrarHistoria());
  const leer = el.querySelector('.historia-leer'), mas = el.querySelector('.historia-mas');
  leer.addEventListener('click', () => {
    const abrir = mas.hidden;
    mas.hidden = !abrir;
    leer.setAttribute('aria-expanded', String(abrir));
    leer.textContent = abrir ? 'Ver menos' : `Seguir leyendo · ${pozosTexto} · fuentes`;
  });
  // las flechas mantienen desplegado o plegado lo que el usuario eligió
  el.querySelectorAll('.historia-flecha').forEach((b) => b.addEventListener('click', () => abrirHistoria(b.dataset.ir, { desplegada: !mas.hidden })));
  el.querySelector('.cerrar').focus({ preventScroll: true });
}

// La historia abierta se marca en la lista de la tarjeta y en su marcador del mapa.
function marcarActiva(id) {
  document.querySelectorAll('.historia-btn, .marcador-historia').forEach((b) => {
    const activa = b.dataset.historia === id;
    b.classList.toggle('activa', activa);
    if (b.classList.contains('historia-btn')) b.setAttribute('aria-current', activa ? 'true' : 'false');
  });
}

function itemPozo(f) {
  const e = ESTADOS.find((x) => x.nombre === f.g);
  const operadora = f.e ? esc(f.e) : '<em>sin empresa asignada</em>';
  const antes = f.ea && f.ea !== f.e ? ` (antes, ${esc(f.ea)})` : '';
  return `<li><span class="ley-dot" style="background:${e?.hex}" aria-hidden="true"></span><span><b>${esc(f.s)}</b><span class="historia-estado">${esc(f.est)}</span><br><span class="historia-op">${operadora}${antes}${f.b ? ` · barrio ${esc(f.b)}` : ''}</span></span></li>`;
}

/** Cierra la ventana. Con volver: true (el botón o Escape) el mapa vuelve a mostrar todas las historias. */
export function cerrarHistoria({ volver = true } = {}) {
  if (!abierta) return;
  pedido++;
  abierta = null;
  marcarActiva(null);
  const el = document.getElementById('historia');
  el.classList.add('hidden');
  el.innerHTML = '';
  if (volver) {
    alCerrar?.();
    if (focoPrevio && document.contains(focoPrevio)) focoPrevio.focus({ preventScroll: true });
  }
  focoPrevio = null;
}
