# Plan de implementación

Cada tarea es autónoma: se puede pedir a Claude Code "hacé la tarea 2.3" y tiene todo lo que necesita.
Marcar con [x] al terminar. Cada tarea termina con `npm run build` sin errores y una mirada en el navegador.

## Semana 1 · 18–25 sep · Datos y esqueleto — HECHA el 18/09

- [x] 1.1 Pipeline `data-pipeline/procesar.py` reproducible; salidas en `public/data/`; conciliación.
- [x] 1.2 Esqueleto Vite + MapLibre + deck.gl; 44.390 puntos por estado; filtros en GPU.
- [x] 1.3 Recorrido de 7 pasos con Scrollama; cifras desde `resumen.json`; gráfico D3 del paso 1.
- [x] 1.4 Panel de exploración: estado, operadora, yacimiento, provincia, población, buscador, ficha.
- [x] 1.5 Workflow de GitHub Pages; estilo de respaldo si falla el mapa base.
- [ ] 1.6 **Aldana:** crear el repo en GitHub (público, en una cuenta con el seudónimo), subir el
      proyecto y activar Pages (guía: `docs/git-github.md`). **Mariano:** aceptar la invitación y verificar el link.
- [x] 1.6b Integrados el 20/09: padrón de primera producción, país con coordenadas, concesiones SHP.
- [x] 1.6c Mensuales 2017–2026 filtrados (4.873.490 filas, `raw/produccion-mensual_gsj.zip`, 41 MB) y procesados el 20/09.
- [ ] 1.7 **Aldana:** boceto de tarjeta, leyenda y portada; primera pasada a los textos de
      `definirPasos()` en `src/story.js` (60–90 palabras por paso, voseo).
- [ ] 1.8 **Los dos:** abrir el formulario en udesa.edu.ar/contarcondatos y ver qué acepta el campo
      "Institución"/"Aval institucional" para presentación personal. Elegir seudónimo.

## Semana 2 · 26 sep – 2 oct · Recorrido y diseño

- [x] 2.1 Paso 6 centrado en el centroide del radio urbano con más pozos (`resumen.poblacion.radio_urbano_mas_pozos`).
- [x] 2.2 (29/09) CH-679 = `YPF.Ch.-679` (idpozo 121621), en `resumen.casos.ch679` (lo busca `procesar.py`).
      Paso 7 (el del radio censal, antes "tarjeta 6"): anillo + rótulo "CH-679" (`resaltado` en `map.js`), zoom 14.
- [x] 2.3 (29/09) Paso 5 (Ejido): con `poblacion: true` los pozos fuera del ejido se atenúan en vez de ocultarse;
      leyenda de población con los cortes de `POBLACION_CORTES` (`paleta.js`), en la leyenda y en el panel.
- [ ] 2.4 Aplicar el diseño de Aldana: tarjetas, portada, tipografías, tamaño de puntos por zoom.
      Hecho el 29/09: `.filtro-inline label` ya no queda en mayúsculas; conteos de estado alineados a la derecha.
- [x] 2.5 (29/09) Tooltip al pasar el mouse (solo con mouse): estado + operadora; la sigla llega de la ficha si el
      cursor se queda quieto 250 ms. También en barrios, radios y concesiones.
- [ ] 2.6 Móvil (390 px): recorrido con tarjetas apiladas y mapa fijo arriba; panel de exploración
      como hoja inferior; probar en un teléfono real. Hecho el 29/09: hoja inferior plegable (botón "Filtros"),
      arranca plegada y no tapa la tarjeta final. Falta: probar en un teléfono real.
- [x] 2.7 Portada y paso 1 con los 85.609 pozos del país (capa `pais`), la cuenca coloreada.
- [x] 2.8 (29/09) Gráfico del paso 2: rótulos separados con guía corta; rótulos grises en `textoSec` (contraste);
      porcentajes con coma decimal en todas las tarjetas (`dec()` en `data.js`).
- [x] 2.9a Tarjetas 2 y 4 con la frase de trayectoria ("no registran ni un mes de producción desde 2017").
- [x] 2.9c Tarjeta 7 con ritmo de declaraciones de abandono (calculado en `story.js` desde `abandonados_por_anio_de_declaracion`).
- [x] 2.9b (29/09) Filtro "Última producción" en el panel con cuatro tramos y conteos (coinciden con
      `resumen.trayectoria`) + gráfico chico de declaraciones de abandono por año (2018 → 2026 parcial; 2017 no va).
- [ ] 2.11 Tarjeta 6 (Km 3) quedó larga (~95 palabras) con los barrios: Aldana decide qué sacar o si los barrios
      van en una tarjeta propia entre la 6 y la 7. Hecho el 29/09: nombres de barrio desde zoom 12,5 (`TextLayer`
      con `CollisionFilterExtension`: si se pisan, gana el barrio con más pozos).
- [x] 2.12 Mapa base con toponimia argentina (20/09). OpenFreeMap con `text-field` de las capas `symbol`
      reemplazado por `['coalesce', ['get', 'name:es'], ['get', 'name']]`: probado en Chrome, muestra "Islas
      Malvinas". Argenmap (IGN) quedó como opción (`MAPA_BASE = 'ign'` en `src/map.js`) con prueba de un tile y
      respaldo automático a OpenFreeMap; ese día wms.ign.gob.ar no respondía. Pendiente: citar el mapa base en
      la metodología; opcional, rótulos propios (`TextLayer`) para Comodoro, Rada Tilly, Caleta Olivia y las cuencas.
- [x] 2.10 (29/09) Paso 4 (Operadoras): frase con `resumen.concesiones.pozos_en_area_sin_concesion` y anillo sobre
      esos pozos cuando la capa de concesiones está encendida (columna `conc_cod` nueva en el binario). Las
      concesiones pasaron del azul de "Activo" al gris de los límites.
- [x] 2.17 (29/09) Auditoría completa del repositorio y correcciones: `public/data` regenerado (faltaba `eph`; la
      regeneración fue idéntica byte a byte salvo `eph` y la fecha); textos ajustados a las reglas 1, 2 y 7 (detalle
      para Aldana en `docs/cambios-textos-2026-09-29.md`); filtros del panel independientes del recorrido; el panel
      se cierra al volver hacia arriba; leyenda con conteos del alcance de cada paso (cuenca / ejido / país);
      buscador que acepta "CH-679"; ficha como diálogo accesible (foco, Escape); errores de carga controlados;
      cifra del `<meta>` generada al compilar; librerías en chunks propios; repo anidado de GitHub Desktop borrado
      (ver `docs/git-github.md`).

- [x] 2.13 (26/09) Paso nuevo "El primer pozo" entre la portada y el paso País. La portada quedó como estaba
      (decisión de los autores). `flyTo` de 3 s a zoom 8 sobre el Pozo N° 2 (idpozo 121014); se ve solo ese pozo
      (`soloId` en `map.js`) con un marcador HTML (borde gris "Abandonado", torre en trazo, etiqueta "Pozo N° 2 ·
      1907"); la leyenda se oculta en ese paso; al pasar al paso País los puntos entran con un fundido de 0,6 s.
      Tarjeta con foto `public/img/pozo2-1907.jpg` (16:9) y crédito de la Fototeca; en celular va sin foto y el
      vuelo usa `padding` inferior para dejar el pozo arriba. Pasos renumerados 1–8; el de Km 3 ya no repite 1907.
      Ajustes del 26/09 (tarde): la portada muestra el mapa SIN pozos (tarjeta igual) y el mapa arranca en esa
      vista; la leyenda se oculta en portada y en el paso 1; texto definitivo de la tarjeta (sin "abandonado desde
      1916"); foto con la escena completa (carros y torre) en 16:9; el mapa base ya no dibuja áreas protegidas
      (capa `park` de OpenFreeMap). Pendiente: actualizar `docs/tarjetas-para-aldana.docx`.
- [x] 2.15 (26/09) Portada: texto debajo de la bajada generado en `textoPortada()` de `story.js`, con la
      desocupación del aglomerado leída de `resumen.eph` (nueva serie EPH 2022–2026 en `raw/`) y fuente con el CV.
      Pendiente opcional: confirmar el empleo petrolero de Chubut en el Excel del OEDE si se quiere sumar a algún paso.
- [x] 2.16 (26/09) Portada rediseñada con el formato de la tarjeta del paso 1: foto de hoy (El Patagónico,
      `public/img/comodoro-hoy.jpg`, también en celular), kicker "Exploración interactiva", texto narrativo de los
      autores (título en una línea, 48 px; bajada en óxido `--acento-portada`, solo en la portada), botón "Desplazá para empezar" (clickeable, lleva al paso 1, flecha animada salvo "reducir
      movimiento") y fuentes con el CV de la EPH. Serie de desocupación larga de datos.gob.ar.
- [x] 2.14 (26/09) Fichas: el corte de fechas de relleno pasó de 13/12/1907 a 1/1/1907 (el Pozo N° 2 recupera
      su fecha de perforación); la ficha muestra terminación y la fecha de abandono del listado de operadoras
      (`fab`) cuando existe; "2017-01" se muestra como "ya figuraba así al inicio de la serie". Correr
      `npm run data` para regenerar.

## Semana 3 · 3–9 oct · Pulido

- [ ] 3.1 Paso 3 (operadoras): colorear por operadora (5 destacadas + "otras", validar paleta con
      `validate_palette.js`), con un control "antes / después" que alterna operador anterior y actual
      usando `operadores.json` y la columna `ea` de las fichas. Si no da el tiempo: filtro simple por
      operadora y texto con las cifras.
- [ ] 3.2 Página "Metodología y fuentes" (`#metodologia` en `index.html`): datasets con enlace y
      fecha de descarga; tabla `GRUPOS`; correcciones; límites del dato; declaración de IA; créditos;
      licencias. Enlaces oficiales de `docs/investigacion-contexto.md`.
- [x] 2.18 (30/09) El paso 8 queda como cierre del relato (sin panel) con un botón "Explorá el mapa"; el visualizador
      es una sección aparte en la misma página (`#explorar`, enlace directo `…/#explorar`): ahí se libera el mapa y
      aparece el panel; al volver a un paso del relato se cierra. Carga en dos etapas (`main.js`): primero textos,
      gráfico, metodología, mapa base (MapLibre y deck.gl por `import()` dinámico) y pozos del país; después, en
      segundo plano, pozos de la cuenca, radios, límites, concesiones y barrios (`mapa.cargarDatos()`), con aviso
      "Cargando los pozos…" si alguien llega antes. La primera carga baja ~125 KB de código en vez de ~2,2 MB.
- [x] 2.19 (01/10) Fotos de los autores en las tarjetas 3, 4, 5, 6 y 8 y nueva foto de portada (`fotos-originales/`
      → `public/img/paso-N.jpg` y `portada.jpg`; crédito "Foto: los autores", salvo la del paso 8: "Foto: Mauro
      Esains", con enlace a su Instagram y uso autorizado). La de El Patagónico ya no se usa. El
      paso 7 queda sin foto; en celular las tarjetas van sin foto (la portada sí). Textos alternativos provisorios
      en `definirPasos()`: los revisa Aldana.
- [x] 2.20 (01/10) Fotos en WebP: `scripts/fotos_a_webp.py` (Pillow) convierte `fotos-originales/*.jpg` a
      `public/img/*.webp` a 800 px de ancho y calidad 80, sin metadatos. Las siete fotos pasan de 2.036 KB a 609 KB
      (70 % menos). La web usa solo WebP; los JPG originales (también el del Pozo N° 2) quedan versionados en
      `fotos-originales/`. Para cambiar una foto: reemplazar el original y volver a correr el script.
- [x] 2.21 (05/10) El paso 7 pasa de "Un radio censal" a **"Convivir con los pozos"**: cifra `barrios.pozos_en_barrios`;
      cinco historias de vecinos (Escuela N° 169, derrame en Bella Vista Sur, pozo dentro de una casa, petróleo en un
      patio, surgencia del CH-679) con marcador-botón en el mapa (`mapa.historias()`), lista de botones en la
      tarjeta y ventana con resumen, datos de cada pozo del registro y fuentes (`src/historias.js`). Prensa citada
      como excepción a la regla 3 (CLAUDE.md). Textos provisorios: los revisa Aldana
      (`docs/cambios-textos-2026-09-29.md`).
- [x] 3.3 (29/09) Enlaces a fuentes oficiales desde las tarjetas y la portada (`F` y `htmlFuente()` en `story.js`;
      solo URLs verificadas en `docs/investigacion-contexto.md` y `docs/formulario.md`).
- [ ] 3.4 Rendimiento: probar en una compu lenta y en Firefox/Safari; si hace falta, bajar
      `radiusMaxPixels` y agrupar en hexágonos por debajo de zoom 8 (`HexagonLayer`).
- [ ] 3.5 Accesibilidad: recorrido completo con teclado; foco visible; `prefers-reduced-motion`
      desactiva las animaciones de cámara; contraste de textos ≥ 4,5:1. Hecho el 29/09: foco visible en todos los
      controles, enlace "Saltar el recorrido", vuelos y fundidos sin animación con "reducir movimiento", ficha con
      foco y Escape, títulos de paso como encabezados. Falta: recorrido completo con teclado y lector de pantalla.
- [ ] 3.6 Prueba con 2–3 personas ajenas al proyecto: ¿entienden qué es "abandonado"? ¿encuentran
      los filtros? ¿la ficha les dice lo que esperan? Ajustar textos.
- [ ] 3.7 Deseable: línea de tiempo por año de perforación (`anio_cod` ya está en el binario; 46 %
      con fecha). Solo si 3.1–3.6 están cerradas.

## Semana 4 · 10–15 oct · Entrega

- [ ] 4.1 Congelar código el 12/10 (tag `v1.0`). Solo correcciones de errores después.
- [ ] 4.2 Video de 60 s: recorrido completo + 15 s de exploración (filtro por estado, clic en un
      pozo). Grabar a 1920×1080. Subir a YouTube o Vimeo (no listado).
- [ ] 4.3 PNG de portada 1920×1080 por si el formulario exige archivo.
- [ ] 4.4 Formulario: categoría Exploración interactiva; título; descripción metodológica (≤ 200
      palabras, `docs/formulario.md`); fuentes con links; declaración de IA; seudónimo; link a la web
      y al video. Enviar el 13 o 14. Guardar el acuse.
- [ ] 4.5 Respaldo: exportar `dist/` como zip y guardar junto al repo.

## Riesgos y respuesta

| Riesgo | Respuesta |
|---|---|
| Scroll flojo en móvil | Tarjetas apiladas con mapa fijo arriba (2.6) |
| Máquinas lentas | Hexágonos por debajo de zoom 8 (3.4); paso 0 sin puntos |
| Paso 3 se atrasa | Filtro simple por operadora + texto |
| Cambia el dato de la SE | Datos congelados con el Capítulo IV del 20/09/2026 (mismas cifras de cuenca que el del 18/09), citados con fecha |
| Duda de autoría/aval | Resolver en 1.8 esta semana |
| OpenFreeMap caído o lento | Fondo papel de respaldo ya implementado; alternativa: Argenmap (IGN) si vuelve a responder, o PMTiles en el repo |
