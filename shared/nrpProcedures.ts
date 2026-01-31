/**
 * NRP Specialized Procedures
 * 
 * Step-by-step guidance for neonatal resuscitation procedures.
 * Based on NRP 8th Edition guidelines.
 */

export interface ProcedureStep {
  step: number;
  action: string;
  details: string;
  warning?: string;
  tip?: string;
}

export interface NRPProcedure {
  id: string;
  name: string;
  indication: string;
  contraindications: string[];
  equipment: string[];
  steps: ProcedureStep[];
  complications: string[];
  verification: string[];
}

/**
 * Umbilical Venous Catheter (UVC) Insertion
 * Emergency vascular access for neonatal resuscitation
 */
export const UVC_INSERTION: NRPProcedure = {
  id: 'NRP-PROC-UVC',
  name: 'Umbilical Venous Catheter (UVC) Insertion',
  indication: 'Emergency vascular access for medication/fluid administration during neonatal resuscitation',
  contraindications: [
    'Omphalitis (umbilical infection)',
    'Omphalocele or gastroschisis',
    'Necrotizing enterocolitis',
    'Peritonitis',
  ],
  equipment: [
    '3.5 Fr or 5 Fr umbilical catheter (single lumen)',
    'Sterile drapes and gloves',
    'Antiseptic solution (chlorhexidine or povidone-iodine)',
    'Umbilical tape or sterile tie',
    'Sterile scissors and forceps',
    'Saline flush (0.9% NaCl)',
    '3-way stopcock',
    'Suture material (3-0 or 4-0 silk)',
  ],
  steps: [
    {
      step: 1,
      action: 'Prepare equipment',
      details: 'Flush catheter with saline, attach 3-way stopcock, prepare sterile field',
      tip: 'Pre-measure insertion depth: shoulder-umbilicus distance + 1 cm (approximately 2-4 cm for emergency insertion)',
    },
    {
      step: 2,
      action: 'Clean umbilical stump',
      details: 'Apply antiseptic solution to umbilical stump and surrounding area',
      warning: 'Avoid chlorhexidine in preterm <28 weeks due to skin absorption risk',
    },
    {
      step: 3,
      action: 'Tie umbilical tape',
      details: 'Loosely tie umbilical tape around base of cord (can tighten if bleeding)',
      tip: 'Leave loose enough to allow catheter insertion',
    },
    {
      step: 4,
      action: 'Cut cord',
      details: 'Cut cord horizontally 1-2 cm from skin using sterile scissors',
    },
    {
      step: 5,
      action: 'Identify vessels',
      details: 'Identify the single, thin-walled, large umbilical vein (usually at 12 o\'clock position). Avoid the two thick-walled, smaller arteries.',
      tip: 'Vein is larger, thin-walled, and usually gaping open. Arteries are smaller, thick-walled, and often constricted.',
    },
    {
      step: 6,
      action: 'Dilate vein',
      details: 'Gently dilate the vein opening using closed forceps, then open forceps to widen',
    },
    {
      step: 7,
      action: 'Insert catheter',
      details: 'Insert catheter into vein, directing toward head (cephalad). Advance 2-4 cm until blood return.',
      warning: 'Do NOT advance if resistance is met - may be in portal system',
    },
    {
      step: 8,
      action: 'Confirm placement',
      details: 'Aspirate blood to confirm venous placement, then flush with saline',
      tip: 'For emergency use, insert just until blood return (2-4 cm). Do not advance further.',
    },
    {
      step: 9,
      action: 'Secure catheter',
      details: 'Secure with purse-string suture around umbilical stump or tape bridge',
    },
  ],
  complications: [
    'Air embolism',
    'Hemorrhage',
    'Infection',
    'Portal vein thrombosis',
    'Hepatic necrosis (if in portal system)',
    'Cardiac arrhythmias (if advanced too far)',
  ],
  verification: [
    'Blood return on aspiration',
    'Catheter flushes easily without resistance',
    'No blanching of skin (would indicate arterial placement)',
    'X-ray confirmation if time permits (tip at T9-T10 level)',
  ],
};

/**
 * Endotracheal Intubation
 * Airway management for neonatal resuscitation
 */
export const ETT_INTUBATION: NRPProcedure = {
  id: 'NRP-PROC-ETT',
  name: 'Endotracheal Intubation',
  indication: 'Ineffective bag-mask ventilation, need for prolonged PPV, chest compressions, tracheal suctioning for meconium, surfactant administration',
  contraindications: [
    'Complete upper airway obstruction (may need surgical airway)',
    'Severe facial trauma',
  ],
  equipment: [
    'Laryngoscope with Miller blade (size 0 for preterm, size 1 for term)',
    'ETT (uncuffed): 2.5mm (<1kg), 3.0mm (1-2kg), 3.5mm (2-3kg), 3.5-4.0mm (>3kg)',
    'Stylet (optional)',
    'Suction catheter and suction device',
    'CO2 detector or capnography',
    'Tape for securing ETT',
    'Stethoscope',
    'Pulse oximeter',
  ],
  steps: [
    {
      step: 1,
      action: 'Position infant',
      details: 'Place infant supine with head in neutral "sniffing" position. Place shoulder roll if needed.',
      tip: 'Avoid hyperextension or flexion of the neck',
    },
    {
      step: 2,
      action: 'Pre-oxygenate',
      details: 'Provide PPV with 100% oxygen for 30 seconds before attempt',
      warning: 'Each intubation attempt should be limited to 30 seconds',
    },
    {
      step: 3,
      action: 'Hold laryngoscope',
      details: 'Hold laryngoscope in left hand. Insert blade into right side of mouth.',
    },
    {
      step: 4,
      action: 'Visualize glottis',
      details: 'Sweep tongue to left, advance blade to vallecula (Miller) or lift epiglottis directly. Lift blade upward and outward (do not rock back).',
      warning: 'Do NOT use rocking motion - risk of dental/gum injury',
    },
    {
      step: 5,
      action: 'Identify landmarks',
      details: 'Identify vocal cords (white, V-shaped). May need gentle external laryngeal pressure (BURP maneuver).',
      tip: 'If secretions obscure view, suction before proceeding',
    },
    {
      step: 6,
      action: 'Insert ETT',
      details: 'Insert ETT from right side of mouth. Advance until vocal cord guide (black line) is at level of cords.',
    },
    {
      step: 7,
      action: 'Remove laryngoscope',
      details: 'Hold ETT firmly at lip, remove laryngoscope and stylet (if used)',
    },
    {
      step: 8,
      action: 'Confirm placement',
      details: 'Attach CO2 detector - should show color change with exhalation. Auscultate both axillae and stomach.',
      warning: 'If no CO2 detected after 6 breaths, assume esophageal - remove and re-attempt',
    },
    {
      step: 9,
      action: 'Secure ETT',
      details: 'Note depth at lip (typically 6 + weight in kg). Secure with tape.',
      tip: 'Depth formula: 6 + weight (kg) = cm at lip',
    },
  ],
  complications: [
    'Esophageal intubation',
    'Right mainstem bronchus intubation',
    'Hypoxia during prolonged attempts',
    'Bradycardia (vagal response)',
    'Trauma to airway structures',
    'Pneumothorax',
  ],
  verification: [
    'CO2 detection (colorimetric or capnography)',
    'Bilateral chest rise',
    'Equal breath sounds in both axillae',
    'No breath sounds over stomach',
    'Improving heart rate and SpO2',
    'Chest X-ray (tip at T1-T2 level)',
  ],
};

/**
 * Surfactant Administration
 * For preterm infants with RDS
 */
export const SURFACTANT_ADMIN: NRPProcedure = {
  id: 'NRP-PROC-SURF',
  name: 'Surfactant Administration',
  indication: 'Respiratory distress syndrome (RDS) in preterm infants, typically <32 weeks gestation',
  contraindications: [
    'Congenital diaphragmatic hernia',
    'Pulmonary hemorrhage (relative)',
    'Uncontrolled air leak',
  ],
  equipment: [
    'Surfactant (beractant, poractant, or calfactant)',
    'Endotracheal tube (already in place)',
    'Feeding tube or catheter for instillation',
    'Syringes for drawing up surfactant',
    'Pulse oximeter and cardiac monitor',
    'Suction equipment',
  ],
  steps: [
    {
      step: 1,
      action: 'Warm surfactant',
      details: 'Warm surfactant to room temperature. Do NOT shake - gently swirl to mix.',
      warning: 'Shaking can denature the surfactant proteins',
    },
    {
      step: 2,
      action: 'Calculate dose',
      details: 'Beractant: 100 mg/kg (4 mL/kg). Poractant: 200 mg/kg initial (2.5 mL/kg). Calfactant: 105 mg/kg (3 mL/kg).',
      tip: 'Check product-specific dosing guidelines',
    },
    {
      step: 3,
      action: 'Confirm ETT position',
      details: 'Verify ETT is properly positioned before administration',
    },
    {
      step: 4,
      action: 'Pre-oxygenate',
      details: 'Increase FiO2 to maintain SpO2 during procedure',
    },
    {
      step: 5,
      action: 'Instill surfactant',
      details: 'Instill in 2-4 aliquots. For each aliquot: instill over 1-2 seconds, then provide PPV for 30 seconds.',
      tip: 'Some protocols use different positions (supine, right lateral, left lateral) for each aliquot',
    },
    {
      step: 6,
      action: 'Avoid suctioning',
      details: 'Do NOT suction ETT for at least 1 hour after administration unless absolutely necessary',
      warning: 'Suctioning removes surfactant from airways',
    },
    {
      step: 7,
      action: 'Monitor response',
      details: 'Watch for rapid improvement in oxygenation. Be prepared to reduce ventilator settings quickly.',
      warning: 'Failure to reduce settings can cause pneumothorax',
    },
  ],
  complications: [
    'Transient bradycardia',
    'Oxygen desaturation during procedure',
    'ETT obstruction',
    'Pulmonary hemorrhage',
    'Pneumothorax (if ventilator not adjusted)',
  ],
  verification: [
    'Improved oxygenation (SpO2, FiO2 requirement)',
    'Improved lung compliance',
    'Chest X-ray improvement',
    'Reduced work of breathing',
  ],
};

/**
 * Laryngeal Mask Airway (LMA) Insertion
 * Alternative airway when intubation fails or is not possible
 */
export const LMA_INSERTION: NRPProcedure = {
  id: 'NRP-PROC-LMA',
  name: 'Laryngeal Mask Airway (LMA) Insertion',
  indication: 'Failed intubation, difficult airway, when intubation skills not available',
  contraindications: [
    'Very preterm infants (<34 weeks or <2 kg)',
    'Upper airway obstruction',
    'Congenital airway abnormalities',
  ],
  equipment: [
    'LMA size 1 (for neonates 2-5 kg)',
    'Syringe for cuff inflation (if cuffed LMA)',
    'Water-soluble lubricant',
    'Suction equipment',
    'Bag-mask device',
  ],
  steps: [
    {
      step: 1,
      action: 'Select size',
      details: 'Size 1 LMA for neonates 2-5 kg. Check cuff integrity if applicable.',
    },
    {
      step: 2,
      action: 'Lubricate',
      details: 'Apply water-soluble lubricant to posterior surface of LMA',
    },
    {
      step: 3,
      action: 'Position infant',
      details: 'Place infant supine with head in neutral position',
    },
    {
      step: 4,
      action: 'Open mouth',
      details: 'Open mouth and depress tongue with finger or blade',
    },
    {
      step: 5,
      action: 'Insert LMA',
      details: 'Insert LMA with opening facing tongue. Slide along hard palate until resistance felt.',
      tip: 'Use index finger to guide LMA into position',
    },
    {
      step: 6,
      action: 'Inflate cuff',
      details: 'If cuffed LMA, inflate cuff with recommended volume (typically 2-4 mL for size 1)',
    },
    {
      step: 7,
      action: 'Confirm placement',
      details: 'Attach bag, provide ventilation. Look for chest rise, auscultate breath sounds.',
    },
    {
      step: 8,
      action: 'Secure LMA',
      details: 'Secure with tape once proper placement confirmed',
    },
  ],
  complications: [
    'Malposition',
    'Gastric insufflation',
    'Aspiration',
    'Laryngospasm',
    'Inadequate ventilation',
  ],
  verification: [
    'Visible chest rise with ventilation',
    'Bilateral breath sounds',
    'CO2 detection',
    'Improving SpO2 and heart rate',
  ],
};

/**
 * Needle Thoracentesis
 * Emergency treatment for tension pneumothorax
 */
export const NEEDLE_THORACENTESIS: NRPProcedure = {
  id: 'NRP-PROC-THORACENTESIS',
  name: 'Needle Thoracentesis (Needle Decompression)',
  indication: 'Suspected tension pneumothorax with hemodynamic compromise',
  contraindications: [
    'No clinical evidence of tension pneumothorax',
    'Bleeding disorder (relative)',
  ],
  equipment: [
    '22-24 gauge angiocatheter or butterfly needle',
    'Antiseptic solution',
    '10 mL syringe',
    '3-way stopcock',
    'Sterile gloves',
  ],
  steps: [
    {
      step: 1,
      action: 'Identify landmarks',
      details: '2nd intercostal space, midclavicular line on affected side',
      tip: 'Transillumination can help confirm pneumothorax in neonates',
    },
    {
      step: 2,
      action: 'Clean site',
      details: 'Clean with antiseptic solution',
    },
    {
      step: 3,
      action: 'Insert needle',
      details: 'Insert needle perpendicular to chest wall, just above the 3rd rib (to avoid intercostal vessels)',
      warning: 'Intercostal vessels run along inferior border of each rib',
    },
    {
      step: 4,
      action: 'Aspirate',
      details: 'Aspirate while advancing. Rush of air confirms pneumothorax.',
    },
    {
      step: 5,
      action: 'Remove needle',
      details: 'If using angiocatheter, advance catheter and remove needle. Attach 3-way stopcock.',
    },
    {
      step: 6,
      action: 'Evacuate air',
      details: 'Aspirate air with syringe through stopcock until resistance felt',
    },
    {
      step: 7,
      action: 'Prepare for chest tube',
      details: 'Needle decompression is temporary. Prepare for chest tube insertion.',
      warning: 'This is a temporizing measure only',
    },
  ],
  complications: [
    'Lung laceration',
    'Hemorrhage',
    'Infection',
    'Recurrence of pneumothorax',
  ],
  verification: [
    'Rush of air on aspiration',
    'Improved breath sounds',
    'Improved oxygenation',
    'Improved heart rate and blood pressure',
    'Chest X-ray confirmation',
  ],
};

/**
 * Get procedure by ID
 */
export function getProcedure(procedureId: string): NRPProcedure | undefined {
  const procedures: Record<string, NRPProcedure> = {
    'NRP-PROC-UVC': UVC_INSERTION,
    'NRP-PROC-ETT': ETT_INTUBATION,
    'NRP-PROC-SURF': SURFACTANT_ADMIN,
    'NRP-PROC-LMA': LMA_INSERTION,
    'NRP-PROC-THORACENTESIS': NEEDLE_THORACENTESIS,
  };
  return procedures[procedureId];
}

/**
 * Get all available procedures
 */
export function getAllProcedures(): NRPProcedure[] {
  return [
    UVC_INSERTION,
    ETT_INTUBATION,
    SURFACTANT_ADMIN,
    LMA_INSERTION,
    NEEDLE_THORACENTESIS,
  ];
}

/**
 * Get procedure by indication keyword
 */
export function getProceduresByIndication(keyword: string): NRPProcedure[] {
  const keywordLower = keyword.toLowerCase();
  return getAllProcedures().filter(
    (proc) =>
      proc.indication.toLowerCase().includes(keywordLower) ||
      proc.name.toLowerCase().includes(keywordLower)
  );
}
