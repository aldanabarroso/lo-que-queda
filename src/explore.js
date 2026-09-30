// Panel de exploración: filtros, buscador y ficha por pozo. Y la leyenda con conteos (esa va desde la
// primera carga: el paso País ya la necesita; el panel se arma cuando llegan los pozos de la cuenca).

import { ESTADOS, POBLACION_RAMPA, POBLACION_CORTES } from './paleta.js';
import { cargarFicha, cargarLote, fmt, esc, TRAMOS_TIEMPO } from './data.js';
import { dibujarAbandonos } from './chart.js';

/** Leyenda compacta (durante el recorrido): conteos del filtro vigente. Se repinta con cada cambio del mapa. */
export function montarLeyenda({ mapa }) {
  const leyenda = document.getElementById('leyenda');
  function pintar() {
    const est = mapa.estado, cont = mapa.conteos;
    // en el paso País se cuentan los puntos que dibuja esa capa; si no, los pozos de la cuenca (segunda carga)
    const porEstado = est.pais ? cont.paisPorEstado : cont.porEstado;
    if (!est.pais && !cont.listo) { leyenda.innerHTML = ''; return; } // todavía no llegaron los pozos
    const alcance = est.pais ? 'Golfo San Jorge' : cont.soloEjido ? 'Ejido de Comodoro Rivadavia' : 'Cuenca del Golfo San Jorge';
    let html = `<p class="ley-titulo">Estado declarado · ${alcance}</p>`;
    html += ESTADOS.filter((e) => porEstado[e.cod] > 0).map((e) =>
      `<div class="ley-item"><span class="ley-dot" style="background:${e.hex}"></span>${e.nombre}<b>${fmt(porEstado[e.cod])}</b></div>`).join('');
    if (est.pais && cont.otrasCuencas) html += `<div class="ley-item"><span class="ley-dot ley-dot-otras"></span>Otras cuencas<b>${fmt(cont.otrasCuencas)}</b></div>`;
    if (est.concesiones && cont.sinConcesion !== null) {
      html += `<div class="ley-item"><span class="ley-anillo"></span>En área sin concesión vigente<b>${fmt(cont.sinConcesion)}</b></div>`;
    }
    if (est.poblacion) html += htmlRampa();
    leyenda.innerHTML = html;
  }
  mapa.alCambiar(pintar);
  pintar();
}

export function montarExploracion({ mapa, pozos, resumen }) {
  const $ = (id) => document.getElementById(id);
  const panel = $('explore');
  const meta = pozos.meta;
  const R = resumen;

  // Filtros del panel: se conservan aunque el recorrido cambie el mapa, y se vuelven a aplicar al abrirlo.
  const filtros = {
    estadosVisibles: new Set(ESTADOS.map((e) => e.cod)),
    empresa: null, yacimiento: null, provincia: null, tiempo: null,
    poblacion: false, barrios: false, concesiones: false,
  };
  let panelAbierto = false;

  // ---- estado declarado (checkboxes con conteo alineado a la derecha) ----
  const fEstado = $('f-estado');
  const conteoEstado = {};
  for (const e of ESTADOS) {
    const id = `est-${e.cod}`;
    const row = document.createElement('div');
    row.className = 'filtro-inline';
    row.innerHTML = `<input type="checkbox" id="${id}" checked><label for="${id}"><span class="ley-dot" style="background:${e.hex}"></span><span class="filtro-nombre">${e.nombre}</span><span class="filtro-conteo"></span></label>`;
    row.querySelector('input').addEventListener('change', (ev) => {
      ev.target.checked ? filtros.estadosVisibles.add(e.cod) : filtros.estadosVisibles.delete(e.cod);
      actualizar();
    });
    conteoEstado[e.cod] = { row, span: row.querySelector('.filtro-conteo') };
    fEstado.appendChild(row);
  }

  // ---- tiempo sin producir (serie mensual) ----
  const fTiempo = $('f-tiempo');
  const conteoTramo = {};
  if (pozos.cols.meses_cod && R.trayectoria) {
    const { desde, hasta } = R.trayectoria.cobertura;
    $('f-tiempo-nota').textContent = `Según la producción mensual declarada entre ${mesAnio(desde)} y ${mesAnio(hasta)}.`;
    for (const tr of TRAMOS_TIEMPO) {
      const id = `tiempo-${tr.cod}`;
      const row = document.createElement('div');
      row.className = 'filtro-inline';
      row.innerHTML = `<input type="checkbox" id="${id}" checked><label for="${id}"><span class="filtro-nombre">${tr.nombre}</span><span class="filtro-conteo"></span></label>`;
      row.querySelector('input').addEventListener('change', () => {
        const marcados = TRAMOS_TIEMPO.filter((x) => $(`tiempo-${x.cod}`).checked).map((x) => x.cod);
        filtros.tiempo = marcados.length === TRAMOS_TIEMPO.length ? null : new Set(marcados);
        actualizar();
      });
      conteoTramo[tr.cod] = row.querySelector('.filtro-conteo');
      fTiempo.appendChild(row);
    }
    dibujarAbandonos($('grafico-abandonos'), R.trayectoria);
  } else {
    fTiempo.closest('.bloque-tiempo')?.classList.add('hidden');
  }

  // ---- operadora (ordenada por cantidad de pozos), yacimiento y provincia ----
  llenarSelect($('f-empresa'), meta.empresas, contar(pozos.cols.empresa_cod, meta.empresas.length), (v) => v || '(sin empresa asignada)');
  llenarSelect($('f-yacimiento'), meta.yacimientos, contar(pozos.cols.yac_cod, meta.yacimientos.length), (v) => v || '(sin yacimiento)');
  const numONull = (v) => (v === '' ? null : Number(v));
  $('f-empresa').addEventListener('change', (ev) => { filtros.empresa = numONull(ev.target.value); actualizar(); });
  $('f-yacimiento').addEventListener('change', (ev) => { filtros.yacimiento = numONull(ev.target.value); actualizar(); });
  $('f-provincia').addEventListener('change', (ev) => { filtros.provincia = numONull(ev.target.value); actualizar(); });
  $('f-poblacion').addEventListener('change', (ev) => { filtros.poblacion = ev.target.checked; $('ley-poblacion').classList.toggle('hidden', !ev.target.checked); actualizar(); });
  $('f-concesiones').addEventListener('change', (ev) => { filtros.concesiones = ev.target.checked; actualizar(); });
  $('f-barrios').addEventListener('change', (ev) => { filtros.barrios = ev.target.checked; actualizar(); });
  $('ley-poblacion').innerHTML = htmlRampa();

  function actualizar() {
    if (panelAbierto) mapa.aplicar({ ...filtros });
  }

  // Cada cambio del mapa (del panel o del recorrido) refresca los conteos del panel.
  const refrescarConteos = () => {
    const cont = mapa.conteos;
    for (const e of ESTADOS) {
      const n = cont.porEstado[e.cod];
      conteoEstado[e.cod].span.textContent = fmt(n);
      conteoEstado[e.cod].row.classList.toggle('hidden', n === 0 && e.cod === 4); // "No informado" solo si hay
    }
    for (const tr of TRAMOS_TIEMPO) if (conteoTramo[tr.cod]) conteoTramo[tr.cod].textContent = fmt(cont.porTramo[tr.cod]);
    $('n-visible').textContent = fmt(mapa.visibles);
  };
  mapa.alCambiar(refrescarConteos);
  refrescarConteos();
  $('n-total').textContent = fmt(pozos.n);

  // ---- buscador por sigla ----
  // El índice sigla → pozo se arma la primera vez (recorre todas las fichas, unos 19 MB).
  // Acepta la sigla completa ("YPF.Ch.-679") o el final sin prefijo de empresa ("CH-679", "ch 679", "CH679").
  let indiceSigla = null;
  function obtenerIndice() {
    if (!indiceSigla) indiceSigla = construirIndiceSigla(pozos).catch((err) => { indiceSigla = null; throw err; });
    return indiceSigla;
  }
  $('form-buscar').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const texto = $('f-buscar').value.trim();
    const q = normalizar(texto);
    if (!q) return;
    mostrarMensaje('Buscando…');
    let indice;
    try { indice = await obtenerIndice(); } catch { mostrarMensaje('No se pudo cargar el índice de siglas. Probá de nuevo.'); return; }
    let ids = indice.exacta.get(q) || [];
    if (!ids.length) ids = indice.lista.filter(([s]) => s.endsWith(q)).map(([, id]) => id);
    if (!ids.length && q.length >= 3) ids = indice.lista.filter(([s]) => s.includes(q)).map(([, id]) => id);
    if (!ids.length) { mostrarMensaje(`No encontré la sigla “${texto}”.`); return; }
    if (ids.length === 1) { abrirPozo(ids[0], true); return; }
    // varias coincidencias: se listan para elegir
    const primeros = ids.slice(0, 12);
    const fichas = await Promise.all(primeros.map((id) => cargarFicha(id).catch(() => null)));
    mostrarMensaje(`Hay ${fmt(ids.length)} pozos con “${texto}”${ids.length > primeros.length ? `; se muestran los primeros ${primeros.length}` : ''}:`,
      primeros.map((id, i) => ({ id, texto: fichas[i]?.s || `pozo ${id}` })));
  });

  // ---- ficha ----
  const ficha = $('ficha');
  let focoPrevio = null;
  let pedido = 0; // si se piden dos fichas seguidas, solo se muestra la última
  async function abrirPozo(idpozo, volar = false) {
    const este = ++pedido;
    if (volar) { const c = mapa.coordsDe(idpozo); if (c) mapa.volar({ center: c, zoom: 14 }); }
    mapa.aplicar({ seleccionado: idpozo });
    let f;
    try { f = await cargarFicha(idpozo); } catch { if (este === pedido) mostrarMensaje('No se pudo cargar la ficha de este pozo. Probá de nuevo.'); return; }
    if (este === pedido) mostrarFicha(f);
  }
  function abrirDialogo(html) {
    if (ficha.classList.contains('hidden')) focoPrevio = document.activeElement;
    ficha.innerHTML = `<button type="button" class="cerrar" aria-label="Cerrar ficha">×</button>${html}`;
    ficha.classList.remove('hidden');
    ficha.querySelector('.cerrar').addEventListener('click', cerrarFicha);
    ficha.querySelectorAll('[data-pozo]').forEach((b) => b.addEventListener('click', () => abrirPozo(Number(b.dataset.pozo), true)));
    ficha.querySelector('.cerrar').focus({ preventScroll: true });
  }
  function cerrarFicha() {
    ficha.classList.add('hidden');
    mapa.aplicar({ seleccionado: null });
    if (focoPrevio && document.contains(focoPrevio)) focoPrevio.focus({ preventScroll: true });
    focoPrevio = null;
  }
  ficha.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') cerrarFicha(); });
  function mostrarMensaje(texto, opciones = []) {
    abrirDialogo(`<p class="kicker" id="ficha-titulo">Buscar por sigla</p><p>${esc(texto)}</p>${opciones.length
      ? `<ul class="lista-siglas">${opciones.map((o) => `<li><button type="button" class="link-btn" data-pozo="${o.id}">${esc(o.texto)}</button></li>`).join('')}</ul>` : ''}`);
  }
  function mostrarFicha(f) {
    if (!f) { mostrarMensaje('Sin datos para este pozo.'); return; }
    const e = ESTADOS.find((x) => x.nombre === f.g);
    const tipo = [f.tp, [f.c, f.sc].filter(Boolean).join(' / ')].filter(Boolean).join(' · ');
    abrirDialogo(`
      <p class="kicker" id="ficha-titulo">Pozo ${esc(f.s)}</p>
      <p class="ficha-estado"><span class="ley-dot" style="background:${e?.hex}"></span>${esc(f.est)}</p>
      <dl>
        <dt>Operadora</dt><dd>${f.e ? esc(f.e) : '<em>sin empresa asignada</em>'}</dd>
        ${f.ea && f.ea !== f.e ? `<dt>Operadora anterior</dt><dd>${esc(f.ea)}</dd>` : ''}
        <dt>Yacimiento</dt><dd>${esc(f.y) || '—'}</dd>
        <dt>Área / concesión</dt><dd>${esc(f.ar) || '—'}</dd>
        <dt>Provincia</dt><dd>${esc(f.p)}</dd>
        <dt>Tipo</dt><dd>${esc(tipo) || '—'}</dd>
        ${f.fperf ? `<dt>Perforado</dt><dd>${esc(f.fperf)}${f.fterm ? ` · terminado ${esc(f.fterm)}` : ''}</dd>` : '<dt>Perforado</dt><dd><em>sin fecha en el registro</em></dd>'}
        ${f.pp ? `<dt>Primera producción</dt><dd>${f.pp06 ? 'enero de 2006 o antes (la serie empieza ahí)' : esc(f.pp)}</dd>` : ''}
        ${f.up ? `<dt>Última producción</dt><dd>${esc(f.up)}${f.msp > 12 ? ` · ${aniosSinProducir(f.msp)}` : ''}</dd>` : ''}
        ${declaradoAbandonado(f)}
        ${f.conc === false ? '<dt>Concesión</dt><dd><em>el área no figura como concesión vigente</em></dd>' : ''}
        ${f.prof ? `<dt>Profundidad</dt><dd>${fmt(f.prof)} m</dd>` : ''}
        ${f.ej ? `<dt>Ubicación</dt><dd>${f.b ? `Barrio ${esc(f.b)}, ` : ''}dentro del ejido de Comodoro Rivadavia${f.rp ? ` · radio censal con ${fmt(f.rp)} habitantes` : ''}</dd>` : ''}
      </dl>
      <p class="fuente">Estado declarado por la operadora ante la Secretaría de Energía. No describe el estado físico del pozo.</p>`);
  }

  // ---- mostrar/ocultar panel ----
  function mostrarPanel() {
    if (panelAbierto) return;
    panelAbierto = true;
    panel.classList.remove('hidden');
    document.body.classList.add('explorando');
    document.body.classList.remove('sin-leyenda'); // al explorar, la leyenda siempre está
    mapa.habilitarExploracion(true);
    mapa.aplicar({ ...filtros, soloId: null, soloEjido: false, contarEjido: false, pais: false, pozos: true, limites: true, resaltado: null, resaltadoEtiqueta: null });
  }
  function ocultarPanel() {
    if (!panelAbierto) return;
    panelAbierto = false;
    panel.classList.add('hidden');
    document.body.classList.remove('explorando');
    mapa.habilitarExploracion(false);
  }
  $('btn-recorrido').addEventListener('click', () => {
    ocultarPanel();
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paso1 = document.querySelector('#story .step[data-step="1"]');
    paso1.scrollIntoView({ behavior: suave ? 'smooth' : 'auto' });
    paso1.tabIndex = -1; // el botón desaparece con el panel: el foco del teclado pasa al paso 1
    paso1.focus({ preventScroll: true });
  });
  // Mientras se lee la metodología, el panel y la leyenda se esconden (no tapan el texto).
  const metodologia = $('metodologia');
  if (metodologia && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => document.body.classList.toggle('en-metodologia', e.isIntersecting),
      { rootMargin: '0px 0px -50% 0px' }).observe(metodologia);
  }
  // En el celular el panel es una hoja inferior plegable (arranca plegada: el mapa queda a pantalla completa).
  const btnPlegar = $('btn-plegar');
  btnPlegar.addEventListener('click', () => {
    const abierto = btnPlegar.getAttribute('aria-expanded') === 'true';
    btnPlegar.setAttribute('aria-expanded', String(!abierto));
    btnPlegar.textContent = abierto ? 'Filtros' : 'Cerrar';
    panel.classList.toggle('plegado', abierto);
  });

  return { alClickPozo: (id) => abrirPozo(id), mostrarPanel, ocultarPanel };
}

// Rampa de población por radio censal, con los mismos cortes que usa el mapa.
function htmlRampa() {
  const c = POBLACION_CORTES.map((n) => fmt(n));
  const rotulos = [`menos de ${c[0]}`, ...c.slice(1).map((n, i) => `${c[i]} a ${n}`), `más de ${c[c.length - 1]}`];
  return `<div class="ley-rampa"><p class="ley-titulo">Habitantes por radio censal (Censo 2022)</p>${POBLACION_RAMPA.map((col, i) =>
    `<div class="ley-item"><span class="ley-cuadro" style="background:${col}"></span>${rotulos[i]}</div>`).join('')}</div>`;
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const mesAnio = (aaaamm) => `${MESES[Number(aaaamm.slice(5, 7)) - 1]} de ${aaaamm.slice(0, 4)}`;
function aniosSinProducir(meses) {
  const a = Math.floor(meses / 12);
  return a === 1 ? 'más de un año sin producir' : `${fmt(a)} años sin producir`;
}

// "Declarado abandonado": la serie mensual arranca en enero de 2017, así que "2017-01" significa
// "ya figuraba abandonado al empezar la serie", no la fecha real. Si el listado de operadoras trae
// la fecha de abandono (pocos pozos, a veces muy viejos), se muestra esa.
function declaradoAbandonado(f) {
  if (f.g !== 'Abandonado' && !f.pab) return '';
  if (f.fab) return `<dt>Declarado abandonado</dt><dd>${esc(f.fab)} <em>(listado de operadoras)</em></dd>`;
  if (f.pab === '2017-01') return '<dt>Declarado abandonado</dt><dd>ya figuraba así en enero de 2017 (inicio de la serie mensual)</dd>';
  if (f.pab) return `<dt>Declarado abandonado</dt><dd>desde ${esc(f.pab)}</dd>`;
  return '';
}

function contar(arr, k) {
  const c = new Uint32Array(k);
  for (let i = 0; i < arr.length; i++) c[arr[i]]++;
  return c;
}
function llenarSelect(sel, nombres, conteos, etiqueta) {
  const idx = [...nombres.keys()].filter((i) => conteos[i] > 0).sort((a, b) => conteos[b] - conteos[a]);
  for (const i of idx) {
    const o = document.createElement('option');
    o.value = i; o.textContent = `${etiqueta(nombres[i])} (${fmt(conteos[i])})`;
    sel.appendChild(o);
  }
}
// Sigla normalizada para buscar: mayúsculas, sin espacios, puntos ni guiones ("YPF.Ch.-679" → "YPFCH679").
const normalizar = (s) => String(s).toUpperCase().replace(/[\s.\-]/g, '');
async function construirIndiceSigla(pozos) {
  const lotes = new Set();
  for (let i = 0; i < pozos.n; i++) lotes.add(Math.floor(pozos.cols.idpozo[i] / 1000));
  const exacta = new Map(), lista = [];
  const recs = await Promise.all([...lotes].map((l) => cargarLote(l)));
  for (const lote of recs) {
    for (const [id, f] of Object.entries(lote)) {
      if (!f.s) continue;
      const s = normalizar(f.s);
      if (!exacta.has(s)) exacta.set(s, []);
      exacta.get(s).push(Number(id));
      lista.push([s, Number(id)]);
    }
  }
  return { exacta, lista };
}
