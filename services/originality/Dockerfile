# VicTesis Lab · Verificador de Originalidad — imagen para Cloud Run.
#
# Servicio independiente del portal (Express + SQLite + modelos ONNX). Escucha en
# el puerto que inyecte la plataforma (Cloud Run: 8080; en local: 5000). El portal
# lo alcanza vía ORIGINALITY_API_URL y solo expone sus rutas /api/*.
#
# Base debian (glibc) porque Puppeteer descarga Chrome for Testing y necesita esas
# librerías: la base alpine/musl de la plantilla original no puede ejecutarlo.
#
# Node 24 (bookworm): el servidor importa `node:sqlite` (server/corpus.js), módulo
# que no existe en Node 20 y que en Node 22 aún requería la bandera experimental.
# Con Node 24 coincide con el runtime local validado (sin banderas).

FROM node:24-bookworm-slim

WORKDIR /app

# Dependencias del sistema para Chromium/Puppeteer headless (informes PDF) y
# fuentes para que el texto no salga como cuadros. Solo se instalan las mínimas.
# `libreoffice-writer` es lo que permite marcar sobre el ORIGINAL de un .docx:
# convierte el documento a PDF respetando carátula, encabezados, pies y tablas
# (server/docxToPdf.js) y ese PDF se marca igual que un PDF subido. Las fuentes
# crosextra son las sustitutas métricamente compatibles de Calibri y Cambria,
# las tipografías habituales de las tesis; sin ellas el maquetado se desplaza.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    fonts-crosextra-carlito \
    fonts-crosextra-caladea \
    libreoffice-writer \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Dónde queda el Chrome for Testing que descarga el postinstall de Puppeteer.
#
# Tiene que fijarse ANTES de `npm ci` y valer lo mismo en build y en runtime.
# Sin esta línea el postinstall lo deja en $HOME/.cache/puppeteer (== /root al
# compilar, porque HOME aún no se había redefinido) y en runtime Puppeteer lo
# busca en HOME=/tmp/.cache/puppeteer → "Could not find Chrome (ver. X)". Los
# informes PDF se caían con un 500 justo después de subir el documento.
#
# La ruta vive fuera de /app para que el `COPY . .` posterior no pueda pisarla.
ENV PUPPETEER_CACHE_DIR=/opt/puppeteer

# Dependencias de la aplicación (cierra en package-lock.json).
COPY package.json package-lock.json ./
RUN npm ci

# Falla el build si el navegador no quedó donde Puppeteer lo va a buscar. Es la
# comprobación que habría evitado publicar una imagen que solo rompe al generar
# el informe: la descarga del postinstall puede fallar o cambiar de ruta sin que
# `npm ci` devuelva un error.
RUN node --input-type=module -e "import puppeteer from 'puppeteer'; import { existsSync } from 'node:fs'; const p = await puppeteer.executablePath(); if (!existsSync(p)) { throw new Error('Puppeteer no encuentra Chrome en ' + p); } console.log('Chrome listo en', p);"

# Código (node_modules, dist y .git quedan fuera por .dockerignore).
COPY . .

# Compila el cliente: lo que servirá estático y el HTML que comprueba el portal
# para arrancar en modo producción sin levantar un segundo Vite.
RUN npm run build

# El sistema de archivos de Cloud Run es de solo lectura salvo /tmp: los modelos
# ONNX (IA/IA-semántica) se cachean ahí si no vienen ya en la imagen, y el corpus
# local (server/corpus.js) también crea su base de datos en /tmp para poder
# escribir (en local sin CORPUS_DB cae a ./data/corpus.db).
# /tmp se borra en cada redeploy o reinicio de instancia, así que por sí solo
# CORPUS_DB no sobrevive; cuando CORPUS_BUCKET está seteado (ver deploy.sh),
# corpus.js sube y baja ese mismo archivo como objeto normal de Cloud Storage
# al arrancar y tras cada escritura, sin montar el bucket como filesystem
# (Cloud Storage FUSE no da locking real y corrompe una base SQLite en WAL).
# HOME/XDG_CACHE_HOME apuntan a /tmp para que LibreOffice (conversión DOCX→PDF)
# pueda escribir su perfil y su caché de fuentes en un sistema de solo lectura.
# Ojo: mover HOME cambia dónde Puppeteer *buscaría* su navegador, pero ahí ya no
# hay nada (/tmp nace vacío en cada instancia); por eso PUPPETEER_CACHE_DIR está
# fijado arriba a una ruta de la imagen y no depende de HOME.
ENV NODE_ENV=production \
    PORT=8080 \
    HOME=/tmp \
    XDG_CACHE_HOME=/tmp/.cache \
    SOFFICE_PATH=/usr/bin/soffice \
    TRANSFORMERS_CACHE=/tmp/hf-transformers \
    CORPUS_DB=/tmp/originality/corpus.db

EXPOSE 8080

CMD ["node", "server/index.js"]
