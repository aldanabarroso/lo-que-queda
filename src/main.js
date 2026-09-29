// Arranque: carga datos, crea el mapa, monta el recorrido y el panel de exploración.

import { cargarPozos, cargarPais, cargarResumen, cargarRadios, cargarLimites, cargarProduccion, cargarConcesiones, cargarBarrios } from './data.js';
import { crearMapa } from './map.js';
import { definirPasos, montarRecorrido, textoPortada } from './story.js';
import { montarExploracion } from './explore.js';
import { montarMetodologia } from './metodologia.js';

async function iniciar() {
  const [pozos, pais, resumen, radios, limites, produccion, concesiones, barrios] = await Promise.all([
    cargarPozos(), cargarPais(), cargarResumen(), cargarRadios(), cargarLimites(), cargarProduccion(), cargarConcesiones(), cargarBarrios(),
  ]);

  let exploracion;
  const mapa = crearMapa({
    pozos, pais, radios, limites, concesiones, barrios,
    onClickPozo: (idpozo) => exploracion?.alClickPozo(idpozo),
  });
  exploracion = montarExploracion({ mapa, pozos, resumen });

  const portada = textoPortada(resumen);
  document.getElementById('portada-texto').textContent = portada.texto;
  document.getElementById('portada-fuente').innerHTML = portada.fuente; // lleva enlaces a las fuentes
  // Botón de la portada: lleva al primer paso (con teclado también). Sin animación si el sistema lo pide.
  document.getElementById('btn-empezar').addEventListener('click', () => {
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelector('#story .step[data-step="1"]')?.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'center' });
  });

  montarMetodologia(document.getElementById('metodologia'), resumen);

  const pasos = definirPasos(resumen);
  montarRecorrido({
    pasos, mapa, produccion,
    alTerminar: () => exploracion.mostrarPanel(),
    alSalirDelFinal: () => exploracion.ocultarPanel(),
  });
}

iniciar().catch((err) => {
  console.error(err);
  document.getElementById('story').insertAdjacentHTML('afterbegin',
    `<div class="card error"><p>No se pudieron cargar los datos. ${err.message}</p></div>`);
});
