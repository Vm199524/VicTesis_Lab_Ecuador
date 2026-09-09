/**
 * Domain Model: CloudDomainRecommender
 * Provides architectural and domain options within the Google Ecosystem
 * based on the user's specification "vmtesis.web" and Google Cloud hosting.
 */

export interface GoogleDomainOption {
  id: string;
  name: string;
  fullDomain: string;
  ecosystem: 'Google Firebase Hosting' | 'Google Registry (TLD)' | 'Google Cloud Run' | 'Dominio Institucional Universitario';
  type: 'Gratuito / Incluido' | 'TLD Oficial Google' | 'Institucional';
  description: string;
  benefits: string[];
  isRecommended: boolean;
}

export class CloudDomainRecommender {
  private readonly baseSlug: string;

  constructor(baseSlug: string = 'vmtesis') {
    this.baseSlug = baseSlug;
  }

  public getOptions(): GoogleDomainOption[] {
    return [
      {
        id: 'firebase-web',
        name: `${this.baseSlug}.web.app`,
        fullDomain: `https://${this.baseSlug}.web.app`,
        ecosystem: 'Google Firebase Hosting',
        type: 'Gratuito / Incluido',
        description: 'La opción predilecta del ecosistema Google Cloud. Coincide exactamente con tu requerimiento ("vmtesis.web") mediante el dominio oficial de Firebase Hosting.',
        benefits: [
          'Alojamiento global con Google Cloud CDN en milisegundos',
          'Certificado SSL/HTTPS automático y gratuito de por vida',
          'Compatible directamente con este proyecto Vite + React',
          'Sin costo mensual para tráfico estudiantil universitario',
        ],
        isRecommended: true,
      },
      {
        id: 'google-app-tld',
        name: `${this.baseSlug}.app`,
        fullDomain: `https://${this.baseSlug}.app`,
        ecosystem: 'Google Registry (TLD)',
        type: 'TLD Oficial Google',
        description: 'El dominio de primer nivel (.app) desarrollado y administrado por Google Registry para aplicaciones web seguras.',
        benefits: [
          'Operado directamente por Google Registry',
          'Seguridad HSTS incorporada: fuerza HTTPS en todos los navegadores',
          'Nombre corto, profesional y memorable para tesistas y docentes',
          'Disponible para registro en Google Cloud Domains / Squarespace',
        ],
        isRecommended: true,
      },
      {
        id: 'firebase-com',
        name: `${this.baseSlug}.firebaseapp.com`,
        fullDomain: `https://${this.baseSlug}.firebaseapp.com`,
        ecosystem: 'Google Firebase Hosting',
        type: 'Gratuito / Incluido',
        description: 'Subdominio espejo proporcionado automáticamente por Google Firebase en cada proyecto.',
        benefits: [
          'Respaldo automático e interoperabilidad nativa',
          'Integración directa con Google Identity y bases de datos',
          'Cero mantenimiento de servidores',
        ],
        isRecommended: false,
      },
      {
        id: 'cloud-run',
        name: `${this.baseSlug}.run.app`,
        fullDomain: `https://${this.baseSlug}-*.run.app`,
        ecosystem: 'Google Cloud Run',
        type: 'Gratuito / Incluido',
        description: 'Dominio por defecto de Google Cloud Run donde se ejecuta actualmente la aplicación contenerizada.',
        benefits: [
          'Contenedores serverless de Google Cloud en alta disponibilidad',
          'Escalado a cero para optimización máxima de recursos',
          'Soporte para backend Node/Express y SSR',
        ],
        isRecommended: false,
      },
      {
        id: 'institucional-edu',
        name: 'tesis.tuuniversidad.edu.ec',
        fullDomain: 'https://tesis.tuuniversidad.edu.ec',
        ecosystem: 'Dominio Institucional Universitario',
        type: 'Institucional',
        description: 'Configuración de CNAME institucional apuntando a los servidores de Google Cloud para respaldo oficial de la universidad. El nombre mostrado es una plantilla: sustitúyelo por el subdominio que te asigne tu propia institución.',
        benefits: [
          'Máxima legitimidad académica para la comunidad de graduación',
          'Alineado a las líneas de investigación de tu universidad',
          'Reconocimiento en procesos de titulación y sustentación',
        ],
        isRecommended: false,
      },
    ];
  }

  public getDeploymentSteps(): string[] {
    return [
      '1. Instalar Firebase CLI en la terminal: `npm install -g firebase-tools`',
      '2. Iniciar sesión con tu cuenta de Google: `firebase login`',
      `3. Inicializar el hosting vinculado a tu proyecto Google Cloud: \`firebase init hosting\` (elegir proyecto \`${this.baseSlug}\`)`,
      '4. Configurar la carpeta pública de compilación como `dist`',
      `5. Desplegar a nivel global: \`npm run build && firebase deploy\``,
      `6. ¡Listo! Tu sitio estará activo al instante en https://${this.baseSlug}.web.app con SSL emitido por Google.`,
    ];
  }
}
