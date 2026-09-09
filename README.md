<!--
  Tesis Ecuador · Portal Universitario
  --------------------------------------------------------------------------
  El bloque <style> añade micro-animaciones CSS al encabezado en los visores
  que renderizan CSS dentro del README (VS Code, editores, GitHub Desktop).
  En github.com el <style> se ignora y todo queda estático y legible: el
  contenido nunca depende de la animación (degradación elegante).
-->
<div align="center">

<a href="#portal-tesis-ecuador">
<!-- Logo principal: réplica vectorial del favicon de la app
     (círculo azul marino #002B49, anillo dorado #c9a227, libro abierto y check dorado). -->
<svg viewBox="0 0 100 100" width="120" height="120" role="img" aria-label="Tesis Ecuador" class="te-logo" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="49" fill="#002B49"/>
  <circle cx="50" cy="50" r="42" fill="none" stroke="#c9a227" stroke-width="3" opacity="0.9"/>
  <path d="M50 61 C44 56 37 55 30 55.5 L30 40.5 C37 40 44 41 50 46 Z" fill="#F8FAFC"/>
  <path d="M50 61 C56 56 63 55 70 55.5 L70 40.5 C63 40 56 41 50 46 Z" fill="#E2E8F0"/>
  <path d="M38 50.5 L46.5 59 L63 39.5" fill="none" stroke="#c9a227" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</a>

# Portal Tesis Ecuador

**Plataforma web interactiva de apoyo metodológico para estudiantes universitarios de todo el Ecuador en proceso de titulación.**

*Recursos, tutoría y formación académica* — de la **viabilidad del tema** a la **defensa**: metodología cuantitativa, matriz de consistencia, ecuaciones Scopus, normas APA 7, verificación de originalidad y un **Tutor IA** que entiende lenguaje natural.

<!-- Animaciones CSS: flotación suave del logo (se ignoran en github.com). -->
<style>
.te-logo{animation:teFloat 5s ease-in-out infinite}
@keyframes teFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@media (prefers-reduced-motion: reduce){.te-logo{animation:none}}
</style>

[![React 19](https://img.shields.io/badge/React-19-%23002B49?logo=react&logoColor=white&labelColor=%23002B49)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-%23002B49?logo=typescript&logoColor=white&labelColor=%23002B49)](https://www.typescriptlang.org)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-%23c9a227?logo=tailwindcss&logoColor=white&labelColor=%23002B49)](https://tailwindcss.com)
[![Vite 6](https://img.shields.io/badge/Vite-6-%23c9a227?logo=vite&logoColor=white&labelColor=%23002B49)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-4-%23002B49?logo=express&logoColor=white&labelColor=%23002B49)](https://expressjs.com)

[![Estado: activo](https://img.shields.io/badge/estado-activo-%23c9a227?style=flat-square&labelColor=%23002B49)](https://github.com/Vm199524/PORTAL-TESIS-ECUADOR)
[![5 idiomas](https://img.shields.io/badge/idiomas-es%20%7C%20en%20%7C%20pt%20%7C%20fr%20%7C%20it-%23c9a227?style=flat-square&labelColor=%23002B49)]()

</div>

---

## 🗂️ Módulos

| # | Módulo | Qué hace |
|---|--------|----------|
| 01 | **Viabilidad & Matriz** | Diagnóstico ponderado del tema y construcción de la **matriz de consistencia** en 4 fases. |
| 02 | **Los 5 Capítulos** | Entregables, errores críticos y *checklist* por capítulo. |
| 03 | **Scopus & Booleanos** | Constructor de **ecuaciones booleanas** con sintaxis `TITLE-ABS-KEY`. |
| 04 | **APA 7 & Zotero** | Simulador de citas parentéticas, narrativas, en bloque y regla del *et al.* |
| 05 | **Software & Toolbox** | Herramientas de búsqueda, gestión bibliográfica y análisis estadístico. |
| 06 | **Videoteca** | Rutas de video curadas por etapa del proceso. |
| 07 | **Revisor de Borrador** | Diagnóstico automatizado del Avance 1 o 2 (estructura, objetivos, requerimientos, citación, redacción y formato). |
| 08 | **Ver Todo** | Los módulos desplegados en un lienzo continuo. |

Suma un **Tutor IA** y un **servicio de verificación de originalidad** (detección de plagio/contenido IA).

---

## 🤖 Tutor IA: un mini-agente inteligente (offline primero)

El Tutor IA **no depende de una API para responder lo esencial**. Su motor de intención
(`src/domain/tutorIntentEngine.ts`) clasifica cada mensaje por capas:

1. **Cortesías** — saludos, agradecimientos y despedidas (`matchMetaKey`), respondidos al instante.
2. **Temas curados** — 20+ temas de metodología (`matchTopicKey`, sinónimos + normalización sin tildes) resueltos desde una base de conocimiento **localizada a `es · en · pt · fr · it`**.
3. **Flujo guiado** — máquina de estados (`TOPIC_NEXT`) que **avanza de tema en tema** cuando respondes *"sí, sigamos"*: cuantitativo → objetivos → variables → matriz → ecuaciones Scopus → Zotero → APA 7 → redacción → originalidad → revisión → estructura → defensa.
4. **Lenguaje natural** — una *pregunta* real ("¿hasta dónde vamos a avanzar?") **nunca** se confunde con una orden de continuar: solo las afirmaciones explícitas avanzan el flujo.
5. **Texto libre** — si la consulta no coincide con la KB, se delega al servidor Express (`/api/ask-tutor`), que con `GEMINI_API_KEY` responde en el **idioma activo** del chat.

Todo lo curado funciona **sin red ni clave**: si no hay clave Gemini o se agota la cuota, el asistente nunca queda inservible.

---

## 🔒 Revisor de Borrador: privacidad

El documento del estudiante **se procesa íntegramente en el navegador**: la extracción de texto de `.docx` se hace con `DecompressionStream` nativo y el análisis corre en el cliente. No hay subida a servidor ni almacenamiento remoto; el borrador solo vive en `localStorage`.

> El diagnóstico es **orientativo**: evalúa forma y estructura, no el fondo científico. La decisión de aprobación corresponde únicamente al docente o tutor.

---

## 🧰 Stack tecnológico

- **Frontend:** React 19 · TypeScript · Vite 6 · Tailwind CSS v4 (plugin oficial) · Motion · lucide-react.
- **Backend:** Express 4 + `tsx` en desarrollo; **un solo proceso Node** sirve estáticos y API en producción (`dist/server.cjs`).
- **IA:** `@google/genai` (Gemini) para texto libre del Tutor IA; detección offline ONNX (transformers.js) en el servicio de originalidad.
- **i18n:** sistema propio liviano **sin dependencias** (`t()`/`tf()`) con **5 idiomas** — sin i18next, sin peso extra en el bundle.
- **Marca:** paleta `#002B49` (azul marino) y `#c9a227` (dorado).

---

## 📁 Estructura del proyecto

```text
Plataforma_Tesis/
├─ src/
│  ├─ components/        # UI: Tutor IA, matriz de consistencia, Scopus, APA 7…
│  ├─ domain/            # Motor de intención del Tutor, analizador de borradores,
│  │                     # extractor .docx, motor de citas APA, generador Scopus
│  ├─ data/              # Contenido metodológico, catálogo de herramientas y videoteca
│  ├─ i18n/              # Traducciones (es/en/pt/fr/it) + contenido de la KB del tutor
│  ├─ context/           # Preferencias (idioma, tema), auth
│  ├─ App.tsx · main.tsx
│  └─ types.ts           # Contratos compartidos
├─ services/
│  └─ originality/       # Verificador de originalidad/IA (servicio aparte, ONNX)
├─ server.ts             # API Express + /api/ask-tutor (Gemini)
├─ index.html            # Favicon SVG de marca + metadatos OG
└─ vite.config.ts
```

---

## 🚀 Requisitos e instalación

**Requisitos:** Node.js ≥ 20 y npm.

```bash
# 1) Clona el repositorio
git clone https://github.com/Vm199524/PORTAL-TESIS-ECUADOR.git
cd PORTAL-TESIS-ECUADOR

# 2) Instala dependencias
npm install

# 3) Configura el entorno (opcional para desarrollo del tutor)
cp .env.example .env

# 4) Desarrollo: servidor Express + Vite con HMR
npm run dev

# 5) Producción
npm run build     # dist/ (estático) + dist/server.cjs
npm start         # un solo proceso sirve la app y la API
```

La app queda en **http://127.0.0.1:3000**.

> **Nota sobre `localhost`.** El servidor escucha en IPv4 (`0.0.0.0`). Algunos navegadores en Windows
> resuelven `localhost` primero a IPv6 (`::1`) y muestran conexión rechazada. Usa `127.0.0.1` o cambia
> de puerto: `PORT=4321 npm run dev`.

### Variables de entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `GEMINI_API_KEY` | No | Habilita el texto libre del Tutor IA vía Gemini. Sin ella usa el motor de conocimiento local. |
| `PORT` | No | Puerto del servidor. Por defecto `3000`. |
| `AUTH_SECRET` | Sí (prod.) | Firma de cookies de sesión. |
| `ADMIN_KEY` | No | Clave del panel de guía de corrección (`/#admin`). |
| `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` | No | Inicio de sesión social (OAuth). |
| `VITE_ADSENSE_CLIENT`, `VITE_ADSENSE_SLOT_HOME` | No | Google AdSense (sin ellas no se carga publicidad). |
| `ORIGINALITY_API_URL` | No | URL del servicio de verificación de originalidad. |

### Scripts

| Script | Acción |
|--------|--------|
| `npm run dev` | Servidor Express + Vite en desarrollo con HMR. |
| `npm run build` | Compila el frontend a `dist/` y empaqueta el servidor en `dist/server.cjs`. |
| `npm start` | Ejecuta el servidor compilado (`node dist/server.cjs`). |
| `npm run lint` | Verificación de tipos con `tsc --noEmit`. |

---

## ☁️ Despliegue

El `build` produce **estáticos + una API Express** para correr como un único contenedor/servicio Node.

**Cloud Run / Fly.io / Railway (servicio Node)**
```dockerfile
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

**Vercel** — framework **Vite**, comando de build `npm run build`; expón la API Express como función serverless.

**Firebase Hosting** — publica `dist/` como sitio estático y `server.ts` como Cloud Function para la API y `/api/ask-tutor`.

El **servicio de originalidad** se despliega aparte (tiene su propio `Dockerfile`/`render.yaml` en `services/originality`).

---

<div align="center">

**Portal Tesis Ecuador** · recursos, tutoría y formación académica para la titulación.

<sub>Proyecto académico · **Victor Manuel LLuilema Pisco** · Universidad Estatal de Milagro (UNEMI)</sub>

</div>
