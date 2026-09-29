// Carga de datos. Todo sale de public/data/, generado por data-pipeline/procesar.py.
// Nunca tipear cifras a mano: vienen de resumen.json.

const BASE = `${import.meta.env.BASE_URL}data/`;

const DTYPES = {
  uint8: Uint8Array, uint16: Uint16Array, uint32: Uint32Array, float32: Float32Array,
};

async function traer(name) {
  const r = await fetch(BASE + name);
  if (!r.ok) throw new Error(`No se pudo cargar ${name} (${r.status})`);
  return r;
}
const json = async (name) => (await traer(name)).json();

/** Lee un binario por columnas según su meta (offset y bytes de cada columna). */
async function leerBin(nombre) {
  const [meta, buf] = await Promise.all([json(`${nombre}.meta.json`), traer(`${nombre}.bin`).then((r) => r.arrayBuffer())]);
  const cols = {};
  for (const c of meta.columns) {
    const T = DTYPES[c.dtype];
    cols[c.name] = new T(buf, c.offset, c.bytes / T.BYTES_PER_ELEMENT);
  }
  // deck.gl trabaja mejor con un array de posiciones plano [lon, lat, lon, lat, ...]
  const n = meta.n;
  const positions = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    positions[i * 2] = cols.lon[i];
    positions[i * 2 + 1] = cols.lat[i];
  }
  return { meta, n, cols, positions };
}

/** Pozos de la cuenca: arrays tipados por columna + índice idpozo → fila. */
export async function cargarPozos() {
  const p = await leerBin('pozos_gsj');
  // el índice sigla → pozo se arma en el buscador (viene de las fichas); acá solo idpozo → fila
  const filaPorId = new Map();
  for (let i = 0; i < p.n; i++) filaPorId.set(p.cols.idpozo[i], i);
  return { ...p, filaPorId };
}

/** Pozos del país entero (lon, lat, estado, es_gsj) para el paso País. */
export const cargarPais = () => leerBin('pozos_pais');

export const cargarResumen = () => json('resumen.json');
export const cargarConcesiones = () => json('concesiones.geojson').catch(() => null);
export const cargarBarrios = () => json('barrios.geojson').catch(() => null);
export const cargarRadios = () => json('radios.geojson');
export const cargarLimites = () => json('limites.geojson');
export const cargarProduccion = () => json('produccion_cuencas.json');
export const cargarOperadores = () => json('operadores.json');

const cacheFichas = new Map();
/** Lote de fichas (1.000 pozos por archivo). Si falla, no queda cacheado: se reintenta la próxima vez. */
export function cargarLote(lote) {
  if (!cacheFichas.has(lote)) {
    cacheFichas.set(lote, json(`fichas/${lote}.json`).catch((err) => { cacheFichas.delete(lote); throw err; }));
  }
  return cacheFichas.get(lote);
}
/** Ficha de un pozo: se carga su lote a demanda. */
export async function cargarFicha(idpozo) {
  const recs = await cargarLote(Math.floor(idpozo / 1000));
  return recs[String(idpozo)] || null;
}

/** Formato de miles con punto (castellano rioplatense). */
export const fmt = (n) => Math.round(n).toLocaleString('es-AR');
/** Decimal con coma: pct(22.8) → "22,8". */
export const dec = (n, d = 1) => n.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d });
/** Escapa texto que viene de los datos antes de insertarlo como HTML. */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
