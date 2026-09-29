# Pipeline de datos

`procesar.py` toma los archivos de `raw/` y genera todo `public/data/`. Tarda unos 15 segundos.

```bash
pip install -r data-pipeline/requirements.txt   # o: pip install pandas numpy geopandas shapely pyogrio
python data-pipeline/procesar.py --check        # lo mismo que `npm run data`
```

`requirements.txt` fija las versiones con las que se verificó el pipeline (Python 3.12, 29/09/2026).

**Windows:** si `python` abre la Microsoft Store (es solo un acceso directo), usar el lanzador `py`
con la versión que tiene las librerías instaladas, desde la raíz del proyecto:

```powershell
py -3.12 -m pip install -r data-pipeline\requirements.txt
py -3.12 data-pipeline\procesar.py --check
```

En ese caso `npm run data` no anda (llama a `python`); correr el comando de arriba.

## Insumos (`raw/`), descargados entre el 18 y el 26/09/2026

La primera tanda es del 18/09/2026. El 20/09 se reemplazó el Capítulo IV por la versión del país con coordenadas
(da las mismas cifras de la cuenca que la del 18/09) y se sumaron el padrón, las concesiones, los barrios y el
mensual. La EPH se sumó el 26/09. Fecha de cada archivo en la tabla.

| Archivo | Origen | Cómo se obtuvo |
|---|---|---|
| `capitulo-iv-pozos.csv` | Secretaría de Energía, dataset "Producción de petróleo y gas por pozo (Capítulo IV)", recurso "Capítulo IV – Pozos" (CSV, 34 MB, 85.611 pozos con geojson) | Descarga directa (20/09/2026). El script filtra la cuenca solo |
| `padron-primera-produccion.csv` | Mismo dataset, "Padrón de Pozos de Capítulo IV con fecha de primera producción" | Descarga directa (20/09/2026). La serie arranca en 2006-01: ese valor significa "ya figuraba al inicio de la serie" |
| `concesiones-explotacion.zip` | Dataset "Producción de hidrocarburos – Concesiones de Explotación" (SHP) | Descarga directa (20/09/2026); 297 polígonos país, 55 en la cuenca |
| `produccion-mensual_gsj.zip` | Mensuales "Producción de Pozos de Gas y Petróleo – AAAA", 2017 a 2026 | `python filtrar_mensuales.py` → `produccion-mensual_gsj.csv` (4.873.490 filas), comprimido en zip (41 MB), 20/09/2026. El script lo lee comprimido |
| `listado-pozos-operadoras_gsj.csv` | Mismo dataset, recurso "Listado de pozos cargados por empresas operadoras" (actualizado 20/10/2025) | Descarga del 18/09/2026, filtrado por `idcuenca == GSJ` |
| `serie-produccion-petroleo-por-cuenca.csv` | Mismo dataset, "Serie histórica de producción de petróleo por cuenca y sub-tipo de recurso" | Descarga directa (18/09/2026) |
| `limites-administrativos-2025.zip` | datos.comodoro.gov.ar | Shapefile (ejido Comodoro Rivadavia, Rada Tilly, depto. Escalante), 18/09/2026 |
| `radios-censales-2022.zip` | datos.comodoro.gov.ar (Censo 2022, INDEC) | Shapefile, 325 radios del depto. Escalante, 18/09/2026 |
| `poblacion-radio-censal-2022.kmz` | datos.comodoro.gov.ar (Censo 2022, INDEC) | Polígonos con población por radio, 18/09/2026 |
| `limites-barrios-2026.gpkg` | datos.comodoro.gov.ar | 77 barrios de Comodoro Rivadavia (GeoPackage), 20/09/2026; 52 tienen pozos |
| `eph-desempleo-comodoro-datosgobar.csv` | datos.gob.ar, serie `45.2_ECTDTCR_0_T_52` (INDEC, EPH continua: tasa de desempleo, Comodoro Rivadavia), trimestral 2003–2026 | Descarga de la API de series (26/09/2026). Define el último valor y hace cuántos años no había uno más alto |
| `eph-comodoro-2022-2026.csv` | INDEC, EPH, informes "Mercado de trabajo. Tasas e indicadores socioeconómicos" 1T 2022 a 2T 2026 | Serie armada por Mariano (26/09/2026) con los cuadros 3.1 a 3.4 de cada informe: tasas, población y CV/IC 90 % de la desocupación para Comodoro Rivadavia–Rada Tilly, región Patagonia y total 31 aglomerados. 2T 2026 provisorio |

Licencias: Secretaría de Energía CC-BY 4.0; portal municipal según su licencia (Creative Commons).

## Qué hace el script

1. Lee el Capítulo IV país entero; filtra la cuenca; parsea coordenadas; agrupa los 17 estados en 4
   (`GRUPOS`); descarta fechas de relleno (1902-01-01 y anteriores al 1/1/1907) en la fecha de inicio de
   perforación y en la de fin de terminación.
2. Cruza con el listado anterior (operador previo), el padrón (primera producción), el mensual si
   existe (última producción, meses sin producir, primer mes abandonado) y las concesiones
   (pozo en área con/sin concesión vigente).
3. Cruce espacial con ejido, Rada Tilly, Escalante, radios censales con población y barrios.
   Los zip se descomprimen en una carpeta temporal del sistema que se borra sola.
4. Escribe `pozos_gsj.bin` y su `meta.json` con las tablas de códigos. Columnas, en orden:

   | Columna | Tipo | Contenido |
   |---|---|---|
   | `idpozo` | uint32 | id del Capítulo IV |
   | `lon`, `lat` | float32 | coordenadas |
   | `estado_cod` | uint8 | índice en `estados` del meta (Activo, Inactivo, A abandonar, Abandonado, No informado) |
   | `empresa_cod` | uint16 | índice en `empresas` del meta (`""` = sin empresa) |
   | `yac_cod` | uint16 | índice en `yacimientos` del meta |
   | `prov_cod` | uint8 | 1 Chubut, 2 Santa Cruz, 0 otra |
   | `anio_cod` | uint16 | año de inicio de perforación (0 = sin fecha o fecha de relleno) |
   | `ejido_cod` | uint8 | 1 = dentro del ejido de Comodoro Rivadavia |
   | `primera_cod` | uint16 | año de primera producción del padrón (0 = sin dato). OJO: 2006 incluye a los que ya figuraban en 2006-01, el inicio de la serie; no es un año de perforación |
   | `meses_cod` | uint16 | meses sin producir hasta el último mes de la serie mensual (65535 = ningún mes con producción en la serie) |
   | `conc_cod` | uint8 | 1 = área con concesión de explotación vigente, 0 = área que no figura como concesión (255 = sin la capa) |

   Cada columna empieza en un offset múltiplo de su tamaño (hay bytes de relleno entre columnas cuando hace
   falta), así `new Uint16Array(buf, offset, n)` no falla con `n` impar. Leer siempre `offset` y `bytes` del
   meta, nunca calcularlos. `pozos_pais.bin` sigue el mismo formato (lon, lat, estado_cod, gsj_cod).
5. Escribe las fichas por lote de 1.000 `idpozo` (claves cortas documentadas en el meta).
6. `radios.geojson` (población + pozos por estado), `barrios.geojson`, `limites.geojson`, `concesiones.geojson`,
   `pozos_pais.bin` (85.609 pozos con coordenadas), `produccion_cuencas.json`, `operadores.json`.
7. `resumen.json`: todas las cifras de la pieza. `conciliacion.md`: tabla de control.

## Cifras de control (18/09/2026)

Ver `../public/data/conciliacion.md`. Si al reprocesar cambia alguna, revisar antes de publicar.
