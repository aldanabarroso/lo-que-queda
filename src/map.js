// Mapa: MapLibre GL como base + deck.gl (MapboxOverlay) para los pozos y los polígonos.
// Un solo ScatterplotLayer con los 44.390 pozos; los filtros se aplican en GPU
// con DataFilterExtension, así cambiar de estado/operadora no reconstruye nada.

import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer, GeoJsonLayer, TextLayer } from '@deck.gl/layers';
import { DataFilterExtension, CollisionFilterExtension, PathStyleExtension } from '@deck.gl/extensions';
import { ESTADOS, PALETA, POBLACION_RAMPA, POBLACION_CORTES } from './paleta.js';
import { cargarFicha, fmt, esc } from './data.js';

// Mapa base. Por defecto, OpenFreeMap (vectorial, gratuito, sin clave) con los rótulos forzados al
// nombre en castellano de OpenStreetMap (`name:es`): así dice "Islas Malvinas" y no "Falklands".
// Probado el 20/09/2026. Alternativa: Argenmap del Instituto Geográfico Nacional (cartografía oficial,
// raster); se desatura para el estilo papel. Ese día el servidor del IGN no respondía, por eso no es
// el predeterminado: con MAPA_BASE = 'ign' se prueba un tile y, si no llega en 5 s, se usa OpenFreeMap.
const MAPA_BASE = 'openfreemap'; // 'openfreemap' | 'ign'

const ESTILO_OPENFREEMAP = 'https://tiles.openfreemap.org/styles/positron';
const TILE_PRUEBA_IGN = 'https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/capabaseargenmap@EPSG%3A3857@png/7/44/43.png';

const ESTILO_IGN = {
  version: 8,
  sources: {
    argenmap: {
      type: 'raster',
      tiles: ['https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/capabaseargenmap@EPSG%3A3857@png/{z}/{x}/{y}.png'],
      tileSize: 256,
      scheme: 'tms',
      maxzoom: 18,
      attribution: '© <a href="https://www.ign.gob.ar/">Instituto Geográfico Nacional</a> (Argenmap)',
    },
  },
  layers: [
    { id: 'fondo', type: 'background', paint: { 'background-color': PALETA.fondo } },
    { id: 'argenmap', type: 'raster', source: 'argenmap',
      paint: { 'raster-saturation': -1, 'raster-opacity': 0.55, 'raster-contrast': -0.15, 'raster-brightness-min': 0.1 } },
  ],
};

// Estilo mínimo local: fondo papel sin tiles. Se usa mientras carga el remoto y como respaldo
// si el proveedor no responde (la pieza sigue funcionando: los pozos y los límites son nuestros).
const ESTILO_RESPALDO = {
  version: 8,
  sources: {},
  layers: [{ id: 'fondo', type: 'background', paint: { 'background-color': PALETA.fondo } }],
};

const VISTA_INICIAL = { center: [-66.5, -41.5], zoom: 4.3 }; // la de la portada: el país, sin pozos
const ZOOM_ROTULOS_BARRIOS = 12.5; // por debajo, los nombres de barrio se pisan
const FUENTE_ROTULOS = '"Source Sans 3", system-ui, sans-serif';

// Tramos de "tiempo sin producir" (meses_cod del binario: meses desde el último mes con producción en la
// serie mensual; 65535 = ningún mes con producción en la serie). Los cortes son los de resumen.trayectoria.
export const TRAMOS_TIEMPO = [
  { cod: 0, nombre: 'Produjo en el último año' },
  { cod: 1, nombre: 'Sin producir hace 1 a 5 años' },
  { cod: 2, nombre: 'Sin producir hace más de 5 años' },
  { cod: 3, nombre: 'Ningún mes con producción en la serie' },
];
const tramoDe = (m) => (m === 65535 ? 3 : m <= 12 ? 0 : m < 60 ? 1 : 2);

const movimientoReducido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ¿Responde el IGN? Carga un tile como imagen (no necesita CORS) con tiempo límite.
function ignDisponible(ms = 5000) {
  return new Promise((resolver) => {
    const img = new Image();
    const t = setTimeout(() => resolver(false), ms);
    img.onload = () => { clearTimeout(t); resolver(true); };
    img.onerror = () => { clearTimeout(t); resolver(false); };
    img.src = TILE_PRUEBA_IGN;
  });
}

// Ajustes al estilo Positron de OpenFreeMap:
// 1) Rótulos en castellano: usa `name_en` primero (de ahí "Falklands"); se reemplaza el texto de todas
//    las capas de nombres por `name:es` y, si no existe, `name`.
// 2) Sin áreas protegidas: la capa "park" de OpenStreetMap (parques nacionales, reservas, Península Valdés,
//    Meseta de Somuncurá) dibuja manchones grises que distraen del dato. Se quita.
function prepararEstilo(estilo) {
  const antes = estilo.layers.length;
  estilo.layers = estilo.layers.filter((capa) => capa['source-layer'] !== 'park' && !/^park/.test(capa.id));
  console.info(`Mapa base: ${antes - estilo.layers.length} capas de áreas protegidas quitadas.`);
  for (const capa of estilo.layers) {
    const campo = capa.layout?.['text-field'];
    if (capa.type !== 'symbol' || !campo) continue;
    if (JSON.stringify(campo).includes('"ref"')) continue; // números de ruta: se dejan
    capa.layout['text-field'] = ['coalesce', ['get', 'name:es'], ['get', 'name']];
  }
  return estilo;
}

async function cargarEstiloRemoto(map) {
  if (MAPA_BASE === 'ign' && await ignDisponible()) {
    map.setStyle(ESTILO_IGN);
    return;
  }
  if (MAPA_BASE === 'ign') console.warn('Argenmap (IGN) no responde; se usa OpenFreeMap.');
  try {
    const r = await fetch(ESTILO_OPENFREEMAP);
    if (!r.ok) throw new Error(r.status);
    map.setStyle(prepararEstilo(await r.json()));
  } catch (e) {
    console.warn('Mapa base externo no disponible; se usa el fondo local.', e);
  }
}

export function crearMapa({ pozos, pais, radios, limites, concesiones, barrios, onClickPozo }) {
  const map = new maplibregl.Map({
    container: 'map',
    style: ESTILO_RESPALDO,
    center: VISTA_INICIAL.center,
    zoom: VISTA_INICIAL.zoom,
    attributionControl: { compact: true },
    // Durante el recorrido el scroll y el arrastre (también con el dedo) mueven el texto, no el mapa:
    // con dragPan o touchZoomRotate activos MapLibre pone `touch-action: none` y en el celular no se podría
    // avanzar deslizando sobre el mapa. Se activan al explorar (habilitarExploracion).
    scrollZoom: false,
    dragPan: false,
    touchZoomRotate: false,
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

  // ---- estado de filtros (todo en memoria) ----
  const estado = {
    estadosVisibles: new Set([0, 1, 2, 3, 4]),
    empresa: null,     // código o null
    yacimiento: null,  // código o null
    provincia: null,   // 1 | 2 | null
    tiempo: null,      // Set de tramos de TRAMOS_TIEMPO o null (= todos)
    soloEjido: false,
    contarEjido: false, // la leyenda cuenta solo los pozos del ejido (paso Ejido, donde los de afuera se atenúan)
    poblacion: false,  // radios censales con población; atenúa los pozos fuera del ejido
    limites: false,
    pozos: false,      // si es false no se dibuja ningún pozo (portada)
    pais: false,       // capa de todo el país (paso País)
    concesiones: false,
    barrios: false,
    soloId: null,      // idpozo: si está definido, se ve solo ese pozo (paso del Pozo N° 2)
    resaltado: null,   // idpozo que nombra una tarjeta (CH-679): anillo y rótulo
    resaltadoEtiqueta: null, // rótulo al lado del anillo (opcional)
    seleccionado: null, // idpozo de la ficha abierta: anillo sin rótulo
  };
  const atenuado = () => estado.poblacion && !estado.soloEjido && !estado.pais;

  const { estado_cod, empresa_cod, yac_cod, prov_cod, ejido_cod, idpozo, meses_cod, conc_cod } = pozos.cols;
  const tramo = meses_cod ? Uint8Array.from(meses_cod, tramoDe) : null;

  // Color por estado; fuera del ejido, casi transparente cuando la población es el foco.
  const colorPleno = ESTADOS.map((e) => [...e.rgb, 255]);
  const colorTenue = ESTADOS.map((e) => [...e.rgb, 38]);

  // Pozos en áreas que no figuran como concesión vigente (columna conc_cod; si el binario no la trae, no hay capa).
  const idxSinConc = conc_cod ? Uint32Array.from({ length: pozos.n }, (_, i) => i).filter((i) => conc_cod[i] === 0) : null;
  const posSinConc = idxSinConc ? Float32Array.from({ length: idxSinConc.length * 2 }, (_, k) => pozos.positions[idxSinConc[k >> 1] * 2 + (k & 1)]) : null;

  // Vector de "pasa el filtro" recalculado en CPU sólo cuando cambia un filtro
  // (44k valores: instantáneo). El extension filtra por ese valor en GPU.
  // De paso cuenta, para la leyenda y el panel, pozos por estado y por tramo de tiempo.
  let pasa = new Float32Array(pozos.n);
  let pasaSinConc = idxSinConc ? new Float32Array(idxSinConc.length) : null;
  // Pozos de otras cuencas que dibuja la capa país (para la leyenda del paso País): se cuentan del binario.
  const otrasCuencas = pais ? pais.cols.gsj_cod.reduce((acc, v) => acc + (v ? 0 : 1), 0) : 0;
  const conteos = { porEstado: new Array(ESTADOS.length).fill(0), porTramo: new Array(TRAMOS_TIEMPO.length).fill(0), soloEjido: false, sinConcesion: 0, otrasCuencas };
  function recalcularFiltro() {
    pasa = new Float32Array(pozos.n); // array nuevo: deck.gl lo detecta como dato nuevo
    conteos.porEstado.fill(0);
    conteos.porTramo.fill(0);
    conteos.soloEjido = estado.soloEjido || estado.contarEjido;
    let n = 0;
    for (let i = 0; i < pozos.n; i++) {
      if (estado.soloId !== null) {
        if (idpozo[i] === estado.soloId) { pasa[i] = 1; n++; }
        continue;
      }
      const base = (estado.empresa === null || empresa_cod[i] === estado.empresa)
        && (estado.yacimiento === null || yac_cod[i] === estado.yacimiento)
        && (estado.provincia === null || prov_cod[i] === estado.provincia)
        && (!estado.soloEjido || ejido_cod[i] === 1);
      if (!base) continue;
      const okEstado = estado.estadosVisibles.has(estado_cod[i]);
      const okTiempo = !tramo || !estado.tiempo || estado.tiempo.has(tramo[i]);
      // la leyenda cuenta todos los estados (para que se vea cuántos hay aunque estén apagados)
      if (okTiempo && (!conteos.soloEjido || ejido_cod[i] === 1)) conteos.porEstado[estado_cod[i]]++;
      if (okEstado && tramo) conteos.porTramo[tramo[i]]++;
      if (okEstado && okTiempo) { pasa[i] = 1; n++; }
    }
    conteos.sinConcesion = 0;
    if (idxSinConc) {
      pasaSinConc = new Float32Array(idxSinConc.length);
      for (let k = 0; k < idxSinConc.length; k++) { pasaSinConc[k] = pasa[idxSinConc[k]]; conteos.sinConcesion += pasaSinConc[k]; }
    }
    return n;
  }
  let visibles = recalcularFiltro();

  // El objeto `data` de cada capa de puntos se arma solo cuando cambia el filtro: así los cuadros
  // del fundido (que cambian nada más la opacidad) no recalculan colores de 44k puntos.
  let datosPozos, datosSinConc;
  function armarDatos() {
    datosPozos = { length: pozos.n, attributes: {
      getPosition: { value: pozos.positions, size: 2 },
      getFilterValue: { value: pasa, size: 1 },
    } };
    datosSinConc = idxSinConc ? { length: idxSinConc.length, attributes: {
      getPosition: { value: posSinConc, size: 2 },
      getFilterValue: { value: pasaSinConc, size: 1 },
    } } : null;
  }
  armarDatos();
  const datosPais = pais ? { length: pais.n, attributes: { getPosition: { value: pais.positions, size: 2 } } } : null;

  function capaPozos() {
    const tenue = atenuado();
    return new ScatterplotLayer({
      id: 'pozos',
      data: datosPozos,
      getFillColor: (_, { index }) => (tenue && ejido_cod[index] !== 1 ? colorTenue : colorPleno)[estado_cod[index]],
      getRadius: 18,
      radiusMinPixels: 1.6,
      radiusMaxPixels: 7,
      radiusUnits: 'meters',
      stroked: false,
      pickable: true,
      opacity: 0.9 * fundido,
      visible: estado.pozos && !estado.pais, // con la capa país encendida, los puntos de la cuenca los dibuja esa capa
      filterRange: [0.5, 1.5],
      extensions: [new DataFilterExtension({ filterSize: 1 })],
      updateTriggers: { getFillColor: [tenue] },
      onClick: ({ index }) => index >= 0 && onClickPozo?.(idpozo[index], index),
    });
  }

  // Anillo sobre los pozos de áreas sin concesión vigente, cuando la capa de concesiones está encendida.
  function capaSinConcesion() {
    if (!datosSinConc) return null;
    return new ScatterplotLayer({
      id: 'sin-concesion',
      data: datosSinConc,
      filled: false,
      stroked: true,
      getLineColor: [...hexARgb(PALETA.texto), 200],
      lineWidthUnits: 'pixels',
      getLineWidth: 1,
      getRadius: 30,
      radiusUnits: 'meters',
      radiusMinPixels: 3.2,
      radiusMaxPixels: 9,
      opacity: fundido,
      visible: estado.pozos && estado.concesiones && !estado.pais && estado.soloId === null,
      filterRange: [0.5, 1.5],
      extensions: [new DataFilterExtension({ filterSize: 1 })],
    });
  }

  // País entero: puntos chicos y tenues; los del Golfo San Jorge un poco más presentes.
  function capaPais() {
    if (!datosPais) return null;
    return new ScatterplotLayer({
      id: 'pais',
      visible: estado.pozos && estado.pais,
      opacity: fundido,
      data: datosPais,
      getFillColor: (_, { index }) => pais.cols.gsj_cod[index] ? [...ESTADOS[pais.cols.estado_cod[index]].rgb, 200] : [90, 87, 81, 90],
      getRadius: 400,
      radiusMinPixels: 1,
      radiusMaxPixels: 3,
      radiusUnits: 'meters',
      stroked: false,
      pickable: false,
    });
  }

  // Concesiones en el gris de los límites: el azul es "Activo" en esta pieza.
  function capaConcesiones() {
    if (!concesiones) return null;
    return new GeoJsonLayer({
      id: 'concesiones',
      data: concesiones,
      visible: estado.concesiones,
      filled: true,
      stroked: true,
      getFillColor: [...hexARgb(PALETA.limite), 14],
      getLineColor: [...hexARgb(PALETA.limite), 150],
      lineWidthMinPixels: 1,
      pickable: true, // solo para el tooltip con el nombre del área
    });
  }

  function capaBarrios() {
    if (!barrios) return null;
    return new GeoJsonLayer({
      id: 'barrios',
      data: barrios,
      visible: estado.barrios,
      // relleno invisible: permite el tooltip al pasar por adentro del barrio. Con la población encendida no va,
      // así el tooltip que gana es el del radio censal (que está debajo).
      filled: !estado.poblacion,
      getFillColor: [0, 0, 0, 0],
      stroked: true,
      getLineColor: hexARgb(PALETA.limite),
      lineWidthMinPixels: 0.8,
      pickable: true,
    });
  }

  // Nombres de barrio: solo con zoom de ciudad; si se pisan, gana el barrio con más pozos.
  const rotulosBarrios = barrios ? barrios.features.map((f) => ({ nombre: f.properties.barrio, pozos: f.properties.pozos || 0, pos: centroide(f.geometry) })).filter((d) => d.pos) : [];
  function capaRotulosBarrios() {
    if (!rotulosBarrios.length) return null;
    return new TextLayer({
      id: 'barrios-rotulos',
      data: rotulosBarrios,
      visible: estado.barrios && map.getZoom() >= ZOOM_ROTULOS_BARRIOS,
      getPosition: (d) => d.pos,
      getText: (d) => d.nombre,
      getSize: 12.5,
      getColor: hexARgb(PALETA.textoSec),
      fontFamily: FUENTE_ROTULOS,
      fontWeight: 600,
      characterSet: 'auto',
      fontSettings: { sdf: true, fontSize: 48, buffer: 6, radius: 12 },
      outlineWidth: 5,
      outlineColor: [255, 252, 246, 235],
      extensions: [new CollisionFilterExtension()],
      getCollisionPriority: (d) => d.pozos,
      collisionTestProps: { sizeScale: 1.4 },
    });
  }

  const rampa = POBLACION_RAMPA.map(hexARgb);
  function colorPoblacion(p) {
    if (p <= 0) return [0, 0, 0, 0];
    const tramoPobl = POBLACION_CORTES.findIndex((corte) => p < corte);
    return [...rampa[tramoPobl === -1 ? rampa.length - 1 : tramoPobl], 190];
  }

  function capaRadios() {
    return new GeoJsonLayer({
      id: 'radios',
      data: radios,
      visible: estado.poblacion,
      filled: true,
      stroked: true,
      getFillColor: (f) => colorPoblacion(f.properties.pobl),
      getLineColor: hexARgb(PALETA.urbanoBorde),
      lineWidthMinPixels: 0.5,
      pickable: true,
    });
  }

  function capaLimites() {
    return new GeoJsonLayer({
      id: 'limites',
      data: limites,
      visible: estado.limites,
      filled: false,
      stroked: true,
      getLineColor: hexARgb(PALETA.limite),
      getLineWidth: 2,
      lineWidthUnits: 'pixels',
      getDashArray: [3, 2], // en múltiplos del ancho de línea: 6 px de trazo, 4 de espacio
      extensions: [new PathStyleExtension({ dash: true })],
    });
  }

  // Anillos sobre pozos puntuales: el que nombra una tarjeta (CH-679, con rótulo) y el de la ficha abierta.
  const posDe = (id) => {
    const i = id === null ? undefined : pozos.filaPorId.get(id);
    return i === undefined ? null : [pozos.positions[i * 2], pozos.positions[i * 2 + 1]];
  };
  function capasResaltado() {
    if (!estado.pozos) return [];
    const pos = posDe(estado.resaltado);
    const anillos = [pos, posDe(estado.seleccionado)].filter(Boolean);
    if (!anillos.length) return [];
    const capas = [new ScatterplotLayer({
      id: 'resaltado',
      data: anillos,
      getPosition: (d) => d,
      getRadius: 10,
      radiusUnits: 'pixels',
      filled: false,
      stroked: true,
      getLineColor: [...hexARgb(PALETA.texto), 235],
      lineWidthUnits: 'pixels',
      getLineWidth: 2,
      opacity: fundido,
    })];
    if (pos && estado.resaltadoEtiqueta) {
      capas.push(new TextLayer({
        id: 'resaltado-rotulo',
        data: [{ pos, texto: estado.resaltadoEtiqueta }],
        getPosition: (d) => d.pos,
        getText: (d) => d.texto,
        getPixelOffset: [16, 0],
        getTextAnchor: 'start',
        getAlignmentBaseline: 'center',
        getSize: 13,
        getColor: hexARgb(PALETA.texto),
        fontFamily: FUENTE_ROTULOS,
        fontWeight: 600,
        characterSet: 'auto',
        background: true,
        getBackgroundColor: [255, 252, 246, 240],
        backgroundPadding: [8, 4],
        opacity: fundido,
      }));
    }
    return capas;
  }

  // Fundido de entrada de los puntos: cuando se pasa de "un solo pozo" a muchos (paso del Pozo N° 2 → país),
  // los puntos aparecen en medio segundo en vez de golpe. Solo cambia la opacidad de las capas de puntos.
  let fundido = 1;
  let animFundido = null;
  function fundirEntrada(ms = 600) {
    cancelAnimationFrame(animFundido);
    if (movimientoReducido()) { fundido = 1; render(); return; }
    const t0 = performance.now();
    const paso = (t) => {
      fundido = Math.min(1, (t - t0) / ms);
      render();
      if (fundido < 1) animFundido = requestAnimationFrame(paso);
    };
    fundido = 0;
    animFundido = requestAnimationFrame(paso);
  }

  // Marcador del Pozo N° 2 (HTML, así tiene forma propia). El color del borde es el de su estado
  // declarado (Abandonado): el ícono agrega forma, no cambia la regla color = estado.
  let marcador = null;
  function mostrarMarcador(id, etiqueta) {
    marcador?.remove();
    marcador = null;
    if (id === null || id === undefined) return;
    const i = pozos.filaPorId.get(id);
    if (i === undefined) return;
    const el = document.createElement('div');
    el.className = 'marcador-pozo';
    el.innerHTML = `<span class="marcador-halo"></span><span class="marcador-icono">
      <svg width="18" height="20" viewBox="0 0 18 20" fill="none" stroke="currentColor" stroke-width="1.4"
        stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">
        <path d="M9 1 L4 19 M9 1 L14 19 M7.3 6.5 L10.7 6.5 M6.2 11 L11.8 11 M5.2 15 L12.8 15 M2 19 L16 19"/></svg></span>
      <span class="marcador-etiqueta">${esc(etiqueta)}</span>`;
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', etiqueta);
    marcador = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([pozos.positions[i * 2], pozos.positions[i * 2 + 1]])
      .addTo(map);
  }

  // ---- tooltip al pasar el mouse (solo con mouse: en pantallas táctiles está la ficha) ----
  const conMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const tip = document.createElement('div');
  tip.id = 'tooltip';
  tip.className = 'hidden';
  tip.setAttribute('aria-hidden', 'true'); // con teclado y lector de pantalla, la información está en la ficha
  document.body.appendChild(tip);
  let tipPozo = null, tipEspera = null;
  function ocultarTip() { tip.classList.add('hidden'); tipPozo = null; clearTimeout(tipEspera); map.getCanvas().style.cursor = ''; }
  function alPasar({ layer, index, object, x, y }) {
    if (!conMouse) return;
    if (!layer || index < 0) { ocultarTip(); return; }
    let html = '';
    if (layer.id === 'pozos') {
      const id = idpozo[index];
      map.getCanvas().style.cursor = 'pointer';
      if (tipPozo !== id) {
        tipPozo = id;
        const e = ESTADOS[estado_cod[index]];
        const empresa = pozos.meta.empresas[empresa_cod[index]];
        html = `<p class="tip-titulo"><span class="ley-dot" style="background:${e.hex}"></span>${e.nombre}</p>
          <p class="tip-sigla">&nbsp;</p>
          <p>${empresa ? esc(empresa) : '<em>sin empresa asignada</em>'}</p>
          <p class="tip-nota">Clic para ver la ficha</p>`;
        tip.innerHTML = html;
        // la sigla está en las fichas (por lote): se pide solo si el cursor se queda quieto sobre el pozo
        clearTimeout(tipEspera);
        tipEspera = setTimeout(() => {
          cargarFicha(id).then((f) => { if (tipPozo === id && f?.s) tip.querySelector('.tip-sigla').textContent = f.s; }).catch(() => {});
        }, 250);
      }
    } else {
      tipPozo = null;
      map.getCanvas().style.cursor = '';
      const p = object?.properties || {};
      if (layer.id === 'barrios') html = `<p class="tip-titulo">Barrio ${esc(p.barrio)}</p><p>${fmt(p.pozos || 0)} pozos</p>`;
      else if (layer.id === 'radios') html = `<p class="tip-titulo">Radio censal ${esc(p.LINK)}</p><p>${fmt(p.pobl || 0)} habitantes · ${fmt(p.pozos || 0)} pozos</p>`;
      else if (layer.id === 'concesiones') html = `<p class="tip-titulo">${esc(p.nombre)}</p><p>${esc(p.operadora || '')}</p>`;
      else { ocultarTip(); return; }
      tip.innerHTML = html;
    }
    tip.classList.remove('hidden');
    const r = map.getContainer().getBoundingClientRect();
    const izq = x + 14 + tip.offsetWidth > r.width ? x - 14 - tip.offsetWidth : x + 14;
    const arr = y + 14 + tip.offsetHeight > r.height ? y - 14 - tip.offsetHeight : y + 14;
    tip.style.transform = `translate(${Math.round(r.left + izq)}px, ${Math.round(r.top + arr)}px)`;
  }
  map.getCanvas().addEventListener('mouseleave', ocultarTip);
  map.on('movestart', ocultarTip); // al volar a otro paso, lo que estaba bajo el cursor ya no está

  const overlay = new MapboxOverlay({ interleaved: false, layers: [], onHover: alPasar });
  map.addControl(overlay);

  function render() {
    overlay.setProps({ layers: [capaPais(), capaConcesiones(), capaRadios(), capaBarrios(), capaLimites(), capaPozos(), capaSinConcesion(), capaRotulosBarrios(), ...capasResaltado()].filter(Boolean) });
  }
  map.on('load', () => { render(); cargarEstiloRemoto(map); });
  // al cambiar de estilo (remoto cargado) deck.gl conserva sus capas; nada que hacer.

  // Los rótulos de barrio dependen del zoom: se redibuja solo al cruzar el umbral.
  let rotulosVisibles = map.getZoom() >= ZOOM_ROTULOS_BARRIOS;
  map.on('zoom', () => {
    const v = map.getZoom() >= ZOOM_ROTULOS_BARRIOS;
    if (v !== rotulosVisibles) { rotulosVisibles = v; if (estado.barrios) render(); }
  });

  const oyentes = new Set();

  // ---- API que usan story.js y explore.js ----
  return {
    map,
    estado,
    get visibles() { return visibles; },
    /** Conteos del filtro vigente: por estado (para la leyenda) y por tramo de tiempo sin producir. */
    get conteos() { return conteos; },
    /** Registra una función que se llama después de cada cambio de filtros o capas. */
    alCambiar(fn) { oyentes.add(fn); },
    aplicar(cambios = {}) {
      const eraUnSolo = estado.soloId !== null;
      const habiaPozos = estado.pozos;
      ocultarTip();
      Object.assign(estado, cambios);
      // los Set se copian: así un paso del recorrido y el panel nunca comparten (ni pisan) el mismo filtro
      if (cambios.estadosVisibles) estado.estadosVisibles = new Set(cambios.estadosVisibles);
      if (cambios.tiempo) estado.tiempo = new Set(cambios.tiempo);
      visibles = recalcularFiltro();
      armarDatos();
      const aparecenPozos = (eraUnSolo && estado.soloId === null) || (!habiaPozos && estado.pozos);
      if (aparecenPozos) fundirEntrada();
      else render();
      oyentes.forEach((fn) => fn(estado));
      return visibles;
    },
    marcador: mostrarMarcador,
    volar(vista, opciones = {}) {
      // El padding siempre se pasa explícito: MapLibre lo conserva entre vuelos si no.
      const destino = { ...vista, duration: 1600, essential: true, padding: { top: 0, bottom: 0, left: 0, right: 0 }, ...opciones };
      if (movimientoReducido()) map.jumpTo(destino); // "reducir movimiento": sin vuelos de cámara
      else map.flyTo(destino);
    },
    filaDe(id) { return pozos.filaPorId.get(id); },
    coordsDe(id) {
      const i = pozos.filaPorId.get(id);
      return i === undefined ? null : [pozos.positions[i * 2], pozos.positions[i * 2 + 1]];
    },
    habilitarExploracion(on) {
      for (const h of [map.scrollZoom, map.dragPan, map.touchZoomRotate]) on ? h.enable() : h.disable();
    },
  };
}

function hexARgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Centroide de área del anillo exterior más grande (suficiente para ubicar un rótulo de barrio).
function centroide(geom) {
  if (!geom) return null;
  const poligonos = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : [];
  let mejor = null, mejorArea = 0;
  for (const pol of poligonos) {
    const anillo = pol[0];
    let a = 0, cx = 0, cy = 0;
    for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
      const f = anillo[j][0] * anillo[i][1] - anillo[i][0] * anillo[j][1];
      a += f; cx += (anillo[j][0] + anillo[i][0]) * f; cy += (anillo[j][1] + anillo[i][1]) * f;
    }
    if (Math.abs(a) > mejorArea && a !== 0) { mejorArea = Math.abs(a); mejor = [cx / (3 * a), cy / (3 * a)]; }
  }
  return mejor;
}
