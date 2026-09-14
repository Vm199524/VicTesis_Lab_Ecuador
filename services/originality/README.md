<div align="center">

<img src="docs/logo-originalidad.svg" width="132" height="132" alt="Verificador de Originalidad Académica" />

# VicTesis Lab · Verificador de Originalidad Académica

**Detección de plagio y de contenido generado por IA** para el portal **Tesis Ecuador (VicTesis Lab)**.


</div>

---

Servicio de **detección de plagio y de contenido generado por IA** del portal **Tesis Ecuador (VicTesis Lab)**. Contrasta un documento académico contra fuentes abiertas, un corpus local y modelos de lenguaje, y genera **informes PDF** con el detalle de las coincidencias.

Es un servicio independiente (Express + SQLite + modelos ONNX) que el portal consume a través de `/api/originality/*` y que también puede desplegarse con su propia interfaz.

---

## ✨ Qué hace

- **Verificación de originalidad**: analiza el texto por frases y detecta coincidencias con **Wikipedia, CORE, Europe PMC, arXiv, Semantic Scholar, DOAJ, CrossRef, OpenAlex** y un **corpus/repositorio local**.
- **Exclusión de citas**: opción de ignorar citas y referencias para no penalizar el contenido correctamente atribuido.
- **Estimación de contenido IA**: detección asistida por un modelo de lenguaje (ONNX, local).
- **Coincidencia semántica**: además de la coincidencia literal, detecta paráfrasis mediante un modelo semántico multilingüe.
- **Informes PDF**: descarga de informes de similitud (y de IA) con marca de verificación, detalle por fuente y desglose.
- **Soporte de archivos**: `.txt`, `.md`, `.doc`, `.docx`, `.rtf` y `.pdf` (hasta 25 MB).
- **Extracción fiel del original**: cuando el documento tiene geometría de página, el informe se dibuja sobre el original tal como se subió. Un `.docx` se convierte antes a PDF con **LibreOffice** (`server/docxToPdf.js`), así se conservan **carátula, encabezados, pies y tablas** y las coincidencias se marcan con colores sobre esa maqueta, no sobre un informe reimpreso.

---

## 🧱 Stack

- **Servidor:** Node.js 22.5+ · Express · SQLite nativo (`node:sqlite`, corpus y reportes).
- **IA / NLP:** `@huggingface/transformers` (ONNX): modelo semántico multilingüe para similitud y modelo `Qwen2.5` (0.5B) para la estimación de contenido IA.
- **Extracción:** `pdfjs-dist` (PDF), `mammoth` / `word-extractor` (Word), **LibreOffice headless** (DOCX→PDF fiel), `multer` (subida).
- **Informes PDF:** render HTML a PDF con **Puppeteer** (Chromium headless).
- **Cliente:** React + Vite + Tailwind (interfaz propia del detector, opcional en despliegue).

---

## 🚀 Puesta en marcha

**Requisitos:**

- Node.js ≥ 22.5 (usa el módulo nativo `node:sqlite`).
- **LibreOffice** (`soffice` en el `PATH`) solo para marcar sobre el original de
  un `.docx`. Si no está, todo lo demás funciona y el informe de un `.docx` sale
  como informe reimpreso. En Debian/Ubuntu: `apt-get install libreoffice-writer`
  (la imagen de Cloud Run ya lo incluye). Ruta explícita: `SOFFICE_PATH`.

```bash
npm install
npm run build   # compila el cliente a dist/public (necesario para NODE_ENV=production)
npm start       # NODE_ENV=production node server/index.js → http://127.0.0.1:5000
```

Para desarrollo con recarga del cliente:

```bash
npm run dev
```

En el primer uso que requiera modelos ONNX, se descargan a la carpeta de caché (ver `TRANSFORMERS_CACHE`) y quedan listos para las siguientes peticiones.

### Variables de entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `PORT` | No | Puerto de escucha (Cloud Run inyecta `8080`; por defecto `5000`). |
| `NODE_ENV` | No | `production` sirve la interfaz compilada sin levantar Vite. |
| `TRANSFORMERS_CACHE` | No | Carpeta de caché de los modelos ONNX (en Cloud Run usar `/tmp`). |
| `AI_DETECT_MODEL` | No | Modelo de estimación de IA (por defecto `onnx-community/Qwen2.5-0.5B`). |
| `AI_DETECT_DISABLED=1` | No | Desactiva la detección de contenido IA. |
| `SEMANTIC_MODEL` | No | Modelo semántico (por defecto `Xenova/paraphrase-multilingual-MiniLM-L12-v2`). |
| `SEMANTIC_DISABLED=1` | No | Desactiva la coincidencia semántica. |
| `CORPUS_DB` | No | Ruta de la base del corpus local (por defecto `./data/corpus.db`; en Cloud Run el `Dockerfile` la fija a `/tmp/originality/corpus.db` porque la raíz es de solo lectura). |
| `SOFFICE_PATH` | No | Ruta del binario de LibreOffice (`/usr/bin/soffice` en el contenedor). Si se omite, se buscan las rutas habituales. |
| `HOME` / `XDG_CACHE_HOME` | No | En Cloud Run apuntan a `/tmp` para que LibreOffice pueda escribir su perfil y su caché de fuentes en un sistema de solo lectura. |
| `MAX_CHARS` / `MAX_CHUNKS` | No | Límites de texto y de bloques analizados. |
| `CORE_API_KEY` / `SEMANTIC_SCHOLAR_API_KEY` | No | Claves opcionales de proveedores para ampliar cobertura. |

---

## ☁️ Despliegue (Cloud Run)

Incluye un `Dockerfile` pensado para **Cloud Run** (imagen sobre base debian/glibc con las librerías de Chromium que exige Puppeteer). Despliegue de referencia:

La vía rápida es el guión de la raíz del repo (compila la imagen una sola vez y
despliega por `--image`):

```bash
bash deploy.sh detector
```

Equivale a (desde `services/originality/`, si se prefiere el despliegue directo):

```bash
gcloud run deploy portaltesis-originalidad \
  --source . \
  --region europe-west1 \
  --allow-unauthenticated --quiet \
  --memory 8Gi --cpu 2 --concurrency 1 --max-instances 2 --timeout 900
```

> **Memoria:** 8 GiB porque el runtime ONNX de transformers.js reserva varios GB
> por instancia (probado: 1 y 2 GiB revientan con OOM) y a eso se suma el
> marcado del original —Chromium de Puppeteer renderizando el PDF completo— y el
> perfil de LibreOffice al convertir un `.docx`. Con 4 GiB el contenedor llegó a
> ser reiniciado por OOM durante análisis largos, y al reciclarse la instancia se
> pierde el estado en memoria (los `overlayToken` dejan de existir). `concurrency 1`
> evita que dos análisis solapen su consumo en un mismo contenedor. Con
> `min-instances 0` no hay coste en reposo.
>
> **Estado en memoria.** Los `overlayToken` que permiten marcar sobre el original
> viven en la RAM de la instancia (TTL 30 min) porque el sistema de archivos de
> Cloud Run es efímero. Si la instancia se recicla, el portal **vuelve a extraer
> el archivo** y reintenta; si aun así no hay original disponible, el informe sale
> como reimpreso en lugar de fallar con un error de token inválido.
>
> **Imagen.** El `Dockerfile` instala Chromium (Puppeteer), `libreoffice-writer`
> —conversión fiel de `.docx`— y las fuentes `fonts-crosextra-carlito`/`caladea`,
> sustitutas métricamente compatibles de Calibri y Cambria, las tipografías
> habituales de las tesis: sin ellas el maquetado se desplaza al convertir.
>
> **Documentos largos (desplegado):** el servicio usa `MAX_CHUNKS=48` (muestreo
> representativo de un documento completo) y `FETCH_CONCURRENCY=4` — un análisis
> así tarda ~6 min y cabe en el timeout de 900 s. El portal espera hasta 850 s
> (`ORIGINALITY_TIMEOUT_MS`).
> La primera petición tras un arranque en frío descarga el modelo a
> `TRANSFORMERS_CACHE` (~40–60 s); las siguientes son instantáneas mientras la
> instancia vive.

> El portal **Tesis Ecuador (VicTesis Lab)** se conecta a este servicio con la variable
> `ORIGINALITY_API_URL` y solo expone sus rutas `/api/*` bajo `/api/originality/*`. Cuando
> `ORIGINALITY_API_URL` apunta a otra máquina, el portal no intenta arrancar el detector;
> en local (sin esa variable) el portal lo lanza solo en el puerto 5000.

### Endpoints

`limits` · `extract` · `plagiarism-check` · `report` · `report-overlay` · `ai-detect` · `ai-report`

---

## 📁 Estructura

```text
services/originality/
├─ server/            # API Express: extracción, plagio, IA, informes, corpus
│  ├─ plagiarism.js   # contraste por frases contra proveedores y corpus local
│  ├─ semantic.js     # similitud semántica (paráfrasis) con ONNX
│  ├─ ai-detect.js    # estimación de contenido generado por IA
│  ├─ report.js       # informe PDF (Puppeteer)
│  ├─ docxToPdf.js    # DOCX→PDF con LibreOffice (conserva la maqueta original)
│  └─ routes.js       # registro de rutas /api/*
├─ client/            # interfaz propia del detector (React + Vite)
├─ shared/            # esquemas y utilidades compartidas
└─ Dockerfile         # imagen para Cloud Run
```

---

## ⚠️ Nota ética

Es una herramienta de **orientación**: el porcentaje y las coincidencias ayudan a revisar el
borrador, pero la decisión sobre originalidad corresponde a la institución y a los informes
oficiales (p. ej. Turnitin) que cada universidad exige. El detector no sustituye ese dictamen.

---

*Proyecto desarrollado e integrado para el portal **Tesis Ecuador — VicTesis Lab**. Inspirado en
patrones y herramientas de código abierto de la comunidad de detección de similitud, adaptado y
reescrito por completo para este ecosistema.*
