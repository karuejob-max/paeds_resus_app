/**
 * Multi-Language Support System
 * 
 * Provides translations for Swahili (sw), French (fr), and Arabic (ar)
 * to expand reach across LMICs where English may not be primary language.
 */

export type SupportedLanguage = 'en' | 'sw' | 'fr' | 'ar';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  region: string[];
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', region: ['Global', 'Kenya', 'Nigeria', 'South Africa'] },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', direction: 'ltr', region: ['Kenya', 'Tanzania', 'Uganda', 'DRC', 'Rwanda'] },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', region: ['DRC', 'Senegal', 'Cameroon', 'Côte d\'Ivoire', 'Mali'] },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', region: ['Egypt', 'Sudan', 'Morocco', 'Algeria', 'Tunisia'] }
];

/**
 * Translation dictionary type
 */
export interface TranslationDictionary {
  // Navigation & UI
  nav: {
    home: string;
    clinicalAssessment: string;
    nrp: string;
    trauma: string;
    cprClock: string;
    procedures: string;
    simulations: string;
    settings: string;
    logout: string;
  };
  
  // Common actions
  actions: {
    start: string;
    stop: string;
    pause: string;
    resume: string;
    next: string;
    back: string;
    confirm: string;
    cancel: string;
    save: string;
    reset: string;
    complete: string;
    skip: string;
    retry: string;
    yes: string;
    no: string;
    done: string;
  };
  
  // Patient information
  patient: {
    age: string;
    weight: string;
    years: string;
    months: string;
    kg: string;
    estimatedWeight: string;
    actualWeight: string;
    gender: string;
    male: string;
    female: string;
  };
  
  // Clinical assessment
  assessment: {
    title: string;
    startAssessment: string;
    enterPatientInfo: string;
    signsOfLife: string;
    breathing: string;
    notBreathing: string;
    pulse: string;
    noPulse: string;
    responsive: string;
    unresponsive: string;
    airway: string;
    circulation: string;
    disability: string;
    exposure: string;
    reassess: string;
    better: string;
    same: string;
    worse: string;
  };
  
  // Vital signs
  vitals: {
    heartRate: string;
    respiratoryRate: string;
    bloodPressure: string;
    oxygenSaturation: string;
    temperature: string;
    capillaryRefill: string;
    consciousness: string;
    pupils: string;
    bpm: string;
    breaths: string;
    mmHg: string;
    percent: string;
    celsius: string;
    seconds: string;
  };
  
  // Interventions
  interventions: {
    immediateAction: string;
    doThisNow: string;
    callForHelp: string;
    startCPR: string;
    giveOxygen: string;
    establishAccess: string;
    giveMedication: string;
    prepareEquipment: string;
    monitorPatient: string;
    reassessIn: string;
    completed: string;
    overridden: string;
    whyThisAction: string;
  };
  
  // Medications
  medications: {
    drug: string;
    dose: string;
    route: string;
    volume: string;
    concentration: string;
    maxDose: string;
    dilution: string;
    administration: string;
    warnings: string;
    contraindications: string;
    sideEffects: string;
  };
  
  // Emergency scenarios
  emergencies: {
    cardiacArrest: string;
    anaphylaxis: string;
    statusEpilepticus: string;
    septicShock: string;
    respiratoryFailure: string;
    dka: string;
    trauma: string;
    neonatal: string;
  };
  
  // Alerts and warnings
  alerts: {
    critical: string;
    warning: string;
    caution: string;
    info: string;
    success: string;
    error: string;
    timerExpired: string;
    actionRequired: string;
    reassessmentDue: string;
    maxDoseReached: string;
    contraindicated: string;
  };
  
  // CPR specific
  cpr: {
    startCPR: string;
    stopCPR: string;
    compressions: string;
    ventilations: string;
    shockDelivered: string;
    rosc: string;
    pulseCheck: string;
    rhythmCheck: string;
    epinephrineGiven: string;
    amiodaroneGiven: string;
    elapsed: string;
    cycles: string;
  };
  
  // Simulation mode
  simulation: {
    title: string;
    practiceMode: string;
    startSimulation: string;
    endSimulation: string;
    score: string;
    passed: string;
    failed: string;
    feedback: string;
    correctActions: string;
    missedActions: string;
    criticalErrors: string;
    tryAgain: string;
    viewDebriefing: string;
  };
  
  // Procedures
  procedures: {
    title: string;
    watchVideo: string;
    keyPoints: string;
    commonErrors: string;
    equipment: string;
    indications: string;
    contraindications: string;
    steps: string;
  };
  
  // Time-related
  time: {
    seconds: string;
    minutes: string;
    hours: string;
    elapsed: string;
    remaining: string;
    now: string;
    overdue: string;
  };
}

/**
 * English translations (default)
 */
const en: TranslationDictionary = {
  nav: {
    home: 'Home',
    clinicalAssessment: 'Clinical Assessment',
    nrp: 'Neonatal Resuscitation',
    trauma: 'Trauma Assessment',
    cprClock: 'CPR Clock',
    procedures: 'Procedures',
    simulations: 'Simulations',
    settings: 'Settings',
    logout: 'Logout'
  },
  actions: {
    start: 'Start',
    stop: 'Stop',
    pause: 'Pause',
    resume: 'Resume',
    next: 'Next',
    back: 'Back',
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    reset: 'Reset',
    complete: 'Complete',
    skip: 'Skip',
    retry: 'Retry',
    yes: 'Yes',
    no: 'No',
    done: 'Done'
  },
  patient: {
    age: 'Age',
    weight: 'Weight',
    years: 'years',
    months: 'months',
    kg: 'kg',
    estimatedWeight: 'Estimated Weight',
    actualWeight: 'Actual Weight',
    gender: 'Gender',
    male: 'Male',
    female: 'Female'
  },
  assessment: {
    title: 'Clinical Assessment',
    startAssessment: 'Start Assessment',
    enterPatientInfo: 'Enter Patient Information',
    signsOfLife: 'Signs of Life',
    breathing: 'Breathing',
    notBreathing: 'Not Breathing',
    pulse: 'Pulse Present',
    noPulse: 'No Pulse',
    responsive: 'Responsive',
    unresponsive: 'Unresponsive',
    airway: 'Airway',
    circulation: 'Circulation',
    disability: 'Disability',
    exposure: 'Exposure',
    reassess: 'Reassess',
    better: 'Better',
    same: 'Same',
    worse: 'Worse'
  },
  vitals: {
    heartRate: 'Heart Rate',
    respiratoryRate: 'Respiratory Rate',
    bloodPressure: 'Blood Pressure',
    oxygenSaturation: 'Oxygen Saturation',
    temperature: 'Temperature',
    capillaryRefill: 'Capillary Refill',
    consciousness: 'Consciousness',
    pupils: 'Pupils',
    bpm: 'bpm',
    breaths: 'breaths/min',
    mmHg: 'mmHg',
    percent: '%',
    celsius: '°C',
    seconds: 'sec'
  },
  interventions: {
    immediateAction: 'IMMEDIATE ACTION REQUIRED',
    doThisNow: 'Do this NOW',
    callForHelp: 'Call for Help',
    startCPR: 'Start CPR',
    giveOxygen: 'Give Oxygen',
    establishAccess: 'Establish IV/IO Access',
    giveMedication: 'Give Medication',
    prepareEquipment: 'Prepare Equipment',
    monitorPatient: 'Monitor Patient',
    reassessIn: 'Reassess in',
    completed: 'Completed',
    overridden: 'Overridden',
    whyThisAction: 'Why this action?'
  },
  medications: {
    drug: 'Drug',
    dose: 'Dose',
    route: 'Route',
    volume: 'Volume',
    concentration: 'Concentration',
    maxDose: 'Maximum Dose',
    dilution: 'Dilution',
    administration: 'Administration',
    warnings: 'Warnings',
    contraindications: 'Contraindications',
    sideEffects: 'Side Effects'
  },
  emergencies: {
    cardiacArrest: 'Cardiac Arrest',
    anaphylaxis: 'Anaphylaxis',
    statusEpilepticus: 'Status Epilepticus',
    septicShock: 'Septic Shock',
    respiratoryFailure: 'Respiratory Failure',
    dka: 'Diabetic Ketoacidosis',
    trauma: 'Trauma',
    neonatal: 'Neonatal Emergency'
  },
  alerts: {
    critical: 'CRITICAL',
    warning: 'WARNING',
    caution: 'CAUTION',
    info: 'INFO',
    success: 'SUCCESS',
    error: 'ERROR',
    timerExpired: 'Timer Expired',
    actionRequired: 'Action Required',
    reassessmentDue: 'Reassessment Due',
    maxDoseReached: 'Maximum Dose Reached',
    contraindicated: 'Contraindicated'
  },
  cpr: {
    startCPR: 'Start CPR',
    stopCPR: 'Stop CPR',
    compressions: 'Compressions',
    ventilations: 'Ventilations',
    shockDelivered: 'Shock Delivered',
    rosc: 'ROSC',
    pulseCheck: 'Pulse Check',
    rhythmCheck: 'Rhythm Check',
    epinephrineGiven: 'Epinephrine Given',
    amiodaroneGiven: 'Amiodarone Given',
    elapsed: 'Elapsed',
    cycles: 'Cycles'
  },
  simulation: {
    title: 'Case Simulation',
    practiceMode: 'Practice Mode',
    startSimulation: 'Start Simulation',
    endSimulation: 'End Simulation',
    score: 'Score',
    passed: 'PASSED',
    failed: 'FAILED',
    feedback: 'Feedback',
    correctActions: 'Correct Actions',
    missedActions: 'Missed Actions',
    criticalErrors: 'Critical Errors',
    tryAgain: 'Try Again',
    viewDebriefing: 'View Debriefing'
  },
  procedures: {
    title: 'Procedure Library',
    watchVideo: 'Watch Video',
    keyPoints: 'Key Points',
    commonErrors: 'Common Errors',
    equipment: 'Equipment Needed',
    indications: 'Indications',
    contraindications: 'Contraindications',
    steps: 'Steps'
  },
  time: {
    seconds: 'seconds',
    minutes: 'minutes',
    hours: 'hours',
    elapsed: 'elapsed',
    remaining: 'remaining',
    now: 'now',
    overdue: 'overdue'
  }
};

/**
 * Swahili translations
 */
const sw: TranslationDictionary = {
  nav: {
    home: 'Nyumbani',
    clinicalAssessment: 'Tathmini ya Kimatibabu',
    nrp: 'Ufufuaji wa Watoto Wachanga',
    trauma: 'Tathmini ya Jeraha',
    cprClock: 'Saa ya CPR',
    procedures: 'Taratibu',
    simulations: 'Mazoezi',
    settings: 'Mipangilio',
    logout: 'Ondoka'
  },
  actions: {
    start: 'Anza',
    stop: 'Simama',
    pause: 'Pumzika',
    resume: 'Endelea',
    next: 'Ifuatayo',
    back: 'Rudi',
    confirm: 'Thibitisha',
    cancel: 'Ghairi',
    save: 'Hifadhi',
    reset: 'Weka upya',
    complete: 'Maliza',
    skip: 'Ruka',
    retry: 'Jaribu tena',
    yes: 'Ndiyo',
    no: 'Hapana',
    done: 'Imekamilika'
  },
  patient: {
    age: 'Umri',
    weight: 'Uzito',
    years: 'miaka',
    months: 'miezi',
    kg: 'kg',
    estimatedWeight: 'Uzito Uliokadiriwa',
    actualWeight: 'Uzito Halisi',
    gender: 'Jinsia',
    male: 'Kiume',
    female: 'Kike'
  },
  assessment: {
    title: 'Tathmini ya Kimatibabu',
    startAssessment: 'Anza Tathmini',
    enterPatientInfo: 'Ingiza Taarifa za Mgonjwa',
    signsOfLife: 'Dalili za Uhai',
    breathing: 'Anapumua',
    notBreathing: 'Hapumui',
    pulse: 'Mapigo Yapo',
    noPulse: 'Hakuna Mapigo',
    responsive: 'Anajibu',
    unresponsive: 'Hajibu',
    airway: 'Njia ya Hewa',
    circulation: 'Mzunguko wa Damu',
    disability: 'Ulemavu',
    exposure: 'Uchunguzi',
    reassess: 'Tathmini Tena',
    better: 'Bora zaidi',
    same: 'Sawa',
    worse: 'Mbaya zaidi'
  },
  vitals: {
    heartRate: 'Kiwango cha Moyo',
    respiratoryRate: 'Kiwango cha Kupumua',
    bloodPressure: 'Shinikizo la Damu',
    oxygenSaturation: 'Kiwango cha Oksijeni',
    temperature: 'Joto',
    capillaryRefill: 'Kujaza kwa Kapilari',
    consciousness: 'Fahamu',
    pupils: 'Mboni',
    bpm: 'mapigo/dakika',
    breaths: 'pumzi/dakika',
    mmHg: 'mmHg',
    percent: '%',
    celsius: '°C',
    seconds: 'sekunde'
  },
  interventions: {
    immediateAction: 'HATUA YA HARAKA INAHITAJIKA',
    doThisNow: 'Fanya hivi SASA',
    callForHelp: 'Omba Msaada',
    startCPR: 'Anza CPR',
    giveOxygen: 'Toa Oksijeni',
    establishAccess: 'Weka IV/IO',
    giveMedication: 'Toa Dawa',
    prepareEquipment: 'Andaa Vifaa',
    monitorPatient: 'Fuatilia Mgonjwa',
    reassessIn: 'Tathmini tena baada ya',
    completed: 'Imekamilika',
    overridden: 'Imepuuzwa',
    whyThisAction: 'Kwa nini hatua hii?'
  },
  medications: {
    drug: 'Dawa',
    dose: 'Kipimo',
    route: 'Njia',
    volume: 'Kiasi',
    concentration: 'Mkusanyiko',
    maxDose: 'Kipimo cha Juu',
    dilution: 'Kuyeyusha',
    administration: 'Utoaji',
    warnings: 'Onyo',
    contraindications: 'Vizuizi',
    sideEffects: 'Madhara'
  },
  emergencies: {
    cardiacArrest: 'Kusimama kwa Moyo',
    anaphylaxis: 'Mzio Mkali',
    statusEpilepticus: 'Kifafa Kinachoendelea',
    septicShock: 'Mshtuko wa Septic',
    respiratoryFailure: 'Kushindwa kwa Kupumua',
    dka: 'Ketoacidosis ya Kisukari',
    trauma: 'Jeraha',
    neonatal: 'Dharura ya Mtoto Mchanga'
  },
  alerts: {
    critical: 'MUHIMU SANA',
    warning: 'ONYO',
    caution: 'TAHADHARI',
    info: 'TAARIFA',
    success: 'IMEFANIKIWA',
    error: 'KOSA',
    timerExpired: 'Muda Umeisha',
    actionRequired: 'Hatua Inahitajika',
    reassessmentDue: 'Tathmini Tena Sasa',
    maxDoseReached: 'Kipimo cha Juu Kimefikiwa',
    contraindicated: 'Imekatazwa'
  },
  cpr: {
    startCPR: 'Anza CPR',
    stopCPR: 'Simamisha CPR',
    compressions: 'Kushinikiza',
    ventilations: 'Kupumzisha',
    shockDelivered: 'Mshtuko Umetolewa',
    rosc: 'Moyo Umerudi',
    pulseCheck: 'Angalia Mapigo',
    rhythmCheck: 'Angalia Mdundo',
    epinephrineGiven: 'Epinephrine Imetolewa',
    amiodaroneGiven: 'Amiodarone Imetolewa',
    elapsed: 'Imepita',
    cycles: 'Mizunguko'
  },
  simulation: {
    title: 'Mazoezi ya Kesi',
    practiceMode: 'Hali ya Mazoezi',
    startSimulation: 'Anza Mazoezi',
    endSimulation: 'Maliza Mazoezi',
    score: 'Alama',
    passed: 'UMEFAULU',
    failed: 'UMESHINDWA',
    feedback: 'Maoni',
    correctActions: 'Hatua Sahihi',
    missedActions: 'Hatua Zilizokosekana',
    criticalErrors: 'Makosa Makubwa',
    tryAgain: 'Jaribu Tena',
    viewDebriefing: 'Tazama Muhtasari'
  },
  procedures: {
    title: 'Maktaba ya Taratibu',
    watchVideo: 'Tazama Video',
    keyPoints: 'Mambo Muhimu',
    commonErrors: 'Makosa ya Kawaida',
    equipment: 'Vifaa Vinavyohitajika',
    indications: 'Dalili',
    contraindications: 'Vizuizi',
    steps: 'Hatua'
  },
  time: {
    seconds: 'sekunde',
    minutes: 'dakika',
    hours: 'masaa',
    elapsed: 'imepita',
    remaining: 'imebaki',
    now: 'sasa',
    overdue: 'imechelewa'
  }
};

/**
 * French translations
 */
const fr: TranslationDictionary = {
  nav: {
    home: 'Accueil',
    clinicalAssessment: 'Évaluation Clinique',
    nrp: 'Réanimation Néonatale',
    trauma: 'Évaluation Traumatique',
    cprClock: 'Horloge RCP',
    procedures: 'Procédures',
    simulations: 'Simulations',
    settings: 'Paramètres',
    logout: 'Déconnexion'
  },
  actions: {
    start: 'Démarrer',
    stop: 'Arrêter',
    pause: 'Pause',
    resume: 'Reprendre',
    next: 'Suivant',
    back: 'Retour',
    confirm: 'Confirmer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    reset: 'Réinitialiser',
    complete: 'Terminer',
    skip: 'Passer',
    retry: 'Réessayer',
    yes: 'Oui',
    no: 'Non',
    done: 'Terminé'
  },
  patient: {
    age: 'Âge',
    weight: 'Poids',
    years: 'ans',
    months: 'mois',
    kg: 'kg',
    estimatedWeight: 'Poids Estimé',
    actualWeight: 'Poids Réel',
    gender: 'Sexe',
    male: 'Masculin',
    female: 'Féminin'
  },
  assessment: {
    title: 'Évaluation Clinique',
    startAssessment: 'Commencer l\'Évaluation',
    enterPatientInfo: 'Entrer les Informations du Patient',
    signsOfLife: 'Signes de Vie',
    breathing: 'Respire',
    notBreathing: 'Ne Respire Pas',
    pulse: 'Pouls Présent',
    noPulse: 'Pas de Pouls',
    responsive: 'Réactif',
    unresponsive: 'Non Réactif',
    airway: 'Voies Aériennes',
    circulation: 'Circulation',
    disability: 'Neurologique',
    exposure: 'Exposition',
    reassess: 'Réévaluer',
    better: 'Mieux',
    same: 'Pareil',
    worse: 'Pire'
  },
  vitals: {
    heartRate: 'Fréquence Cardiaque',
    respiratoryRate: 'Fréquence Respiratoire',
    bloodPressure: 'Pression Artérielle',
    oxygenSaturation: 'Saturation en Oxygène',
    temperature: 'Température',
    capillaryRefill: 'Recoloration Capillaire',
    consciousness: 'Conscience',
    pupils: 'Pupilles',
    bpm: 'bpm',
    breaths: 'resp/min',
    mmHg: 'mmHg',
    percent: '%',
    celsius: '°C',
    seconds: 'sec'
  },
  interventions: {
    immediateAction: 'ACTION IMMÉDIATE REQUISE',
    doThisNow: 'Faites ceci MAINTENANT',
    callForHelp: 'Appeler à l\'Aide',
    startCPR: 'Commencer la RCP',
    giveOxygen: 'Donner de l\'Oxygène',
    establishAccess: 'Établir un Accès IV/IO',
    giveMedication: 'Administrer le Médicament',
    prepareEquipment: 'Préparer l\'Équipement',
    monitorPatient: 'Surveiller le Patient',
    reassessIn: 'Réévaluer dans',
    completed: 'Terminé',
    overridden: 'Annulé',
    whyThisAction: 'Pourquoi cette action?'
  },
  medications: {
    drug: 'Médicament',
    dose: 'Dose',
    route: 'Voie',
    volume: 'Volume',
    concentration: 'Concentration',
    maxDose: 'Dose Maximale',
    dilution: 'Dilution',
    administration: 'Administration',
    warnings: 'Avertissements',
    contraindications: 'Contre-indications',
    sideEffects: 'Effets Secondaires'
  },
  emergencies: {
    cardiacArrest: 'Arrêt Cardiaque',
    anaphylaxis: 'Anaphylaxie',
    statusEpilepticus: 'État de Mal Épileptique',
    septicShock: 'Choc Septique',
    respiratoryFailure: 'Insuffisance Respiratoire',
    dka: 'Acidocétose Diabétique',
    trauma: 'Traumatisme',
    neonatal: 'Urgence Néonatale'
  },
  alerts: {
    critical: 'CRITIQUE',
    warning: 'ATTENTION',
    caution: 'PRUDENCE',
    info: 'INFO',
    success: 'SUCCÈS',
    error: 'ERREUR',
    timerExpired: 'Temps Écoulé',
    actionRequired: 'Action Requise',
    reassessmentDue: 'Réévaluation Nécessaire',
    maxDoseReached: 'Dose Maximale Atteinte',
    contraindicated: 'Contre-indiqué'
  },
  cpr: {
    startCPR: 'Commencer la RCP',
    stopCPR: 'Arrêter la RCP',
    compressions: 'Compressions',
    ventilations: 'Ventilations',
    shockDelivered: 'Choc Délivré',
    rosc: 'RACS',
    pulseCheck: 'Vérifier le Pouls',
    rhythmCheck: 'Vérifier le Rythme',
    epinephrineGiven: 'Épinéphrine Administrée',
    amiodaroneGiven: 'Amiodarone Administrée',
    elapsed: 'Écoulé',
    cycles: 'Cycles'
  },
  simulation: {
    title: 'Simulation de Cas',
    practiceMode: 'Mode Pratique',
    startSimulation: 'Démarrer la Simulation',
    endSimulation: 'Terminer la Simulation',
    score: 'Score',
    passed: 'RÉUSSI',
    failed: 'ÉCHOUÉ',
    feedback: 'Retour',
    correctActions: 'Actions Correctes',
    missedActions: 'Actions Manquées',
    criticalErrors: 'Erreurs Critiques',
    tryAgain: 'Réessayer',
    viewDebriefing: 'Voir le Débriefing'
  },
  procedures: {
    title: 'Bibliothèque de Procédures',
    watchVideo: 'Regarder la Vidéo',
    keyPoints: 'Points Clés',
    commonErrors: 'Erreurs Courantes',
    equipment: 'Équipement Nécessaire',
    indications: 'Indications',
    contraindications: 'Contre-indications',
    steps: 'Étapes'
  },
  time: {
    seconds: 'secondes',
    minutes: 'minutes',
    hours: 'heures',
    elapsed: 'écoulé',
    remaining: 'restant',
    now: 'maintenant',
    overdue: 'en retard'
  }
};

/**
 * Arabic translations
 */
const ar: TranslationDictionary = {
  nav: {
    home: 'الرئيسية',
    clinicalAssessment: 'التقييم السريري',
    nrp: 'إنعاش حديثي الولادة',
    trauma: 'تقييم الإصابات',
    cprClock: 'ساعة الإنعاش',
    procedures: 'الإجراءات',
    simulations: 'المحاكاة',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج'
  },
  actions: {
    start: 'ابدأ',
    stop: 'توقف',
    pause: 'إيقاف مؤقت',
    resume: 'استئناف',
    next: 'التالي',
    back: 'رجوع',
    confirm: 'تأكيد',
    cancel: 'إلغاء',
    save: 'حفظ',
    reset: 'إعادة تعيين',
    complete: 'إكمال',
    skip: 'تخطي',
    retry: 'إعادة المحاولة',
    yes: 'نعم',
    no: 'لا',
    done: 'تم'
  },
  patient: {
    age: 'العمر',
    weight: 'الوزن',
    years: 'سنوات',
    months: 'أشهر',
    kg: 'كجم',
    estimatedWeight: 'الوزن المقدر',
    actualWeight: 'الوزن الفعلي',
    gender: 'الجنس',
    male: 'ذكر',
    female: 'أنثى'
  },
  assessment: {
    title: 'التقييم السريري',
    startAssessment: 'بدء التقييم',
    enterPatientInfo: 'أدخل معلومات المريض',
    signsOfLife: 'علامات الحياة',
    breathing: 'يتنفس',
    notBreathing: 'لا يتنفس',
    pulse: 'النبض موجود',
    noPulse: 'لا يوجد نبض',
    responsive: 'مستجيب',
    unresponsive: 'غير مستجيب',
    airway: 'مجرى الهواء',
    circulation: 'الدورة الدموية',
    disability: 'الحالة العصبية',
    exposure: 'الفحص',
    reassess: 'إعادة التقييم',
    better: 'أفضل',
    same: 'نفس الحالة',
    worse: 'أسوأ'
  },
  vitals: {
    heartRate: 'معدل ضربات القلب',
    respiratoryRate: 'معدل التنفس',
    bloodPressure: 'ضغط الدم',
    oxygenSaturation: 'تشبع الأكسجين',
    temperature: 'درجة الحرارة',
    capillaryRefill: 'إعادة ملء الشعيرات',
    consciousness: 'الوعي',
    pupils: 'الحدقتان',
    bpm: 'نبضة/دقيقة',
    breaths: 'نفس/دقيقة',
    mmHg: 'ملم زئبق',
    percent: '%',
    celsius: 'درجة مئوية',
    seconds: 'ثانية'
  },
  interventions: {
    immediateAction: 'إجراء فوري مطلوب',
    doThisNow: 'افعل هذا الآن',
    callForHelp: 'اطلب المساعدة',
    startCPR: 'ابدأ الإنعاش القلبي',
    giveOxygen: 'أعطِ الأكسجين',
    establishAccess: 'أنشئ خط وريدي',
    giveMedication: 'أعطِ الدواء',
    prepareEquipment: 'جهز المعدات',
    monitorPatient: 'راقب المريض',
    reassessIn: 'أعد التقييم خلال',
    completed: 'مكتمل',
    overridden: 'تم التجاوز',
    whyThisAction: 'لماذا هذا الإجراء؟'
  },
  medications: {
    drug: 'الدواء',
    dose: 'الجرعة',
    route: 'طريقة الإعطاء',
    volume: 'الحجم',
    concentration: 'التركيز',
    maxDose: 'الجرعة القصوى',
    dilution: 'التخفيف',
    administration: 'الإعطاء',
    warnings: 'تحذيرات',
    contraindications: 'موانع الاستعمال',
    sideEffects: 'الآثار الجانبية'
  },
  emergencies: {
    cardiacArrest: 'السكتة القلبية',
    anaphylaxis: 'الحساسية المفرطة',
    statusEpilepticus: 'حالة الصرع',
    septicShock: 'الصدمة الإنتانية',
    respiratoryFailure: 'فشل التنفس',
    dka: 'الحماض الكيتوني السكري',
    trauma: 'الإصابة',
    neonatal: 'طوارئ حديثي الولادة'
  },
  alerts: {
    critical: 'حرج',
    warning: 'تحذير',
    caution: 'احتياط',
    info: 'معلومات',
    success: 'نجاح',
    error: 'خطأ',
    timerExpired: 'انتهى الوقت',
    actionRequired: 'إجراء مطلوب',
    reassessmentDue: 'موعد إعادة التقييم',
    maxDoseReached: 'تم الوصول للجرعة القصوى',
    contraindicated: 'ممنوع'
  },
  cpr: {
    startCPR: 'ابدأ الإنعاش',
    stopCPR: 'أوقف الإنعاش',
    compressions: 'الضغطات',
    ventilations: 'التنفس',
    shockDelivered: 'تم إعطاء الصدمة',
    rosc: 'عودة الدورة الدموية',
    pulseCheck: 'فحص النبض',
    rhythmCheck: 'فحص النظم',
    epinephrineGiven: 'تم إعطاء الإبينفرين',
    amiodaroneGiven: 'تم إعطاء الأميودارون',
    elapsed: 'المنقضي',
    cycles: 'الدورات'
  },
  simulation: {
    title: 'محاكاة الحالات',
    practiceMode: 'وضع التدريب',
    startSimulation: 'بدء المحاكاة',
    endSimulation: 'إنهاء المحاكاة',
    score: 'النتيجة',
    passed: 'ناجح',
    failed: 'راسب',
    feedback: 'التغذية الراجعة',
    correctActions: 'الإجراءات الصحيحة',
    missedActions: 'الإجراءات المفقودة',
    criticalErrors: 'الأخطاء الحرجة',
    tryAgain: 'حاول مرة أخرى',
    viewDebriefing: 'عرض الملخص'
  },
  procedures: {
    title: 'مكتبة الإجراءات',
    watchVideo: 'شاهد الفيديو',
    keyPoints: 'النقاط الرئيسية',
    commonErrors: 'الأخطاء الشائعة',
    equipment: 'المعدات المطلوبة',
    indications: 'دواعي الاستعمال',
    contraindications: 'موانع الاستعمال',
    steps: 'الخطوات'
  },
  time: {
    seconds: 'ثواني',
    minutes: 'دقائق',
    hours: 'ساعات',
    elapsed: 'منقضي',
    remaining: 'متبقي',
    now: 'الآن',
    overdue: 'متأخر'
  }
};

/**
 * All translations
 */
const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en,
  sw,
  fr,
  ar
};

/**
 * Get translation dictionary for a language
 */
export function getTranslations(language: SupportedLanguage): TranslationDictionary {
  return translations[language] || translations.en;
}

/**
 * Get a specific translation by path
 */
export function t(language: SupportedLanguage, path: string): string {
  const dict = getTranslations(language);
  const keys = path.split('.');
  let result: unknown = dict;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      // Fallback to English
      result = translations.en;
      for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
          result = (result as Record<string, unknown>)[k];
        } else {
          return path; // Return path if not found
        }
      }
      break;
    }
  }
  
  return typeof result === 'string' ? result : path;
}

/**
 * Get language configuration
 */
export function getLanguageConfig(code: SupportedLanguage): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGES.find(l => l.code === code);
}

/**
 * Check if language is RTL
 */
export function isRTL(language: SupportedLanguage): boolean {
  const config = getLanguageConfig(language);
  return config?.direction === 'rtl';
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): LanguageConfig[] {
  return SUPPORTED_LANGUAGES;
}

/**
 * Detect user's preferred language from browser
 */
export function detectBrowserLanguage(): SupportedLanguage {
  if (typeof navigator === 'undefined') return 'en';
  
  const browserLang = navigator.language.split('-')[0].toLowerCase();
  
  if (browserLang === 'sw' || browserLang === 'swh') return 'sw';
  if (browserLang === 'fr') return 'fr';
  if (browserLang === 'ar') return 'ar';
  
  return 'en';
}
