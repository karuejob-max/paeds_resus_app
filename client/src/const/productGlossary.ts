export type ProductGlossaryEntry = {
  acronym: string;
  name: string;
  forWhom: string;
  job: string;
};

export const PRODUCT_GLOSSARY: ProductGlossaryEntry[] = [
  {
    acronym: "NERP",
    name: "Nurses Emergency Readiness Program",
    forWhom: "Nurses and nurse leaders",
    job: "Builds individual emergency-readiness capability through structured learning, practice, and evidence.",
  },
  {
    acronym: "IERP",
    name: "Interns Emergency Readiness Program",
    forWhom: "Medical interns",
    job: "Builds a profile-first individual pathway for interns with practical progression and evidence gates.",
  },
  {
    acronym: "ILSP",
    name: "Institutional Life Support Program",
    forWhom: "Hospitals and health facilities",
    job: "Organises institution-paid life-support cohorts, delivery, practical assessment, and completion evidence.",
  },
  {
    acronym: "IERS",
    name: "Institutional Emergency Readiness System",
    forWhom: "CEOs, medical directors, and nursing leadership",
    job: "Makes emergency-response roles, readiness evidence, drills, gaps, and corrective actions visible.",
  },
  {
    acronym: "ICPD",
    name: "Institutional Continuous Professional Development",
    forWhom: "HR, nursing/medical education, and quality teams",
    job: "Records professional-development activity, attendance, targets, certificates, and leadership reports.",
  },
];
