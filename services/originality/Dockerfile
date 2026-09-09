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
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
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

# Dependencias de la aplicación (cierra en package-lock.json).
COPY package.json package-lock.json ./
RUN npm ci

# Código (node_modules, dist y .git quedan fuera por .dockerignore).
COPY . .

# Compila el cliente: lo que servirá estático y el HTML que comprueba el portal
# para arrancar en modo producción sin levantar un segundo Vite.
RUN npm run build

# El sistema de archivos de Cloud Run es de solo lectura salvo /tmp: los modelos
# ONNX (IA/IA-semántica) se cachean ahí si no vienen ya en la imagen, y el corpus
# local (server/corpus.js) también crea su base de datos en /tmp para poder
# escribir (en local sin CORPUS_DB cae a ./data/corpus.db).
ENV NODE_ENV=production \
    PORT=8080 \
    TRANSFORMERS_CACHE=/tmp/hf-transformers \
    CORPUS_DB=/tmp/originality/corpus.db

EXPOSE 8080

CMD ["node", "server/index.js"]
