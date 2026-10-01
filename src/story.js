// Recorrido guiado. Cada paso: texto (editable sin tocar el resto del código), vista del mapa
// y qué capas/filtros se activan. Las cifras se leen de resumen.json (R) para que nunca
// se desincronicen con los datos.

import scrollama from 'scrollama';
import { fmt, dec, esc } from './data.js';
import { dibujarProduccion } from './chart.js';

// Fuentes con enlace oficial (verificadas en docs/investigacion-contexto.md y docs/formulario.md).
// Una fuente sin enlace se escribe como texto suelto.
const F = {
  capIV: { t: 'Secretaría de Energía, Capítulo IV – Pozos', url: 'http://datos.energia.gob.ar/dataset/c846e79c-026c-4040-897f-1ad3543b407c' },
  mecon: { t: 'Ministerio de Economía', url: 'https://www.argentina.gob.ar/noticias/13-de-diciembre-descubrimiento-de-petroleo-en-comodoro-rivadavia' },
  ley24799: { t: 'Ley 24.799', url: 'https://www.argentina.gob.ar/normativa/nacional/ley-24799-42613/texto' },
  res596: { t: 'Resolución SE 5/96 (InfoLeg)', url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/30000-34999/31996/norma.htm' },
  ypf20f: { t: 'YPF, Form 20-F 2024, Nota 17 (SEC)', url: 'https://www.sec.gov/Archives/edgar/data/904851/000119312525067155/d866694d20f.htm' },
  ypf6k: { t: 'YPF, Form 6-K (SEC, 19/2/2026)', url: 'https://www.sec.gov/Archives/edgar/data/904851/000119312526057719/d47643d6k.htm' },
  muniCH679: { t: 'Municipalidad de Comodoro Rivadavia, 27/8/2024', url: 'https://www.comodoro.gov.ar/2024/08/27/el-municipio-intervino-ante-un-nuevo-derrame-de-petroleo-en-un-yacimiento-ypf/' },
  censo: { t: 'Censo 2022', url: 'https://www.comodoro.gov.ar/miciudad/2025/10/13/censo-nacional-de-poblacion-hogares-y-viviendas-2022/' },
  indecEPH: { t: 'INDEC, EPH', url: 'https://www.indec.gob.ar/uploads/informesdeprensa/mercado_trabajo_eph_2trim26433FCBC5A8.pdf' },
};

/** Arma el HTML de una línea de fuentes: partes de texto o {t, url} (se abren en otra pestaña). */
export function htmlFuente(partes) {
  return partes.map((p) => (typeof p === 'string' ? esc(p)
    : `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.t)}<svg class="icono-externo" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M4 1H1v8h8V6M6 1h3v3M9 1 4.5 5.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg><span class="sr-only"> (abre en otra pestaña)</span></a>`)).join('; ');
}

/** Proporción en palabras ("Casi dos de cada tres") calculada desde el dato; si no hay una fracción
 *  simple cerca, el porcentaje con coma decimal. */
function proporcion(parte, total) {
  const f = parte / total;
  const fracciones = [[1, 2, 'la mitad'], [2, 3, 'dos de cada tres'], [3, 4, 'tres de cada cuatro'], [3, 5, 'tres de cada cinco'], [4, 5, 'cuatro de cada cinco'], [1, 3, 'uno de cada tres'], [1, 4, 'uno de cada cuatro']];
  let mejor = null;
  for (const [a, b, texto] of fracciones) {
    const d = f - a / b;
    if (Math.abs(d) <= 0.03 && (!mejor || Math.abs(d) < Math.abs(mejor.d))) mejor = { d, texto };
  }
  if (!mejor) return `el ${dec(f * 100)} %`;
  if (Math.abs(mejor.d) < 0.005) return mejor.texto;
  return `${mejor.d < 0 ? 'casi' : 'más de'} ${mejor.texto}`;
}
const mayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Variación de la Cuenca Neuquina (producción del año de referencia sobre la del año base, en %). */
function variacion(pctSobreBase) {
  if (pctSobreBase >= 300) return 'más que se triplicó';
  if (pctSobreBase >= 200) return 'más que se duplicó';
  if (pctSobreBase > 100) return `creció un ${fmt(pctSobreBase - 100)} %`;
  return `produce el ${fmt(pctSobreBase)} % de lo que producía`;
}

// Nombres cortos para las operadoras que se nombran en el texto (el dato trae la razón social completa).
const NOMBRE_CORTO = {
  'PECOM SERVICIOS ENERGIA SAU': 'PECOM',
  'PATAGONIA RESOURCES S.A.': 'Patagonia Resources',
  'Clear Petroleum S.A.': 'Clear Petroleum',
  'QUINTANA E&P ARGENTINA S.R.L.': 'Quintana',
  'ROCH S.A.': 'Roch',
  'PAN AMERICAN ENERGY SL': 'Pan American Energy',
  'COMPAÑÍA GENERAL DE COMBUSTIBLES S.A.': 'CGC',
  'COMPAÑÍAS ASOCIADAS PETROLERAS S.A.': 'CAPSA',
  'CROWN POINT ENERGIA S.A.': 'Crown Point',
  'BREST S.A. DE SERVICIOS PETROLEROS': 'Brest',
  'COPESA CIA CONSTRUCTORA PETROLERA SA': 'COPESA',
  'PETROMINERA CHUBUT S.E.': 'Petrominera Chubut',
};
const nombreCorto = (n) => {
  const t = n.trim(); // el dato trae alguna razón social con espacio al final ("PATAGONIA RESOURCES S.A. ")
  return NOMBRE_CORTO[t] || t.replace(/\s+(S\.?A\.?U?\.?|S\.?R\.?L\.?|SAU|SL|S\.?E\.?)$/i, '').trim();
};
const lista = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}` : xs[0] || '');

/** Texto de la portada (debajo del título). Texto definido por los autores el 26/09.
 *  La frase de la desocupación depende de resumen.eph (INDEC, EPH, serie de datos.gob.ar): "la más alta en
 *  décadas" solo si pasaron 20 años o más desde un valor mayor. Por el error muestral de la EPH nunca se dice
 *  cuánto subió; la fuente declara el coeficiente de variación. */
export function textoPortada(R) {
  const E = R.eph;
  let desocupacion = '';
  if (E) {
    const anios = E.anios_sin_un_valor_mayor; // null = el más alto de toda la serie
    if (anios === null || anios >= 20) desocupacion = ' y la desocupación es la más alta en décadas';
    else if (anios >= 5) desocupacion = ` y la desocupación es la más alta desde ${E.ultimo_valor_mayor.periodo.slice(0, 4)}`;
  }
  const texto = `Comodoro Rivadavia creció al ritmo del petróleo durante más de un siglo. Los barrios se armaron al lado de los pozos, y a veces encima. Hoy la cuenca produce cada vez menos, YPF se fue${desocupacion}. Pero los pozos siguen ahí. Esta es la historia de lo que queda… cuando el petróleo se va.`;
  const partes = ['Secretaría de Energía', F.ypf6k]; // el 6-K respalda "YPF se fue" (venta de Manantiales Behr)
  if (E) {
    let eph = `${E.trimestre}.º trimestre de ${E.anio} (${dec(E.desocupacion)} %`;
    if (E.provisorio) eph += ', provisorio';
    if (E.cv) eph += `, coeficiente de variación ${dec(E.cv)} %`;
    partes.push({ ...F.indecEPH, t: `${F.indecEPH.t}, ${eph})` });
  }
  return { texto, fuente: `Fuentes: ${htmlFuente(partes)}.` };
}

/** Devuelve la definición de pasos con las cifras ya resueltas. */
export function definirPasos(R) {
  const c = R.cuenca, e = R.ejido, p = R.poblacion, pr = R.produccion, k = R.km3.en_ejido;
  const t = R.trayectoria; // null si no se procesó el mensual
  const radio = (p.radio_urbano_mas_pozos || p.radio_mas_pozos)[0];
  const B = R.barrios; // null si no hay capa de barrios
  const topBarrios = B ? B.por_barrio.slice(0, 3) : [];
  const barrioSinActivos = B ? B.por_barrio.find((b) => b.activos === 0 && b.pozos >= 100) : null;
  const ch679 = R.casos?.ch679 || null; // el pozo de la surgencia de 2024, si se encontró su sigla en el registro
  const sinConcesion = R.concesiones?.pozos_en_area_sin_concesion;
  // Operadoras que hoy tienen los pozos que el listado anterior asignaba a YPF (las cinco con más pozos).
  const exYpf = c.ex_ypf_por_operadora_actual
    ? Object.keys(c.ex_ypf_por_operadora_actual).filter((n) => n && !n.startsWith('(')).slice(0, 5).map(nombreCorto)
    : [];
  // Ritmo de declaraciones de abandono: años completos posteriores al primero de la serie
  // (el primer año arrastra los pozos que ya estaban abandonados al inicio) y anteriores al último (incompleto).
  let ritmo = null;
  if (t) {
    const anios = Object.entries(t.abandonados_por_anio_de_declaracion).map(([a, n]) => [Number(a), n]).sort((x, y) => x[0] - y[0]);
    const desde = Number(t.cobertura.desde.slice(0, 4)), hasta = Number(t.cobertura.hasta.slice(0, 4));
    const completos = anios.filter(([a]) => a > desde && a < hasta);
    if (completos.length) {
      const total = completos.reduce((acc, [, n]) => acc + n, 0);
      const paradosMas5 = t.inactivos_por_tiempo_sin_producir['5_a_9_anios'] + t.inactivos_por_tiempo_sin_producir.nunca_en_serie;
      ritmo = { desdeAnio: completos[0][0], hastaAnio: completos[completos.length - 1][0], total, porAnio: Math.round(total / completos.length), paradosMas5 };
    }
  }
  const desdeSerie = t ? t.cobertura.desde.slice(0, 4) : null;

  // Fotos de los autores (originales en fotos-originales/, copiadas en public/img/). En celular no se muestran.
  // Textos alternativos provisorios: los revisa Aldana.
  const foto = (archivo, alt) => ({ src: `${import.meta.env.BASE_URL}img/${archivo}`, alt, credito: 'Foto: los autores.' });

  // Capas y filtros de partida de cada paso: todo apagado, todos los estados visibles.
  const base = {
    estadosVisibles: [0, 1, 2, 3, 4], empresa: null, yacimiento: null, provincia: null, tiempo: null,
    soloEjido: false, contarEjido: false, poblacion: false, limites: false, pais: false, concesiones: false, barrios: false,
    resaltado: null, resaltadoEtiqueta: null,
  };

  return [
    {
      // El primer pozo. Solo se ve el Pozo N° 2 (idpozo 121014), con su ícono; el mapa vuela desde la portada.
      // Hechos y fuentes: docs/investigacion-contexto.md. Texto definido por los autores el 26/09.
      id: 1, kicker: 'Paso 1 · El primer pozo', cifra: '1907',
      titulo: 'buscaban agua y encontraron petróleo',
      texto: 'El Estado perforaba en Comodoro Rivadavia para darle agua al pueblo. La mañana del 13 de diciembre, a unos 540 metros, del Pozo N° 2 salió petróleo. Al día siguiente, un decreto del presidente Figueroa Alcorta prohibió pedir permisos mineros en cinco leguas a la redonda. En su lugar hoy está el Museo Nacional del Petróleo.',
      fuente: [F.mecon, F.ley24799],
      foto: {
        src: `${import.meta.env.BASE_URL}img/pozo2-1907.jpg`,
        alt: 'Torre de perforación del Pozo N° 2, con carros tirados por caballos y trabajadores al pie, diciembre de 1907',
        credito: 'Pozo N° 2, diciembre de 1907. Fototeca de Comodoro Rivadavia – Archivo Histórico Municipal (negativo cedido por el AGN).',
        posicion: '45% 10%', // encuadre: que entren la torre y los carros
      },
      vista: { center: [-67.480922, -45.837491], zoom: 8 },
      vuelo: { duration: 3000 },
      pozoArriba: true, // en celular, el pozo queda en la mitad de arriba (la tarjeta tapa la de abajo)
      marcador: { idpozo: 121014, etiqueta: 'Pozo N° 2 · 1907' },
      capas: { ...base, soloId: 121014 },
    },
    {
      id: 2, kicker: 'Paso 2 · País', cifra: `${dec(pr.gsj_pct_ref)} %`,
      titulo: `del petróleo argentino salió del Golfo San Jorge en ${pr.anio_ref}`,
      texto: `En ${pr.anio_base} era el ${dec(pr.gsj_pct_base)} %. Mientras la Cuenca Neuquina ${variacion(pr.neuquina_ref_sobre_base_pct)} y el shale ya es el ${dec(pr.shale_pct_ref)} % del total, la cuenca más vieja del país produce el ${fmt(pr.gsj_ref_sobre_base_pct)} % de lo que producía entonces.`,
      fuente: ['Secretaría de Energía, serie histórica de producción por cuenca'],
      vista: { center: [-66.5, -41.5], zoom: 4.3 },
      capas: { ...base, pais: true },
      grafico: true,
    },
    {
      id: 3, kicker: 'Paso 3 · Cuenca', cifra: fmt(c.total),
      titulo: 'pozos en la cuenca con más pozos del país',
      texto: `${mayuscula(proporcion(c.sin_produccion, c.total))} no producen: ${fmt(c.Inactivo)} inactivos, ${fmt(c['A abandonar'])} a abandonar y ${fmt(c.Abandonado)} abandonados, según lo que cada operadora declara ante la Secretaría de Energía. De los ${fmt(R.antiguedad.ya_en_2006)} pozos que ya figuraban en 2006, hoy están activos ${fmt(R.antiguedad.ya_en_2006_por_grupo.Activo)}.${t ? ` Y ${fmt(t.nunca_en_serie_no_abandonados)} pozos inactivos o a abandonar no registran ni un mes de producción desde ${desdeSerie}.` : ''}`,
      fuente: [F.capIV],
      foto: foto('paso-3.jpg', 'Vista aérea de una planta petrolera con tanques de PECOM, playas de estacionamiento y árboles; detrás, la meseta'),
      vista: { center: [-68.3, -46.2], zoom: 7 },
      capas: { ...base },
    },
    {
      id: 4, kicker: 'Paso 4 · Operadoras', cifra: fmt(c.ypf_pozos_listado_anterior),
      titulo: 'pozos de YPF cambiaron de manos',
      texto: `Entre 2024 y 2026 YPF se retiró de la cuenca (Proyecto Andes). ${exYpf.length ? `Hoy esos pozos figuran a nombre de ${lista(exYpf)}, entre otras.` : 'Hoy esos pozos figuran a nombre de otras operadoras.'} Y ${fmt(c.sin_empresa.total)} pozos no tienen ninguna empresa asignada; ${fmt(c.sin_empresa.Abandonado)} de ellos están abandonados.${sinConcesion ? ` Además, ${fmt(sinConcesion)} pozos están en áreas que no figuran como concesión de explotación vigente: en el mapa, los que tienen un anillo.` : ''}`,
      fuente: [F.capIV, 'Secretaría de Energía, concesiones de explotación', F.ypf20f, 'Decreto Chubut 1509/2024'],
      foto: foto('paso-4.jpg', 'Las letras oxidadas de un viejo cartel de YPF entre pastizales, frente a un galpón'),
      vista: { center: [-68.3, -46.2], zoom: 7 },
      capas: { ...base, concesiones: true },
      // TODO semana 3 (tarea 3.1): colorear por operadora con "antes / después" (ver docs/plans).
    },
    {
      // Los pozos de afuera del ejido quedan atenuados (tarea 2.3): la ciudad es el foco, el yacimiento el contexto.
      id: 5, kicker: 'Paso 5 · Ejido', cifra: fmt(e.total),
      titulo: 'pozos dentro del ejido de Comodoro Rivadavia',
      texto: `${fmt(e.Activo)} están activos. ${fmt(e.Abandonado)} están abandonados. ${fmt(p.pobl_en_radios_con_pozo)} personas, el ${dec(p.pobl_en_radios_con_pozo_pct)} % de Comodoro y Rada Tilly, viven en un radio censal con al menos un pozo.${t ? ` ${fmt(t.ejido_nunca_en_serie)} de los pozos del ejido no produjeron ni un mes desde ${desdeSerie}.` : ''}`,
      fuente: [F.capIV, 'Municipalidad de Comodoro Rivadavia', F.censo],
      foto: foto('paso-5.jpg', 'Un aparato de bombeo cercado sobre una loma, con el mar de fondo'),
      vista: { center: [-67.55, -45.85], zoom: 10.3 },
      capas: { ...base, poblacion: true, limites: true, contarEjido: true },
    },
    {
      id: 6, kicker: 'Paso 6 · Km 3', cifra: fmt(k.total),
      titulo: 'pozos en un yacimiento que es un barrio',
      texto: `En Campamento Central – Bella Vista Este, el yacimiento del Pozo N° 2, hoy hay ${fmt(k.Abandonado)} pozos abandonados y ${fmt(k.Activo)} activos. La Resolución SE 5/96 exige que el abandono de pozos en ejidos urbanos sea siempre definitivo.${topBarrios.length ? ` Los barrios con más pozos: ${topBarrios.map((b) => `${b.barrio} (${fmt(b.pozos)})`).join(', ')}.${barrioSinActivos ? ` En ${barrioSinActivos.barrio} hay ${fmt(barrioSinActivos.pozos)} pozos y ninguno está activo.` : ''}` : ''}`,
      fuente: [F.capIV, F.res596, 'Municipalidad de Comodoro Rivadavia, barrios'],
      foto: foto('paso-6.jpg', 'Vista aérea de un aparato de bombeo cercado en medio de un barrio, entre casas y calles de tierra con charcos'),
      vista: { center: [-67.49, -45.82], zoom: 13 },
      capas: { ...base, soloEjido: true, limites: true, barrios: true },
    },
    {
      // Si el CH-679 está en el registro, se marca con un anillo y la vista se abre un poco para que entre.
      id: 7, kicker: 'Paso 7 · Un radio censal', cifra: fmt(radio.pozos),
      titulo: `pozos en un radio censal donde viven ${fmt(radio.pobl)} personas`,
      texto: `${B?.barrio_del_radio_urbano_mas_pozos ? `Barrio ${B.barrio_del_radio_urbano_mas_pozos}. ` : ''}Es el radio censal urbano con más pozos de la ciudad: ${fmt(radio.abandonados)} abandonados y ${fmt(radio.activos)} activos. En agosto de 2024 el municipio intervino por la surgencia del pozo abandonado CH-679, en el Yacimiento Central, que afectó el arroyo Belgrano${ch679 ? ' (en el mapa, con un anillo)' : ''}.`,
      fuente: [F.censo, F.muniCH679],
      vista: { center: [radio.lon ?? -67.50, radio.lat ?? -45.83], zoom: ch679 ? 14 : 14.5 },
      capas: { ...base, soloEjido: true, poblacion: true, barrios: true, resaltado: ch679?.idpozo ?? null, resaltadoEtiqueta: ch679 ? 'CH-679' : null },
    },
    {
      id: 8, kicker: 'Paso 8 · Lo que queda', cifra: fmt(c.sin_produccion),
      titulo: 'pozos sin producir en la cuenca',
      texto: `${ritmo ? `${fmt(ritmo.paradosMas5)} pozos inactivos o a abandonar llevan más de cinco años sin producir. Entre ${ritmo.desdeAnio} y ${ritmo.hastaAnio} las operadoras declararon abandonados ${fmt(ritmo.total)} pozos: unos ${fmt(ritmo.porAnio)} por año. ` : ''}YPF tenía provisionados US$ 915 millones por abandono de pozos al cierre de 2024. No existe un registro público de pasivos ambientales hidrocarburíferos. Lo que hay es este dato, pozo por pozo. Exploralo.`,
      fuente: [F.capIV, F.ypf20f],
      foto: foto('paso-8.jpg', 'Un aparato de bombeo en la meseta, bajo un cielo cargado de nubes oscuras'),
      vista: { center: [-68.3, -46.2], zoom: 7 },
      capas: { ...base, limites: true },
      boton: { texto: 'Explorá el mapa', destino: 'explorar' }, // lleva a la sección del visualizador
    },
  ];
}

// Vista con la que arranca el visualizador (la cuenca entera, como el paso 8).
const VISTA_EXPLORAR = { center: [-68.3, -46.2], zoom: 7 };
const FLECHA = '<svg class="empezar-flecha" width="14" height="16" viewBox="0 0 14 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 1 L7 14 M1.5 8.5 L7 14 L12.5 8.5"/></svg>';

/** Lleva a una sección (con desplazamiento suave, salvo "reducir movimiento") y le pasa el foco. */
export function irA(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'start' });
  el.focus({ preventScroll: true });
}

/** Inserta las tarjetas en #story, antes de la sección del visualizador. No necesita el mapa: se llama apenas
 *  llega resumen.json, así el relato se puede leer mientras bajan MapLibre y deck.gl. */
export function crearTarjetas({ pasos, produccion }) {
  const cont = document.getElementById('story');
  const seccionExplorar = document.getElementById('explorar');
  for (const s of pasos) {
    const sec = document.createElement('section');
    sec.className = 'step';
    sec.dataset.step = s.id;
    sec.setAttribute('aria-labelledby', `titulo-paso-${s.id}`);
    sec.innerHTML = `
      <div class="card${s.foto ? ' card-foto' : ''}">
        ${s.foto ? `<figure class="foto-paso"><img src="${s.foto.src}" alt="${s.foto.alt}" loading="lazy"${s.foto.posicion ? ` style="object-position:${s.foto.posicion}"` : ''}><figcaption>${s.foto.credito}</figcaption></figure>` : ''}
        <p class="kicker">${s.kicker}</p>
        <h2 class="titulo-paso" id="titulo-paso-${s.id}"><span class="cifra">${s.cifra}</span> ${s.titulo}</h2>
        <p class="texto">${s.texto}</p>
        ${s.grafico ? '<div class="grafico" id="grafico-cuencas"></div>' : ''}
        ${s.boton ? `<a class="empezar boton-paso" href="#${s.boton.destino}" data-destino="${s.boton.destino}">${s.boton.texto} ${FLECHA}</a>` : ''}
        <p class="fuente">Fuente: ${htmlFuente(s.fuente)}</p>
      </div>`;
    cont.insertBefore(sec, seccionExplorar);
  }
  if (produccion) dibujarProduccion(document.getElementById('grafico-cuencas'), produccion);
  cont.querySelectorAll('.boton-paso').forEach((a) => a.addEventListener('click', (ev) => { ev.preventDefault(); irA(a.dataset.destino); }));
}

/** Conecta scrollama con el mapa (cuando el mapa ya existe). Al conectarse aplica el paso en pantalla.
 *  La sección #explorar (en index.html) es un paso más del scroll, sin tarjeta: al entrar se abre el
 *  visualizador (alEntrarExplorar) y al volver a cualquier paso del relato se cierra (alSalirExplorar). */
export function conectarRecorrido({ pasos, mapa, alEntrarExplorar, alSalirExplorar }) {
  const seccionExplorar = document.getElementById('explorar');
  let explorando = false;
  const scroller = scrollama();
  scroller
    .setup({ step: '#story .step', offset: 0.55, progress: false })
    .onStepEnter(({ element }) => {
      document.querySelectorAll('#story .step').forEach((el) => el.classList.toggle('activa', el === element));
      if (element === seccionExplorar) {
        // Visualizador. Si ya estaba abierto (volvió de la metodología, o scrollama re-dispara al cambiar el alto
        // de la ventana) no se toca nada: el mapa conserva los filtros y la vista que eligió el usuario.
        if (explorando) return;
        explorando = true;
        mapa.marcador(null);
        mapa.volar(VISTA_EXPLORAR);
        alEntrarExplorar?.();
        return;
      }
      if (explorando) { explorando = false; alSalirExplorar?.(); } // volvió al relato: se cierra el visualizador
      const paso = pasos.find((p) => p.id === Number(element.dataset.step));
      if (!paso) { // portada: el país, sin ningún pozo
        mapa.marcador(null);
        document.body.classList.add('sin-leyenda'); // sin pozos en el mapa, la leyenda no tiene qué explicar
        mapa.aplicar({ soloId: null, pozos: false, soloEjido: false, poblacion: false, limites: false, pais: false, concesiones: false, barrios: false, resaltado: null, resaltadoEtiqueta: null });
        mapa.volar({ center: [-66.5, -41.5], zoom: 4.3 });
        return;
      }
      mapa.aplicar({ soloId: null, pozos: true, ...paso.capas });
      document.body.classList.toggle('sin-leyenda', Boolean(paso.capas.soloId)); // un solo pozo: la leyenda cuenta 44.390
      mapa.marcador(paso.marcador?.idpozo ?? null, paso.marcador?.etiqueta);
      const movil = window.matchMedia('(max-width: 700px)').matches;
      const padding = paso.pozoArriba && movil ? { top: 0, bottom: Math.round(window.innerHeight * 0.45), left: 0, right: 0 } : undefined;
      mapa.volar(paso.vista, { ...(paso.vuelo || {}), ...(padding ? { padding } : {}) });
    });
  return scroller;
}
