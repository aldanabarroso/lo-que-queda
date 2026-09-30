// Arranque en dos cargas, para que la pieza aparezca rápido:
//  1. Lo liviano: textos (resumen.json), gráfico, metodología, el mapa base (MapLibre + deck.gl, que se
//     piden apenas arranca) y los pozos del país del paso 2. Con eso se ven la portada y los primeros pasos.
//  2. En segundo plano, mientras se lee la portada: los 44.390 pozos de la cuenca, radios censales,
//     límites, concesiones y barrios. Recién ahí se arma el panel del visualizador. Si alguien baja más
//     rápido de lo que tarda en llegar, un aviso dice "Cargando los pozos…".

import {
  cargarResumen, cargarProduccion, cargarPais,
  cargarPozos, cargarRadios, cargarLimites, cargarConcesiones, cargarBarrios,
} from './data.js';
import { definirPasos, montarRecorrido, textoPortada, irA } from './story.js';
import { montarLeyenda, montarExploracion } from './explore.js';
import { montarMetodologia } from './metodologia.js';

async function iniciar() {
  // ---- primera carga ----
  const libreriaMapa = import('./map.js'); // los archivos más pesados del código: se piden ya, en paralelo
  const pais = cargarPais().catch((err) => { console.warn('Sin la capa país:', err); return null; }); // no es imprescindible
  const [resumen, produccion] = await Promise.all([cargarResumen(), cargarProduccion()]);

  const portada = textoPortada(resumen);
  document.getElementById('portada-texto').textContent = portada.texto;
  document.getElementById('portada-fuente').innerHTML = portada.fuente; // lleva enlaces a las fuentes
  // Botón de la portada: lleva al primer paso (con teclado también). Sin animación si el sistema lo pide.
  document.getElementById('btn-empezar').addEventListener('click', () => {
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelector('#story .step[data-step="1"]')?.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'center' });
  });
  montarMetodologia(document.getElementById('metodologia'), resumen);

  const { crearMapa } = await libreriaMapa;
  let exploracion = null;
  let quiereExplorar = false; // entró al visualizador antes de que llegaran los pozos
  const mapa = crearMapa({ onClickPozo: (idpozo) => exploracion?.alClickPozo(idpozo) });
  montarLeyenda({ mapa });
  montarRecorrido({
    pasos: definirPasos(resumen), mapa, produccion,
    alEntrarExplorar: () => { quiereExplorar = true; exploracion?.mostrarPanel(); },
    alSalirExplorar: () => { quiereExplorar = false; exploracion?.ocultarPanel(); },
  });
  const datosPais = await pais;
  if (datosPais) mapa.cargarDatos({ pais: datosPais });

  // ---- segunda carga ----
  const aviso = document.getElementById('cargando');
  document.body.classList.add('cargando-pozos');
  try {
    const [pozos, radios, limites, concesiones, barrios] = await Promise.all([
      cargarPozos(), cargarRadios(), cargarLimites(), cargarConcesiones(), cargarBarrios(),
    ]);
    mapa.cargarDatos({ pozos, radios, limites, concesiones, barrios });
    exploracion = montarExploracion({ mapa, pozos, resumen });
    document.body.classList.remove('cargando-pozos');
    if (quiereExplorar) exploracion.mostrarPanel();
  } catch (err) {
    console.error(err);
    aviso.textContent = 'No se pudieron cargar los pozos. Probá recargar la página.';
    document.body.classList.add('error-pozos');
    return;
  }
  // Enlace directo al visualizador (…/#explorar): los pasos se insertaron después del salto inicial del
  // navegador, así que se vuelve a llevar ahí.
  if (location.hash === '#explorar') irA('explorar');
}

iniciar().catch((err) => {
  console.error(err);
  document.getElementById('story').insertAdjacentHTML('afterbegin',
    `<div class="card error"><p>No se pudieron cargar los datos. ${err.message}</p></div>`);
});
