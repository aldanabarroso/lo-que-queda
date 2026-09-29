// Gráficos D3: producción anual de petróleo por cuenca (paso País) y declaraciones de abandono por año
// (panel de exploración). Un solo eje, líneas o barras finas, etiquetas directas, sin leyenda aparte.

import * as d3 from 'd3';
import { PALETA, ESTADOS } from './paleta.js';
import { fmt, dec } from './data.js';

// Las cuencas chicas van en grises claros (la línea) con el rótulo en el gris de texto (contraste ≥ 4,5:1).
const SERIES = [
  { key: 'cuenca_gsj', nombre: 'Golfo San Jorge', color: ESTADOS[2].hex, rotulo: ESTADOS[2].hex, destacada: true },
  { key: 'cuenca_neuquina', nombre: 'Neuquina', color: ESTADOS[0].hex, rotulo: ESTADOS[0].hex },
  { key: 'cuenca_cuyana', nombre: 'Cuyana', color: '#9a978f', rotulo: PALETA.textoSec },
  { key: 'cuenca_austral', nombre: 'Austral', color: '#b5b1a7', rotulo: PALETA.textoSec },
  { key: 'cuenca_noroeste', nombre: 'Noroeste', color: '#c9c5bb', rotulo: PALETA.textoSec },
];
const SEPARACION_ROTULOS = 12; // px mínimos entre rótulos al final de las líneas

export function dibujarProduccion(el, produccion) {
  if (!el) return;
  const datos = produccion.anual.filter((d) => d.anio <= produccion.ultimo_anio_completo);
  const W = el.clientWidth || 336, H = 190, m = { t: 12, r: 92, b: 24, l: 40 };
  const ult = datos[datos.length - 1];
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('width', '100%')
    .attr('role', 'img')
    .attr('aria-label', `Producción anual de petróleo por cuenca, ${datos[0].anio} a ${ult.anio}. En ${ult.anio}: ${SERIES.map((s) => `${s.nombre} ${dec(ult[s.key] / 1e6)} millones de m³`).join('; ')}.`);
  const x = d3.scaleLinear().domain(d3.extent(datos, (d) => d.anio)).range([m.l, W - m.r]);
  const y = d3.scaleLinear().domain([0, d3.max(datos, (d) => d3.max(SERIES, (s) => d[s.key]))]).nice().range([H - m.b, m.t]);

  svg.append('g').attr('transform', `translate(0,${H - m.b})`)
    .call(d3.axisBottom(x).ticks(4).tickFormat(d3.format('d')).tickSize(0))
    .call((g) => g.select('.domain').attr('stroke', PALETA.urbanoBorde))
    .selectAll('text').attr('fill', PALETA.textoSec).attr('font-size', 11);
  svg.append('g').attr('transform', `translate(${m.l},0)`)
    .call(d3.axisLeft(y).ticks(3).tickFormat((v) => `${(v / 1e6).toLocaleString('es-AR')} M`).tickSize(-(W - m.l - m.r)))
    .call((g) => g.select('.domain').remove())
    .call((g) => g.selectAll('line').attr('stroke', PALETA.urbanoBorde))
    .selectAll('text').attr('fill', PALETA.textoSec).attr('font-size', 11);

  const linea = (key) => d3.line().x((d) => x(d.anio)).y((d) => y(d[key])).curve(d3.curveMonotoneX);
  for (const s of SERIES) {
    svg.append('path').datum(datos).attr('d', linea(s.key))
      .attr('fill', 'none').attr('stroke', s.color).attr('stroke-width', s.destacada ? 2.5 : 1.5);
  }

  // Rótulos al final de cada línea, separados para que no se pisen (las tres cuencas chicas terminan
  // casi en el mismo valor): se ordenan por altura y se empujan hacia abajo; si se pasan del eje, hacia arriba.
  const rotulos = SERIES.map((s) => ({ s, yLinea: y(ult[s.key]), y: y(ult[s.key]) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < rotulos.length; i++) rotulos[i].y = Math.max(rotulos[i].y, rotulos[i - 1].y + SEPARACION_ROTULOS);
  const exceso = rotulos[rotulos.length - 1].y - (H - m.b);
  if (exceso > 0) {
    rotulos[rotulos.length - 1].y -= exceso;
    for (let i = rotulos.length - 2; i >= 0; i--) rotulos[i].y = Math.min(rotulos[i].y, rotulos[i + 1].y - SEPARACION_ROTULOS);
  }
  for (const r of rotulos) {
    if (Math.abs(r.y - r.yLinea) > 3) { // rótulo desplazado: una guía corta lo une con su línea
      svg.append('path').attr('d', `M${x(ult.anio) + 2},${r.yLinea} L${x(ult.anio) + 5},${r.y}`)
        .attr('stroke', r.s.color).attr('fill', 'none').attr('stroke-width', 1);
    }
    svg.append('text').attr('x', x(ult.anio) + 7).attr('y', r.y + 4)
      .attr('fill', r.s.rotulo).attr('font-size', 11).attr('font-weight', r.s.destacada ? 600 : 400)
      .text(r.s.nombre);
  }
  svg.append('text').attr('x', m.l).attr('y', m.t - 2).attr('fill', PALETA.textoSec).attr('font-size', 10)
    .text('millones de m³ de petróleo por año');
}

/** Barras chicas: pozos declarados abandonados por año (serie mensual). El primer año de la serie no se
 *  muestra (arrastra los que ya estaban abandonados al empezar); el último se marca como parcial. */
export function dibujarAbandonos(el, trayectoria) {
  if (!el || !trayectoria?.abandonados_por_anio_de_declaracion) return;
  const { desde, hasta } = trayectoria.cobertura;
  const anioDesde = Number(desde.slice(0, 4)), anioHasta = Number(hasta.slice(0, 4));
  const parcial = hasta.slice(5, 7) !== '12';
  const datos = Object.entries(trayectoria.abandonados_por_anio_de_declaracion)
    .map(([a, n]) => ({ anio: Number(a), n, parcial: parcial && Number(a) === anioHasta }))
    .filter((d) => d.anio > anioDesde)
    .sort((a, b) => a.anio - b.anio);
  if (!datos.length) return;
  const W = 296, H = 104, m = { t: 14, r: 2, b: 16, l: 2 };
  const x = d3.scaleBand().domain(datos.map((d) => d.anio)).range([m.l, W - m.r]).padding(0.25);
  const y = d3.scaleLinear().domain([0, d3.max(datos, (d) => d.n)]).range([H - m.b, m.t]);
  const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('width', '100%')
    .attr('role', 'img')
    .attr('aria-label', `Pozos declarados abandonados por año: ${datos.map((d) => `${d.anio}${d.parcial ? ' (parcial)' : ''}, ${fmt(d.n)}`).join('; ')}.`);
  const color = ESTADOS[3].hex;
  const g = svg.selectAll('g').data(datos).join('g');
  g.append('rect').attr('x', (d) => x(d.anio)).attr('width', x.bandwidth())
    .attr('y', (d) => y(d.n)).attr('height', (d) => y(0) - y(d.n))
    .attr('fill', (d) => (d.parcial ? 'none' : color)).attr('stroke', color).attr('stroke-dasharray', (d) => (d.parcial ? '2 2' : null));
  g.append('text').attr('x', (d) => x(d.anio) + x.bandwidth() / 2).attr('y', (d) => y(d.n) - 3)
    .attr('text-anchor', 'middle').attr('font-size', 10).attr('fill', PALETA.textoSec).text((d) => fmt(d.n));
  g.append('text').attr('x', (d) => x(d.anio) + x.bandwidth() / 2).attr('y', H - 3)
    .attr('text-anchor', 'middle').attr('font-size', 10).attr('fill', PALETA.textoSec)
    .text((d) => `${String(d.anio).slice(2)}${d.parcial ? '*' : ''}`);
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const nota = document.createElement('p');
  nota.className = 'nota-grafico';
  nota.textContent = `Años ${anioDesde + 1} a ${anioHasta}${parcial ? ` (* hasta ${MESES[Number(hasta.slice(5, 7)) - 1]})` : ''}. No se muestra ${anioDesde}: incluye los pozos que ya figuraban abandonados al empezar la serie.`;
  el.appendChild(nota);
}
