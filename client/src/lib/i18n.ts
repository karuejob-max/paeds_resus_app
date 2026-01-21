/**
 * Internationalization (i18n) system for Paeds Resus
 * Supports multiple languages and regional variants
 */

export type Language = "en" | "sw" | "fr" | "es" | "ar";

export interface TranslationStrings {
  [key: string]: string | TranslationStrings;
}

export const translations: Record<Language, TranslationStrings> = {
  en: {
    common: {
      appName: "Paeds Resus",
      tagline: "No Child Should Die From Preventable Causes",
      home: "Home",
      about: "About",
      contact: "Contact",
      logout: "Logout",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      back: "Back",
      next: "Next",
      previous: "Previous",
      search: "Search",
      filter: "Filter",
      sort: "Sort",
      language: "Language",
    },
    navigation: {
      home: "Home",
      forProviders: "For Providers",
      forInstitutions: "For Institutions",
      facilities: "Facilities",
      resources: "Resources",
      admin: "Admin",
      institutional: "Institutional",
      sms: "SMS",
      verifyCertificate: "Verify Certificate",
      dashboard: "Dashboard",
    },
    auth: {
      login: "Login",
      logout: "Logout",
      signup: "Sign Up",
      email: "Email",
      password: "Password",
      rememberMe: "Remember Me",
      forgotPassword: "Forgot Password?",
      noAccount: "Don't have an account?",
      haveAccount: "Already have an account?",
      loginSuccess: "Login successful",
      logoutSuccess: "Logout successful",
    },
    enrollment: {
      title: "Enrollment",
      selectUserType: "Select User Type",
      healthcare: "Healthcare Provider",
      institutionType: "Institution",
      parent: "Parent/Caregiver",
      learner: "Learner",
      fullName: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      institutionName: "Institution Name",
      enrollNow: "Enroll Now",
      enrollmentSuccess: "Enrollment successful",
    },
    payment: {
      title: "Payment",
      selectMethod: "Select Payment Method",
      mpesa: "M-Pesa",
      bankTransfer: "Bank Transfer",
      card: "Credit/Debit Card",
      amount: "Amount",
      currency: "Currency",
      payNow: "Pay Now",
      paymentSuccess: "Payment successful",
      paymentFailed: "Payment failed",
    },
    certificates: {
      title: "Certificates",
      verify: "Verify Certificate",
      certificateNumber: "Certificate Number",
      recipientName: "Recipient Name",
      courseCompleted: "Course Completed",
      dateIssued: "Date Issued",
      expiryDate: "Expiry Date",
      download: "Download Certificate",
      verifySuccess: "Certificate verified successfully",
      verifyFailed: "Certificate verification failed",
    },
    dashboard: {
      welcome: "Welcome",
      overview: "Overview",
      progress: "Progress",
      statistics: "Statistics",
      recentActivity: "Recent Activity",
      upcomingEvents: "Upcoming Events",
      enrollments: "Enrollments",
      payments: "Payments",
      certificates: "Certificates",
    },
    messages: {
      welcome: "Welcome to Paeds Resus",
      noDataAvailable: "No data available",
      confirmDelete: "Are you sure you want to delete this?",
      unsavedChanges: "You have unsaved changes",
      networkError: "Network error. Please try again.",
      serverError: "Server error. Please try again.",
    },
  },

  sw: {
    common: {
      appName: "Paeds Resus",
      tagline: "Hakuna Mtoto Anayefaa Kufa Kutokana na Magonjwa Yanayoweza Kuzuiwa",
      home: "Nyumbani",
      about: "Kuhusu",
      contact: "Wasiliana",
      logout: "Toka",
      loading: "Inapakia...",
      error: "Hitilafu",
      success: "Imefanikiwa",
      cancel: "Ghairi",
      save: "Hifadhi",
      delete: "Futa",
      edit: "Hariri",
      back: "Nyuma",
      next: "Inayofuata",
      previous: "Iliyotangulia",
      search: "Tafuta",
      filter: "Chuja",
      sort: "Panga",
      language: "Lugha",
    },
    navigation: {
      home: "Nyumbani",
      forProviders: "Kwa Wazazi wa Huduma",
      forInstitutions: "Kwa Taasisi",
      facilities: "Vituo",
      resources: "Rasilimali",
      admin: "Msimamizi",
      institutional: "Taasisi",
      sms: "SMS",
      verifyCertificate: "Thibitisha Cheti",
      dashboard: "Dashibodi",
    },
    auth: {
      login: "Ingia",
      logout: "Toka",
      signup: "Jisajili",
      email: "Barua Pepe",
      password: "Neno la Siri",
      rememberMe: "Nikumbuke",
      forgotPassword: "Umesahau Neno la Siri?",
      noAccount: "Huna akaunti?",
      haveAccount: "Una akaunti tayari?",
      loginSuccess: "Kuingia kumefanikiwa",
      logoutSuccess: "Kutoka kumefanikiwa",
    },
    enrollment: {
      title: "Usajili",
      selectUserType: "Chagua Aina ya Mtumiaji",
      healthcare: "Mtoa Huduma ya Afya",
      institutionType: "Taasisi",
      parent: "Mzazi/Mlezi",
      learner: "Mwanafunzi",
      fullName: "Jina Kamili",
      email: "Anwani ya Barua Pepe",
      phone: "Namba ya Simu",
      institutionName: "Jina la Taasisi",
      enrollNow: "Jisajili Sasa",
      enrollmentSuccess: "Usajili umefanikiwa",
    },
    payment: {
      title: "Malipo",
      selectMethod: "Chagua Njia ya Malipo",
      mpesa: "M-Pesa",
      bankTransfer: "Uhamisho wa Benki",
      card: "Kadi ya Mkopo/Debit",
      amount: "Kiasi",
      currency: "Sarafu",
      payNow: "Lipia Sasa",
      paymentSuccess: "Malipo yamefanikiwa",
      paymentFailed: "Malipo hayakufanikiwa",
    },
    certificates: {
      title: "Vyeti",
      verify: "Thibitisha Cheti",
      certificateNumber: "Namba ya Cheti",
      recipientName: "Jina la Mpokeaji",
      courseCompleted: "Kozi Iliyokamilika",
      dateIssued: "Tarehe ya Kutolewa",
      expiryDate: "Tarehe ya Muda wa Kumalizia",
      download: "Pakua Cheti",
      verifySuccess: "Cheti limethibitishwa kwa mafanikiwa",
      verifyFailed: "Uthibitisho wa Cheti halikufanikiwa",
    },
    dashboard: {
      welcome: "Karibu",
      overview: "Muhtasari",
      progress: "Maendeleo",
      statistics: "Takwimu",
      recentActivity: "Shughuli za Karibuni",
      upcomingEvents: "Matukio Yajayo",
      enrollments: "Usajili",
      payments: "Malipo",
      certificates: "Vyeti",
    },
    messages: {
      welcome: "Karibu kwenye Paeds Resus",
      noDataAvailable: "Hakuna data inayopatikana",
      confirmDelete: "Je, una uhakika kuwa unataka kufuta hii?",
      unsavedChanges: "Una mabadiliko yasiyohifadhiwa",
      networkError: "Hitilafu ya mtandao. Tafadhali jaribu tena.",
      serverError: "Hitilafu ya seva. Tafadhali jaribu tena.",
    },
  },

  fr: {
    common: {
      appName: "Paeds Resus",
      tagline: "Aucun Enfant ne Devrait Mourir de Causes Évitables",
      home: "Accueil",
      about: "À Propos",
      contact: "Contact",
      logout: "Déconnexion",
      loading: "Chargement...",
      error: "Erreur",
      success: "Succès",
      cancel: "Annuler",
      save: "Enregistrer",
      delete: "Supprimer",
      edit: "Modifier",
      back: "Retour",
      next: "Suivant",
      previous: "Précédent",
      search: "Rechercher",
      filter: "Filtrer",
      sort: "Trier",
      language: "Langue",
    },
    navigation: {
      home: "Accueil",
      forProviders: "Pour les Prestataires",
      forInstitutions: "Pour les Institutions",
      facilities: "Établissements",
      resources: "Ressources",
      admin: "Admin",
      institutional: "Institutionnel",
      sms: "SMS",
      verifyCertificate: "Vérifier le Certificat",
      dashboard: "Tableau de Bord",
    },
    auth: {
      login: "Connexion",
      logout: "Déconnexion",
      signup: "S'inscrire",
      email: "Adresse E-mail",
      password: "Mot de Passe",
      rememberMe: "Se Souvenir de Moi",
      forgotPassword: "Mot de Passe Oublié?",
      noAccount: "Pas de Compte?",
      haveAccount: "Avez-vous un Compte?",
      loginSuccess: "Connexion Réussie",
      logoutSuccess: "Déconnexion Réussie",
    },
    enrollment: {
      title: "Inscription",
      selectUserType: "Sélectionner le Type d'Utilisateur",
      healthcare: "Prestataire de Soins de Santé",
      institutionType: "Institution",
      parent: "Parent/Tuteur",
      learner: "Apprenant",
      fullName: "Nom Complet",
      email: "Adresse E-mail",
      phone: "Numéro de Téléphone",
      institutionName: "Nom de l'Institution",
      enrollNow: "S'inscrire Maintenant",
      enrollmentSuccess: "Inscription Réussie",
    },
    payment: {
      title: "Paiement",
      selectMethod: "Sélectionner la Méthode de Paiement",
      mpesa: "M-Pesa",
      bankTransfer: "Virement Bancaire",
      card: "Carte de Crédit/Débit",
      amount: "Montant",
      currency: "Devise",
      payNow: "Payer Maintenant",
      paymentSuccess: "Paiement Réussi",
      paymentFailed: "Paiement Échoué",
    },
    certificates: {
      title: "Certificats",
      verify: "Vérifier le Certificat",
      certificateNumber: "Numéro de Certificat",
      recipientName: "Nom du Destinataire",
      courseCompleted: "Cours Complété",
      dateIssued: "Date d'Émission",
      expiryDate: "Date d'Expiration",
      download: "Télécharger le Certificat",
      verifySuccess: "Certificat Vérifié avec Succès",
      verifyFailed: "Vérification du Certificat Échouée",
    },
    dashboard: {
      welcome: "Bienvenue",
      overview: "Aperçu",
      progress: "Progrès",
      statistics: "Statistiques",
      recentActivity: "Activité Récente",
      upcomingEvents: "Événements à Venir",
      enrollments: "Inscriptions",
      payments: "Paiements",
      certificates: "Certificats",
    },
    messages: {
      welcome: "Bienvenue sur Paeds Resus",
      noDataAvailable: "Aucune Donnée Disponible",
      confirmDelete: "Êtes-vous Sûr de Vouloir Supprimer Ceci?",
      unsavedChanges: "Vous Avez des Modifications Non Enregistrées",
      networkError: "Erreur Réseau. Veuillez Réessayer.",
      serverError: "Erreur Serveur. Veuillez Réessayer.",
    },
  },

  es: {
    common: {
      appName: "Paeds Resus",
      tagline: "Ningún Niño Debería Morir de Causas Prevenibles",
      home: "Inicio",
      about: "Acerca de",
      contact: "Contacto",
      logout: "Cerrar Sesión",
      loading: "Cargando...",
      error: "Error",
      success: "Éxito",
      cancel: "Cancelar",
      save: "Guardar",
      delete: "Eliminar",
      edit: "Editar",
      back: "Atrás",
      next: "Siguiente",
      previous: "Anterior",
      search: "Buscar",
      filter: "Filtrar",
      sort: "Ordenar",
      language: "Idioma",
    },
    navigation: {
      home: "Inicio",
      forProviders: "Para Proveedores",
      forInstitutions: "Para Instituciones",
      facilities: "Instalaciones",
      resources: "Recursos",
      admin: "Admin",
      institutional: "Institucional",
      sms: "SMS",
      verifyCertificate: "Verificar Certificado",
      dashboard: "Panel de Control",
    },
    auth: {
      login: "Iniciar Sesión",
      logout: "Cerrar Sesión",
      signup: "Registrarse",
      email: "Correo Electrónico",
      password: "Contraseña",
      rememberMe: "Recuérdame",
      forgotPassword: "¿Olvidaste tu Contraseña?",
      noAccount: "¿No tienes Cuenta?",
      haveAccount: "¿Ya tienes Cuenta?",
      loginSuccess: "Inicio de Sesión Exitoso",
      logoutSuccess: "Cierre de Sesión Exitoso",
    },
    enrollment: {
      title: "Inscripción",
      selectUserType: "Seleccionar Tipo de Usuario",
      healthcare: "Proveedor de Atención Médica",
      institutionType: "Institución",
      parent: "Padre/Tutor",
      learner: "Aprendiz",
      fullName: "Nombre Completo",
      email: "Correo Electrónico",
      phone: "Número de Teléfono",
      institutionName: "Nombre de la Institución",
      enrollNow: "Inscribirse Ahora",
      enrollmentSuccess: "Inscripción Exitosa",
    },
    payment: {
      title: "Pago",
      selectMethod: "Seleccionar Método de Pago",
      mpesa: "M-Pesa",
      bankTransfer: "Transferencia Bancaria",
      card: "Tarjeta de Crédito/Débito",
      amount: "Cantidad",
      currency: "Moneda",
      payNow: "Pagar Ahora",
      paymentSuccess: "Pago Exitoso",
      paymentFailed: "Pago Fallido",
    },
    certificates: {
      title: "Certificados",
      verify: "Verificar Certificado",
      certificateNumber: "Número de Certificado",
      recipientName: "Nombre del Destinatario",
      courseCompleted: "Curso Completado",
      dateIssued: "Fecha de Emisión",
      expiryDate: "Fecha de Vencimiento",
      download: "Descargar Certificado",
      verifySuccess: "Certificado Verificado Exitosamente",
      verifyFailed: "Verificación de Certificado Fallida",
    },
    dashboard: {
      welcome: "Bienvenido",
      overview: "Resumen",
      progress: "Progreso",
      statistics: "Estadísticas",
      recentActivity: "Actividad Reciente",
      upcomingEvents: "Próximos Eventos",
      enrollments: "Inscripciones",
      payments: "Pagos",
      certificates: "Certificados",
    },
    messages: {
      welcome: "Bienvenido a Paeds Resus",
      noDataAvailable: "No Hay Datos Disponibles",
      confirmDelete: "¿Estás Seguro de que Deseas Eliminar Esto?",
      unsavedChanges: "Tienes Cambios Sin Guardar",
      networkError: "Error de Red. Por Favor Intenta de Nuevo.",
      serverError: "Error del Servidor. Por Favor Intenta de Nuevo.",
    },
  },

  ar: {
    common: {
      appName: "باديز ريسس",
      tagline: "لا يجب أن يموت أي طفل من أسباب يمكن الوقاية منها",
      home: "الرئيسية",
      about: "حول",
      contact: "اتصل",
      logout: "تسجيل الخروج",
      loading: "جاري التحميل...",
      error: "خطأ",
      success: "نجح",
      cancel: "إلغاء",
      save: "حفظ",
      delete: "حذف",
      edit: "تحرير",
      back: "رجوع",
      next: "التالي",
      previous: "السابق",
      search: "بحث",
      filter: "تصفية",
      sort: "ترتيب",
      language: "اللغة",
    },
    navigation: {
      home: "الرئيسية",
      forProviders: "للمزودين",
      forInstitutions: "للمؤسسات",
      facilities: "المرافق",
      resources: "الموارد",
      admin: "الإدارة",
      institutional: "المؤسسي",
      sms: "الرسائل النصية",
      verifyCertificate: "التحقق من الشهادة",
      dashboard: "لوحة التحكم",
    },
    auth: {
      login: "تسجيل الدخول",
      logout: "تسجيل الخروج",
      signup: "إنشاء حساب",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      rememberMe: "تذكرني",
      forgotPassword: "هل نسيت كلمة المرور؟",
      noAccount: "ليس لديك حساب؟",
      haveAccount: "هل لديك حساب بالفعل؟",
      loginSuccess: "تم تسجيل الدخول بنجاح",
      logoutSuccess: "تم تسجيل الخروج بنجاح",
    },
    enrollment: {
      title: "التسجيل",
      selectUserType: "اختر نوع المستخدم",
      healthcare: "مزود الرعاية الصحية",
      institutionType: "المؤسسة",
      parent: "الوالد/الوصي",
      learner: "المتعلم",
      fullName: "الاسم الكامل",
      email: "البريد الإلكتروني",
      phone: "رقم الهاتف",
      institutionName: "اسم المؤسسة",
      enrollNow: "التسجيل الآن",
      enrollmentSuccess: "تم التسجيل بنجاح",
    },
    payment: {
      title: "الدفع",
      selectMethod: "اختر طريقة الدفع",
      mpesa: "M-Pesa",
      bankTransfer: "التحويل البنكي",
      card: "بطاقة الائتمان/الخصم",
      amount: "المبلغ",
      currency: "العملة",
      payNow: "ادفع الآن",
      paymentSuccess: "تم الدفع بنجاح",
      paymentFailed: "فشل الدفع",
    },
    certificates: {
      title: "الشهادات",
      verify: "التحقق من الشهادة",
      certificateNumber: "رقم الشهادة",
      recipientName: "اسم المستقبل",
      courseCompleted: "اكتمل المسار",
      dateIssued: "تاريخ الإصدار",
      expiryDate: "تاريخ الانتهاء",
      download: "تحميل الشهادة",
      verifySuccess: "تم التحقق من الشهادة بنجاح",
      verifyFailed: "فشل التحقق من الشهادة",
    },
    dashboard: {
      welcome: "أهلا وسهلا",
      overview: "نظرة عامة",
      progress: "التقدم",
      statistics: "الإحصائيات",
      recentActivity: "النشاط الأخير",
      upcomingEvents: "الأحداث القادمة",
      enrollments: "التسجيلات",
      payments: "الدفعات",
      certificates: "الشهادات",
    },
    messages: {
      welcome: "أهلا وسهلا بك في باديز ريسس",
      noDataAvailable: "لا توجد بيانات متاحة",
      confirmDelete: "هل أنت متأكد من أنك تريد حذف هذا؟",
      unsavedChanges: "لديك تغييرات لم يتم حفظها",
      networkError: "خطأ في الشبكة. يرجى المحاولة مرة أخرى.",
      serverError: "خطأ في الخادم. يرجى المحاولة مرة أخرى.",
    },
  },
};

/**
 * Get translation for a key
 */
export function t(language: Language, key: string, defaultValue: string = key): string {
  const keys = key.split(".");
  let value: unknown = translations[language];

  for (const k of keys) {
    if (typeof value === "object" && value !== null && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return defaultValue;
    }
  }

  return typeof value === "string" ? value : defaultValue;
}

/**
 * Get all translations for a language
 */
export function getLanguageTranslations(language: Language): TranslationStrings {
  return translations[language];
}

/**
 * Detect user's preferred language
 */
export function detectLanguage(): Language {
  if (typeof navigator === "undefined") return "en";

  const browserLang = navigator.language.split("-")[0];
  const supportedLanguages: Language[] = ["en", "sw", "fr", "es", "ar"];

  if (supportedLanguages.includes(browserLang as Language)) {
    return browserLang as Language;
  }

  return "en";
}

/**
 * Format currency based on language
 */
export function formatCurrency(amount: number, language: Language, currency: string = "KES"): string {
  const localeMap: Record<Language, string> = {
    en: "en-US",
    sw: "sw-TZ",
    fr: "fr-FR",
    es: "es-ES",
    ar: "ar-SA",
  };

  return new Intl.NumberFormat(localeMap[language], {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Format date based on language
 */
export function formatDate(date: Date, language: Language): string {
  const localeMap: Record<Language, string> = {
    en: "en-US",
    sw: "sw-TZ",
    fr: "fr-FR",
    es: "es-ES",
    ar: "ar-SA",
  };

  return new Intl.DateTimeFormat(localeMap[language], {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Format time based on language
 */
export function formatTime(date: Date, language: Language): string {
  const localeMap: Record<Language, string> = {
    en: "en-US",
    sw: "sw-TZ",
    fr: "fr-FR",
    es: "es-ES",
    ar: "ar-SA",
  };

  return new Intl.DateTimeFormat(localeMap[language], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

/**
 * Get text direction for language
 */
export function getTextDirection(language: Language): "ltr" | "rtl" {
  return language === "ar" ? "rtl" : "ltr";
}
