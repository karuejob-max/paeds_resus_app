export interface CadreOption {
  value: string;
  label: string;
  subSpecialties?: string[];
  subCadres?: CadreOption[];
  category?: string;
}

export interface CadreGroup {
  group: string;
  options: CadreOption[];
}

export const CPD_CADRE_TAXONOMY: CadreGroup[] = [
  {
    group: "Staff",
    options: [
      {
        value: "Consultant Physician",
        label: "Consultant Physician",
        subSpecialties: [
          "General Paediatrician",
          "Paediatric Cardiologist",
          "Paediatric Nephrologist",
          "Paediatric Oncologist / Haematologist",
          "Paediatric Neurologist",
          "Paediatric Endocrinologist",
          "Paediatric Pulmonologist / Respirologist",
          "Paediatric Gastroenterologist",
          "Neonatologist",
          "Paediatric Critical Care Specialist",
          "Paediatric Emergency Medicine Specialist",
          "Paediatric Infectious Disease Specialist",
          "Paediatric Rheumatologist",
          "Paediatric Allergist / Immunologist",
          "Other Specialist",
          "Other",
        ],
      },
      { value: "MO", label: "MO" },
      {
        value: "RCO",
        label: "RCO (Clinical Officer)",
        subCadres: [
          {
            value: "RCO HND",
            label: "HND",
            subSpecialties: [
              "Anaesthesia",
              "Paediatrics",
              "Ophthalmology / Cataract Surgery",
              "Orthopaedics",
              "ENT / Audiology",
              "Reproductive Health / Medicine",
              "Dermatology",
              "Oncology",
              "Chest / Pulmonology Medicine",
              "Emergency Medicine / Critical Care",
              "Other",
            ],
          },
          { value: "BSc. Clin. Med", label: "BSc. Clin. Med" },
          { value: "Dip Clin. Med", label: "Dip Clin. Med" },
          { value: "Other RCO", label: "Other RCO" },
        ],
      },
      {
        value: "RN",
        label: "RN (Registered Nurse)",
        subCadres: [
          {
            value: "MSN",
            label: "MSN",
            subSpecialties: [
              "Paediatric Critical Care Nursing",
              "Neonatal Nursing",
              "Midwifery / Reproductive Health Nursing",
              "Nephrology / Renal Nursing",
              "Oncology and Palliative Care Nursing",
              "Critical Care Nursing (Intensive Care)",
              "Trauma & Emergency Nursing",
              "Medical Surgical Nursing",
              "Nursing Education / Leadership",
              "Community Health Nursing",
              "Mental Health and Psychiatric Nursing",
              "Other",
            ],
          },
          {
            value: "HND",
            label: "HND",
            subSpecialties: [
              "Paediatric Critical Care Nursing",
              "Critical Care Nursing (Intensive Care)",
              "Trauma & Emergency Nursing (Accident & Emergency)",
              "Nurse Anaesthesia Nursing (KRNA)",
              "Peri-Operative Nursing (Theatre Nursing)",
              "Stoma and Wound Care Nursing",
              "Infection Prevention and Control Nursing",
              "Nephrology Nursing (Renal)",
              "Cardiovascular / Cardiac Nursing",
              "Oncology Nursing",
              "Pediatric Oncology Nursing",
              "Diabetes Nursing",
              "Ophthalmic Nursing (Eye Care)",
              "Ear, Nose, and Throat (ENT) Nursing",
              "Neonatal Nursing",
              "Paediatric Nursing",
              "Midwifery / Reproductive Health Nursing",
              "Psychiatric / Mental Health Nursing",
              "Geriatric Nursing (Aged Care)",
              "Community Health / Public Health Nursing",
              "Family Health Nursing",
              "Palliative Care Nursing",
              "Other",
            ],
          },
          {
            value: "Undergraduate",
            label: "Undergraduate",
            subCadres: [
              { value: "BSN", label: "BSN" },
              { value: "BSM", label: "BSM" },
              { value: "Other Undergraduate", label: "Other Undergraduate" },
            ],
          },
          {
            value: "Diploma",
            label: "Diploma",
            subCadres: [
              { value: "KRCHN", label: "KRCHN" },
              { value: "KRNM", label: "KRNM" },
              { value: "KRN", label: "KRN" },
              { value: "KRM", label: "KRM" },
              { value: "Other Diploma RN", label: "Other Diploma RN" },
            ],
          },
          {
            value: "Certificate",
            label: "Certificate",
            subCadres: [
              { value: "KECHN", label: "KECHN" },
              { value: "Other Certificate RN", label: "Other Certificate RN" },
            ],
          },
          { value: "Other RN", label: "Other RN" },
        ],
      },
      { value: "Other Staff", label: "Other Staff" },
    ],
  },
  {
    group: "Intern",
    options: [
      { value: "MOI", label: "MOI (Medical Officer Intern)" },
      { value: "NOI", label: "NOI (Nursing Officer Intern)" },
      { value: "COI", label: "COI (Clinical Officer Intern)" },
      { value: "Other Intern", label: "Other Intern" },
    ],
  },
  {
    group: "Student",
    options: [
      {
        value: "Medical Student",
        label: "Medical Student",
        subCadres: [
          { value: "MBChB Student", label: "MBChB Student" },
          { value: "Pharmacy Student", label: "Pharmacy Student" },
          { value: "Dental Surgery Student", label: "Dental and Surgery Student" },
          { value: "Other Medical Student", label: "Other Medical Student" },
        ],
      },
      {
        value: "Clinical Officer Student",
        label: "Clinical Officer Student",
        subCadres: [
          { value: "BSc Clinical Medicine Student", label: "BSc Clinical Medicine Student" },
          { value: "Diploma in Clinical Medicine Student", label: "Diploma in Clinical Medicine Student" },
          { value: "Other Clinical Officer Student", label: "Other Clinical Officer Student" },
        ],
      },
      {
        value: "Nursing Student",
        label: "Nursing Student",
        subCadres: [
          {
            value: "BSN Student",
            label: "BSN Student",
            subCadres: [
              { value: "BSN Student", label: "BSN Student" },
              { value: "BSM Student", label: "BSM Student" },
              { value: "Other BSN Student", label: "Other BSN Student" },
            ],
          },
          {
            value: "Diploma Student",
            label: "Diploma Student",
            subCadres: [
              { value: "KRCHN Student", label: "KRCHN Student" },
              { value: "KRNM Student", label: "KRNM Student" },
              { value: "KRN Student", label: "KRN Student" },
              { value: "KRM Student", label: "KRM Student" },
              { value: "Other Diploma Nursing Student", label: "Other Diploma Nursing Student" },
            ],
          },
          {
            value: "Certificate Student",
            label: "Certificate Student",
            subCadres: [
              { value: "KECHN Student", label: "KECHN Student" },
              { value: "Other Certificate Nursing Student", label: "Other Certificate Nursing Student" },
            ],
          },
          { value: "Other Nursing Student", label: "Other Nursing Student" },
        ],
      },
      { value: "Consultant Physician Student", label: "Consultant Physician Student" },
      { value: "Other Student", label: "Other Student" },
    ],
  },
];

/** Helper to flatten all options for simple lookups or validation */
export function getAllCadreValues(): string[] {
  const values: string[] = [];
  const addOptions = (opts: CadreOption[]) => {
    for (const opt of opts) {
      values.push(opt.value);
      if (opt.subCadres) {
        addOptions(opt.subCadres);
      }
    }
  };
  for (const group of CPD_CADRE_TAXONOMY) {
    addOptions(group.options);
  }
  return values;
}

export const ALL_STANDARD_SPECIALTIES = [
  // Consultant Physician
  "General Paediatrician",
  "Paediatric Cardiologist",
  "Paediatric Nephrologist",
  "Paediatric Oncologist / Haematologist",
  "Paediatric Neurologist",
  "Paediatric Endocrinologist",
  "Paediatric Pulmonologist / Respirologist",
  "Paediatric Gastroenterologist",
  "Neonatologist",
  "Paediatric Critical Care Specialist",
  "Paediatric Emergency Medicine Specialist",
  "Paediatric Infectious Disease Specialist",
  "Paediatric Rheumatologist",
  "Paediatric Allergist / Immunologist",
  "Other Specialist",

  // MSN
  "Paediatric Critical Care Nursing",
  "Neonatal Nursing",
  "Midwifery / Reproductive Health Nursing",
  "Nephrology / Renal Nursing",
  "Oncology and Palliative Care Nursing",
  "Critical Care Nursing (Intensive Care)",
  "Trauma & Emergency Nursing",
  "Medical Surgical Nursing",
  "Nursing Education / Leadership",
  "Community Health Nursing",
  "Mental Health and Psychiatric Nursing",

  // HND
  "Nurse Anaesthesia Nursing (KRNA)",
  "Peri-Operative Nursing (Theatre Nursing)",
  "Stoma and Wound Care Nursing",
  "Infection Prevention and Control Nursing",
  "Nephrology Nursing (Renal)",
  "Cardiovascular / Cardiac Nursing",
  "Oncology Nursing",
  "Pediatric Oncology Nursing",
  "Diabetes Nursing",
  "Ophthalmic Nursing (Eye Care)",
  "Ear, Nose, and Throat (ENT) Nursing",
  "Paediatric Nursing",
  "Midwifery / Reproductive Health Nursing",
  "Psychiatric / Mental Health Nursing",
  "Geriatric Nursing (Aged Care)",
  "Community Health / Public Health Nursing",
  "Family Health Nursing",
  "Palliative Care Nursing",

  // Clinical Officer HND
  "Anaesthesia",
  "Paediatrics",
  "Ophthalmology / Cataract Surgery",
  "Orthopaedics",
  "ENT / Audiology",
  "Reproductive Health / Medicine",
  "Dermatology",
  "Oncology",
  "Chest / Pulmonology Medicine",
  "Emergency Medicine / Critical Care",
];
