/**
 * Diccionario del portal (i18n).
 *
 * Dos capas que comparten el mismo mecanismo:
 *
 *   1. INTERFAZ — botones, menús, títulos, mensajes del sistema. Vive aquí abajo
 *      y se consulta con `t('clave')`. Si falta una clave se ve la clave misma:
 *      es un error visible a propósito, para que no pase inadvertido.
 *
 *   2. CONTENIDO — el material académico que llena los módulos (herramientas,
 *      videoteca, capítulos, presentación). Vive en `./content/*` y se consulta
 *      con `tf('clave', textoEnEspañol)`: si la traducción todavía no existe se
 *      muestra el español original en lugar de romper la página. Así el catálogo
 *      se puede traducir por partes sin dejar huecos en la interfaz.
 */

import { CONTENT_TRANSLATIONS } from './content';

export type Locale = 'es' | 'en' | 'pt' | 'fr' | 'it';

export const DEFAULT_LOCALE: Locale = 'es';

export const LOCALES: { id: Locale; label: string; flag: string }[] = [
  { id: 'es', label: 'Español', flag: '🇪🇨' },
  { id: 'en', label: 'English', flag: '🇺🇸' },
  { id: 'pt', label: 'Português', flag: '🇧🇷' },
  { id: 'fr', label: 'Français', flag: '🇫🇷' },
  { id: 'it', label: 'Italiano', flag: '🇮🇹' },
];

type Dict = Record<Locale, string>;

const UI_TRANSLATIONS: Record<string, Dict> = {
  // ---------- Navbar ----------
  'nav.home': { es: 'Inicio', en: 'Home', pt: 'Início', fr: 'Accueil', it: 'Home' },
  'nav.modules': { es: 'Módulos', en: 'Modules', pt: 'Módulos', fr: 'Modules', it: 'Moduli' },
  'nav.presentation': { es: 'Presentación', en: 'Presentation', pt: 'Apresentação', fr: 'Présentation', it: 'Presentazione' },
  'nav.about': { es: 'Acerca del portal', en: 'About', pt: 'Sobre o portal', fr: 'À propos', it: 'Informazioni' },
  'nav.writeMe': { es: 'Escríbeme', en: 'Message me', pt: 'Fale comigo', fr: 'Écris-moi', it: 'Scrivimi' },
  'nav.language': { es: 'Idioma', en: 'Language', pt: 'Idioma', fr: 'Langue', it: 'Lingua' },

  // ---------- Sesión ----------
  'auth.signIn': { es: 'Iniciar sesión', en: 'Sign in', pt: 'Entrar', fr: 'Se connecter', it: 'Accedi' },
  'auth.signOut': { es: 'Cerrar sesión', en: 'Sign out', pt: 'Sair', fr: 'Se déconnecter', it: 'Esci' },
  'auth.signInTitle': { es: 'Inicia sesión', en: 'Sign in', pt: 'Entrar', fr: 'Connexion', it: 'Accedi' },
  'auth.signUpTitle': { es: 'Crea tu cuenta', en: 'Create your account', pt: 'Crie sua conta', fr: 'Créez votre compte', it: 'Crea il tuo account' },
  'auth.subtitle': { es: 'Guarda tu progreso y recupera tus borradores desde cualquier dispositivo.', en: 'Save your progress and pick up your drafts from any device.', pt: 'Salve seu progresso e retome seus rascunhos de qualquer dispositivo.', fr: 'Enregistrez votre progression et retrouvez vos brouillons sur tous vos appareils.', it: 'Salva i tuoi progressi e riprendi le bozze da qualsiasi dispositivo.' },
  'auth.continueGoogle': { es: 'Continuar con Google', en: 'Continue with Google', pt: 'Continuar com Google', fr: 'Continuer avec Google', it: 'Continua con Google' },
  'auth.continueGithub': { es: 'Continuar con GitHub', en: 'Continue with GitHub', pt: 'Continuar com GitHub', fr: 'Continuer avec GitHub', it: 'Continua con GitHub' },
  'auth.or': { es: 'o', en: 'or', pt: 'ou', fr: 'ou', it: 'oppure' },
  'auth.name': { es: 'Nombre completo', en: 'Full name', pt: 'Nome completo', fr: 'Nom complet', it: 'Nome completo' },
  'auth.email': { es: 'Correo electrónico', en: 'Email address', pt: 'E-mail', fr: 'Adresse e-mail', it: 'Indirizzo email' },
  'auth.password': { es: 'Contraseña', en: 'Password', pt: 'Senha', fr: 'Mot de passe', it: 'Password' },
  'auth.passwordHint': { es: 'Mínimo 8 caracteres.', en: 'At least 8 characters.', pt: 'Mínimo de 8 caracteres.', fr: 'Au moins 8 caractères.', it: 'Almeno 8 caratteri.' },
  'auth.createAccount': { es: 'Crear cuenta', en: 'Create account', pt: 'Criar conta', fr: 'Créer un compte', it: 'Crea account' },
  'auth.noAccount': { es: '¿Aún no tienes cuenta?', en: "Don't have an account?", pt: 'Ainda não tem conta?', fr: 'Pas encore de compte ?', it: 'Non hai ancora un account?' },
  'auth.hasAccount': { es: '¿Ya tienes cuenta?', en: 'Already have an account?', pt: 'Já tem uma conta?', fr: 'Vous avez déjà un compte ?', it: 'Hai già un account?' },
  'auth.googleUnavailable': { es: 'El acceso con Google todavía no está configurado en este servidor.', en: 'Google sign-in is not configured on this server yet.', pt: 'O acesso com Google ainda não está configurado neste servidor.', fr: "La connexion Google n'est pas encore configurée sur ce serveur.", it: "L'accesso con Google non è ancora configurato su questo server." },
  'auth.githubUnavailable': { es: 'El acceso con GitHub todavía no está configurado en este servidor.', en: 'GitHub sign-in is not configured on this server yet.', pt: 'O acesso com GitHub ainda não está configurado neste servidor.', fr: "La connexion GitHub n'est pas encore configurée sur ce serveur.", it: "L'accesso con GitHub non è ancora configurato su questo server." },
  'auth.gateNotice': { es: 'Las herramientas del portal necesitan una sesión iniciada. Entra con Google, con GitHub o con tu correo y te llevamos directo al módulo que abriste.', en: 'The portal tools require an active session. Sign in with Google, GitHub or your email and we will take you straight to the module you opened.', pt: 'As ferramentas do portal exigem uma sessão iniciada. Entre com Google, GitHub ou seu e-mail e levamos você direto ao módulo que abriu.', fr: "Les outils du portail nécessitent une session active. Connectez-vous avec Google, GitHub ou votre e-mail et nous vous emmenons directement au module ouvert.", it: "Gli strumenti del portale richiedono una sessione attiva. Accedi con Google, GitHub o la tua email e ti portiamo direttamente al modulo che hai aperto." },

  // ---------- Publicidad ----------
  'ads.label': { es: 'Publicidad', en: 'Advertisement', pt: 'Publicidade', fr: 'Publicité', it: 'Pubblicità' },

  // ---------- Marca ----------
  // El nombre del portal se traduce igual que el resto de la interfaz: es
  // un título descriptivo de un portal académico, no una marca comercial
  // registrada, así que cambia de idioma junto con todo lo demás.
  'brand.name': { es: 'VicTesis Lab', en: 'VicTesis Lab', pt: 'VicTesis Lab', fr: 'VicTesis Lab', it: 'VicTesis Lab' },

  // ---------- Pie de página ----------
  'footer.tagline': { es: 'Portal Universitario', en: 'University Portal', pt: 'Portal Universitário', fr: 'Portail Universitaire', it: 'Portale Universitario' },

  // ---------- Panel principal ----------
  'home.greeting': { es: 'Tu proyecto de titulación, paso a paso', en: 'Your graduation project, step by step', pt: 'Seu projeto de titulação, passo a passo', fr: 'Votre projet de fin d\'études, étape par étape', it: 'Il tuo progetto di laurea, passo dopo passo' },
  'home.greetingNamed': { es: 'Hola, {name}', en: 'Hi, {name}', pt: 'Olá, {name}', fr: 'Bonjour, {name}', it: 'Ciao, {name}' },
  'home.subtitle': { es: 'Nueve módulos que cubren el proceso completo: desde evaluar si tu tema es viable hasta verificar la originalidad del borrador antes de entregarlo.', en: 'Nine modules covering the whole process: from checking whether your topic is viable to verifying your draft\'s originality before you hand it in.', pt: 'Nove módulos que cobrem todo o processo: de avaliar se o seu tema é viável até verificar a originalidade do rascunho antes da entrega.', fr: 'Neuf modules qui couvrent tout le processus : de la faisabilité du sujet à la vérification de l\'originalité du brouillon avant remise.', it: 'Nove moduli che coprono tutto il processo: dalla verifica della fattibilità del tema al controllo di originalità della bozza prima della consegna.' },
  'home.startHere': { es: 'Empezar por el paso 1', en: 'Start with step 1', pt: 'Começar pelo passo 1', fr: 'Commencer par l\'étape 1', it: 'Inizia dal passo 1' },
  'home.reviewDraft': { es: 'Revisar mi borrador', en: 'Review my draft', pt: 'Revisar meu rascunho', fr: 'Réviser mon brouillon', it: 'Rivedi la mia bozza' },
  'home.modulesTitle': { es: 'Todo el sistema', en: 'The whole system', pt: 'Todo o sistema', fr: 'Tout le système', it: 'Tutto il sistema' },
  'home.modulesSubtitle': { es: 'Entra directo al módulo que necesitas ahora.', en: 'Jump straight into the module you need right now.', pt: 'Vá direto ao módulo de que precisa agora.', fr: 'Accédez directement au module dont vous avez besoin.', it: 'Vai direttamente al modulo che ti serve ora.' },
  'home.open': { es: 'Abrir', en: 'Open', pt: 'Abrir', fr: 'Ouvrir', it: 'Apri' },
  'home.tutorTitle': { es: 'Tutor IA', en: 'AI Tutor', pt: 'Tutor de IA', fr: 'Tuteur IA', it: 'Tutor IA' },
  'home.tutorBody': { es: 'Resuelve dudas de metodología, APA 7 y estructura en cualquier momento.', en: 'Get answers on methodology, APA 7 and structure at any time.', pt: 'Tire dúvidas de metodologia, APA 7 e estrutura a qualquer momento.', fr: 'Posez vos questions de méthodologie, APA 7 et structure à tout moment.', it: 'Chiarisci dubbi su metodologia, APA 7 e struttura in qualsiasi momento.' },
  'home.tutorCta': { es: 'Preguntar ahora', en: 'Ask now', pt: 'Perguntar agora', fr: 'Poser une question', it: 'Chiedi ora' },
  'home.presentationTitle': { es: 'Presentación metodológica', en: 'Methodology presentation', pt: 'Apresentação metodológica', fr: 'Présentation méthodologique', it: 'Presentazione metodologica' },
  'home.presentationBody': { es: 'Recorre el proceso completo en diapositivas, de principio a fin.', en: 'Walk through the entire process as slides, start to finish.', pt: 'Percorra todo o processo em slides, do início ao fim.', fr: 'Parcourez tout le processus en diapositives, du début à la fin.', it: 'Percorri tutto il processo in diapositive, dall\'inizio alla fine.' },
  'home.presentationCta': { es: 'Ver presentación', en: 'View presentation', pt: 'Ver apresentação', fr: 'Voir la présentation', it: 'Vedi presentazione' },
  'home.helpTitle': { es: '¿Te ayudo con algo puntual?', en: 'Need help with something specific?', pt: 'Precisa de ajuda com algo específico?', fr: 'Besoin d\'aide sur un point précis ?', it: 'Ti serve aiuto su qualcosa di specifico?' },
  'home.helpBody': { es: 'Soy un compañero más en el camino de la titulación. Si te trabas en un punto, escríbeme y lo vemos.', en: 'I\'m a fellow student walking the same thesis path. If you get stuck, message me and we\'ll work through it.', pt: 'Sou mais um colega no caminho da titulação. Se travar em algum ponto, me chame e vemos juntos.', fr: 'Je suis un camarade qui suit le même parcours de fin d\'études. Si vous bloquez, écrivez-moi.', it: 'Sono un compagno che percorre la tua stessa strada verso la laurea. Se ti blocchi, scrivimi e lo vediamo insieme.' },

  // ---------- Acerca del portal ----------
  'about.title': { es: 'Acerca del portal', en: 'About this portal', pt: 'Sobre o portal', fr: 'À propos du portail', it: 'Informazioni sul portale' },
  'about.whatTitle': { es: 'Qué es', en: 'What it is', pt: 'O que é', fr: 'Ce que c\'est', it: 'Che cos\'è' },
  'about.whatBody': { es: 'Una plataforma independiente que acompaña a los estudiantes universitarios de todo el Ecuador en la formulación de su proyecto de titulación: evaluar la viabilidad del tema, ordenar los capítulos, construir ecuaciones de búsqueda, citar en APA 7 y revisar el borrador antes de entregarlo.', en: 'An independent platform that guides university students across Ecuador through their graduation project: assessing whether the topic is viable, organizing chapters, building search queries, citing in APA 7 and reviewing the draft before submission.', pt: 'Uma plataforma independente que acompanha os estudantes universitários de todo o Equador na formulação do projeto de titulação: avaliar a viabilidade do tema, organizar os capítulos, construir equações de busca, citar em APA 7 e revisar o rascunho antes da entrega.', fr: 'Une plateforme indépendante qui accompagne les étudiants universitaires de tout l\'Équateur dans leur projet de fin d\'études : évaluer la faisabilité du sujet, organiser les chapitres, construire des équations de recherche, citer en APA 7 et réviser le brouillon avant la remise.', it: 'Una piattaforma indipendente che accompagna gli studenti universitari di tutto l\'Ecuador nel progetto di laurea: valutare la fattibilità del tema, organizzare i capitoli, costruire equazioni di ricerca, citare in APA 7 e rivedere la bozza prima della consegna.' },
  'about.privacyTitle': { es: 'Privacidad', en: 'Privacy', pt: 'Privacidade', fr: 'Confidentialité', it: 'Privacy' },
  'about.privacyBody': { es: 'El Revisor de Borrador procesa tu documento íntegramente dentro de tu navegador: el texto nunca se envía a ningún servidor ni se almacena de forma remota.', en: 'The Draft Reviewer processes your document entirely inside your browser: the text is never sent to any server or stored remotely.', pt: 'O Revisor de Rascunho processa seu documento inteiramente no navegador: o texto nunca é enviado a nenhum servidor nem armazenado remotamente.', fr: 'Le Réviseur de Brouillon traite votre document entièrement dans votre navigateur : le texte n\'est jamais envoyé à un serveur ni stocké à distance.', it: 'Il Revisore di Bozze elabora il documento interamente nel tuo browser: il testo non viene mai inviato a un server né archiviato da remoto.' },
  'about.limitsTitle': { es: 'Alcance y límites', en: 'Scope and limits', pt: 'Alcance e limites', fr: 'Portée et limites', it: 'Ambito e limiti' },
  'about.limitsBody': { es: 'Los diagnósticos revisan forma y estructura, no el fondo científico de tu trabajo. Un puntaje alto no implica aprobación: la decisión sobre tu proyecto corresponde únicamente a tu docente o tutor.', en: 'The diagnostics check form and structure, not the scientific substance of your work. A high score does not mean approval: the decision on your project belongs solely to your professor or advisor.', pt: 'Os diagnósticos revisam forma e estrutura, não o mérito científico do seu trabalho. Uma pontuação alta não significa aprovação: a decisão sobre seu projeto cabe apenas ao seu docente ou tutor.', fr: 'Les diagnostics vérifient la forme et la structure, pas le fond scientifique. Un score élevé ne signifie pas approbation : la décision revient uniquement à votre enseignant ou tuteur.', it: 'Le diagnosi verificano forma e struttura, non il merito scientifico. Un punteggio alto non significa approvazione: la decisione spetta solo al tuo docente o relatore.' },
  'about.authorTitle': { es: 'Quién lo hizo', en: 'Who built it', pt: 'Quem fez', fr: 'Qui l\'a créé', it: 'Chi lo ha realizzato' },
  'about.authorBody': { es: 'Victor Manuel LL. — Desarrollador de Software | Python & IA Aplicada | Ing. en Tecnologías de la Información (dic. 2026). Tesis Ecuador es un portal desarrollado de forma independiente, sin vínculo institucional oficial con ninguna universidad.', en: 'Victor Manuel LL. — Software Developer | Python & Applied AI | Information Technology Engineering (Dec. 2026). Tesis Ecuador is built independently, with no official institutional affiliation with any university.', pt: 'Victor Manuel LL. — Desenvolvedor de Software | Python & IA Aplicada | Eng. de Tecnologias da Informação (dez. 2026). Tesis Ecuador é um portal desenvolvido de forma independente, sem vínculo institucional oficial com nenhuma universidade.', fr: 'Victor Manuel LL. — Développeur logiciel | Python & IA appliquée | Ing. en Technologies de l\'Information (déc. 2026). Tesis Ecuador est un portail développé de façon indépendante, sans lien institutionnel officiel avec aucune université.', it: 'Victor Manuel LL. — Sviluppatore software | Python & IA applicata | Ing. in Tecnologie dell\'Informazione (dic. 2026). Tesis Ecuador è un portale sviluppato in modo indipendente, senza legame istituzionale ufficiale con alcuna università.' },

  // ---------- Riel de módulos ----------
  'rail.title': { es: 'Módulos', en: 'Modules', pt: 'Módulos', fr: 'Modules', it: 'Moduli' },
  'rail.collapse': { es: 'Contraer menú', en: 'Collapse menu', pt: 'Recolher menu', fr: 'Réduire le menu', it: 'Comprimi menu' },
  'rail.expand': { es: 'Expandir menú', en: 'Expand menu', pt: 'Expandir menu', fr: 'Développer le menu', it: 'Espandi menu' },

  // ---------- Cabecera de módulo ----------
  'header.module': { es: 'MÓDULO', en: 'MODULE', pt: 'MÓDULO', fr: 'MODULE', it: 'MODULO' },
  'header.previous': { es: 'Anterior', en: 'Previous', pt: 'Anterior', fr: 'Précédent', it: 'Precedente' },
  'header.next': { es: 'Siguiente', en: 'Next', pt: 'Próximo', fr: 'Suivant', it: 'Successivo' },
  'header.firstModule': { es: 'Primer módulo', en: 'First module', pt: 'Primeiro módulo', fr: 'Premier module', it: 'Primo modulo' },
  'header.lastModule': { es: 'Último módulo', en: 'Last module', pt: 'Último módulo', fr: 'Dernier module', it: 'Ultimo modulo' },
  'header.end': { es: 'Fin', en: 'End', pt: 'Fim', fr: 'Fin', it: 'Fine' },
  'slides.counter': { es: 'Diapositiva {current} de {total}', en: 'Slide {current} of {total}', pt: 'Slide {current} de {total}', fr: 'Diapositive {current} sur {total}', it: 'Diapositiva {current} di {total}' },
  'slides.expand': { es: 'Expandir', en: 'Expand', pt: 'Expandir', fr: 'Agrandir', it: 'Espandi' },
  'slides.exit': { es: 'Salir', en: 'Exit', pt: 'Sair', fr: 'Quitter', it: 'Esci' },

  // ---------- Paginación ----------
  'pagination.initialPhase': { es: 'Fase inicial', en: 'Starting phase', pt: 'Fase inicial', fr: 'Phase initiale', it: 'Fase iniziale' },
  'pagination.moduleOf': { es: 'Módulo {current} de {total}', en: 'Module {current} of {total}', pt: 'Módulo {current} de {total}', fr: 'Module {current} sur {total}', it: 'Modulo {current} di {total}' },
  'pagination.stuck': { es: '¿Te trabas en este paso?', en: 'Stuck on this step?', pt: 'Travou nesta etapa?', fr: 'Bloqué à cette étape ?', it: 'Bloccato in questo passaggio?' },
  'pagination.writeMeGuide': { es: 'Escríbeme y te guío', en: 'Message me for guidance', pt: 'Me chame e eu te guio', fr: 'Écris-moi, je te guide', it: 'Scrivimi, ti guido' },
  'pagination.backToStart': { es: 'Volver al módulo 01', en: 'Back to module 01', pt: 'Voltar ao módulo 01', fr: 'Retour au module 01', it: 'Torna al modulo 01' },

  // ---------- Hero / portal ----------
  'hero.slidesHint': { es: 'Presentación Metodológica para Estudiantes Universitarios del Ecuador 🎓', en: 'Methodology Walkthrough for University Students in Ecuador 🎓', pt: 'Apresentação Metodológica para Estudantes Universitários do Equador 🎓', fr: 'Présentation Méthodologique pour les Étudiants Universitaires de l\'Équateur 🎓', it: 'Presentazione Metodologica per Studenti Universitari dell\'Ecuador 🎓' },
  'hero.slidesSubtitle': { es: 'Navega mediante las flechas (← / →) o accede directamente a los mini ecosistemas interactivos de trabajo.', en: 'Navigate with the arrow keys (← / →) or jump straight into the interactive mini ecosystems.', pt: 'Navegue com as setas (← / →) ou acesse diretamente os mini ecossistemas interativos.', fr: 'Naviguez avec les flèches (← / →) ou accédez directement aux mini écosystèmes interactifs.', it: 'Naviga con le frecce (← / →) o accedi direttamente ai mini ecosistemi interattivi.' },
  'hero.seeEcosystems': { es: 'Ver Mini Ecosistemas de Trabajo', en: 'See the Work Mini Ecosystems', pt: 'Ver Mini Ecossistemas de Trabalho', fr: 'Voir les Mini Écosystèmes de Travail', it: 'Vedi i Mini Ecosistemi di Lavoro' },
  'hero.badge': { es: 'Metodología de Investigación para Estudiantes Universitarios del Ecuador', en: 'Research Methodology for University Students in Ecuador', pt: 'Metodologia de Pesquisa para Estudantes Universitários do Equador', fr: 'Méthodologie de Recherche pour les Étudiants Universitaires de l\'Équateur', it: 'Metodologia di Ricerca per Studenti Universitari dell\'Ecuador' },
  'hero.titlePrefix': { es: 'Portal Metodológico de', en: 'Methodology Portal for', pt: 'Portal Metodológico de', fr: 'Portail Méthodologique de', it: 'Portale Metodologico di' },
  'hero.titleSuffix': { es: 'Titulación Universitaria', en: 'University Graduation', pt: 'Titulação Universitária', fr: 'Fin d\'Études Universitaires', it: 'Laurea Universitaria' },
  'hero.description': { es: 'Plataforma interactiva independiente para guiar a los estudiantes y graduandos de las universidades del Ecuador. Al seleccionar cualquier herramienta se abrirá su respectivo mini ecosistema de trabajo para maximizar tu enfoque.', en: 'An independent interactive platform to guide students and graduating candidates from universities across Ecuador. Selecting any tool opens its own mini work ecosystem to keep you focused.', pt: 'Plataforma interativa independente para orientar estudantes e formandos das universidades do Equador. Ao selecionar qualquer ferramenta, abre-se o respectivo mini ecossistema de trabalho.', fr: 'Plateforme interactive indépendante pour guider les étudiants et diplômés des universités de l\'Équateur. Chaque outil ouvre son propre mini écosystème de travail.', it: 'Piattaforma interattiva indipendente per guidare studenti e laureandi delle università dell\'Ecuador. Selezionando uno strumento si apre il relativo mini ecosistema di lavoro.' },
  'hero.shortcutDraft': { es: 'Revisar mi borrador', en: 'Review my draft', pt: 'Revisar meu rascunho', fr: 'Réviser mon brouillon', it: 'Rivedi la mia bozza' },
  'hero.shortcutFeasibility': { es: 'Evaluar mi tema', en: 'Evaluate my topic', pt: 'Avaliar meu tema', fr: 'Évaluer mon sujet', it: 'Valuta il mio argomento' },
  'hero.shortcutVideos': { es: 'Videoteca', en: 'Video Library', pt: 'Videoteca', fr: 'Vidéothèque', it: 'Videoteca' },
  'hero.railHint': { es: 'Los nueve módulos quedan fijos en el menú lateral mientras avanzas.', en: 'All nine modules stay pinned to the side menu as you work.', pt: 'Os nove módulos ficam fixos no menu lateral enquanto você avança.', fr: 'Les neuf modules restent épinglés dans le menu latéral pendant que vous avancez.', it: 'Tutti e nove i moduli restano fissi nel menu laterale mentre procedi.' },
  'hero.logoTag': { es: 'TESIS ECUADOR · PORTAL UNIVERSITARIO', en: 'TESIS ECUADOR · UNIVERSITY PORTAL', pt: 'TESIS ECUADOR · PORTAL UNIVERSITÁRIO', fr: 'TESIS ECUADOR · PORTAIL UNIVERSITAIRE', it: 'TESIS ECUADOR · PORTALE UNIVERSITARIO' },
  'hero.logoSub': { es: 'Recursos, tutoría y formación académica', en: 'Resources, tutoring and academic training', pt: 'Recursos, tutoria e formação acadêmica', fr: 'Ressources, tutorat et formation académique', it: 'Risorse, tutoraggio e formazione accademica' },

  // ---------- Banda de apoyo entre compañeros ----------
  'support.badge': { es: 'Entre estudiantes del Ecuador', en: 'Among students across Ecuador', pt: 'Entre estudantes do Equador', fr: 'Entre étudiants de l\'Équateur', it: 'Tra studenti dell\'Ecuador' },
  'support.title': { es: '¿Te ayudo con algo de tu proyecto de titulación?', en: 'Can I help with your graduation project?', pt: 'Posso ajudar com seu projeto de titulação?', fr: 'Puis-je vous aider avec votre projet de fin d\'études ?', it: 'Posso aiutarti con il tuo progetto di laurea?' },
  'support.body': { es: 'Si quieres que te ayude con un tema en específico o que te sea de ayuda en el desarrollo de tu proyecto, escríbeme y conversamos.', en: 'If you\'d like help with a specific topic or with the development of your project, message me and let\'s talk.', pt: 'Se quiser ajuda com um tema específico ou no desenvolvimento do seu projeto, me chame e conversamos.', fr: 'Si vous voulez de l\'aide sur un sujet précis ou sur le développement de votre projet, écrivez-moi.', it: 'Se vuoi aiuto su un argomento specifico o sullo sviluppo del tuo progetto, scrivimi.' },
  'support.button': { es: 'Escríbeme', en: 'Message me', pt: 'Fale comigo', fr: 'Écris-moi', it: 'Scrivimi' },

  // ---------- Footer ----------
  'footer.title': { es: 'VicTesis Lab · Portal Universitario', en: 'VicTesis Lab · University Portal', pt: 'VicTesis Lab · Portal Universitário', fr: 'VicTesis Lab · Portail Universitaire', it: 'VicTesis Lab · Portale Universitario' },
  'footer.description': { es: 'Plataforma metodológica independiente para acompañar a los estudiantes universitarios de todo el Ecuador en la formulación de sus proyectos de grado.', en: 'An independent methodology platform supporting university students across Ecuador as they shape their graduation projects.', pt: 'Plataforma metodológica independente para acompanhar os estudantes universitários de todo o Equador na formulação de seus projetos de graduação.', fr: 'Plateforme méthodologique indépendante pour accompagner les étudiants universitaires de tout l\'Équateur dans la formulation de leurs projets de fin d\'études.', it: 'Piattaforma metodologica indipendente per accompagnare gli studenti universitari di tutto l\'Ecuador nella formulazione dei loro progetti di laurea.' },
  'footer.tags': { es: 'Estructuración de Avances • Ecuaciones Scopus • Normas APA 7ª Edición • Zotero • Suite de Herramientas', en: 'Draft Structuring • Scopus Search Strings • APA 7th Edition • Zotero • Toolset', pt: 'Estruturação de Avanços • Equações Scopus • Normas APA 7ª Edição • Zotero • Suíte de Ferramentas', fr: 'Structuration des Avancées • Équations Scopus • Normes APA 7e Édition • Zotero • Suite d\'Outils', it: 'Strutturazione degli Avanzamenti • Equazioni Scopus • Norme APA 7ª Edizione • Zotero • Suite di Strumenti' },

  // ---------- Common actions ----------
  'action.close': { es: 'Cerrar', en: 'Close', pt: 'Fechar', fr: 'Fermer', it: 'Chiudi' },
  'action.copy': { es: 'Copiar', en: 'Copy', pt: 'Copiar', fr: 'Copier', it: 'Copia' },
  'action.copied': { es: 'Copiado', en: 'Copied', pt: 'Copiado', fr: 'Copié', it: 'Copiato' },
  'action.clear': { es: 'Limpiar', en: 'Clear', pt: 'Limpar', fr: 'Effacer', it: 'Pulisci' },
  'action.send': { es: 'Enviar', en: 'Send', pt: 'Enviar', fr: 'Envoyer', it: 'Invia' },

  // ---------- Modal de contacto entre compañeros ----------
  'peer.header': { es: '¿Te ayudo con algo?', en: 'Need a hand with something?', pt: 'Posso ajudar com algo?', fr: 'Besoin d\'aide ?', it: 'Ti serve una mano?' },
  'peer.question': { es: '¿Deseas que te ayude con un tema en específico o que te sea de ayuda en el desarrollo de tu proyecto de titulación?', en: 'Would you like help with a specific topic, or with the development of your graduation project?', pt: 'Quer ajuda com um tema específico ou no desenvolvimento do seu projeto de titulação?', fr: 'Souhaitez-vous de l\'aide sur un sujet précis, ou sur le développement de votre projet de fin d\'études ?', it: 'Vuoi aiuto su un argomento specifico o sullo sviluppo del tuo progetto di laurea?' },
  'peer.footerNote': { es: 'Las indicaciones de tu docente o tutor siempre tienen la última palabra sobre tu trabajo.', en: 'Your professor\'s or advisor\'s guidance always has the final word on your work.', pt: 'As orientações do seu docente ou tutor sempre têm a última palavra sobre seu trabalho.', fr: 'Les indications de votre enseignant ou tuteur ont toujours le dernier mot sur votre travail.', it: 'Le indicazioni del tuo docente o tutor hanno sempre l\'ultima parola sul tuo lavoro.' },
  'peer.back': { es: 'Volver', en: 'Back', pt: 'Voltar', fr: 'Retour', it: 'Indietro' },
  'peer.openWhatsapp': { es: 'Abrir WhatsApp', en: 'Open WhatsApp', pt: 'Abrir WhatsApp', fr: 'Ouvrir WhatsApp', it: 'Apri WhatsApp' },
  'peer.messagePreviewLabel': { es: 'Mensaje que se enviará', en: 'Message that will be sent', pt: 'Mensagem que será enviada', fr: 'Message qui sera envoyé', it: 'Messaggio che verrà inviato' },
  'peer.option.tema.title': { es: 'Un tema en específico', en: 'A specific topic', pt: 'Um tema específico', fr: 'Un sujet précis', it: 'Un argomento specifico' },
  'peer.option.tema.desc': { es: 'Hay un punto concreto que quiero entender mejor.', en: 'There\'s a specific point I want to understand better.', pt: 'Há um ponto específico que quero entender melhor.', fr: 'Il y a un point précis que je veux mieux comprendre.', it: 'C\'è un punto specifico che voglio capire meglio.' },
  'peer.option.tema.message': { es: '¡Hola! Vi el portal Tesis Ecuador y quisiera que me ayudes con un tema en específico.', en: 'Hi! I saw the Tesis Ecuador portal and I\'d like help with a specific topic.', pt: 'Olá! Vi o portal Tesis Ecuador e gostaria de ajuda com um tema específico.', fr: 'Bonjour ! J\'ai vu le portail Tesis Ecuador et j\'aimerais de l\'aide sur un sujet précis.', it: 'Ciao! Ho visto il portale Tesis Ecuador e vorrei aiuto su un argomento specifico.' },
  'peer.option.proyecto.title': { es: 'El desarrollo de mi proyecto', en: 'My project\'s development', pt: 'O desenvolvimento do meu projeto', fr: 'Le développement de mon projet', it: 'Lo sviluppo del mio progetto' },
  'peer.option.proyecto.desc': { es: 'Quiero orientación general sobre cómo avanzar.', en: 'I want general guidance on how to move forward.', pt: 'Quero orientação geral sobre como avançar.', fr: 'Je veux des conseils généraux pour avancer.', it: 'Voglio una guida generale su come procedere.' },
  'peer.option.proyecto.message': { es: '¡Hola! Vi el portal Tesis Ecuador y quisiera que me ayudes con el desarrollo de mi proyecto de titulación.', en: 'Hi! I saw the Tesis Ecuador portal and I\'d like help with my graduation project\'s development.', pt: 'Olá! Vi o portal Tesis Ecuador e gostaria de ajuda com o desenvolvimento do meu projeto.', fr: 'Bonjour ! J\'ai vu le portail Tesis Ecuador et j\'aimerais de l\'aide pour le développement de mon projet.', it: 'Ciao! Ho visto il portale Tesis Ecuador e vorrei aiuto per lo sviluppo del mio progetto di laurea.' },
  'peer.option.consulta.title': { es: 'Solo tengo una consulta', en: 'I just have a question', pt: 'Só tenho uma dúvida', fr: 'J\'ai juste une question', it: 'Ho solo una domanda' },
  'peer.option.consulta.desc': { es: 'Quiero preguntar algo antes de continuar.', en: 'I want to ask something before continuing.', pt: 'Quero perguntar algo antes de continuar.', fr: 'Je veux demander quelque chose avant de continuer.', it: 'Voglio chiedere qualcosa prima di continuare.' },
  'peer.option.consulta.message': { es: '¡Hola! Vi el portal Tesis Ecuador y tengo una consulta sobre mi proyecto de titulación.', en: 'Hi! I saw the Tesis Ecuador portal and I have a question about my graduation project.', pt: 'Olá! Vi o portal Tesis Ecuador e tenho uma dúvida sobre meu projeto.', fr: 'Bonjour ! J\'ai vu le portail Tesis Ecuador et j\'ai une question sur mon projet.', it: 'Ciao! Ho visto il portale Tesis Ecuador e ho una domanda sul mio progetto di laurea.' },

  // ---------- Tutor IA (chrome únicamente; la base de conocimiento sigue en español) ----------
  'tutor.title': { es: 'Tutor IA Metodológico 🎓', en: 'AI Methodology Tutor 🎓', pt: 'Tutor de IA Metodológico 🎓', fr: 'Tuteur IA Méthodologique 🎓', it: 'Tutor IA Metodologico 🎓' },
  'tutor.subtitle': { es: 'Estructura, objetivos, APA 7 y revisión de borradores', en: 'Structure, objectives, APA 7 and draft review', pt: 'Estrutura, objetivos, APA 7 e revisão de rascunhos', fr: 'Structure, objectifs, APA 7 et révision de brouillons', it: 'Struttura, obiettivi, APA 7 e revisione bozze' },
  'tutor.clearHistory': { es: 'Borrar la conversación y empezar de cero', en: 'Clear the conversation and start over', pt: 'Apagar a conversa e começar do zero', fr: 'Effacer la conversation et recommencer', it: 'Cancella la conversazione e ricomincia' },
  'tutor.whatsapp': { es: '¿Te ayudo con algo? Escríbeme por WhatsApp', en: 'Need help? Message me on WhatsApp', pt: 'Posso ajudar? Fale comigo pelo WhatsApp', fr: 'Besoin d\'aide ? Écrivez-moi sur WhatsApp', it: 'Serve aiuto? Scrivimi su WhatsApp' },
  'tutor.close': { es: 'Cerrar ventana', en: 'Close window', pt: 'Fechar janela', fr: 'Fermer la fenêtre', it: 'Chiudi finestra' },
  'tutor.analyzing': { es: 'Analizando consulta académica...', en: 'Analyzing your question...', pt: 'Analisando sua pergunta...', fr: 'Analyse de la question...', it: 'Analisi della domanda...' },
  'tutor.faq': { es: 'Preguntas frecuentes', en: 'Frequently asked questions', pt: 'Perguntas frequentes', fr: 'Questions fréquentes', it: 'Domande frequenti' },
  'tutor.placeholder': { es: 'Escribe tu duda metodológica...', en: 'Type your methodology question...', pt: 'Digite sua dúvida metodológica...', fr: 'Écrivez votre question méthodologique...', it: 'Scrivi la tua domanda metodologica...' },
  'tutor.sendTitle': { es: 'Enviar consulta', en: 'Send question', pt: 'Enviar pergunta', fr: 'Envoyer la question', it: 'Invia la domanda' },
  'tutor.launcher': { es: '¿Dudas? Pregunta al Tutor IA', en: 'Questions? Ask the AI Tutor', pt: 'Dúvidas? Pergunte ao Tutor IA', fr: 'Des questions ? Demandez au Tuteur IA', it: 'Domande? Chiedi al Tutor IA' },
  'tutor.launcherShort': { es: 'Tutor IA', en: 'AI Tutor', pt: 'Tutor IA', fr: 'Tuteur IA', it: 'Tutor IA' },
  'tutor.answerLanguageNote': { es: 'El tutor responde en el idioma que selecciones en la barra superior.', en: 'The tutor replies in the language you select in the top bar.', pt: 'O tutor responde no idioma que você selecionar na barra superior.', fr: "Le tuteur répond dans la langue sélectionnée dans la barre supérieure.", it: "Il tutor risponde nella lingua selezionata nella barra superiore." },
  // Líneas de tono contextual: el tutor ajusta su apertura al módulo activo y
  // usa el nombre corto ya traducido del módulo ({module}). Dos variantes para
  // que la primera respuesta de cada módulo no suene a plantilla fija.
  'tutor.moduleOpenerA': { es: 'Estás en **{module}** — te respondo con el foco de ese módulo. ¿Qué necesitas resolver?', en: 'You are in **{module}** — I will focus my answer on that module. What do you need to solve?', pt: 'Você está em **{module}** — respondo com o foco desse módulo. O que você precisa resolver?', fr: 'Vous êtes dans **{module}** — je vous réponds en me concentrant sur ce module. Que voulez-vous résoudre ?', it: 'Sei in **{module}** — ti rispondo concentrandomi su questo modulo. Cosa ti serve risolvere?' },
  'tutor.moduleOpenerB': { es: 'Como tu tutor dentro de **{module}**, enfoco la respuesta en ese tema.', en: 'As your tutor inside **{module}**, I focus my answer on that topic.', pt: 'Como seu tutor em **{module}**, concentro a resposta nesse tema.', fr: 'En tant que votre tuteur dans **{module}**, je concentre ma réponse sur ce sujet.', it: 'Come tuo tutor in **{module}**, concentro la risposta su questo argomento.' },
  // Invitación a abrir el módulo interactivo cuando la conversación ya es larga:
  // el chat explica, pero el módulo tiene herramientas para avanzar más rápido.
  'tutor.moduleNudge': { es: '💡 Has estado un buen rato consultándome por aquí. Para **llevarlo a la práctica**, abre el módulo **{module}** desde el menú "Módulos": ahí tienes herramientas interactivas para avanzar más rápido.', en: '💡 You have been asking for a while now. To **put it into practice**, open the **{module}** module from the "Modules" menu: it has interactive tools to help you move faster.', pt: '💡 Você já está consultando há um bom tempo por aqui. Para **colocar em prática**, abra o módulo **{module}** no menu "Módulos": lá você tem ferramentas interativas para avançar mais rápido.', fr: '💡 Vous consultez depuis un bon moment. Pour **passer à la pratique**, ouvrez le module **{module}** dans le menu « Modules » : vous y trouverez des outils interactifs pour avancer plus vite.', it: '💡 Stai consultando da un bel po\'. Per **metterlo in pratica**, apri il modulo **{module}** dal menu "Moduli": lì hai strumenti interattivi per avanzare più velocemente.' },
  // Acuse al retomar el último tema cuando el usuario responde algo breve ("sí", "sigamos").
  'tutor.continueAck': { es: '¡Claro! Retomamos donde íbamos:', en: 'Of course! Let\'s pick up where we left off:', pt: 'Claro! Retomamos de onde paramos:', fr: 'Bien sûr ! Reprenons là où nous en étions :', it: 'Certo! Riprendiamo da dove eravamo rimasti:' },
  // CTA del flujo guiado: invita a avanzar al siguiente paso del proceso (es un
  // disparador de continuación, no menciona el tema para no duplicar strings).
  'tutor.nextStepCta': { es: '**¿Siguiente paso?** Responde "sí, sigamos" y avanzo en el proceso.', en: '**Next step?** Reply "yes, let\'s continue" and I will move the process forward.', pt: '**Próximo passo?** Responda "sim, continuemos" e avanço no processo.', fr: '**Étape suivante ?** Répondez « oui, continuons » et j\'avance dans le processus.', it: '**Prossimo passo?** Rispondi "sì, continuiamo" e avanzo nel processo.' },
  // Saludo breve y localizado. Un simple "hola" NO debe volcar la lista de
  // herramientas (eso es el welcome, que ya se mostró al abrir): se saluda y se
  // invita a decir el tema, en el idioma activo.
  'tutor.greeting': { es: '¡Hola! 👋 ¿En qué parte de tu tesis o de la plataforma quieres que te oriente hoy?', en: 'Hello! 👋 Which part of your thesis or the platform would you like help with today?', pt: 'Olá! 👋 Em que parte da sua tese ou da plataforma você quer que eu oriente hoje?', fr: 'Bonjour ! 👋 Sur quelle partie de votre mémoire ou de la plateforme souhaitez-vous être orienté aujourd\'hui ?', it: 'Ciao! 👋 Su quale parte della tua tesi o della piattaforma vuoi essere orientato oggi?' },
  'tutor.thanks': { es: '¡Con gusto! 😊 Aquí estoy para lo que necesites de tu tesis.', en: 'You\'re welcome! 😊 I\'m here for whatever you need on your thesis.', pt: 'De nada! 😊 Estou aqui para o que você precisar na sua tese.', fr: 'Avec plaisir ! 😊 Je suis là pour tout ce dont vous avez besoin pour votre mémoire.', it: 'Prego! 😊 Sono qui per tutto ciò di cui hai bisogno per la tua tesi.' },
  'tutor.farewell': { es: '¡Hasta pronto! 👋 Mucho éxito con tu titulación. Cuando quieras seguimos.', en: 'See you soon! 👋 Best of luck with your thesis. We can continue whenever you like.', pt: 'Até logo! 👋 Muito sucesso na sua titulação. Quando quiser, continuamos.', fr: 'À bientôt ! 👋 Bonne chance pour votre mémoire. Nous pourrons continuer quand vous voudrez.', it: 'A presto! 👋 In bocca al lupo per la tua tesi. Quando vuoi, continuiamo.' },

  // Encabezado breve al avanzar al siguiente tema del flujo guiado.
  'tutor.stepAdvance': { es: '¡Perfecto! Avanzamos al siguiente paso del proceso:', en: 'Great! Let\'s move to the next step of the process:', pt: 'Perfeito! Avançamos para a próxima etapa do processo:', fr: 'Parfait ! Passons à l\'étape suivante du processus :', it: 'Perfetto! Passiamo al prossimo passo del processo:' },

  // Etiquetas de los accesos rápidos del tutor. La consulta que se envía al
  // motor sigue siendo la española: es la que reconoce su base de conocimiento.
  'tutor.q.draftReview': { es: '¿Cómo reviso mi borrador?', en: 'How do I review my draft?', pt: 'Como reviso meu rascunho?', fr: 'Comment relire mon brouillon ?', it: 'Come rivedo la mia bozza?' },
  'tutor.q.structure': { es: 'Estructura del documento completo', en: 'Structure of the full document', pt: 'Estrutura do documento completo', fr: 'Structure du document complet', it: 'Struttura del documento completo' },
  'tutor.q.objectives': { es: '¿Cómo redacto los objetivos?', en: 'How do I write the objectives?', pt: 'Como redijo os objetivos?', fr: 'Comment rédiger les objectifs ?', it: 'Come scrivo gli obiettivi?' },
  'tutor.q.ieee830': { es: 'Requerimientos IEEE 830', en: 'IEEE 830 requirements', pt: 'Requisitos IEEE 830', fr: 'Exigences IEEE 830', it: 'Requisiti IEEE 830' },
  'tutor.q.writingErrors': { es: 'Errores de redacción académica', en: 'Common academic writing mistakes', pt: 'Erros de redação acadêmica', fr: "Erreurs de rédaction académique", it: 'Errori di scrittura accademica' },
  'tutor.q.boolean': { es: '¿Qué es una ecuación booleana?', en: 'What is a boolean search string?', pt: 'O que é uma equação booleana?', fr: "Qu'est-ce qu'une équation booléenne ?", it: 'Che cosa è una equazione booleana?' },
  'tutor.q.matrix': { es: 'Matriz de Consistencia y Avance 1', en: 'Consistency matrix and Advance 1', pt: 'Matriz de consistência e primeira entrega', fr: 'Matrice de cohérence et premier rendu', it: 'Matrice di coerenza e prima consegna' },
  'tutor.q.etAl': { es: 'Regla del "et al." en APA 7', en: 'The "et al." rule in APA 7', pt: 'Regra do "et al." na APA 7', fr: 'La règle « et al. » en APA 7', it: 'La regola "et al." in APA 7' },
  'tutor.q.chapters': { es: 'Los 5 capítulos de la tesis', en: 'The five chapters of the thesis', pt: 'Os cinco capítulos da tese', fr: 'Les cinq chapitres du mémoire', it: 'I cinque capitoli della tesi' },
  'tutor.q.zotero': { es: 'Zotero 7 y gestor de citas', en: 'Zotero 7 and citation managers', pt: 'Zotero 7 e gerenciador de citações', fr: 'Zotero 7 et gestionnaire de citations', it: 'Zotero 7 e gestore delle citazioni' },

  // ---------- Revisor de borrador (chrome; el diagnóstico generado sigue en español) ----------
  'draft.badge': { es: 'Revisor de borrador', en: 'Draft Reviewer', pt: 'Revisor de Rascunho', fr: 'Réviseur de Brouillon', it: 'Revisore di Bozze' },
  'draft.title': { es: 'Diagnóstico de tu avance 🔎', en: 'Diagnosis of your progress 🔎', pt: 'Diagnóstico do seu avanço 🔎', fr: 'Diagnostic de votre avancement 🔎', it: 'Diagnosi del tuo avanzamento 🔎' },
  'draft.subtitle': { es: 'Revisa la forma y la estructura de tu documento contra el formato de titulación, antes de que lo lea tu docente.', en: 'Check your document\'s form and structure against the graduation format, before your professor reads it.', pt: 'Revise a forma e a estrutura do seu documento conforme o formato de titulação, antes que seu docente o leia.', fr: 'Vérifiez la forme et la structure de votre document selon le format de fin d\'études, avant que votre enseignant ne le lise.', it: 'Controlla la forma e la struttura del tuo documento rispetto al formato di laurea, prima che il tuo docente lo legga.' },
  'draft.clientSide': { es: 'Se procesa en tu navegador', en: 'Processed in your browser', pt: 'Processado no seu navegador', fr: 'Traité dans votre navigateur', it: 'Elaborato nel tuo browser' },
  'draft.stepStage': { es: '¿Qué estás entregando?', en: 'What are you submitting?', pt: 'O que você está entregando?', fr: 'Que soumettez-vous ?', it: 'Cosa stai consegnando?' },
  'draft.stepDocument': { es: 'Tu documento', en: 'Your document', pt: 'Seu documento', fr: 'Votre document', it: 'Il tuo documento' },
  'draft.dropHint': { es: 'Arrastra tu archivo aquí o', en: 'Drag your file here or', pt: 'Arraste seu arquivo aqui ou', fr: 'Glissez votre fichier ici ou', it: 'Trascina qui il tuo file oppure' },
  'draft.select': { es: 'selecciónalo', en: 'select it', pt: 'selecione-o', fr: 'sélectionnez-le', it: 'selezionalo' },
  'draft.textLabel': { es: 'Texto del borrador', en: 'Draft text', pt: 'Texto do rascunho', fr: 'Texte du brouillon', it: 'Testo della bozza' },
  'draft.words': { es: 'palabras', en: 'words', pt: 'palavras', fr: 'mots', it: 'parole' },
  'draft.analyzeButton': { es: 'Analizar mi', en: 'Analyze my', pt: 'Analisar meu', fr: 'Analyser mon', it: 'Analizza il mio' },
  'draft.neverLeaves': { es: 'Tu documento no sale de este navegador.', en: 'Your document never leaves this browser.', pt: 'Seu documento não sai deste navegador.', fr: 'Votre document ne quitte jamais ce navigateur.', it: 'Il tuo documento non lascia mai questo browser.' },
  'draft.copyDiagnosis': { es: 'Copiar diagnóstico', en: 'Copy diagnosis', pt: 'Copiar diagnóstico', fr: 'Copier le diagnostic', it: 'Copia diagnosi' },

  // ---------- Los 8 módulos: nombre corto y descripción usados en el riel,
  // la cabecera y la paginación. El nombre largo y el badge quedan en
  // español en todos los idiomas por ahora (son etiquetas institucionales). ----------
  'module.feasibility.shortName': { es: 'Viabilidad & Matriz', en: 'Feasibility & Matrix', pt: 'Viabilidade & Matriz', fr: 'Faisabilité & Matrice', it: 'Fattibilità & Matrice' },
  'module.feasibility.description': { es: 'Diagnóstico ponderado de acceso a la muestra, literatura indexada y consistencia metodológica en 4 fases progresivas.', en: 'A weighted diagnosis of sample access, indexed literature and methodological consistency across 4 progressive phases.', pt: 'Diagnóstico ponderado de acesso à amostra, literatura indexada e consistência metodológica em 4 fases progressivas.', fr: 'Diagnostic pondéré de l\'accès à l\'échantillon, de la littérature indexée et de la cohérence méthodologique en 4 phases.', it: 'Diagnosi ponderata dell\'accesso al campione, della letteratura indicizzata e della coerenza metodologica in 4 fasi.' },
  'module.chapters.shortName': { es: 'Los 5 Capítulos', en: 'The 5 Chapters', pt: 'Os 5 Capítulos', fr: 'Les 5 Chapitres', it: 'I 5 Capitoli' },
  'module.chapters.description': { es: 'Entregables obligatorios, errores críticos a evitar, fórmulas y checklist de aprobación por capítulo.', en: 'Mandatory deliverables, critical mistakes to avoid, formulas and an approval checklist per chapter.', pt: 'Entregáveis obrigatórios, erros críticos a evitar, fórmulas e checklist de aprovação por capítulo.', fr: 'Livrables obligatoires, erreurs critiques à éviter, formules et liste de contrôle par chapitre.', it: 'Consegne obbligatorie, errori critici da evitare, formule e checklist di approvazione per capitolo.' },
  'module.scopus.shortName': { es: 'Scopus & Booleanos', en: 'Scopus & Boolean', pt: 'Scopus & Booleanos', fr: 'Scopus & Booléens', it: 'Scopus & Booleani' },
  'module.scopus.description': { es: 'Constructor booleano con operadores AND/OR/AND NOT, filtros de acceso abierto y enlaces directos de búsqueda.', en: 'A boolean builder with AND/OR/AND NOT operators, open-access filters and direct search links.', pt: 'Construtor booleano com operadores AND/OR/AND NOT, filtros de acesso aberto e links diretos de busca.', fr: 'Constructeur booléen avec opérateurs AND/OR/AND NOT, filtres en libre accès et liens de recherche directs.', it: 'Costruttore booleano con operatori AND/OR/AND NOT, filtri open-access e link di ricerca diretti.' },
  'module.apa7.shortName': { es: 'APA 7 & Zotero', en: 'APA 7 & Zotero', pt: 'APA 7 & Zotero', fr: 'APA 7 & Zotero', it: 'APA 7 & Zotero' },
  'module.apa7.description': { es: 'Citas parentéticas, narrativas, directas y en bloque, aplicación de et al. e integración con Zotero 7.', en: 'Parenthetical, narrative, direct and block citations, the et al. rule and Zotero 7 integration.', pt: 'Citações parentéticas, narrativas, diretas e em bloco, aplicação do et al. e integração com o Zotero 7.', fr: 'Citations parenthétiques, narratives, directes et en bloc, règle et al. et intégration avec Zotero 7.', it: 'Citazioni tra parentesi, narrative, dirette e in blocco, regola et al. e integrazione con Zotero 7.' },
  'module.toolbox.shortName': { es: 'Software & Toolbox', en: 'Software & Toolbox', pt: 'Software & Toolbox', fr: 'Logiciels & Toolbox', it: 'Software & Toolbox' },
  'module.toolbox.description': { es: 'Gestores bibliográficos, análisis estadístico (Jamovi, SPSS), mapas de literatura e IA ética.', en: 'Reference managers, statistical analysis (Jamovi, SPSS), literature maps and ethical AI use.', pt: 'Gerenciadores bibliográficos, análise estatística (Jamovi, SPSS), mapas de literatura e IA ética.', fr: 'Gestionnaires bibliographiques, analyse statistique (Jamovi, SPSS), cartes de littérature et IA éthique.', it: 'Gestori bibliografici, analisi statistica (Jamovi, SPSS), mappe della letteratura e IA etica.' },
  'module.videos.shortName': { es: 'Videoteca', en: 'Video Library', pt: 'Videoteca', fr: 'Vidéothèque', it: 'Videoteca' },
  'module.videos.description': { es: 'Rutas de video curadas para estructura, metodología, revisión de literatura, herramientas y sustentación.', en: 'Curated video tracks for structure, methodology, literature review, tools and thesis defense.', pt: 'Trilhas de vídeo curadas para estrutura, metodologia, revisão de literatura, ferramentas e defesa.', fr: 'Parcours vidéo pour la structure, la méthodologie, la revue de littérature, les outils et la soutenance.', it: 'Percorsi video curati per struttura, metodologia, revisione della letteratura, strumenti e discussione.' },
  'module.draft.shortName': { es: 'Revisor de Borrador', en: 'Draft Reviewer', pt: 'Revisor de Rascunho', fr: 'Réviseur de Brouillon', it: 'Revisore di Bozze' },
  'module.draft.description': { es: 'Sube tu Avance 1, Avance 2 o documento completo y recibe un diagnóstico de forma y estructura. Se procesa en tu navegador.', en: 'Upload your Draft 1, Draft 2 or full document and get a form-and-structure diagnosis. Processed in your browser.', pt: 'Envie seu Avanço 1, Avanço 2 ou documento completo e receba um diagnóstico de forma e estrutura. Processado no seu navegador.', fr: 'Téléversez votre Avancée 1, Avancée 2 ou document complet et recevez un diagnostic de forme et de structure. Traité dans votre navigateur.', it: 'Carica la tua Bozza 1, Bozza 2 o il documento completo e ricevi una diagnosi di forma e struttura. Elaborato nel tuo browser.' },
  // ---------- Verificador de Originalidad Académica ----------
  'plag.title': { es: 'Verificador de Originalidad Académica', en: 'Academic Originality Checker', pt: 'Verificador de Originalidade Acadêmica', fr: 'Vérificateur d\'Originalité Académique', it: 'Verificatore di Originalità Accademica' },
  'plag.tagline': { es: 'Integridad académica: detección de plagio y rigor', en: 'Academic integrity: plagiarism detection and rigor', pt: 'Integridade acadêmica: detecção de plágio e rigor', fr: 'Intégrité académique : détection du plagiat et rigueur', it: 'Integrità accademica: rilevamento del plagio e rigore' },
  'plag.dropTitle': { es: 'Arrastra tu archivo aquí (.pdf, .txt)', en: 'Drag your file here (.pdf, .txt)', pt: 'Arraste seu arquivo aqui (.pdf, .txt)', fr: 'Glissez votre fichier ici (.pdf, .txt)', it: 'Trascina qui il tuo file (.pdf, .txt)' },
  'plag.dropSub': { es: 'o haz clic para subir', en: 'or click to upload', pt: 'ou clique para enviar', fr: 'ou cliquez pour téléverser', it: 'oppure clicca per caricare' },
  'plag.pasteLabel': { es: 'O pega tu texto para análisis instantáneo', en: 'Or paste your text for instant analysis', pt: 'Ou cole seu texto para análise instantânea', fr: 'Ou collez votre texte pour une analyse instantanée', it: 'Oppure incolla il testo per un\'analisi immediata' },
  'plag.placeholder': { es: 'Pega aquí el texto de tu documento (mínimo {min} caracteres)…', en: 'Paste your document text here (at least {min} characters)…', pt: 'Cole aqui o texto do seu documento (mínimo {min} caracteres)…', fr: 'Collez ici le texte de votre document (au moins {min} caractères)…', it: 'Incolla qui il testo del tuo documento (almeno {min} caratteri)…' },
  'plag.characters': { es: 'caracteres', en: 'characters', pt: 'caracteres', fr: 'caractères', it: 'caratteri' },
  'plag.words': { es: 'palabras', en: 'words', pt: 'palavras', fr: 'mots', it: 'parole' },
  'plag.minHint': { es: 'Faltan caracteres: el mínimo es {min}.', en: 'Not enough text yet: the minimum is {min} characters.', pt: 'Ainda faltam caracteres: o mínimo é {min}.', fr: 'Texte insuffisant : le minimum est de {min} caractères.', it: 'Testo insufficiente: il minimo è {min} caratteri.' },
  'plag.overLimit': { es: 'Excede el límite en {extra} caracteres.', en: 'Over the limit by {extra} characters.', pt: 'Excede o limite em {extra} caracteres.', fr: 'Dépasse la limite de {extra} caractères.', it: 'Supera il limite di {extra} caratteri.' },
  'plag.excludeCitations': { es: 'Excluir citas y referencias', en: 'Exclude quotes and references', pt: 'Excluir citações e referências', fr: 'Exclure les citations et références', it: 'Escludi citazioni e riferimenti' },
  'plag.summaryTitle': { es: 'Resumen del Documento', en: 'Document Summary', pt: 'Resumo do Documento', fr: 'Résumé du Document', it: 'Riepilogo del Documento' },
  'plag.noDocument': { es: 'Sin documento cargado', en: 'No document loaded', pt: 'Nenhum documento carregado', fr: 'Aucun document chargé', it: 'Nessun documento caricato' },
  'plag.startAnalysis': { es: 'Iniciar Análisis de Originalidad', en: 'Start Originality Analysis', pt: 'Iniciar Análise de Originalidade', fr: 'Lancer l\'Analyse d\'Originalité', it: 'Avvia l\'Analisi di Originalità' },
  'plag.analyzing': { es: 'Analizando…', en: 'Analyzing…', pt: 'Analisando…', fr: 'Analyse en cours…', it: 'Analisi in corso…' },
  'plag.statusTitle': { es: 'Estado del Análisis en Tiempo Real', en: 'Real-Time Analysis Status', pt: 'Estado da Análise em Tempo Real', fr: 'État de l\'Analyse en Temps Réel', it: 'Stato dell\'Analisi in Tempo Reale' },
  'plag.pending': { es: 'Pendiente', en: 'Pending', pt: 'Pendente', fr: 'En attente', it: 'In attesa' },
  'plag.checking': { es: 'Comprobando…', en: 'Checking…', pt: 'Verificando…', fr: 'Vérification…', it: 'Verifica…' },
  'plag.noMatches': { es: 'Sin coincidencias', en: 'No matches', pt: 'Sem coincidências', fr: 'Aucune correspondance', it: 'Nessuna corrispondenza' },
  'plag.noResults': { es: 'Sin resultados', en: 'No results returned', pt: 'Sem resultados', fr: 'Aucun résultat', it: 'Nessun risultato' },
  'plag.matchAt': { es: 'Coincidencia {pct}%', en: 'Match {pct}%', pt: 'Coincidência {pct}%', fr: 'Correspondance {pct} %', it: 'Corrispondenza {pct}%' },
  'plag.localCorpus': { es: 'Repositorio local', en: 'Local repository', pt: 'Repositório local', fr: 'Dépôt local', it: 'Repository locale' },
  'plag.progressNote': { es: 'Progreso indicativo: los proveedores se consultan en paralelo. El estado final sale de la respuesta real. «Sin coincidencias» significa que el proveedor respondió y nada se parecía a tu texto; «Sin resultados», que no devolvió ningún candidato.', en: 'Indicative progress: providers are queried in parallel. Final statuses come from the actual response. "No matches" means the provider answered and nothing resembled your text; "No results returned" means it produced no candidates at all.', pt: 'Progresso indicativo: os provedores são consultados em paralelo. O estado final vem da resposta real. «Sem coincidências» significa que o provedor respondeu e nada se parecia com seu texto; «Sem resultados», que não devolveu nenhum candidato.', fr: 'Progression indicative : les fournisseurs sont interrogés en parallèle. L\'état final provient de la réponse réelle. « Aucune correspondance » signifie que le fournisseur a répondu sans rien trouver de semblable ; « Aucun résultat », qu\'il n\'a produit aucun candidat.', it: 'Avanzamento indicativo: i provider vengono interrogati in parallelo. Lo stato finale deriva dalla risposta reale. «Nessuna corrispondenza» significa che il provider ha risposto e nulla somigliava al tuo testo; «Nessun risultato», che non ha restituito alcun candidato.' },
  'plag.slowHint': { es: 'El análisis suele tardar entre 3 y 5 minutos porque compara tu texto contra varias fuentes en paralelo. No cierres la pestaña mientras avanza.', en: 'The analysis usually takes 3–5 minutes, as it checks your text against several sources in parallel. Keep the tab open while it runs.', pt: 'A análise costuma levar de 3 a 5 minutos, pois compara seu texto com várias fontes em paralelo. Mantenha a aba aberta enquanto avança.', fr: 'L\'analyse prend généralement 3 à 5 minutes, car elle compare votre texte à plusieurs sources en parallèle. Ne fermez pas l\'onglet pendant son déroulement.', it: 'L\'analisi richiede di solito dai 3 ai 5 minuti, perché confronta il testo con più fonti in parallelo. Non chiudere la scheda mentre è in corso.' },
  'plag.privacyBadge': { es: 'Privado: tu tesis no se almacena en ninguna plataforma externa', en: 'Private: your thesis is not stored on any external platform', pt: 'Privado: sua tese não é armazenada em nenhuma plataforma externa', fr: 'Confidentiel : votre mémoire n\'est stocké sur aucune plateforme externe', it: 'Privato: la tua tesi non viene salvata su nessuna piattaforma esterna' },
  'plag.reportTitle': { es: 'Informe de originalidad', en: 'Originality report', pt: 'Relatório de originalidade', fr: 'Rapport d\'originalité', it: 'Rapporto di originalità' },
  'plag.sampled': { es: 'Análisis por muestreo: {chunks} de {total} bloques.', en: 'Sampled analysis: {chunks} of {total} chunks.', pt: 'Análise por amostragem: {chunks} de {total} blocos.', fr: 'Analyse par échantillonnage : {chunks} sur {total} blocs.', it: 'Analisi campionaria: {chunks} di {total} blocchi.' },
  'plag.downloadReport': { es: 'Descargar informe PDF', en: 'Download PDF report', pt: 'Baixar relatório PDF', fr: 'Télécharger le rapport PDF', it: 'Scarica il rapporto PDF' },
  'plag.generatingReport': { es: 'Generando informe de similitud…', en: 'Generating similarity report…', pt: 'Gerando relatório de similaridade…', fr: 'Génération du rapport de similarité…', it: 'Generazione del rapporto di similarità…' },
  'plag.detectAi': { es: 'Estimar uso de IA', en: 'Estimate AI usage', pt: 'Estimar uso de IA', fr: 'Estimer l\'usage de l\'IA', it: 'Stima l\'uso dell\'IA' },
  'plag.detectingAi': { es: 'Estimando…', en: 'Estimating…', pt: 'Estimando…', fr: 'Estimation…', it: 'Stima in corso…' },
  'plag.aiIndicator': { es: 'Indicador de IA', en: 'AI indicator', pt: 'Indicador de IA', fr: 'Indicateur d\'IA', it: 'Indicatore di IA' },
  'plag.plagiarismLabel': { es: 'Índice de plagio', en: 'Plagiarism index', pt: 'Índice de plágio', fr: 'Indice de plagiat', it: 'Indice di plagio' },
  'plag.similarityLabel': { es: 'Similitud general', en: 'Overall similarity', pt: 'Similaridade geral', fr: 'Similarité globale', it: 'Similarità complessiva' },
  'plag.analyzedPassages': { es: 'Pasajes analizados', en: 'Passages analyzed', pt: 'Trechos analisados', fr: 'Passages analysés', it: 'Passaggi analizzati' },
  'plag.flaggedPassages': { es: 'Pasajes con coincidencia alta', en: 'Passages with high similarity', pt: 'Trechos com coincidência alta', fr: 'Passages à forte similarité', it: 'Passaggi con alta similarità' },
  'plag.detailTitle': { es: 'Resultados detallados', en: 'Detailed results', pt: 'Resultados detalhados', fr: 'Résultats détaillés', it: 'Risultati dettagliati' },
  'plag.potentialSources': { es: 'Fuentes potenciales', en: 'Potential sources', pt: 'Fontes potenciais', fr: 'Sources potentielles', it: 'Fonti potenziali' },
  'plag.disclaimer': { es: 'Este informe es una ayuda diagnóstica, no un veredicto: una coincidencia alta puede corresponder a una cita correctamente atribuida, y una baja no garantiza originalidad. La valoración final corresponde a tu docente o tutor.', en: 'This report is a diagnostic aid, not a verdict: a high match may be a properly attributed quotation, and a low one does not guarantee originality. The final judgment rests with your professor or advisor.', pt: 'Este relatório é um auxílio diagnóstico, não um veredicto: uma coincidência alta pode ser uma citação corretamente atribuída, e uma baixa não garante originalidade. A avaliação final cabe ao seu docente ou tutor.', fr: 'Ce rapport est une aide au diagnostic, pas un verdict : une forte correspondance peut être une citation correctement attribuée, et une faible ne garantit pas l\'originalité. L\'appréciation finale revient à votre enseignant ou tuteur.', it: 'Questo rapporto è un ausilio diagnostico, non un verdetto: un\'alta corrispondenza può essere una citazione correttamente attribuita, e una bassa non garantisce l\'originalità. La valutazione finale spetta al tuo docente o relatore.' },
  'plag.loaded': { es: 'Documento cargado: {name}', en: 'Document loaded: {name}', pt: 'Documento carregado: {name}', fr: 'Document chargé : {name}', it: 'Documento caricato: {name}' },
  'plag.loadedTruncated': { es: 'Documento cargado: {name}. Se recortó al límite de caracteres.', en: 'Document loaded: {name}. It was trimmed to the character limit.', pt: 'Documento carregado: {name}. Foi cortado no limite de caracteres.', fr: 'Document chargé : {name}. Il a été tronqué à la limite de caractères.', it: 'Documento caricato: {name}. È stato troncato al limite di caratteri.' },
  'plag.errorFormat': { es: 'Formato no admitido ({ext}). Por ahora solo se admite PDF o TXT.', en: 'Unsupported format ({ext}). For now only PDF or TXT are accepted.', pt: 'Formato não suportado ({ext}). Por enquanto só se aceita PDF ou TXT.', fr: 'Format non pris en charge ({ext}). Pour le moment, seuls PDF et TXT sont acceptés.', it: 'Formato non supportato ({ext}). Per ora si accettano solo PDF o TXT.' },
  'plag.errorSize': { es: 'El archivo supera el límite de {mb} MB.', en: 'The file exceeds the {mb} MB limit.', pt: 'O arquivo excede o limite de {mb} MB.', fr: 'Le fichier dépasse la limite de {mb} Mo.', it: 'Il file supera il limite di {mb} MB.' },
  'plag.errorRead': { es: 'No se pudo leer el documento.', en: 'The document could not be read.', pt: 'Não foi possível ler o documento.', fr: 'Le document n\'a pas pu être lu.', it: 'Non è stato possibile leggere il documento.' },
  'plag.errorAnalysis': { es: 'No se pudo completar el análisis de originalidad.', en: 'The originality analysis could not be completed.', pt: 'Não foi possível concluir a análise de originalidade.', fr: 'L\'analyse d\'originalité n\'a pas pu aboutir.', it: 'Non è stato possibile completare l\'analisi di originalità.' },
  'plag.errorReport': { es: 'No se pudo generar el informe PDF.', en: 'The PDF report could not be generated.', pt: 'Não foi possível gerar o relatório PDF.', fr: 'Le rapport PDF n\'a pas pu être généré.', it: 'Non è stato possibile generare il rapporto PDF.' },
  'plag.errorAi': { es: 'No se pudo estimar el uso de IA.', en: 'AI usage could not be estimated.', pt: 'Não foi possível estimar o uso de IA.', fr: 'L\'usage de l\'IA n\'a pas pu être estimé.', it: 'Non è stato possibile stimare l\'uso dell\'IA.' },
  'plag.serviceOffline': { es: 'El servicio de verificación de originalidad no está disponible en este momento.', en: 'The originality verification service is unavailable right now.', pt: 'O serviço de verificação de originalidade não está disponível no momento.', fr: 'Le service de vérification d\'originalité est indisponible pour le moment.', it: 'Il servizio di verifica dell\'originalità non è disponibile in questo momento.' },

  // Tarjetas separadas (similitud / IA), reinicio del módulo e informes en PDF.
  'plag.similarityCardLabel': { es: 'Índice de similitud', en: 'Similarity index', pt: 'Índice de similaridade', fr: 'Indice de similarité', it: 'Indice di similarità' },
  'plag.aiCardLabel': { es: 'Indicio de IA', en: 'AI indication', pt: 'Indício de IA', fr: 'Indice d\'IA', it: 'Indizio di IA' },
  'plag.aiNotRun': { es: 'Sin estimar', en: 'Not estimated', pt: 'Não estimado', fr: 'Non estimé', it: 'Non stimato' },
  'plag.estimateAiShort': { es: 'Estimar', en: 'Estimate', pt: 'Estimar', fr: 'Estimer', it: 'Stima' },
  'plag.reset': { es: 'Nuevo documento', en: 'New document', pt: 'Novo documento', fr: 'Nouveau document', it: 'Nuovo documento' },
  'plag.resetHint': { es: 'Borra la tesis revisada y todos sus resultados para empezar otra sin datos cruzados.', en: 'Clears the reviewed thesis and all its results so you can start another with nothing carried over.', pt: 'Apaga a tese revisada e todos os seus resultados para começar outra sem dados cruzados.', fr: 'Efface la thèse analysée et tous ses résultats afin d\'en commencer une autre sans report de données.', it: 'Cancella la tesi esaminata e tutti i suoi risultati per iniziarne un\'altra senza dati incrociati.' },
  'plag.downloadPlagiarismPdf': { es: 'Informe de similitud', en: 'Similarity Report', pt: 'Relatório de similaridade', fr: 'Rapport de similarité', it: 'Rapporto di similarità' },
  'plag.downloadAiPdf': { es: 'Informe de IA', en: 'AI Report', pt: 'Relatório de IA', fr: 'Rapport d\'IA', it: 'Rapporto di IA' },
  'plag.generatingAiPdf': { es: 'Generando informe de IA…', en: 'Generating AI report…', pt: 'Gerando relatório de IA…', fr: 'Génération du rapport d\'IA…', it: 'Generazione del rapporto di IA…' },
  'plag.errorAiReport': { es: 'No se pudo generar el informe de IA en PDF.', en: 'The AI PDF report could not be generated.', pt: 'Não foi possível gerar o relatório de IA em PDF.', fr: 'Le rapport d\'IA en PDF n\'a pas pu être généré.', it: 'Non è stato possibile generare il rapporto di IA in PDF.' },
  'plag.providersSummary': { es: '{answered} de {total} proveedores respondieron · {matched} con coincidencias', en: '{answered} of {total} providers answered · {matched} with matches', pt: '{answered} de {total} provedores responderam · {matched} com coincidências', fr: '{answered} fournisseurs sur {total} ont répondu · {matched} avec correspondances', it: '{answered} provider su {total} hanno risposto · {matched} con corrispondenze' },
  // Ambos informes adjuntan ya el documento original marcado, así que el botón
  // que hacía solo eso desapareció. Queda decir al estudiante cuál de los dos
  // formatos va a recibir, porque depende de lo que haya subido.
  'plag.overlayIncluded': { es: 'Cada informe adjunta tu documento original en su propio formato —carátula, encabezados y paginación— con las páginas marcadas, y cierra con la recomendación para corregir lo detectado.', en: 'Each report attaches your original document in its own formatting — cover, headers and pagination — with the marked pages, and closes with the recommendation for fixing what was found.', pt: 'Cada relatório anexa o seu documento original na própria formatação — capa, cabeçalhos e paginação — com as páginas marcadas, e termina com a recomendação para corrigir o que foi detectado.', fr: 'Chaque rapport joint votre document original dans sa mise en forme propre — page de garde, en-têtes et pagination — avec les pages marquées, et se termine par la recommandation pour corriger ce qui a été détecté.', it: 'Ogni rapporto allega il tuo documento originale nella sua formattazione — copertina, intestazioni e impaginazione — con le pagine marcate, e termina con la raccomandazione per correggere quanto rilevato.' },
  'plag.overlayUnavailable': { es: 'Sube el documento en PDF para que el informe lo adjunte marcado sobre su formato original, carátula incluida. Con texto pegado o .txt no hay coordenadas de página y el informe sale reimpreso. Word (.docx) está deshabilitado por ahora.', en: 'Upload the document as PDF so the report can attach it marked up in its original formatting, cover included. Pasted text or .txt carry no page coordinates, so the report is reprinted instead. Word (.docx) is disabled for now.', pt: 'Envie o documento em PDF para que o relatório o anexe marcado sobre o formato original, capa incluída. Com texto colado ou .txt não há coordenadas de página e o relatório sai reimpresso. Word (.docx) está desativado por enquanto.', fr: 'Téléversez le document en PDF pour que le rapport le joigne annoté dans sa mise en forme d\'origine, page de garde comprise. Un texte collé ou un .txt ne portent aucune coordonnée de page : le rapport est alors réimprimé. Word (.docx) est désactivé pour le moment.', it: 'Carica il documento in PDF affinché il rapporto lo alleghi annotato nel formato originale, copertina inclusa. Con testo incollato o .txt non ci sono coordinate di pagina e il rapporto viene ristampato. Word (.docx) è disattivato per ora.' },
  'plag.errorOverlayReport': { es: 'No se pudo generar el informe marcado sobre tu documento.', en: 'The marked-up report over your document could not be generated.', pt: 'Não foi possível gerar o relatório marcado sobre o seu documento.', fr: 'Le rapport annoté sur votre document n\'a pas pu être généré.', it: 'Non è stato possibile generare il rapporto annotato sul tuo documento.' },
  // El servicio marca por cabecera si el PDF lleva el original o si hubo que
  // reimprimirlo. Descargar un reimpreso creyendo que lleva la carátula es
  // justo el fallo que el estudiante no puede detectar por su cuenta.
  'plag.reportReprinted': { es: 'El informe se generó en formato reimpreso: no se pudo adjuntar tu documento original. Vuelve a subirlo y repite el análisis para obtenerlo marcado sobre su carátula.', en: 'The report was generated in reprinted form: your original document could not be attached. Upload it again and repeat the analysis to get it marked up on its own cover.', pt: 'O relatório foi gerado em formato reimpresso: não foi possível anexar o seu documento original. Envie-o novamente e repita a análise para obtê-lo marcado sobre a capa.', fr: 'Le rapport a été généré sous forme réimprimée : votre document d\'origine n\'a pas pu être joint. Téléversez-le à nouveau et relancez l\'analyse pour l\'obtenir annoté sur sa page de garde.', it: 'Il rapporto è stato generato in formato ristampato: non è stato possibile allegare il documento originale. Caricalo di nuovo e ripeti l\'analisi per ottenerlo annotato sulla copertina.' },

  'module.plagiarism.shortName': { es: 'Originalidad & Plagio', en: 'Originality & Plagiarism', pt: 'Originalidade & Plágio', fr: 'Originalité & Plagiat', it: 'Originalità & Plagio' },
  'module.plagiarism.description': { es: 'Contrasta tu documento contra Wikipedia, CORE, arXiv, Semantic Scholar, DOAJ, CrossRef, OpenAlex y Europe PMC, y estima el uso de IA generativa.', en: 'Check your document against Wikipedia, CORE, arXiv, Semantic Scholar, DOAJ, CrossRef, OpenAlex and Europe PMC, and estimate generative-AI usage.', pt: 'Compare seu documento com Wikipedia, CORE, arXiv, Semantic Scholar, DOAJ, CrossRef, OpenAlex e Europe PMC, e estime o uso de IA generativa.', fr: 'Comparez votre document à Wikipédia, CORE, arXiv, Semantic Scholar, DOAJ, CrossRef, OpenAlex et Europe PMC, et estimez l\'usage de l\'IA générative.', it: 'Confronta il tuo documento con Wikipedia, CORE, arXiv, Semantic Scholar, DOAJ, CrossRef, OpenAlex ed Europe PMC, e stima l\'uso dell\'IA generativa.' },
  'module.all.shortName': { es: 'Ver Todo', en: 'View All', pt: 'Ver Tudo', fr: 'Tout Voir', it: 'Vedi Tutto' },
  'module.all.description': { es: 'Todos los módulos desplegados en un único lienzo continuo de trabajo.', en: 'All modules laid out on a single continuous work canvas.', pt: 'Todos os módulos dispostos em uma única tela contínua de trabalho.', fr: 'Tous les modules déployés sur une seule toile de travail continue.', it: 'Tutti i moduli disposti su un\'unica tela di lavoro continua.' },
};

/**
 * Diccionario completo: interfaz y contenido en un mismo mapa.
 * Las claves de contenido llevan prefijos propios (`tool.`, `video.`, `slide.`…)
 * y por eso no pueden chocar con las de interfaz.
 */
export const TRANSLATIONS: Record<string, Dict> = {
  ...UI_TRANSLATIONS,
  ...CONTENT_TRANSLATIONS,
};

/** Interpola {placeholders} dentro de un string ya traducido. */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match
  );
}

export function translate(key: string, locale: Locale): string {
  const entry = TRANSLATIONS[key];
  if (!entry) return key;
  return entry[locale] ?? entry[DEFAULT_LOCALE];
}

/**
 * Traduce contenido que ya existe escrito en español.
 *
 * A diferencia de `translate`, una clave ausente no es un fallo: devuelve el
 * texto original. Es lo que permite ir traduciendo el catálogo académico por
 * partes sin que aparezcan claves crudas en pantalla.
 */
export function translateContent(key: string, locale: Locale, fallback: string): string {
  if (locale === DEFAULT_LOCALE) return fallback;
  const entry = TRANSLATIONS[key];
  if (!entry) return fallback;
  return entry[locale] ?? fallback;
}
