# Guía de operación

## Puesta en marcha

```bash
npm install
cp .env.example .env      # rellenar CONTACT_EMAIL y, si se tienen, las claves
npm run build
npm start                 # http://localhost:5000
```

En el primer análisis se descargan tres modelos ONNX (~1,1 GB en total) a
`./.models`. Hasta que terminen, el sistema funciona con métricas léxicas y lo
indica en la confianza reportada. Para un despliegue sin acceso a Hugging Face,
copiar `./.models` desde una máquina que sí lo tenga.

`./.models` **no está versionado**. Estuvo commiteado y eso dejó el `.git` del
portal en 729 MB, con cada operación de git y cada sincronización de OneDrive
arrastrando ese peso. Se descarga solo; no volver a añadirlo.

### LibreOffice (opcional, para el overlay sobre DOCX)

El overlay que marca coincidencias directamente sobre el documento original
(conservando carátula, encabezados y tablas) solo tiene geometría de página en
PDF. Para que también funcione con `.docx` — el caso más común en tesis — el
servidor convierte el DOCX a PDF con LibreOffice headless antes de analizarlo
(`server/docxToPdf.js`).

Es una dependencia **blanda**: si `soffice` no está instalado, el servidor no
falla — cae automáticamente al informe reimpreso de siempre (sin overlay), tal
como se comportaba antes de esta función. Para activar el overlay en DOCX:

```bash
# Debian/Ubuntu
apt-get install libreoffice

# o, si se instala en una ruta no estándar, apuntar el binario explícitamente:
export SOFFICE_PATH=/ruta/a/soffice
```

En Windows se busca en `C:\Program Files\LibreOffice\program\soffice.exe` por
defecto; en macOS en `/Applications/LibreOffice.app/...`. `SOFFICE_PATH`
tiene prioridad sobre ambos.

## Endpoints

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/api/limits` | Límites y formatos aceptados |
| `POST` | `/api/extract` | Extrae texto de PDF/DOCX/DOC/RTF/TXT/MD (multipart, campo `file`) |
| `POST` | `/api/plagiarism-check` | Análisis de similitud → JSON |
| `POST` | `/api/report` | Análisis + informe PDF (`detectAi: false` omite la sección de IA). Con `overlayToken` devuelve **resumen + el PDF original marcado**; sin él, el informe reimpreso |
| `POST` | `/api/report-overlay` | Solo el PDF original marcado, sin resumen (requiere `overlayToken`) |
| `POST` | `/api/ai-detect` | Estimación de texto generado por IA |
| `POST` | `/api/ai-report` | Informe de IA en PDF. Con `overlayToken` añade el original con los bloques sombreados por indicio |
| `GET` | `/api/corpus/stats` | Estado del corpus local |
| `POST` | `/api/corpus/index` | Añade un documento al corpus |
| `DELETE` | `/api/corpus/:checksum` | Elimina un documento (derecho de supresión) |
| `POST` | `/api/corpus/harvest` | Cosecha un repositorio OAI-PMH |

## Cómo se calcula el índice

Cada pasaje (12–60 palabras, solapado por una oración) se compara con cada
fuente candidata mediante cinco métricas:

| Métrica | Qué detecta |
|---|---|
| `containment` | Copia literal: proporción de 4-gramas del pasaje presentes en la fuente |
| `cosine` | Solape de vocabulario ponderado por TF-IDF |
| `fingerprint` | Reutilización parcial dentro de un documento largo (winnowing, el algoritmo de MOSS) |
| `semantic` | Coincidencia de significado mediante embeddings; sobrevive a la reescritura |
| `longestRun` | Racha más larga de palabras consecutivas idénticas |

El índice del documento es la suma de `palabras_del_pasaje × similitud`, dividida
entre el total de palabras. Un pasaje copiado a medias cuenta como medio pasaje.

### Por qué la métrica semántica no siempre suma al índice

Una afinidad semántica alta sin ninguna traza léxica admite dos lecturas que las
métricas no distinguen: una fuente traducida o reescrita, y dos textos
independientes sobre el mismo tema. Medido sobre fuentes reales, un ensayo sobre
deserción estudiantil coincide con la literatura del área en torno a 0,73–0,81,
mientras que una misma frase en otro idioma supera 0,94.

El sistema solo deja que la semántica no corroborada mueva el índice por encima
de esa brecha. Por debajo, el pasaje se reporta aparte, en «Pasajes con afinidad
de significado», para que el evaluador aplique el criterio que la medición no
puede aportar. Es una decisión deliberada: marcar trabajo honesto tiene un coste
mayor que dejar pasar un caso al revisor humano.

## Cobertura de fuentes

Con texto completo (comparables de verdad):

- **Wikipedia** (ES/EN) — vía API, sin scraping
- **Europe PMC** — cuerpo completo de artículos abiertos
- **CORE** — ~300M trabajos, campo `fullText` — **requiere clave, es el de mayor impacto**
- **Corpus local** — trabajos previos de la institución
- **Unpaywall** — convierte DOIs de pago en copias abiertas

Solo con metadatos o resumen: arXiv, DOAJ, Semantic Scholar, CrossRef, OpenAlex.

Búsqueda web: DuckDuckGo (bloqueado en algunas redes), Serper y Brave con clave.

## Corpus local y protección de datos

Nada se almacena por el hecho de analizarlo. `POST /api/corpus/index` es una
acción explícita y separada. Antes de activar la retención de trabajos de
estudiantes conviene resolver: consentimiento informado, plazo de conservación y
procedimiento de supresión. `DELETE /api/corpus/:checksum` borra el documento y
sus huellas, e invalida de inmediato la caché de búsqueda.

Cosecha de un repositorio institucional:

```bash
curl -X POST http://localhost:5000/api/corpus/harvest \
  -H "Content-Type: application/json" \
  -d '{"endpoint":"https://export.arxiv.org/oai2","set":"cs","maxRecords":500}'
```

Algunos DSpace responden 500 al listado sin filtro; el cosechador lo detecta y
recorre el repositorio por años. Un caso frecuente en repositorios universitarios
del Ecuador: el endpoint responde `Identify` pero no sirve registros, porque su
índice OAI no está construido del lado servidor. Ahí hay que pedir al área de
sistemas de esa universidad que ejecute `dspace oai import`.

## Detección de IA: límites

No existe forma fiable de probar que un texto fue generado por un modelo. Todos
los detectores producen falsos positivos, con mayor frecuencia en escritura
académica formal y en autores que no escriben en su lengua materna — exactamente
la población que este sistema atiende.

Por eso el resultado se reporta como banda con sus señales visibles, nunca como
veredicto, y el informe incluye la advertencia. **Nunca debe fundamentar una
sanción por sí solo.**

## Pruebas

```bash
node tests/run-all.mjs     # suite completa (requiere el servidor levantado)
node tests/humo.test.mjs   # verificación rápida de endpoints
```

Las suites de red dependen de servicios externos: un fallo aislado ahí suele ser
indisponibilidad del proveedor, no una regresión.

## Rendimiento

Con la caché fría, un documento corto tarda 12–20 s; con la caché caliente,
1–4 s. El límite es 120 000 caracteres y 120 pasajes analizados; por encima se
muestrea uniformemente y el informe lo declara.

## Reproducibilidad

El índice depende de qué proveedores respondan en cada momento. Los reintentos y
la caché de consultas (15 min) hacen que dos ejecuciones seguidas coincidan, pero
entre días distintos puede variar si un servicio cambia su disponibilidad. Cada
resultado incluye el campo `providers` con los que efectivamente contribuyeron:
un índice calculado con la mitad de las fuentes caídas no es comparable con otro
calculado con todas.
