# Ingreso al portal y monetización

Dos temas distintos que comparten un archivo: cómo se activa el inicio de sesión
con Google/GitHub y cómo se conecta la publicidad. Los dos dependen de variables
de entorno; ninguno necesita tocar código.

---

## 1. Activar el ingreso con Google y GitHub

El código de OAuth ya está escrito y probado (`src/server/authRoutes.ts`). Los
botones aparecen apagados porque el servidor no encuentra credenciales: al
arrancar consulta `/api/auth/providers`, y si un proveedor no tiene `CLIENT_ID`
y `CLIENT_SECRET`, lo declara no disponible.

### Pasos para Google

1. Entra en <https://console.cloud.google.com/apis/credentials>.
2. **Crear credenciales → ID de cliente de OAuth → Aplicación web.**
3. En **Orígenes autorizados de JavaScript** pon la URL del portal
   (`http://localhost:3000` para pruebas; el dominio real en producción).
4. En **URI de redireccionamiento autorizados** pon exactamente:
   `{APP_URL}/api/auth/google/callback`
   — por ejemplo `http://localhost:3000/api/auth/google/callback`.
5. Copia el ID y el secreto al archivo `.env` de la raíz del proyecto.

### Pasos para GitHub

1. <https://github.com/settings/developers> → **OAuth Apps → New OAuth App.**
2. *Authorization callback URL*: `{APP_URL}/api/auth/github/callback`.
3. Copia el ID y el secreto al `.env`.

### Archivo `.env`

Copia `.env.example` a `.env` y complétalo. `.env` está en `.gitignore`: nunca se
sube al repositorio.

```
APP_URL="http://localhost:3000"
AUTH_SECRET="una-cadena-larga-y-aleatoria-propia"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

`AUTH_SECRET` firma la cookie de sesión. En desarrollo hay un valor por defecto,
pero en producción **debe** definirse: sin ella cualquiera que conozca el
proyecto podría falsificar una sesión.

### Qué queda bloqueado sin sesión

Desde este cambio, el visitante ve el panel principal completo (es la carta de
presentación del portal y lo que rastrea Google), pero al pulsar cualquier
módulo, la presentación o el Tutor IA se abre la ventana de ingreso. La acción
que pidió queda guardada: en cuanto entra, el portal lo lleva directo a ese
módulo en vez de dejarlo en el panel.

---

## 2. Monetizar con Google AdSense

### Lo que hay que saber antes de empezar

AdSense no es un interruptor: Google revisa el sitio antes de aprobarlo y esa
revisión tarda de unos días a algunas semanas. Los requisitos que más rechazos
provocan:

- **Dominio propio y estable.** Un `.web.app` de Firebase sirve, pero un dominio
  propio (`.app`, `.ec`, `.org`) transmite más solidez en la revisión.
- **Contenido original y suficiente.** El portal cumple: son herramientas y
  material metodológico propios. Ayuda tener también páginas de texto indexables.
- **Páginas legales visibles.** Política de privacidad (obligatoria: hay que
  declarar que Google y terceros usan cookies para personalizar anuncios),
  términos de uso y una forma de contacto.
- **Consentimiento de cookies.** Si llegan visitas del Espacio Económico Europeo
  o de Reino Unido, Google exige un CMP certificado. Se puede usar el gratuito de
  Google (*Privacy & messaging → Mensajes de la UE* en el panel de AdSense).
- **Tráfico real.** No hay mínimo oficial, pero un sitio sin visitas no se
  aprueba. El umbral de pago es **100 USD**: por debajo, el saldo se acumula.

Y lo que **nunca** hay que hacer, porque cierra la cuenta de forma permanente:
pedir clics, pulsar los propios anuncios, o generar visitas artificiales.

### Cómo conectarlo en este proyecto

1. Crea la cuenta en <https://adsense.google.com> y añade el sitio.
2. Cuando Google apruebe la cuenta, crea un **bloque de anuncios** de tipo
   *Display* → te da un `data-ad-client` (`ca-pub-…`) y un `data-ad-slot`.
3. Ponlos en el `.env`:

```
VITE_ADSENSE_CLIENT="ca-pub-0000000000000000"
VITE_ADSENSE_SLOT_HOME="0000000000"
```

4. Reconstruye (`npm run build`). El componente `src/components/AdSlot.tsx` carga
   el script de AdSense una sola vez y pinta el bloque.

Sin `VITE_ADSENSE_CLIENT` el componente **no renderiza nada** y no se descarga
ningún script de Google. Eso es deliberado: en desarrollo y durante la revisión
no aparecen recuadros vacíos, y quien despliegue el portal sin cuenta de
publicidad lo tiene limpio.

### Dónde están los anuncios y por qué ahí

Hay un solo bloque, en el panel principal, entre la retícula de módulos y la
fila de presentación. Ni dentro de una herramienta ni pegado a un botón: un
anuncio junto a los controles del verificador de originalidad o del revisor de
borrador provoca clics accidentales, y los clics accidentales son exactamente lo
que penaliza Google.

Para añadir más, crea otro bloque en AdSense, añade su id al `.env` y coloca otro
`<AdSlot slot={...} />` entre secciones. Como referencia: dos o tres bloques por
página es lo razonable; saturar baja el valor de cada impresión y aleja a los
estudiantes.

### Expectativa realista de ingresos

Conviene tenerla clara antes de invertir tiempo. El ingreso se calcula así:

```
ingreso ≈ (visitas de página / 1000) × RPM
```

El RPM (ingreso por mil impresiones) para tráfico educativo de Latinoamérica
suele moverse entre **0,20 y 1,50 USD**. Con 10 000 páginas vistas al mes, eso
son del orden de 2 a 15 USD mensuales. Es decir: AdSense por sí solo no sostiene
un proyecto salvo con volúmenes altos.

### Otras vías, ordenadas por esfuerzo

Ninguna obliga a cobrar por el portal, que seguiría siendo gratuito:

1. **Donaciones voluntarias** (Ko-fi, PayPal, Patreon). Cero requisitos, se puede
   activar hoy mismo, y en proyectos académicos suele rendir más que la
   publicidad en las primeras etapas.
2. **Marketing de afiliación**: enlaces a libros de metodología, cursos o
   herramientas ya recomendadas en el módulo Software & Toolbox. Amazon Afiliados
   o programas de plataformas de cursos. Encaja de forma natural y no molesta.
3. **Servicios propios**: asesoría metodológica, revisión de borradores, talleres.
   El portal se convierte en la carta de presentación y el ingreso viene del
   trabajo profesional, no del tráfico.
4. **Licencia institucional**: universidades o facultades que quieran el portal
   con su marca y su repositorio. Es la vía de mayor valor por unidad y la que
   aprovecha que el sistema ya está preparado para cualquier universidad del
   Ecuador.

Una combinación habitual y sensata: publicidad discreta + donaciones + servicios
propios, dejando la licencia institucional para cuando haya varias universidades
usándolo.
