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

export const CNE_CADRE_TAXONOMY: CadreGroup[] = [
  {
    group: "Staff",
    options: [
      {
        value: "Consultant Physician",
        label: "Consultant Physician",
        subSpecialties: ["Paediatrician", "Other Specialist", "Other"],
      },
      { value: "MO", label: "MO" },
      { value: "RCO", label: "RCO" },
      {
        value: "RN",
        label: "RN (Registered Nurse)",
        subCadres: [
          {
            value: "MSN",
            label: "MSN",
            subSpecialties: ["Paediatric Critical Care", "Neonatology", "Emergency Nursing", "Other"],
          },
          {
            value: "HND",
            label: "HND",
            subSpecialties: ["Paediatric Critical Care", "Neonatology", "Emergency Nursing", "Other"],
          },
          {
            value: "Undergraduate",
            label: "Undergraduate",
            subCadres: [
              { value: "BSN", label: "BSN" },
              { value: "BSM", label: "BSM" },
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
            ],
          },
          { value: "ERN", label: "ERN" },
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
      { value: "Nursing Student", label: "Nursing Student" },
      { value: "Clinical Officer Student", label: "Clinical Officer Student" },
      { value: "MBChB Student", label: "MBChB Student" },
      {
        value: "RN Student",
        label: "RN Student",
        subCadres: [
          { value: "MSN Student", label: "MSN Student" },
          { value: "HND Student", label: "HND Student" },
          { value: "BSN Student", label: "BSN Student" },
          { value: "BSM Student", label: "BSM Student" },
          { value: "KRCHN Student", label: "KRCHN Student" },
          { value: "KRNM Student", label: "KRNM Student" },
          { value: "KRN Student", label: "KRN Student" },
          { value: "KRM Student", label: "KRM Student" },
          { value: "ERN Student", label: "ERN Student" },
        ],
      },
      { value: "Consultant Physician Student", label: "Consultant Physician Student" },
      { value: "MO Student", label: "MO Student" },
      { value: "RCO Student", label: "RCO Student" },
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
  for (const group of CNE_CADRE_TAXONOMY) {
    addOptions(group.options);
  }
  return values;
}
