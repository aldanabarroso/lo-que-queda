// Página "Metodología y fuentes" (plan, tarea 3.2). Reemplaza el contenido de
// <section id="metodologia"> con la página completa.
//
// Reglas (CLAUDE.md):
// - Toda cifra sale de resumen.json (R): miles con fmt(), decimales con coma. Los años y las fechas de
//   documentos no pasan por fmt() (sería "2.026").
// - Si falta una clave de R, la frase no va: nunca se imprime "undefined" ni "NaN" (ver si``).
// - Enlaces solo a fuentes que figuran en docs/ (investigacion-contexto.md, formulario.md) y, para los
//   créditos, a la página de cada biblioteca (campo homepage de su package.json).
// - "Abandonado" = dado de baja por la operadora según la Resolución SE 5/96; no describe el estado físico.

import './metodologia.css';
import { fmt } from './data.js';
import { ESTADOS } from './paleta.js';
import { HISTORIAS, FUENTES_HISTORIAS } from './historias.js';
import { htmlFuente } from './fuentes.js';

// Autoría: seudónimo pendiente. No poner nombres reales hasta después del fallo del jurado.
// Mientras sea null, la línea de autoría no se muestra.
const AUTORIA = null;

// Enlaces oficiales. Cada uno con el documento del repo de donde sale.
const ENLACES = {
  datasetSE: 'http://datos.energia.gob.ar/dataset/c846e79c-026c-4040-897f-1ad3543b407c', // docs/formulario.md
  res596: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/30000-34999/31996/norma.htm', // docs/investigacion-contexto.md
  ley24799: 'https://www.argentina.gob.ar/normativa/nacional/ley-24799-42613/texto', // docs/investigacion-contexto.md
  mecon1907: 'https://www.argentina.gob.ar/noticias/13-de-diciembre-descubrimiento-de-petroleo-en-comodoro-rivadavia', // ídem
  ypf20F: 'https://www.sec.gov/Archives/edgar/data/904851/000119312525067155/d866694d20f.htm', // ídem
  ypf6K: 'https://www.sec.gov/Archives/edgar/data/904851/000119312526057719/d47643d6k.htm', // ídem
  muniCH679: 'https://www.comodoro.gov.ar/2024/08/27/el-municipio-intervino-ante-un-nuevo-derrame-de-petroleo-en-un-yacimiento-ypf/', // ídem
  muniPasivos: 'https://www.comodoro.gov.ar/2024/03/20/coluccio-con-esta-ordenanza-nos-ponemos-a-la-altura-de-la-industria-hidrocarburifera/', // ídem
  censoMuni: 'https://www.comodoro.gov.ar/miciudad/2025/10/13/censo-nacional-de-poblacion-hogares-y-viviendas-2022/', // ídem
  ephInforme2T2026: 'https://www.indec.gob.ar/uploads/informesdeprensa/mercado_trabajo_eph_2trim26433FCBC5A8.pdf', // ídem
  mauroEsains: 'https://www.instagram.com/mauroesains/', // autor de la foto del paso 8 (ídem, sección Fotos)
  // créditos: páginas de los proyectos (homepage de cada package.json en node_modules)
  openfreemap: 'https://openfreemap.org/',
  osm: 'https://www.openstreetmap.org/copyright',
  maplibre: 'https://maplibre.org/',
  deck: 'https://deck.gl',
  d3: 'https://d3js.org',
  scrollama: 'https://github.com/russellgoldenberg/scrollama',
  vite: 'https://vite.dev',
};

// ---------------------------------------------------------------------------
// Ayudas de formato
// ---------------------------------------------------------------------------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const esNum = (x) => typeof x === 'number' && Number.isFinite(x);
/** Entero con miles con punto, o null si no hay dato. */
const N = (x) => (esNum(x) ? fmt(x) : null);
/** Decimal con coma (un decimal), o null. */
const D = (x) => (esNum(x) ? x.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : null);
/** Año tal cual (sin separador de miles), o null. */
const A = (x) => (Number.isInteger(x) ? String(x) : (typeof x === 'string' && /^\d{4}$/.test(x) ? x : null));
/** Texto del dato escapado, o null. */
const T = (s) => (s === undefined || s === null || s === '' ? null : esc(s));
const PCT = '&nbsp;%';

/** Plantilla que devuelve '' si falta algún valor (null, undefined, false o número no finito):
 *  así una frase con un dato ausente no se imprime. */
function si(partes, ...valores) {
  if (valores.some((v) => v === null || v === undefined || v === false || (typeof v === 'number' && !Number.isFinite(v)))) return '';
  return partes.reduce((acc, p, i) => acc + p + (i < valores.length ? valores[i] : ''), '');
}

const enlace = (href, texto) => `<a href="${href}" target="_blank" rel="noopener">${texto}</a>`;
// Archivos de la propia pieza (public/data se publica como data/ junto a index.html)
const enlaceLocal = (ruta, texto) => `<a href="${ruta}" target="_blank" rel="noopener">${texto}</a>`;

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
/** "2017-01" -> "enero de 2017" */
function mes(s) {
  const m = /^(\d{4})-(\d{2})$/.exec(typeof s === 'string' ? s : '');
  const i = m ? Number(m[2]) - 1 : -1;
  return i >= 0 && i < 12 ? `${MESES[i]} de ${m[1]}` : null;
}
/** "2026-09-26" -> "26/9/2026" */
function fecha(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(typeof s === 'string' ? s : '');
  return m ? `${Number(m[3])}/${Number(m[2])}/${m[1]}` : null;
}
const ORDINAL = { 1: '1.er', 2: '2.º', 3: '3.er', 4: '4.º' };
/** (2026, 2) -> "2.º trimestre de 2026" */
const trimestre = (anio, t) => (A(anio) && ORDINAL[t] ? `${ORDINAL[t]} trimestre de ${A(anio)}` : null);
/** "2003T3" -> "3.er trimestre de 2003" */
function periodo(p) {
  const m = /^(\d{4})T([1-4])$/.exec(typeof p === 'string' ? p : '');
  return m ? trimestre(m[1], Number(m[2])) : null;
}

// ---------------------------------------------------------------------------
// Secciones
// ---------------------------------------------------------------------------
const SECCIONES = [
  ['met-datos', 'Datos'],
  ['met-estados', 'Cómo agrupamos los estados'],
  ['met-proceso', 'Qué hicimos con los datos'],
  ['met-limites', 'Límites del dato'],
  ['met-contexto', 'Fuentes del contexto'],
  ['met-ia', 'Uso de inteligencia artificial'],
  ['met-creditos', 'Créditos y licencias'],
];
const titulo = (id) => `<h3 id="${id}">${SECCIONES.find(([i]) => i === id)[1]}</h3>`;

// TEXTO PROVISORIO: el párrafo de apertura lo escribe Aldana (docs/para-aldana.md, tarea 9)
function apertura(R) {
  return `
    <p class="met-apertura">Esta página cuenta de dónde sale cada cifra de la pieza, qué hicimos con los datos y qué
    no se puede afirmar a partir de ellos. Las cifras que salen de los datos las calcula un programa reproducible
    y se leen de un solo archivo, ${enlaceLocal('data/resumen.json', 'resumen.json')}; las de contexto (fechas,
    normas, documentos) llevan su fuente oficial.${si` Esta versión de las cifras se generó el ${fecha(R.generado)}.`}</p>`;
}

function indice() {
  return `
    <nav class="met-indice" aria-label="Secciones de la metodología">
      <ul>${SECCIONES.map(([id, t]) => `<li><a href="#${id}">${t}</a></li>`).join('')}</ul>
    </nav>`;
}

function datos(R) {
  const c = R.cuenca || {}, p = R.poblacion || {}, pr = R.produccion || {}, a = R.antiguedad || {};
  const t = R.trayectoria, cob = (t && t.cobertura) || {}, co = R.concesiones, b = R.barrios, E = R.eph;

  const se = [
    `<li><strong>Capítulo IV – Pozos</strong>: el registro de pozos con ubicación, operadora, yacimiento y estado
      declarado${si` (${N(R.pais?.pozos)} pozos en todo el país)`}. Es la base de la pieza${si`: de ahí salen los
      ${N(c.total)} pozos de la Cuenca del Golfo San Jorge`}. La primera descarga fue el 18/09/2026; la versión
      que usa hoy el programa, con las coordenadas de todo el país, es del 20/09/2026 y da las mismas cifras de la
      cuenca. Las cifras quedaron congeladas con esa versión.</li>`,
    `<li><strong>Listado de pozos cargados por empresas operadoras</strong> (versión actualizada al 20/10/2025):
      la operadora que tenía cada pozo antes y, en algunos casos, la fecha de abandono que informó. Con él
      reconstruimos el cambio de manos tras la salida de YPF.</li>`,
    `<li><strong>Serie histórica de producción de petróleo por cuenca y sub-tipo de recurso</strong>: el gráfico
      de producción por cuenca${si` (${A(pr.anio_base)}–${A(pr.anio_ref)})`}.</li>`,
    `<li><strong>Padrón de pozos de Capítulo IV con fecha de primera producción</strong>: la serie empieza en
      enero de 2006${si`; ${N(a.con_primera_prod)} pozos de la cuenca tienen dato`}.</li>`,
  ];
  const seOtros = [];
  if (t) {
    seOtros.push(`<li><strong>Producción mensual por pozo</strong> (recursos anuales «Producción de Pozos de Gas y
      Petróleo»)${si`, de ${mes(cob.desde)} a ${mes(cob.hasta)}`}${si`; ${N(cob.pozos_con_registro)} pozos de la
      cuenca tienen al menos un mes registrado`}. Filtrada a la cuenca y procesada el 20/09/2026.</li>`);
  }
  if (co) {
    seOtros.push(`<li><strong>Concesiones de explotación</strong> (dataset «Producción de hidrocarburos –
      Concesiones de Explotación», capa de polígonos), descargado el 20/09/2026${si`; ${N(co.poligonos)}
      concesiones en la cuenca`}.</li>`);
  }

  const muni = [
    `<li><strong>Límites administrativos 2025</strong>: ejido de Comodoro Rivadavia, Rada Tilly y departamento
      Escalante. Descargado el 18/09/2026.</li>`,
    `<li><strong>Radios censales 2022</strong> y <strong>población por radio censal</strong> (Censo 2022,
      INDEC)${si`: ${N(p.radios)} radios con población`}. Descargados el 18/09/2026.</li>`,
  ];
  if (b) {
    muni.push(`<li><strong>Barrios</strong> (capa 2026)${si`: ${N(b.cantidad)} barrios de Comodoro Rivadavia`}.
      Integrada el 20/09/2026.</li>`);
  }

  const indec = [
    `<li><strong>Censo Nacional de Población, Hogares y Viviendas 2022</strong>: la población por radio censal,
      tomada del portal municipal. La población oficial de la ciudad es la que publica el municipio:
      ${enlace(ENLACES.censoMuni, 'Censo 2022 en el sitio de la Municipalidad de Comodoro Rivadavia')}.</li>`,
  ];
  if (E) {
    indec.push(`<li><strong>Encuesta Permanente de Hogares (EPH)</strong>: tasa de desocupación del aglomerado
      Comodoro Rivadavia–Rada Tilly. El valor de cada trimestre sale de la serie <code>45.2_ECTDTCR_0_T_52</code>
      de datos.gob.ar${si` (trimestral, desde el ${periodo(E.serie_desde)})`}, descargada el 26/09/2026. El
      coeficiente de variación y el intervalo de confianza, de los informes «Mercado de trabajo. Tasas e
      indicadores socioeconómicos» del INDEC (cuadros 3.1 a 3.4)${si`, hasta el del ${trimestre(E.anio, E.trimestre)}`}.</li>`);
  }

  return `
    <section aria-labelledby="met-datos">
      ${titulo('met-datos')}
      <p>Los datos de la pieza son abiertos y vienen de organismos públicos; solo el mapa base es de un proyecto
      colaborativo. Los de la Secretaría de Energía se publican con licencia CC-BY 4.0.</p>

      <h4>Secretaría de Energía</h4>
      <p>Del dataset ${enlace(ENLACES.datasetSE, 'Producción de petróleo y gas por pozo (Capítulo IV)')},
      en datos.energia.gob.ar:</p>
      <ul>${se.join('')}</ul>
      ${seOtros.length ? `<p>Además, de la Secretaría de Energía:</p><ul>${seOtros.join('')}</ul>` : ''}

      <h4>Municipalidad de Comodoro Rivadavia</h4>
      <p>Del portal de datos abiertos del municipio, datos.comodoro.gov.ar (licencia Creative Commons, según
      el portal):</p>
      <ul>${muni.join('')}</ul>

      <h4>INDEC</h4>
      <ul>${indec.join('')}</ul>

      <h4>Mapa base</h4>
      <p>${enlace(ENLACES.openfreemap, 'OpenFreeMap')} (estilo Positron), con datos ©
      ${enlace(ENLACES.osm, 'colaboradores de OpenStreetMap')} (licencia ODbL). Cambiamos los rótulos por el
      nombre en castellano que registra OpenStreetMap (<code>name:es</code>; si no hay, el nombre original): por
      eso el mapa dice «Islas Malvinas». Quitamos la capa de áreas protegidas, que dibujaba manchas grises que
      distraían del dato. Si el servicio no responde, el mapa usa un fondo liso propio y los pozos y los límites
      se siguen viendo.</p>
    </section>`;
}

function estados(R) {
  const G = R.grupos_de_estado;
  const c = R.cuenca || {};
  let tabla = '';
  let resumenGrupos = '';
  if (G && typeof G === 'object') {
    const porGrupo = new Map();
    for (const [estado, grupo] of Object.entries(G)) {
      if (!porGrupo.has(grupo)) porGrupo.set(grupo, []);
      porGrupo.get(grupo).push(estado);
    }
    // Orden fijo de src/paleta.js (vivo → apagándose → muerto); grupos desconocidos, al final.
    const orden = ESTADOS.map((e) => e.nombre).filter((n) => porGrupo.has(n));
    for (const g of porGrupo.keys()) if (!orden.includes(g)) orden.push(g);
    const total = esNum(c.total) && c.total > 0 ? c.total : null;
    const conConteos = total !== null;

    const filas = orden.map((g) => {
      const color = ESTADOS.find((e) => e.nombre === g)?.hex;
      const n = c[g];
      const p = conConteos && esNum(n) ? (n / total) * 100 : null;
      // un grupo muy chico no se muestra como "0,0 %"
      const pct = p === null ? null : (p > 0 && p < 0.05 ? `menos de ${D(0.1)}` : D(p));
      return `
        <tr>
          <th scope="row">${color ? `<span class="met-punto" style="background:${color}" aria-hidden="true"></span>` : ''}${esc(g)}</th>
          <td><ul class="met-estados">${porGrupo.get(g).map((e) => `<li>${esc(e)}</li>`).join('')}</ul></td>
          ${conConteos ? `<td class="met-num">${N(n) ?? '–'}</td><td class="met-num">${pct ? pct + PCT : '–'}</td>` : ''}
        </tr>`;
    }).join('');

    // El título visible va fuera de la envoltura que se desplaza (en celular, un <caption> quedaría cortado);
    // el <caption> sigue en la tabla para lectores de pantalla.
    const leyendaTabla = `Estado declarado por la operadora y grupo en que lo contamos${conConteos ? '. Pozos de la Cuenca del Golfo San Jorge' : ''}`;
    tabla = `
      <p class="met-tabla-titulo" aria-hidden="true">${leyendaTabla}</p>
      <p class="met-tabla-aviso" aria-hidden="true">Desplazá la tabla hacia el costado para ver todas las columnas.</p>
      <div class="met-tabla-envoltura" role="region" aria-labelledby="met-tabla-titulo" tabindex="0">
        <table>
          <caption id="met-tabla-titulo" class="met-oculto">${leyendaTabla}</caption>
          <thead>
            <tr>
              <th scope="col">Grupo</th>
              <th scope="col">Estados declarados que incluye</th>
              ${conConteos ? '<th scope="col" class="met-num">Pozos</th><th scope="col" class="met-num">% de la cuenca</th>' : ''}
            </tr>
          </thead>
          <tbody>${filas}</tbody>
          ${conConteos ? `<tfoot><tr><th scope="row">Total</th><td></td><td class="met-num">${N(total)}</td><td></td></tr></tfoot>` : ''}
        </table>
      </div>`;

    const nGrupos = orden.filter((g) => g !== 'No informado').length;
    resumenGrupos = si` La tabla de equivalencias reúne los ${N(Object.keys(G).length)} valores del registro
      (incluido «No informado») en ${N(nGrupos)} grupos.`;
  }

  const sinProd = si`<p>«Sin producir» suma los pozos declarados inactivos, a abandonar y abandonados:
    ${N(c.sin_produccion)} en la cuenca${esNum(c.sin_produccion_pct) ? `, el ${D(c.sin_produccion_pct)}${PCT} del total` : ''}.</p>`;

  return `
    <section aria-labelledby="met-estados">
      ${titulo('met-estados')}
      <p>El estado de cada pozo es el que su operadora declara ante la Secretaría de Energía.${resumenGrupos}
      El color sigue un orden fijo, de lo que produce a lo que se dio de baja. El gris de «Abandonado» es
      deliberado: marca una ausencia, no una categoría más.</p>
      ${tabla}
      <p>«Abandonado» quiere decir que la operadora dio de baja el pozo según la
      ${enlace(ENLACES.res596, 'Resolución SE 5/96 (texto en InfoLeg)')}, que fija las normas y procedimientos
      para el abandono de pozos. <strong>No describe el estado físico del pozo.</strong> La resolución define tres
      categorías (activo, inactivo y abandonado) y distingue el abandono temporario del definitivo; por eso
      contamos «Abandono Temporario» como inactivo. No hay un diccionario oficial que defina los demás estados
      («En Estudio», «Parado Transitoriamente» y otros): la agrupación es nuestra, y la ficha de cada pozo
      muestra el estado original.</p>
      ${sinProd}
    </section>`;
}

function proceso(R) {
  const c = R.cuenca || {}, e = R.ejido || {}, p = R.poblacion || {}, a = R.antiguedad || {}, q = R.calidad || {};
  const b = R.barrios, co = R.concesiones, t = R.trayectoria, cob = (t && t.cobertura) || {};

  // Cruces espaciales
  const cruces = [
    si`<li>Ejido de Comodoro Rivadavia: ${N(e.total)} pozos${si`; Rada Tilly: ${N(e.rada_tilly?.total)}`}${si`;
      departamento Escalante: ${N(e.escalante?.total)}`}.</li>`,
    si`<li>Radios censales 2022: ${N(p.pozos_en_radios?.total)} pozos caen en ${N(p.radios_con_pozo)} de los
      ${N(p.radios)} radios. En esos radios viven ${N(p.pobl_en_radios_con_pozo)} personas${si`, el
      ${D(p.pobl_en_radios_con_pozo_pct)}${PCT} de la población de todos los radios`}: es lo que el recorrido
      llama «vivir en un radio censal con al menos un pozo».</li>`,
    b ? si`<li>Barrios: ${N(b.pozos_en_barrios)} pozos en ${N(b.barrios_con_pozo)} de los ${N(b.cantidad)}
      barrios.</li>` : '',
  ].join('');

  let concesiones = '';
  if (co) {
    const areas = Object.entries(co.areas_sin_concesion || {})
      .filter(([nombre, n]) => T(nombre) && esNum(n)).slice(0, 3)
      .map(([nombre, n]) => `${T(nombre)} (${N(n)})`);
    concesiones = `<p>Las concesiones no se cruzan por ubicación sino por código de área: un pozo está «en un área
      con concesión» si el código de su área figura en la capa de concesiones de explotación.${si`
      ${N(co.pozos_en_area_con_concesion)} pozos cumplen esa condición y ${N(co.pozos_en_area_sin_concesion)} no`}${
      areas.length && esNum(co.pozos_en_area_con_concesion) && esNum(co.pozos_en_area_sin_concesion) ? `; las áreas con más pozos en ese caso son ${areas.join(', ')}` : ''}.</p>`;
  }

  const operadora = `<p>Cruzamos por número de pozo (<code>idpozo</code>) el Capítulo IV con el listado de pozos
    cargados por empresas operadoras para saber qué empresa tenía cada pozo antes.${si` En ese listado,
    ${N(c.ypf_pozos_listado_anterior)} pozos de la cuenca figuraban a nombre de YPF; en el Capítulo IV descargado,
    ${c.ypf_pozos_actual === 0 ? 'ninguno' : N(c.ypf_pozos_actual)}.`}</p>`;

  // Fechas
  const fechas = [
    si`<li>Descartamos ${N(q.fechas_relleno_descartadas)} fechas de inicio de perforación que son relleno: el
      1/1/1902, cargado en masa, y cualquier fecha anterior al 1/1/1907. El corte no es el 13/12/1907 porque el
      Pozo N° 2 empezó a perforarse en marzo de 1907, según el registro de la Secretaría de Energía.</li>`,
    si`<li>${N(q.sin_fecha_perforacion)} pozos no tienen fecha de perforación${si`; solo el
      ${D(c.con_fecha_perforacion_pct)}${PCT} de la cuenca la tiene`}.</li>`,
    `<li>La fecha de abandono de la ficha, cuando aparece, es la que la operadora informó en el listado de pozos
      cargados por empresas operadoras; la tienen pocos pozos.</li>`,
    `<li>El padrón de primera producción empieza en enero de 2006. Que un pozo «ya figuraba en 2006-01» quiere
      decir que estaba en el registro al inicio de la serie: no es una fecha de perforación, y su primera
      producción puede ser anterior.${si` De los ${N(a.con_primera_prod)} pozos con dato, ${N(a.ya_en_2006)}
      están en ese caso y ${N(a.iniciaron_despues_2006)} empezaron a producir después.`}</li>`,
  ].join('');

  // Serie mensual
  let mensual = '';
  if (t) {
    const anioDesde = typeof cob.desde === 'string' ? cob.desde.slice(0, 4) : null;
    const yaAbandonados = anioDesde ? t.abandonados_por_anio_de_declaracion?.[anioDesde] : null;
    mensual = `
      <h4>Producción mensual</h4>
      <ul>
        <li>Con la producción mensual${si` de ${mes(cob.desde)} a ${mes(cob.hasta)}`} calculamos, para cada pozo,
          el último mes con producción de petróleo o gas, los meses que lleva sin producir y el primer mes en que
          figura como «Abandonado».</li>
        <li>«Nunca en la serie» quiere decir que el pozo no registró ni un mes con producción de petróleo o gas en
          todo ese período.${si` Son ${N(t.nunca_en_serie)} pozos; ${N(t.nunca_en_serie_no_abandonados)} de ellos
          están declarados inactivos o a abandonar.`}</li>
        ${si`<li>Si el primer mes como «Abandonado» es el primero de la serie (${mes(cob.desde)}), el pozo ya
          figuraba abandonado entonces: no se declaró ese mes. La ficha lo muestra como «ya figuraba así al inicio
          de la serie».${si` Son ${N(yaAbandonados)} pozos.`} Por eso el ritmo anual de declaraciones de abandono
          se calcula solo con los años completos entre el primero y el último de la serie.</li>`}
      </ul>`;
  }

  // Controles de calidad
  const controles = [];
  if (esNum(q.coordenadas_corregidas) && esNum(q.coordenadas_invalidas)) {
    controles.push(`<li>El programa corrige las coordenadas cargadas sin la coma decimal y marca las que caen
      fuera del recuadro que contiene a la Argentina. ${q.coordenadas_corregidas === 0 && q.coordenadas_invalidas === 0
      ? 'En esta versión del Capítulo IV no hizo falta corregir ninguna y ninguna cae afuera.'
      : `En esta versión: ${N(q.coordenadas_corregidas)} corregidas y ${N(q.coordenadas_invalidas)} fuera del recuadro.`}</li>`);
  }
  if (esNum(q.duplicados_idpozo)) {
    controles.push(q.duplicados_idpozo === 0
      ? '<li>No hay números de pozo (<code>idpozo</code>) repetidos.</li>'
      : `<li>${N(q.duplicados_idpozo)} números de pozo (<code>idpozo</code>) aparecen repetidos.</li>`);
  }
  controles.push(si`<li>${N(q.no_informado)} pozos no tienen estado informado; se cuentan aparte, como «No
    informado».</li>`);

  // Historias del paso 7 ("Convivir con los pozos"): de dónde salen y cómo se relacionan con el registro.
  const conSigla = HISTORIAS.filter((h) => h.relacion === 'fuente').map((h) => esc(h.titulo));
  const sinSigla = HISTORIAS.filter((h) => h.relacion === 'autores').map((h) => esc(h.titulo));
  const ch679 = `<h4>Las historias del paso 7</h4>
    <p>El paso «Convivir con los pozos» cuenta historias de vecinos que viven al lado de pozos. Es la única parte de
    la pieza que cita prensa: notas de medios locales y nacionales y comunicados de la Municipalidad, siempre
    atribuidas («según publicó…») y con enlace; cuando hay una fuente oficial, va primero. Lo que afirma cada medio
    va a su nombre. No nombramos a vecinos: quien quiera más detalle encuentra la nota enlazada.</p>
    <p>Los datos de cada pozo (estado declarado, operadora, barrio) salen del Capítulo IV, no de las notas.
    ${conSigla.length ? `En ${conSigla.join(' y ')}, las fuentes nombran el pozo y lo ubicamos en el registro por su sigla. ` : ''}${sinSigla.length
      ? `En ${sinSigla.join(', ')}, las notas no nombran pozos: la relación con el registro la establecieron los autores.` : ''}
    Si dos notas no coinciden en una fecha (como en la Escuela N° 169: abril de 2001 o mayo de 2002), se dan las
    dos, cada una con su fuente.</p>`;

  return `
    <section aria-labelledby="met-proceso">
      ${titulo('met-proceso')}
      <h4>Cruces espaciales</h4>
      <p>La cuenca se filtra por el campo «cuenca» del registro${si`: de los ${N(R.pais?.pozos)} pozos del país,
        ${N(c.total)} son de la Cuenca del Golfo San Jorge`}. Después ubicamos cada pozo por sus coordenadas
        dentro de cada capa (punto en polígono):</p>
      ${cruces ? `<ul>${cruces}</ul>` : ''}
      ${concesiones}

      <h4>Operadora anterior</h4>
      ${operadora}

      <h4>Fechas</h4>
      <ul>${fechas}</ul>
      ${mensual}

      <h4>Controles de calidad</h4>
      <ul>${controles.join('')}</ul>
      ${ch679}

      <h4>Cómo verificar una cifra</h4>
      <p>El programa que procesa los datos (<code>data-pipeline/procesar.py</code>) se publica con el código de la
      pieza y da el mismo resultado cada vez que se corre. Todas las cifras están en
      ${enlaceLocal('data/resumen.json', 'resumen.json')} y las principales, en una
      ${enlaceLocal('data/conciliacion.md', 'tabla de control (conciliacion.md)')}. Si querés cotejar una,
      empezá por ahí.</p>
    </section>`;
}

function limites(R) {
  const c = R.cuenca || {}, p = R.poblacion || {}, pr = R.produccion || {}, t = R.trayectoria, E = R.eph;
  const cob = (t && t.cobertura) || {};
  const items = [
    `<li><strong>El estado es el que declara la operadora.</strong> No describe el estado físico del pozo ni
      cómo se hizo su abandono.</li>`,
    `<li><strong>No calculamos distancias entre pozos y viviendas</strong> ni hacemos afirmaciones sobre
      contaminación: el dato no lo permite. La cercanía se mide a escala de radio censal y de barrio; que un
      radio tenga pozos no dice a qué distancia de las casas están.</li>`,
    si`<li><strong>${N(c.sin_empresa?.total)} pozos no tienen empresa en el registro</strong>${si`
      (${N(c.sin_empresa?.Abandonado)} de ellos, abandonados)`}. Pueden ser vacíos de carga: los mostramos como
      «sin empresa asignada».</li>`,
    si`<li><strong>Solo el ${D(c.con_fecha_perforacion_pct)}${PCT} de los pozos tiene fecha de
      perforación</strong>: cualquier lectura por antigüedad es parcial.</li>`,
    t ? si`<li><strong>La producción mensual por pozo empieza en ${mes(cob.desde)}.</strong> «Sin producir desde
      ${A(typeof cob.desde === 'string' ? cob.desde.slice(0, 4) : null)}» no dice desde cuándo exactamente está
      parado un pozo.</li>` : '',
    si`<li><strong>El gráfico de producción por cuenca usa años completos</strong>: el último es
      ${A(pr.anio_ref)}.</li>`,
    R.concesiones ? `<li><strong>Concesiones.</strong> Que el código de área de un pozo no figure en la capa de
      concesiones no dice, por sí solo, cuál es la situación legal del área.</li>` : '',
    si`<li><strong>Población.</strong> La suma de los radios censales (${N(p.total_radios)} habitantes) se usa
      solo como base del porcentaje de población en radios con pozo. La población oficial de la ciudad es la que
      publica el municipio con el Censo 2022.</li>`,
    `<li><strong>Datos congelados.</strong> Las cifras de la Secretaría de Energía corresponden a las descargas del
      18 y el 20/09/2026. El registro se actualiza: con una versión posterior, las cifras pueden cambiar.</li>`,
  ];

  if (E && esNum(E.desocupacion)) {
    let s = si`La desocupación de Comodoro Rivadavia–Rada Tilly sale de una encuesta por muestreo (la EPH), con
      error muestral alto en un aglomerado de este tamaño. En el ${trimestre(E.anio, E.trimestre)} fue del
      ${D(E.desocupacion)}${PCT}${E.provisorio ? ' (dato provisorio)' : ''}`;
    if (s) {
      const ic = Array.isArray(E.ic90) && E.ic90.length === 2 && esNum(E.ic90[0]) && esNum(E.ic90[1]) ? E.ic90 : null;
      if (esNum(E.cv)) {
        s += `, con un coeficiente de variación de ${D(E.cv)}${PCT}`;
        if (ic) s += ` y un intervalo de confianza al 90${PCT} de ${D(ic[0])}${PCT} a ${D(ic[1])}${PCT}`;
        s += `. El INDEC considera no confiables las estimaciones con un coeficiente de variación mayor al 25${PCT}`;
        if (E.cv > 25) s += '; esta lo supera';
      } else if (ic) {
        s += `, con un intervalo de confianza al 90${PCT} de ${D(ic[0])}${PCT} a ${D(ic[1])}${PCT}`;
      }
      s += '. Por eso citamos el valor puntual, y no decimos cuánto subió ni lo atribuimos al petróleo.';
      const u = E.ultimo_valor_mayor;
      if (u && typeof u === 'object') {
        s += si` En la serie de datos.gob.ar, el último trimestre con una tasa más alta es el
          ${periodo(u.periodo)} (${D(u.tasa)}${PCT}).`;
      } else if (u === null) {
        s += si` Es el valor más alto de la serie de datos.gob.ar, que empieza en el ${periodo(E.serie_desde)}.`;
      }
      items.push(`<li><strong>Desocupación.</strong> ${s}</li>`);
    }
  }

  return `
    <section aria-labelledby="met-limites">
      ${titulo('met-limites')}
      <ul>${items.join('')}</ul>
    </section>`;
}

function contexto(R) {
  const E = R.eph;
  const items = [
    `<li>${enlace(ENLACES.mecon1907, 'Ministerio de Economía, nota sobre el descubrimiento de petróleo en Comodoro Rivadavia (13 de diciembre de 1907)')}:
      el hallazgo en el Pozo N° 2, en una perforación del Estado que buscaba agua.</li>`,
    `<li>Decreto del 14 de diciembre de 1907 (presidente Figueroa Alcorta): prohibió pedir permisos mineros
      alrededor del pueblo. No tiene número conocido y se cita por fecha; texto en Favaro, Morinelli y Ragno
      (CEAL, 1989).</li>`,
    `<li>${enlace(ENLACES.ley24799, 'Ley 24.799 (1997)')}: el sitio del Pozo N° 2, hoy Museo Nacional del
      Petróleo, como bien de interés histórico.</li>`,
    `<li>${enlace(ENLACES.res596, 'Resolución SE 5/96 (Boletín Oficial, 9/1/1996), en InfoLeg')}: normas y
      procedimientos para el abandono de pozos; define «abandonado» y dispone que el abandono en ejidos urbanos
      sea siempre definitivo.</li>`,
    `<li>${enlace(ENLACES.ypf20F, 'YPF, Form 20-F 2024, Nota 17 (SEC)')}: provisión por abandono de pozos al
      31/12/2024.</li>`,
    `<li>${enlace(ENLACES.ypf6K, 'YPF, Form 6-K ante la SEC (19/2/2026)')}: adjudicación de Manantiales Behr a
      PECOM y San Benito Upstream, parte de la salida de YPF de la cuenca.</li>`,
    `<li>Decreto de Chubut 1509/2024 (Boletín Oficial de Chubut, 29/10/2024): cesión de Escalante–El Trébol a
      PECOM Servicios Energía SAU.</li>`,
    `<li>${enlace(ENLACES.muniCH679, 'Municipalidad de Comodoro Rivadavia, comunicado del 27/8/2024')}:
      intervención por la surgencia del pozo CH-679, en el Yacimiento Central, que afectó el arroyo Belgrano.</li>`,
    `<li>Registro de pasivos ambientales: no encontramos un registro público nacional ni provincial de pasivos
      ambientales hidrocarburíferos en funcionamiento. En Comodoro, el municipio presentó un
      ${enlace(ENLACES.muniPasivos, 'proyecto de ordenanza para crear un Registro Municipal de Pasivos Ambientales (20/3/2024)')}.</li>`,
    `<li>${enlace(ENLACES.censoMuni, 'Municipalidad de Comodoro Rivadavia, Censo 2022')}: población de la
      ciudad y del departamento Escalante.</li>`,
  ];
  if (E) {
    // El enlace es al informe del 2.º trimestre de 2026; si el pipeline pasa a otro trimestre, va sin enlace.
    const per = trimestre(E.anio, E.trimestre);
    const esInforme2T2026 = E.anio === 2026 && E.trimestre === 2;
    const nombre = `INDEC, «Mercado de trabajo. Tasas e indicadores socioeconómicos (EPH)»${per ? `, ${per}` : ''}`;
    items.push(`<li>${esInforme2T2026 ? enlace(ENLACES.ephInforme2T2026, nombre) : nombre}: desocupación del
      aglomerado Comodoro Rivadavia–Rada Tilly, con su coeficiente de variación y su intervalo de
      confianza.</li>`);
  }
  // Historias del paso 7: prensa local y nacional y comunicados municipales (siempre atribuidos).
  const historias = HISTORIAS.map((h) => `<li>${esc(h.titulo)}: ${htmlFuente(h.fuentes)}.</li>`).join('');
  return `
    <section aria-labelledby="met-contexto">
      ${titulo('met-contexto')}
      <p>Cada afirmación del recorrido que no sale de los datos tiene una fuente oficial o primaria:</p>
      <ul>${items.join('')}</ul>
      ${FUENTES_HISTORIAS.length ? `<p>Las historias del paso 7 («Convivir con los pozos») citan, además, prensa y
      comunicados municipales, siempre atribuidos:</p><ul>${historias}</ul>` : ''}
    </section>`;
}

function ia() {
  // Declaración aprobada: docs/formulario.md, "Declaración de uso de IA (Anexo A)".
  return `
    <section aria-labelledby="met-ia">
      ${titulo('met-ia')}
      <dl class="met-ia">
        <dt>Herramientas</dt><dd>Claude (Anthropic).</dd>
        <dt>Etapas</dt><dd>Limpieza y cruce de datos, asistencia en la escritura de código de procesamiento y de
          la web, búsqueda y verificación de fuentes documentales, generación de ideas.</dd>
        <dt>Finalidad</dt><dd>Acelerar el trabajo técnico bajo supervisión humana.</dd>
      </dl>
      <p>Todas las decisiones de diseño visual, la selección de qué mostrar, los textos finales y la composición
      de la pieza fueron realizadas por las autoras/es. No se utilizó IA generativa para producir imágenes,
      gráficos ni la visualización final.</p>
    </section>`;
}

function creditos() {
  return `
    <section aria-labelledby="met-creditos">
      ${titulo('met-creditos')}
      <ul>
        <li><strong>Foto del Pozo N° 2</strong> (diciembre de 1907): Fototeca de Comodoro Rivadavia – Archivo
          Histórico Municipal; negativo cedido por el Archivo General de la Nación. Se usa con autorización.</li>
        <li><strong>Fotos de la portada y de los pasos 3, 4, 5 y 6</strong>: tomadas por los autores. Son
          fotografías, no imágenes generadas con inteligencia artificial.</li>
        <li><strong>Foto del paso 8</strong>: ${enlace(ENLACES.mauroEsains, 'Mauro Esains')}. Se usa con autorización.</li>
        <li><strong>Bibliotecas de código abierto</strong>: ${enlace(ENLACES.maplibre, 'MapLibre GL JS')}
          (BSD-3-Clause), ${enlace(ENLACES.deck, 'deck.gl')} (MIT), ${enlace(ENLACES.d3, 'D3')} (ISC) y
          ${enlace(ENLACES.scrollama, 'Scrollama')} (MIT). La web se compila con ${enlace(ENLACES.vite, 'Vite')} (MIT).</li>
        <li><strong>Tipografías</strong>: Fraunces y Source Sans 3, de Google Fonts (SIL Open Font License).</li>
        <li><strong>Código</strong>: licencia MIT (archivo <code>LICENSE</code> del repositorio).</li>
        <li><strong>Datos derivados</strong> (los archivos de la carpeta <code>data/</code> de la pieza): licencia
          CC-BY 4.0. Si los reutilizás, citá también las fuentes originales: Secretaría de Energía, Municipalidad
          de Comodoro Rivadavia e INDEC.</li>
      </ul>
      ${AUTORIA ? `<p>Autoría: ${esc(AUTORIA)}.</p>` : ''}
    </section>`;
}

/** HTML completo de la página (sin tocar el DOM; útil también para probarla fuera del navegador). */
export function htmlMetodologia(R) {
  R = R && typeof R === 'object' ? R : {};
  return `
    <div class="met-hoja">
      <h2 id="met-titulo">Metodología y fuentes</h2>
      ${apertura(R)}
      ${indice()}
      ${datos(R)}
      ${estados(R)}
      ${proceso(R)}
      ${limites(R)}
      ${contexto(R)}
      ${ia()}
      ${creditos()}
    </div>`;
}

/** Reemplaza el contenido de <section id="metodologia"> por la página completa. */
export function montarMetodologia(el, R) {
  if (!el) return;
  el.innerHTML = htmlMetodologia(R);
  el.setAttribute('aria-labelledby', 'met-titulo');
}
