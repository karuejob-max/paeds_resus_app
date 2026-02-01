/**
 * Procedure Video Library
 * 
 * Provides instructional video content for critical pediatric procedures.
 * Videos are categorized by skill level and procedure type.
 */

export type SkillLevel = 'basic' | 'intermediate' | 'advanced';
export type ProcedureCategory = 
  | 'airway' 
  | 'breathing' 
  | 'circulation' 
  | 'vascular_access' 
  | 'medications' 
  | 'monitoring'
  | 'neonatal'
  | 'trauma';

export interface ProcedureVideo {
  id: string;
  title: string;
  description: string;
  category: ProcedureCategory;
  skillLevel: SkillLevel;
  durationSeconds: number;
  thumbnailUrl: string;
  videoUrl: string;
  keyPoints: string[];
  commonErrors: string[];
  equipmentNeeded: string[];
  indications: string[];
  contraindications: string[];
  relatedProcedures: string[];
  ageGroups: ('neonate' | 'infant' | 'child' | 'adolescent')[];
  lastUpdated: string;
  source: string;
  translations: {
    sw?: { title: string; description: string; keyPoints: string[] };
    fr?: { title: string; description: string; keyPoints: string[] };
    ar?: { title: string; description: string; keyPoints: string[] };
  };
}

export interface VideoChapter {
  title: string;
  startTime: number;
  endTime: number;
}

export interface ProcedureVideoWithChapters extends ProcedureVideo {
  chapters: VideoChapter[];
}

/**
 * Procedure Video Library
 * 
 * Note: Video URLs are placeholders. In production, these would be:
 * 1. Hosted on S3/CloudFront for fast delivery
 * 2. Licensed from medical education providers
 * 3. Created in-house with proper medical oversight
 */
export const PROCEDURE_VIDEOS: ProcedureVideo[] = [
  // AIRWAY PROCEDURES
  {
    id: 'bvm_ventilation',
    title: 'Bag-Valve-Mask (BVM) Ventilation',
    description: 'Proper technique for providing positive pressure ventilation using a bag-valve-mask device in pediatric patients.',
    category: 'airway',
    skillLevel: 'basic',
    durationSeconds: 90,
    thumbnailUrl: '/videos/thumbnails/bvm.jpg',
    videoUrl: '/videos/procedures/bvm_ventilation.mp4',
    keyPoints: [
      'Select appropriate mask size (covers nose and mouth, not eyes)',
      'Create C-E grip: C with thumb and index finger, E with remaining fingers on jaw',
      'Maintain neutral head position (sniffing position for infants)',
      'Squeeze bag over 1 second to deliver breath',
      'Watch for chest rise - adjust if not visible',
      'Rate: 20-30 breaths/min for infants, 15-20 for children'
    ],
    commonErrors: [
      'Mask too large or too small',
      'Inadequate seal around mask',
      'Hyperextending neck in infants',
      'Squeezing bag too fast or too hard',
      'Not watching for chest rise',
      'Gastric insufflation from excessive pressure'
    ],
    equipmentNeeded: [
      'Self-inflating bag (250ml neonate, 450ml infant, 1000ml child)',
      'Appropriate size face mask',
      'Oxygen source and tubing',
      'Oropharyngeal airway (optional)',
      'Suction equipment'
    ],
    indications: [
      'Apnea or inadequate respiratory effort',
      'Respiratory failure',
      'Cardiac arrest',
      'Need for assisted ventilation'
    ],
    contraindications: [
      'Complete upper airway obstruction (relative)',
      'Facial trauma preventing seal (relative)'
    ],
    relatedProcedures: ['oropharyngeal_airway', 'nasopharyngeal_airway', 'intubation'],
    ageGroups: ['neonate', 'infant', 'child', 'adolescent'],
    lastUpdated: '2025-01-01',
    source: 'AHA PALS Guidelines 2025',
    translations: {
      sw: {
        title: 'Uingizaji Hewa kwa Mfuko-Valve-Mask (BVM)',
        description: 'Mbinu sahihi ya kutoa uingizaji hewa kwa shinikizo chanya kwa kutumia kifaa cha mfuko-valve-mask kwa wagonjwa wa watoto.',
        keyPoints: [
          'Chagua ukubwa unaofaa wa mask',
          'Tengeneza mkono wa C-E',
          'Dumisha nafasi ya kichwa isiyo na upande',
          'Bonyeza mfuko kwa sekunde 1',
          'Angalia kupanda kwa kifua'
        ]
      },
      fr: {
        title: 'Ventilation au Ballon-Valve-Masque (BVM)',
        description: 'Technique appropriée pour fournir une ventilation à pression positive à l\'aide d\'un dispositif ballon-valve-masque chez les patients pédiatriques.',
        keyPoints: [
          'Sélectionner la taille de masque appropriée',
          'Créer la prise C-E',
          'Maintenir la position neutre de la tête',
          'Presser le ballon pendant 1 seconde',
          'Observer le soulèvement thoracique'
        ]
      },
      ar: {
        title: 'التهوية بالكيس والصمام والقناع',
        description: 'التقنية الصحيحة لتوفير التهوية بالضغط الإيجابي باستخدام جهاز الكيس والصمام والقناع في مرضى الأطفال.',
        keyPoints: [
          'اختر حجم القناع المناسب',
          'أنشئ قبضة C-E',
          'حافظ على وضع الرأس المحايد',
          'اضغط الكيس لمدة ثانية واحدة',
          'راقب ارتفاع الصدر'
        ]
      }
    }
  },
  {
    id: 'oropharyngeal_airway',
    title: 'Oropharyngeal Airway (OPA) Insertion',
    description: 'Correct sizing and insertion technique for oropharyngeal airways in unconscious pediatric patients.',
    category: 'airway',
    skillLevel: 'basic',
    durationSeconds: 60,
    thumbnailUrl: '/videos/thumbnails/opa.jpg',
    videoUrl: '/videos/procedures/opa_insertion.mp4',
    keyPoints: [
      'Only use in unconscious patients without gag reflex',
      'Size: corner of mouth to angle of jaw OR center of lips to tragus',
      'Insert with tongue depressor or rotate 180° (children only)',
      'In infants: insert right-side up with tongue depressor',
      'Confirm airway patency after insertion'
    ],
    commonErrors: [
      'Using in patient with intact gag reflex',
      'Incorrect sizing (too large or small)',
      'Pushing tongue posteriorly during insertion',
      'Not having suction ready'
    ],
    equipmentNeeded: [
      'Oropharyngeal airways (multiple sizes)',
      'Tongue depressor',
      'Suction equipment'
    ],
    indications: [
      'Unconscious patient with no gag reflex',
      'Adjunct to BVM ventilation',
      'Maintaining airway patency'
    ],
    contraindications: [
      'Intact gag reflex',
      'Conscious or semi-conscious patient',
      'Oral trauma or bleeding'
    ],
    relatedProcedures: ['bvm_ventilation', 'nasopharyngeal_airway'],
    ageGroups: ['infant', 'child', 'adolescent'],
    lastUpdated: '2025-01-01',
    source: 'AHA PALS Guidelines 2025',
    translations: {
      sw: {
        title: 'Kuweka Njia ya Hewa ya Oropharyngeal (OPA)',
        description: 'Ukubwa sahihi na mbinu ya kuingiza njia za hewa za oropharyngeal kwa wagonjwa wa watoto wasio na fahamu.',
        keyPoints: [
          'Tumia tu kwa wagonjwa wasio na fahamu',
          'Pima kutoka kona ya mdomo hadi pembe ya taya',
          'Ingiza kwa tongue depressor'
        ]
      },
      fr: {
        title: 'Insertion de la Canule Oropharyngée (OPA)',
        description: 'Dimensionnement correct et technique d\'insertion des canules oropharyngées chez les patients pédiatriques inconscients.',
        keyPoints: [
          'Utiliser uniquement chez les patients inconscients',
          'Taille: coin de la bouche à l\'angle de la mâchoire',
          'Insérer avec un abaisse-langue'
        ]
      },
      ar: {
        title: 'إدخال مجرى الهواء الفموي البلعومي',
        description: 'تقنية التحجيم والإدخال الصحيحة لمجاري الهواء الفموية البلعومية في مرضى الأطفال فاقدي الوعي.',
        keyPoints: [
          'استخدم فقط في المرضى فاقدي الوعي',
          'الحجم: من زاوية الفم إلى زاوية الفك',
          'أدخل باستخدام خافض اللسان'
        ]
      }
    }
  },
  {
    id: 'intubation',
    title: 'Endotracheal Intubation',
    description: 'Step-by-step guide to pediatric endotracheal intubation including equipment selection, technique, and confirmation.',
    category: 'airway',
    skillLevel: 'advanced',
    durationSeconds: 180,
    thumbnailUrl: '/videos/thumbnails/intubation.jpg',
    videoUrl: '/videos/procedures/intubation.mp4',
    keyPoints: [
      'ETT size: (age/4) + 4 for uncuffed, (age/4) + 3.5 for cuffed',
      'Blade size: Miller 0-1 for infants, Miller 2 or Mac 2 for children',
      'Preoxygenate with 100% O2 before attempt',
      'Limit attempts to 30 seconds each',
      'Confirm placement: ETCO2, bilateral breath sounds, chest rise',
      'Secure tube and document depth at teeth/gums'
    ],
    commonErrors: [
      'Wrong ETT size selection',
      'Prolonged intubation attempts (>30 sec)',
      'Esophageal intubation',
      'Right mainstem bronchus intubation',
      'Not preoxygenating',
      'Inadequate sedation/paralysis'
    ],
    equipmentNeeded: [
      'Laryngoscope with appropriate blade',
      'ETT (correct size plus one size smaller)',
      'Stylet',
      'BVM with oxygen',
      'Suction',
      'ETCO2 detector',
      'Tape or ETT holder',
      'Medications for RSI if needed'
    ],
    indications: [
      'Respiratory failure unresponsive to other interventions',
      'Airway protection needed',
      'Prolonged resuscitation',
      'Need for controlled ventilation'
    ],
    contraindications: [
      'Complete upper airway obstruction (consider surgical airway)',
      'Severe facial trauma (consider surgical airway)'
    ],
    relatedProcedures: ['bvm_ventilation', 'rsi_medications', 'lma_insertion'],
    ageGroups: ['neonate', 'infant', 'child', 'adolescent'],
    lastUpdated: '2025-01-01',
    source: 'AHA PALS Guidelines 2025',
    translations: {
      sw: {
        title: 'Intubation ya Endotracheal',
        description: 'Mwongozo wa hatua kwa hatua wa intubation ya endotracheal ya watoto.',
        keyPoints: [
          'Ukubwa wa ETT: (umri/4) + 4',
          'Preoxygenate na O2 100%',
          'Punguza majaribio hadi sekunde 30',
          'Thibitisha uwekaji na ETCO2'
        ]
      },
      fr: {
        title: 'Intubation Endotrachéale',
        description: 'Guide étape par étape de l\'intubation endotrachéale pédiatrique.',
        keyPoints: [
          'Taille du TET: (âge/4) + 4',
          'Préoxygéner avec O2 à 100%',
          'Limiter les tentatives à 30 secondes',
          'Confirmer le placement avec ETCO2'
        ]
      },
      ar: {
        title: 'التنبيب الرغامي',
        description: 'دليل خطوة بخطوة للتنبيب الرغامي للأطفال.',
        keyPoints: [
          'حجم الأنبوب: (العمر/4) + 4',
          'أكسجة مسبقة بأكسجين 100%',
          'حدد المحاولات بـ 30 ثانية',
          'تأكد من الوضع بـ ETCO2'
        ]
      }
    }
  },

  // CIRCULATION PROCEDURES
  {
    id: 'chest_compressions',
    title: 'Pediatric Chest Compressions',
    description: 'High-quality chest compression technique for infants and children during cardiac arrest.',
    category: 'circulation',
    skillLevel: 'basic',
    durationSeconds: 120,
    thumbnailUrl: '/videos/thumbnails/cpr.jpg',
    videoUrl: '/videos/procedures/chest_compressions.mp4',
    keyPoints: [
      'Infants: Two-thumb encircling technique (preferred) or two-finger technique',
      'Children: One or two hands on lower half of sternum',
      'Depth: At least 1/3 AP diameter (4cm infants, 5cm children)',
      'Rate: 100-120 compressions per minute',
      'Allow full chest recoil between compressions',
      'Minimize interruptions (<10 seconds)',
      'Ratio: 15:2 with two rescuers, 30:2 with one rescuer'
    ],
    commonErrors: [
      'Inadequate depth',
      'Incomplete recoil (leaning)',
      'Incorrect hand position',
      'Rate too slow or too fast',
      'Excessive interruptions',
      'Compressor fatigue (switch every 2 minutes)'
    ],
    equipmentNeeded: [
      'Hard surface under patient',
      'CPR feedback device (if available)',
      'Timer/metronome'
    ],
    indications: [
      'Cardiac arrest (no pulse)',
      'Pulse <60 with poor perfusion despite oxygenation'
    ],
    contraindications: [
      'Patient with pulse and adequate perfusion'
    ],
    relatedProcedures: ['bvm_ventilation', 'defibrillation', 'epinephrine_administration'],
    ageGroups: ['infant', 'child', 'adolescent'],
    lastUpdated: '2025-01-01',
    source: 'AHA PALS Guidelines 2025',
    translations: {
      sw: {
        title: 'Mibonyezo ya Kifua kwa Watoto',
        description: 'Mbinu ya mibonyezo ya kifua ya ubora wa juu kwa watoto wachanga na watoto wakati wa kukamatwa kwa moyo.',
        keyPoints: [
          'Watoto wachanga: Mbinu ya vidole viwili vinavyozunguka',
          'Kina: Angalau 1/3 ya kipenyo',
          'Kiwango: Mibonyezo 100-120 kwa dakika',
          'Ruhusu kifua kurudi kabisa'
        ]
      },
      fr: {
        title: 'Compressions Thoraciques Pédiatriques',
        description: 'Technique de compression thoracique de haute qualité pour les nourrissons et les enfants.',
        keyPoints: [
          'Nourrissons: Technique des deux pouces',
          'Profondeur: Au moins 1/3 du diamètre',
          'Rythme: 100-120 compressions par minute',
          'Permettre le retour complet du thorax'
        ]
      },
      ar: {
        title: 'ضغطات الصدر للأطفال',
        description: 'تقنية ضغط الصدر عالية الجودة للرضع والأطفال أثناء السكتة القلبية.',
        keyPoints: [
          'الرضع: تقنية الإبهامين المحيطين',
          'العمق: على الأقل 1/3 من القطر',
          'المعدل: 100-120 ضغطة في الدقيقة',
          'اسمح بعودة الصدر الكاملة'
        ]
      }
    }
  },
  {
    id: 'defibrillation',
    title: 'Pediatric Defibrillation',
    description: 'Safe and effective defibrillation technique for shockable rhythms in pediatric patients.',
    category: 'circulation',
    skillLevel: 'intermediate',
    durationSeconds: 90,
    thumbnailUrl: '/videos/thumbnails/defib.jpg',
    videoUrl: '/videos/procedures/defibrillation.mp4',
    keyPoints: [
      'First shock: 2 J/kg',
      'Subsequent shocks: 4 J/kg (max 10 J/kg or adult dose)',
      'Pad placement: Anterior-posterior or anterior-lateral',
      'Use pediatric pads/attenuator for children <8 years or <25kg',
      'Clear patient before shock delivery',
      'Resume CPR immediately after shock',
      'Rhythm check every 2 minutes'
    ],
    commonErrors: [
      'Incorrect energy selection',
      'Poor pad contact or placement',
      'Delayed shock delivery',
      'Not clearing patient before shock',
      'Prolonged rhythm checks'
    ],
    equipmentNeeded: [
      'Defibrillator (manual or AED)',
      'Pediatric pads or dose attenuator',
      'Conductive gel or pre-gelled pads'
    ],
    indications: [
      'Ventricular fibrillation (VF)',
      'Pulseless ventricular tachycardia (pVT)'
    ],
    contraindications: [
      'Asystole',
      'Pulseless electrical activity (PEA)',
      'Patient in water'
    ],
    relatedProcedures: ['chest_compressions', 'rhythm_recognition'],
    ageGroups: ['infant', 'child', 'adolescent'],
    lastUpdated: '2025-01-01',
    source: 'AHA PALS Guidelines 2025',
    translations: {
      sw: {
        title: 'Defibrillation ya Watoto',
        description: 'Mbinu salama na yenye ufanisi ya defibrillation kwa midundo inayoweza kushtuliwa kwa wagonjwa wa watoto.',
        keyPoints: [
          'Mshtuko wa kwanza: 2 J/kg',
          'Mshtuko unaofuata: 4 J/kg',
          'Safisha mgonjwa kabla ya mshtuko',
          'Endelea CPR mara moja baada ya mshtuko'
        ]
      },
      fr: {
        title: 'Défibrillation Pédiatrique',
        description: 'Technique de défibrillation sûre et efficace pour les rythmes choquables chez les patients pédiatriques.',
        keyPoints: [
          'Premier choc: 2 J/kg',
          'Chocs suivants: 4 J/kg',
          'Dégager le patient avant le choc',
          'Reprendre la RCP immédiatement après le choc'
        ]
      },
      ar: {
        title: 'إزالة الرجفان للأطفال',
        description: 'تقنية إزالة الرجفان الآمنة والفعالة للإيقاعات القابلة للصدمة في مرضى الأطفال.',
        keyPoints: [
          'الصدمة الأولى: 2 جول/كجم',
          'الصدمات التالية: 4 جول/كجم',
          'أبعد الجميع قبل الصدمة',
          'استأنف الإنعاش فوراً بعد الصدمة'
        ]
      }
    }
  },

  // VASCULAR ACCESS
  {
    id: 'io_insertion',
    title: 'Intraosseous (IO) Access',
    description: 'Emergency vascular access via intraosseous route when IV access cannot be rapidly obtained.',
    category: 'vascular_access',
    skillLevel: 'intermediate',
    durationSeconds: 120,
    thumbnailUrl: '/videos/thumbnails/io.jpg',
    videoUrl: '/videos/procedures/io_insertion.mp4',
    keyPoints: [
      'Site: Proximal tibia (1-2 cm below tibial tuberosity, medial flat surface)',
      'Alternative sites: Distal tibia, distal femur, humeral head',
      'Insert perpendicular to bone, slight angle away from growth plate',
      'Confirm placement: Stands without support, flush easily, marrow aspiration',
      'Secure with tape and splint',
      'All IV medications can be given IO (flush with saline after each)'
    ],
    commonErrors: [
      'Insertion through growth plate',
      'Incomplete penetration of cortex',
      'Through-and-through insertion',
      'Not flushing after medications',
      'Using in fractured bone'
    ],
    equipmentNeeded: [
      'IO needle (manual or powered)',
      'Antiseptic solution',
      'Syringe with saline',
      'IV tubing and fluids',
      'Tape and splint for stabilization'
    ],
    indications: [
      'Emergency vascular access when IV cannot be obtained in 90 seconds',
      'Cardiac arrest',
      'Severe shock',
      'Critical medication administration'
    ],
    contraindications: [
      'Fracture in target bone',
      'Previous IO in same bone (within 24-48 hours)',
      'Infection at insertion site',
      'Osteogenesis imperfecta'
    ],
    relatedProcedures: ['iv_access', 'fluid_resuscitation'],
    ageGroups: ['neonate', 'infant', 'child', 'adolescent'],
    lastUpdated: '2025-01-01',
    source: 'AHA PALS Guidelines 2025',
    translations: {
      sw: {
        title: 'Ufikiaji wa Intraosseous (IO)',
        description: 'Ufikiaji wa dharura wa mishipa kupitia njia ya intraosseous wakati ufikiaji wa IV hauwezi kupatikana haraka.',
        keyPoints: [
          'Tovuti: Tibia ya karibu',
          'Ingiza perpendicular kwa mfupa',
          'Thibitisha uwekaji: Inasimama bila msaada',
          'Dawa zote za IV zinaweza kutolewa IO'
        ]
      },
      fr: {
        title: 'Accès Intraosseux (IO)',
        description: 'Accès vasculaire d\'urgence par voie intraosseuse lorsque l\'accès IV ne peut être obtenu rapidement.',
        keyPoints: [
          'Site: Tibia proximal',
          'Insérer perpendiculairement à l\'os',
          'Confirmer le placement: Tient sans support',
          'Tous les médicaments IV peuvent être donnés en IO'
        ]
      },
      ar: {
        title: 'الوصول داخل العظم',
        description: 'الوصول الوعائي الطارئ عبر المسار داخل العظم عندما لا يمكن الحصول على الوصول الوريدي بسرعة.',
        keyPoints: [
          'الموقع: الظنبوب القريب',
          'أدخل عمودياً على العظم',
          'تأكد من الوضع: يقف بدون دعم',
          'جميع أدوية IV يمكن إعطاؤها IO'
        ]
      }
    }
  },
  {
    id: 'uvc_insertion',
    title: 'Umbilical Venous Catheter (UVC) Insertion',
    description: 'Emergency vascular access in neonates via the umbilical vein.',
    category: 'vascular_access',
    skillLevel: 'advanced',
    durationSeconds: 150,
    thumbnailUrl: '/videos/thumbnails/uvc.jpg',
    videoUrl: '/videos/procedures/uvc_insertion.mp4',
    keyPoints: [
      'Use in first 7-14 days of life',
      'Identify umbilical vein (large, thin-walled, usually at 12 o\'clock)',
      'Cut cord 1-2 cm from skin, perpendicular',
      'Insert catheter 4-5 cm until blood return',
      'Confirm position: Blood return, able to flush',
      'Secure with purse-string suture and tape bridge',
      'Ideal tip position: Junction of IVC and right atrium'
    ],
    commonErrors: [
      'Inserting into umbilical artery instead of vein',
      'Inserting too far (into liver)',
      'Air embolism from open catheter',
      'Contamination during insertion'
    ],
    equipmentNeeded: [
      'Umbilical catheter (3.5-5 Fr)',
      'Umbilical tape',
      'Sterile drapes and gloves',
      'Scalpel',
      'Forceps',
      'Saline flush',
      'Suture material'
    ],
    indications: [
      'Emergency vascular access in neonate',
      'Resuscitation requiring medications or fluids',
      'Exchange transfusion'
    ],
    contraindications: [
      'Omphalitis (umbilical infection)',
      'Omphalocele or gastroschisis',
      'Necrotizing enterocolitis',
      'Peritonitis'
    ],
    relatedProcedures: ['io_insertion', 'neonatal_resuscitation'],
    ageGroups: ['neonate'],
    lastUpdated: '2025-01-01',
    source: 'NRP 8th Edition',
    translations: {
      sw: {
        title: 'Kuweka Catheter ya Umbilical Venous (UVC)',
        description: 'Ufikiaji wa dharura wa mishipa kwa watoto wachanga kupitia mshipa wa kitovu.',
        keyPoints: [
          'Tumia katika siku 7-14 za kwanza za maisha',
          'Tambua mshipa wa kitovu',
          'Ingiza catheter 4-5 cm',
          'Thibitisha nafasi na kurudi kwa damu'
        ]
      },
      fr: {
        title: 'Insertion du Cathéter Veineux Ombilical (CVO)',
        description: 'Accès vasculaire d\'urgence chez les nouveau-nés via la veine ombilicale.',
        keyPoints: [
          'Utiliser dans les 7-14 premiers jours de vie',
          'Identifier la veine ombilicale',
          'Insérer le cathéter de 4-5 cm',
          'Confirmer la position avec retour sanguin'
        ]
      },
      ar: {
        title: 'إدخال قسطرة الوريد السري',
        description: 'الوصول الوعائي الطارئ عند حديثي الولادة عبر الوريد السري.',
        keyPoints: [
          'استخدم في أول 7-14 يوماً من الحياة',
          'حدد الوريد السري',
          'أدخل القسطرة 4-5 سم',
          'تأكد من الموضع بعودة الدم'
        ]
      }
    }
  },

  // NEONATAL PROCEDURES
  {
    id: 'neonatal_ppv',
    title: 'Neonatal Positive Pressure Ventilation',
    description: 'Initial ventilation technique for newborns requiring respiratory support at birth.',
    category: 'neonatal',
    skillLevel: 'intermediate',
    durationSeconds: 120,
    thumbnailUrl: '/videos/thumbnails/neonatal_ppv.jpg',
    videoUrl: '/videos/procedures/neonatal_ppv.mp4',
    keyPoints: [
      'Initial breaths: 20-25 cmH2O (may need 30-40 for first breaths)',
      'Rate: 40-60 breaths per minute',
      'Use room air (21% O2) initially for term infants',
      'Use 21-30% O2 for preterm infants',
      'MR SOPA for ineffective ventilation: Mask adjust, Reposition, Suction, Open mouth, Pressure increase, Airway alternative',
      'Target SpO2: 60-65% at 1 min, 80-85% at 5 min, 85-95% at 10 min'
    ],
    commonErrors: [
      'Starting with 100% oxygen',
      'Inadequate seal',
      'Incorrect head position',
      'Not following MR SOPA when ineffective',
      'Ventilating too fast'
    ],
    equipmentNeeded: [
      'T-piece resuscitator or self-inflating bag',
      'Appropriate size mask',
      'Oxygen blender',
      'Pulse oximeter',
      'Suction equipment'
    ],
    indications: [
      'Apnea or gasping',
      'Heart rate <100 despite initial steps',
      'Persistent central cyanosis despite supplemental O2'
    ],
    contraindications: [
      'Congenital diaphragmatic hernia (use ETT)',
      'Known airway anomaly'
    ],
    relatedProcedures: ['bvm_ventilation', 'intubation', 'surfactant_administration'],
    ageGroups: ['neonate'],
    lastUpdated: '2025-01-01',
    source: 'NRP 8th Edition',
    translations: {
      sw: {
        title: 'Uingizaji Hewa wa Shinikizo Chanya kwa Watoto Wachanga',
        description: 'Mbinu ya awali ya uingizaji hewa kwa watoto wachanga wanaohitaji msaada wa kupumua wakati wa kuzaliwa.',
        keyPoints: [
          'Pumzi za awali: 20-25 cmH2O',
          'Kiwango: Pumzi 40-60 kwa dakika',
          'Tumia hewa ya chumba awali',
          'MR SOPA kwa uingizaji hewa usio na ufanisi'
        ]
      },
      fr: {
        title: 'Ventilation à Pression Positive Néonatale',
        description: 'Technique de ventilation initiale pour les nouveau-nés nécessitant un support respiratoire à la naissance.',
        keyPoints: [
          'Respirations initiales: 20-25 cmH2O',
          'Rythme: 40-60 respirations par minute',
          'Utiliser l\'air ambiant initialement',
          'MR SOPA pour ventilation inefficace'
        ]
      },
      ar: {
        title: 'التهوية بالضغط الإيجابي لحديثي الولادة',
        description: 'تقنية التهوية الأولية للمواليد الجدد الذين يحتاجون إلى دعم تنفسي عند الولادة.',
        keyPoints: [
          'الأنفاس الأولى: 20-25 سم ماء',
          'المعدل: 40-60 نفس في الدقيقة',
          'استخدم هواء الغرفة مبدئياً',
          'MR SOPA للتهوية غير الفعالة'
        ]
      }
    }
  },

  // TRAUMA PROCEDURES
  {
    id: 'tourniquet_application',
    title: 'Tourniquet Application',
    description: 'Life-saving hemorrhage control technique for severe extremity bleeding.',
    category: 'trauma',
    skillLevel: 'basic',
    durationSeconds: 60,
    thumbnailUrl: '/videos/thumbnails/tourniquet.jpg',
    videoUrl: '/videos/procedures/tourniquet.mp4',
    keyPoints: [
      'Apply 2-3 inches above wound (not over joint)',
      'Tighten until bleeding stops',
      'Note time of application',
      'Do not remove once applied',
      'Second tourniquet if bleeding continues',
      'Keep tourniquet visible, not covered'
    ],
    commonErrors: [
      'Applying over joint',
      'Not tight enough',
      'Applying too close to wound',
      'Removing tourniquet in field',
      'Not documenting time'
    ],
    equipmentNeeded: [
      'Commercial tourniquet (CAT, SOFT-T)',
      'Marker for time documentation'
    ],
    indications: [
      'Life-threatening extremity hemorrhage',
      'Bleeding not controlled by direct pressure',
      'Multiple casualties (apply early)',
      'Amputation'
    ],
    contraindications: [
      'Bleeding controllable by direct pressure',
      'Proximal to wound not accessible'
    ],
    relatedProcedures: ['wound_packing', 'direct_pressure'],
    ageGroups: ['child', 'adolescent'],
    lastUpdated: '2025-01-01',
    source: 'ATLS 10th Edition',
    translations: {
      sw: {
        title: 'Kuweka Tourniquet',
        description: 'Mbinu ya kudhibiti kutokwa na damu inayookoa maisha kwa kutokwa na damu kali kwa miguu.',
        keyPoints: [
          'Weka inchi 2-3 juu ya jeraha',
          'Kaza hadi kutokwa na damu kusimame',
          'Andika wakati wa kuweka',
          'Usiondoe mara baada ya kuwekwa'
        ]
      },
      fr: {
        title: 'Application du Garrot',
        description: 'Technique de contrôle hémorragique vitale pour les saignements graves des extrémités.',
        keyPoints: [
          'Appliquer 5-7 cm au-dessus de la plaie',
          'Serrer jusqu\'à l\'arrêt du saignement',
          'Noter l\'heure d\'application',
          'Ne pas retirer une fois appliqué'
        ]
      },
      ar: {
        title: 'تطبيق العاصبة',
        description: 'تقنية السيطرة على النزيف المنقذة للحياة للنزيف الشديد في الأطراف.',
        keyPoints: [
          'ضع 5-7 سم فوق الجرح',
          'شد حتى يتوقف النزيف',
          'سجل وقت التطبيق',
          'لا تزيل بعد التطبيق'
        ]
      }
    }
  },
  {
    id: 'needle_decompression',
    title: 'Needle Thoracostomy (Needle Decompression)',
    description: 'Emergency treatment for tension pneumothorax.',
    category: 'trauma',
    skillLevel: 'advanced',
    durationSeconds: 90,
    thumbnailUrl: '/videos/thumbnails/needle_decomp.jpg',
    videoUrl: '/videos/procedures/needle_decompression.mp4',
    keyPoints: [
      'Site: 2nd intercostal space, midclavicular line (anterior) OR 4th-5th ICS, anterior axillary line (lateral)',
      'Insert over top of rib (avoid neurovascular bundle)',
      'Use 14-18 gauge needle, length appropriate for patient size',
      'Listen/feel for rush of air',
      'Leave catheter in place, remove needle',
      'Prepare for chest tube placement'
    ],
    commonErrors: [
      'Wrong anatomical location',
      'Needle too short',
      'Inserting below rib (hitting vessels/nerves)',
      'Removing catheter after decompression',
      'Delay in performing procedure'
    ],
    equipmentNeeded: [
      'Large bore needle/catheter (14-18 gauge)',
      'Antiseptic',
      'Chest tube setup (for definitive management)'
    ],
    indications: [
      'Tension pneumothorax with hemodynamic instability',
      'Clinical signs: Hypotension, JVD, tracheal deviation, absent breath sounds'
    ],
    contraindications: [
      'Simple pneumothorax without tension',
      'Hemothorax (need chest tube)'
    ],
    relatedProcedures: ['chest_tube_insertion'],
    ageGroups: ['infant', 'child', 'adolescent'],
    lastUpdated: '2025-01-01',
    source: 'ATLS 10th Edition',
    translations: {
      sw: {
        title: 'Thoracostomy ya Sindano (Kupunguza Shinikizo)',
        description: 'Matibabu ya dharura kwa pneumothorax ya mvutano.',
        keyPoints: [
          'Tovuti: Nafasi ya 2 ya intercostal',
          'Ingiza juu ya ubavu',
          'Sikiliza/hisi kwa hewa inayotoka',
          'Acha catheter mahali pake'
        ]
      },
      fr: {
        title: 'Thoracostomie à l\'Aiguille (Décompression)',
        description: 'Traitement d\'urgence du pneumothorax sous tension.',
        keyPoints: [
          'Site: 2ème espace intercostal',
          'Insérer au-dessus de la côte',
          'Écouter/sentir l\'échappement d\'air',
          'Laisser le cathéter en place'
        ]
      },
      ar: {
        title: 'بزل الصدر بالإبرة (تخفيف الضغط)',
        description: 'العلاج الطارئ لاسترواح الصدر الضاغط.',
        keyPoints: [
          'الموقع: الفراغ الوربي الثاني',
          'أدخل فوق الضلع',
          'استمع/اشعر بتدفق الهواء',
          'اترك القسطرة في مكانها'
        ]
      }
    }
  }
];

/**
 * Get all videos in a specific category
 */
export function getVideosByCategory(category: ProcedureCategory): ProcedureVideo[] {
  return PROCEDURE_VIDEOS.filter(v => v.category === category);
}

/**
 * Get all videos at a specific skill level
 */
export function getVideosBySkillLevel(level: SkillLevel): ProcedureVideo[] {
  return PROCEDURE_VIDEOS.filter(v => v.skillLevel === level);
}

/**
 * Get video by ID
 */
export function getVideoById(id: string): ProcedureVideo | undefined {
  return PROCEDURE_VIDEOS.find(v => v.id === id);
}

/**
 * Get videos appropriate for a specific age group
 */
export function getVideosByAgeGroup(ageGroup: 'neonate' | 'infant' | 'child' | 'adolescent'): ProcedureVideo[] {
  return PROCEDURE_VIDEOS.filter(v => v.ageGroups.includes(ageGroup));
}

/**
 * Search videos by keyword
 */
export function searchVideos(query: string): ProcedureVideo[] {
  const lowerQuery = query.toLowerCase();
  return PROCEDURE_VIDEOS.filter(v => 
    v.title.toLowerCase().includes(lowerQuery) ||
    v.description.toLowerCase().includes(lowerQuery) ||
    v.keyPoints.some(kp => kp.toLowerCase().includes(lowerQuery)) ||
    v.equipmentNeeded.some(eq => eq.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get related videos for a procedure
 */
export function getRelatedVideos(videoId: string): ProcedureVideo[] {
  const video = getVideoById(videoId);
  if (!video) return [];
  
  return video.relatedProcedures
    .map(id => getVideoById(id))
    .filter((v): v is ProcedureVideo => v !== undefined);
}

/**
 * Get all categories with video counts
 */
export function getCategoriesWithCounts(): { category: ProcedureCategory; count: number; label: string }[] {
  const categoryLabels: Record<ProcedureCategory, string> = {
    airway: 'Airway Management',
    breathing: 'Breathing & Ventilation',
    circulation: 'Circulation & CPR',
    vascular_access: 'Vascular Access',
    medications: 'Medication Administration',
    monitoring: 'Monitoring & Assessment',
    neonatal: 'Neonatal Procedures',
    trauma: 'Trauma Procedures'
  };

  const categorySet = new Set(PROCEDURE_VIDEOS.map(v => v.category));
  const categories: ProcedureCategory[] = Array.from(categorySet);
  return categories.map(category => ({
    category,
    count: PROCEDURE_VIDEOS.filter(v => v.category === category).length,
    label: categoryLabels[category]
  }));
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
