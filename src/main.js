// Arranque en dos cargas, para que la pieza aparezca rápido:
//  1. Lo liviano: textos (resumen.json), tarjetas, gráfico y metodología, que se ven apenas llegan; en
//     paralelo, el mapa base (MapLibre + deck.gl por import(), los archivos más pesados del código).
//  2. Con el mapa ya en pantalla, en segundo plano: los pozos del país (paso 2) y los 44.390 pozos de la
//     cuenca, radios censales, límites, concesiones y barrios. Recién ahí se arma el panel del visualizador.
//     Si alguien baja más rápido de lo que tarda en llegar, un aviso dice "Cargando los pozos…".

import {
  cargarResumen, cargarProduccion, cargarPais,
  cargarPozos, cargarRadios, cargarLimites, cargarConcesiones, cargarBarrios,
} from './data.js';
import { definirPasos, crearTarjetas, conectarRecorrido, textoPortada, irA } from './story.js';
import { montarLeyenda, montarExploracion } from './explore.js';
import { montarMetodologia } from './metodologia.js';

// "Está en la portada": el aviso de carga no aparece ahí (la portada no necesita pozos).
function vigilarPortada() {
  const portada = document.querySelector('#story .step[data-step="0"]');
  new IntersectionObserver(([e]) => document.body.classList.toggle('en-portada', e.isIntersecting),
    { rootMargin: '0px 0px -45% 0px' }).observe(portada);
}

async function iniciar() {
  // ---- primera carga ----
  const libreriaMapa = import('./map.js'); // se pide ya: es lo que más tarda en bajar
  const [resumen, produccion] = await Promise.all([cargarResumen(), cargarProduccion()]);

  const portada = textoPortada(resumen);
  document.getElementById('portada-texto').textContent = portada.texto;
  document.getElementById('portada-fuente').innerHTML = portada.fuente; // lleva enlaces a las fuentes
  // Botón de la portada: lleva al primer paso (con teclado también). Sin animación si el sistema lo pide.
  document.getElementById('btn-empezar').addEventListener('click', () => {
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelector('#story .step[data-step="1"]')?.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'center' });
  });
  const pasos = definirPasos(resumen);
  crearTarjetas({ pasos, produccion });
  montarMetodologia(document.getElementById('metodologia'), resumen);
  vigilarPortada();
  document.body.classList.add('cargando-pozos');

  const { crearMapa } = await libreriaMapa;
  let exploracion = null;
  let quiereExplorar = false; // entró al visualizador antes de que llegaran los pozos
  const mapa = crearMapa({ onClickPozo: (idpozo) => exploracion?.alClickPozo(idpozo) });
  montarLeyenda({ mapa });
  conectarRecorrido({
    pasos, mapa,
    alEntrarExplorar: () => { quiereExplorar = true; exploracion?.mostrarPanel(); },
    alSalirExplorar: () => { quiereExplorar = false; exploracion?.ocultarPanel(); },
  });

  // ---- segunda carga ----
  // La capa país no es imprescindible: si falla, el paso 2 queda sin puntos pero la pieza sigue.
  cargarPais().then((pais) => mapa.cargarDatos({ pais })).catch((err) => console.warn('Sin la capa país:', err));
  const aviso = document.getElementById('cargando');
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
