# Cambios en los textos de las tarjetas — 29/09/2026

Para Aldana: revisar la voz. Los cambios se hicieron para cumplir las reglas 1 (ninguna cifra a mano) y
2 (vocabulario fiel al dato) de `CLAUDE.md`, con la aprobación de Mariano. Ninguna cifra cambió: todas siguen
saliendo de `public/data/resumen.json`. Los textos viven en `definirPasos()` de `src/story.js`. Si preferís otra
redacción, se cambia; lo único que no se puede volver atrás es lo marcado como **regla**.

## Formato (en todas las tarjetas)

- Porcentajes con coma decimal: "22,8 %", "44,1 %", "62,5 %", "39,5 %" (antes salían con punto). **Regla 7.**
- La cifra grande ahora está dentro del título (`<h2>`): con lector de pantalla se lee "44.390 pozos en la cuenca…".
  Se ve igual que antes.
- La línea "Fuente:" tiene enlaces a las fuentes oficiales (tarea 3.3): se abren en otra pestaña, con un ícono chico.

## Portada

- El texto no cambió. A la línea de fuentes se sumó "YPF, Form 6-K (SEC, 19/2/2026)", que respalda "YPF se fue"
  (venta de Manantiales Behr). **Regla 3.**

## Paso 2 · País

- Título: "del petróleo argentino sale **hoy** del Golfo San Jorge" → "del petróleo argentino **salió del Golfo San
  Jorge en 2025**". El dato es del último año completo (`produccion.anio_ref`), no de hoy.
- "Mientras la Cuenca Neuquina más que se duplicó" → igual, pero ahora la frase se calcula desde
  `produccion.neuquina_ref_sobre_base_pct` (218 %). Si el dato cambiara, la frase cambia sola. **Regla 1.**

## Paso 3 · Cuenca

- "Dos de cada tres no producen" → "**Casi** dos de cada tres no producen". El dato es 64,2 % (28.499 de 44.390);
  la proporción se calcula en el código y agrega "casi" o "más de" según corresponda. **Regla 1.**
- "producen 9.909" (de los que ya figuraban en 2006) → "hoy **están activos** 9.909". El grupo Activo incluye
  pozos inyectores, de mantenimiento de presión y en reparación: no todos producen. **Regla 2.**
- "11.243 pozos **que no están declarados abandonados**" → "11.243 pozos **inactivos o a abandonar**". La cifra
  cuenta solo esos dos grupos (hay además 2.942 activos sin un mes de producción, que no entran). **Regla 2.**

## Paso 4 · Operadoras

- "Hoy sus pozos figuran a nombre de PECOM, Patagonia Resources, Clear, Quintana, Roch y otras" → "Hoy esos pozos
  figuran a nombre de PECOM, Patagonia Resources, Clear Petroleum, Quintana y Roch, entre otras". La lista ahora
  sale del dato (`cuenca.ex_ypf_por_operadora_actual`: las cinco con más pozos ex YPF). Salió igual que la que
  estaba tipeada, así que no cambia el sentido. **Regla 1.**
- Frase nueva (tarea 2.10): "Además, 2.207 pozos están en áreas que no figuran como concesión de explotación
  vigente: en el mapa, los que tienen un anillo." Suma unas 20 palabras; la tarjeta queda en ~85.

## Paso 5 · Ejido

- "817 **producen**" → "817 **están activos**". **Regla 2.**
- El mapa ahora muestra los pozos de afuera del ejido atenuados, en vez de ocultarlos (tarea 2.3). La leyenda
  cuenta solo los del ejido y muestra la escala de población.

## Paso 6 · Km 3

- "77 **en producción**" → "77 **activos**". **Regla 2.**
- "La Resolución SE 5/96 exige abandono definitivo en ejidos urbanos; **muchos de estos pozos son anteriores a esa
  norma**" → "La Resolución SE 5/96 exige que el abandono de pozos en ejidos urbanos sea siempre definitivo." La
  segunda mitad no tenía cifra que la respalde (el 53,6 % de los pozos no tiene fecha de perforación). **Regla 1.**
- "En General Enrique Mosconi hay 195 pozos y ninguno **produce**" → "ninguno **está activo**". **Regla 2.**
- Sigue larga (~95 palabras, tarea 2.11): decidís vos si se recorta o si los barrios van en una tarjeta propia.

## Paso 7 · Un radio censal

- Al final: "(en el mapa, con un anillo)". El pozo YPF.Ch.-679 está en el registro (`resumen.casos.ch679`):
  ahora se marca con un anillo y el rótulo "CH-679" (tarea 2.2), y la vista se abre un poco (zoom 14 en vez de
  14,5) para que entre junto con el radio.
- El nombre del barrio del radio no aparece: ningún barrio cubre la mitad del radio 260211203 (el que más cubre es
  General Enrique Mosconi, con el 11,8 % del área). Antes tampoco aparecía.

## Paso 8 · Lo que queda

- "13.175 pozos llevan más de cinco años sin producir **y no están declarados abandonados**" → "13.175 pozos
  **inactivos o a abandonar** llevan más de cinco años sin producir". Mismo motivo que en el paso 3. **Regla 2.**
- "Explorálo" → "Exploralo" (con voseo, el imperativo con pronombre va sin tilde).

## Panel de exploración y ficha

- Nuevo desplegable "¿Qué quiere decir 'abandonado'?" con la definición de la regla 2 (spec §5 pedía explicarlo).
- Ficha: "ya figuraba en enero de 2006 (inicio de la serie)" → "enero de 2006 o antes (la serie empieza ahí)";
  "1 años sin producir" → "más de un año sin producir".

## Metodología y fuentes (nueva, tarea 3.2)

- La arma `src/metodologia.js` con las cifras de `resumen.json`. El párrafo de apertura es provisorio: lo escribís
  vos (tarea 9 de `docs/para-aldana.md`); está marcado con `TEXTO PROVISORIO` en el código.
- La autoría queda oculta (`const AUTORIA = null`) hasta que haya seudónimo.

## Fotos (01/10)

Fotos de los autores en las tarjetas 3, 4, 5 y 6 y en la portada; crédito "Foto: los autores." (hasta que haya
seudónimo). La del paso 8 es de Mauro Esains: crédito "Foto: Mauro Esains", con enlace a su Instagram. El texto alternativo es lo que lee un lector de pantalla: describe la foto, no la interpreta. Son
provisorios, revisalos en `definirPasos()` (`src/story.js`) y en `index.html` (portada):

- Portada: "La estructura oxidada de un aparato de bombeo sobre una loma, frente al mar".
- Paso 3: "Vista aérea de una planta petrolera con tanques de PECOM, playas de estacionamiento y árboles; detrás, la meseta".
- Paso 4: "Las letras oxidadas de un viejo cartel de YPF entre pastizales, frente a un galpón".
- Paso 5: "Un aparato de bombeo cercado sobre una loma, con el mar de fondo".
- Paso 6: "Vista aérea de un aparato de bombeo cercado en medio de un barrio, entre casas y calles de tierra con charcos".
- Paso 8: "Un aparato de bombeo en la meseta, bajo un cielo cargado de nubes oscuras".

Si querés sumar dónde se tomó cada una (por ejemplo "Km 3, 2026. Foto: los autores."), va en el pie de foto.

## Para decidir (no se tocó)

- **Portada, "la desocupación es la más alta en décadas".** Ahora se ve (antes el dato no estaba generado). Se apoya
  en 9,2 % contra 9,3 % de 2005T4, con un coeficiente de variación de 35,5 % (IC 90 %: 3,8 % a 14,6 %). El INDEC
  considera poco confiable todo CV mayor a 25 %: un ranking tiene el mismo problema de error muestral que decir
  "cuánto subió". La fuente declara el CV; es decisión de ustedes si la frase queda.
- Gráfico del paso 2: la Cuenca del Golfo San Jorge va en el rojo de "A abandonar" y la Neuquina en el azul de
  "Activo". En un gráfico sin estados puede confundir; la paleta es de Aldana.
- Tarjetas que no están activas: bajé la transparencia de 55 % a 82 % de opacidad para que el texto tenga contraste
  suficiente (tarea 3.5). Si molesta visualmente, se ajusta.
