# Tesis Ecuador · Portal Universitario — imagen para Cloud Run.
#
# Frontend y API viven en un único proceso: `node dist/server.cjs` sirve los
# estáticos de Vite (dist/) y expone /api (Express). Con NODE_ENV=production y
# firebase-admin, el almacén de cuentas usa Firestore (ver authService).
# Cloud Run inyecta PORT=8080 y provee credenciales por metadata server (ADC).

# ---- Etapa de compilación ----
FROM node:20-slim AS build
WORKDIR /app

# Instalar dependencias primero: aprovecha la caché de capas de Docker.
COPY package.json package-lock.json ./
RUN npm ci

# Código fuente (ver .dockerignore para lo que se excluye).
COPY . .

# URL publica del propio Cloud Run del portal, horneada en el bundle del
# frontend (Vite solo expone VITE_* que existan en el entorno del build).
# Sin esto el modulo de originalidad usa una ruta relativa que pasa por
# Firebase Hosting, cuyo limite de 60s corta un analisis que tarda varios
# minutos (ver nota en src/context/OriginalityCheckContext.tsx). El valor
# por defecto es la URL real y estable del servicio; --build-arg la
# sobreescribe si el servicio se recrea con otra URL.
ARG VITE_ORIGINALITY_API_URL=https://portaltesisvm-1004187222399.europe-west1.run.app
ENV VITE_ORIGINALITY_API_URL=$VITE_ORIGINALITY_API_URL

# Compila el frontend (dist/) y empaqueta el servidor (dist/server.cjs).
RUN npm run build

# ---- Etapa de ejecución ----
FROM node:20-slim AS runtime
ENV NODE_ENV=production \
    PORT=8080
WORKDIR /app

# Solo lo necesario para correr: estáticos + API + dependencias de producción.
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

EXPOSE 8080
CMD ["node", "dist/server.cjs"]
