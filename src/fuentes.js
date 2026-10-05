// Fuentes con enlace (verificadas en docs/investigacion-contexto.md y docs/formulario.md) y cómo se escriben.
// Las usan las tarjetas (story.js), las historias del paso 7 (historias.js) y la metodología.
// Una fuente sin enlace se escribe como texto suelto.

import { esc } from './data.js';

export const F = {
  capIV: { t: 'Secretaría de Energía, Capítulo IV – Pozos', url: 'http://datos.energia.gob.ar/dataset/c846e79c-026c-4040-897f-1ad3543b407c' },
  mecon: { t: 'Ministerio de Economía', url: 'https://www.argentina.gob.ar/noticias/13-de-diciembre-descubrimiento-de-petroleo-en-comodoro-rivadavia' },
  ley24799: { t: 'Ley 24.799', url: 'https://www.argentina.gob.ar/normativa/nacional/ley-24799-42613/texto' },
  res596: { t: 'Resolución SE 5/96 (InfoLeg)', url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/30000-34999/31996/norma.htm' },
  ypf20f: { t: 'YPF, Form 20-F 2024, Nota 17 (SEC)', url: 'https://www.sec.gov/Archives/edgar/data/904851/000119312525067155/d866694d20f.htm' },
  ypf6k: { t: 'YPF, Form 6-K (SEC, 19/2/2026)', url: 'https://www.sec.gov/Archives/edgar/data/904851/000119312526057719/d47643d6k.htm' },
  muniCH679: { t: 'Municipalidad de Comodoro Rivadavia, 27/8/2024', url: 'https://www.comodoro.gov.ar/2024/08/27/el-municipio-intervino-ante-un-nuevo-derrame-de-petroleo-en-un-yacimiento-ypf/' },
  censo: { t: 'Censo 2022', url: 'https://www.comodoro.gov.ar/miciudad/2025/10/13/censo-nacional-de-poblacion-hogares-y-viviendas-2022/' },
  indecEPH: { t: 'INDEC, EPH', url: 'https://www.indec.gob.ar/uploads/informesdeprensa/mercado_trabajo_eph_2trim26433FCBC5A8.pdf' },
  // crédito de la foto del paso 8 (uso autorizado; ver docs/investigacion-contexto.md)
  mauroEsains: { t: 'Mauro Esains', url: 'https://www.instagram.com/mauroesains/' },
};

/** Arma el HTML de una línea de fuentes: partes de texto o {t, url} (se abren en otra pestaña). */
export function htmlFuente(partes, separador = '; ') {
  return partes.map((p) => (typeof p === 'string' ? esc(p)
    : `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.t)}<svg class="icono-externo" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M4 1H1v8h8V6M6 1h3v3M9 1 4.5 5.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg><span class="sr-only"> (abre en otra pestaña)</span></a>`)).join(separador);
}
