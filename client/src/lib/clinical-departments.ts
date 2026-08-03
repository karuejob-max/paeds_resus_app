/**
 * Canonical Clinical Department Directory & Helpers.
 * Used across CPD registration, institutional dashboards, and staff management.
 */

export interface ParentDepartmentOption {
  name: string;
  subs: string[];
}

export const GLOBAL_DEPARTMENTS: ParentDepartmentOption[] = [
  {
    name: "Paediatrics and Child Health",
    subs: ["Paediatric Ward", "New Born Unit (NBU)"]
  },
  {
    name: "Internal Medicine",
    subs: ["Female Medical Ward", "Male Medical Ward", "Private Ward"]
  },
  {
    name: "Surgery",
    subs: ["Male Surgical", "Female Surgical", "Private Ward", "Theatre"]
  },
  {
    name: "Obstetrics and Gyenocology (Maternity)",
    subs: ["Maternity"]
  },
  {
    name: "Critical Care",
    subs: ["ICU", "HDU", "NICU", "PICU"]
  },
  {
    name: "Out Patient Department",
    subs: [
      "Accident and Emergency / Casualty",
      "Cancer Care Centre",
      "Dialysis",
      "Imaging Centre",
      "Comprehensive Care Centre"
    ]
  },
  {
    name: "Clinics",
    subs: ["MCH", "ENT", "Ophthalmology"]
  },
  {
    name: "Medical School/College",
    subs: ["General"]
  }
];

export interface ClinicalDepartmentOption {
  id: string;
  name: string;
  category: "clinical" | "diagnostic" | "support" | "other";
}

// Flat list for legacy backwards compatibility
export const CANONICAL_CLINICAL_DEPARTMENTS: ClinicalDepartmentOption[] = [
  { id: "paediatrics", name: "Paediatrics and Child Health", category: "clinical" },
  { id: "paediatric_ward", name: "Paediatric Ward", category: "clinical" },
  { id: "nbu", name: "New Born Unit (NBU)", category: "clinical" },
  { id: "internal_medicine", name: "Internal Medicine", category: "clinical" },
  { id: "surgery", name: "Surgery", category: "clinical" },
  { id: "obstetrics", name: "Obstetrics and Gyenocology (Maternity)", category: "clinical" },
  { id: "maternity", name: "Maternity", category: "clinical" },
  { id: "critical_care", name: "Critical Care", category: "clinical" },
  { id: "icu", name: "ICU", category: "clinical" },
  { id: "hdu", name: "HDU", category: "clinical" },
  { id: "nicu", name: "NICU", category: "clinical" },
  { id: "picu", name: "PICU", category: "clinical" },
  { id: "opd", name: "Out Patient Department", category: "clinical" },
  { id: "accident_emergency", name: "Accident and Emergency / Casualty", category: "clinical" },
  { id: "clinics", name: "Clinics", category: "clinical" },
  { id: "medical_school", name: "Medical School/College", category: "support" },
  { id: "other", name: "Other", category: "other" }
];

export const CLINICAL_DEPARTMENT_NAMES = CANONICAL_CLINICAL_DEPARTMENTS.map((d) => d.name);

export function isCanonicalDepartment(dept: string): boolean {
  return CANONICAL_CLINICAL_DEPARTMENTS.some(
    (d) => d.name.toLowerCase() === dept.toLowerCase() && d.id !== "other"
  );
}

export interface ParsedDepartment {
  parent: string;
  sub: string;
  isCustomParent: boolean;
  isCustomSub: boolean;
}

/** Parses a stored department string into its parent and sub parts */
export function parseDepartmentString(deptStr: string | null | undefined): ParsedDepartment {
  if (!deptStr) {
    return { parent: "", sub: "", isCustomParent: false, isCustomSub: false };
  }

  const trimmed = deptStr.trim();
  if (!trimmed) {
    return { parent: "", sub: "", isCustomParent: false, isCustomSub: false };
  }

  // Case 1: Contains colon separator
  if (trimmed.includes(":")) {
    const parts = trimmed.split(":");
    const parentPart = parts[0].trim();
    const subPart = parts.slice(1).join(":").trim();

    const parentMatch = GLOBAL_DEPARTMENTS.find(
      (d) => d.name.toLowerCase() === parentPart.toLowerCase()
    );

    if (parentMatch) {
      const isSubOther = subPart.toLowerCase() === "other";
      const subMatch = parentMatch.subs.find(
        (s) => s.toLowerCase() === subPart.toLowerCase()
      );

      return {
        parent: parentMatch.name,
        sub: subMatch ? subMatch : subPart,
        isCustomParent: false,
        isCustomSub: !subMatch && !isSubOther
      };
    } else {
      return {
        parent: parentPart,
        sub: subPart,
        isCustomParent: true,
        isCustomSub: true
      };
    }
  }

  // Case 2: Legacy single string check
  // Check if it matches any sub-department of our global list to resolve parent
  for (const dept of GLOBAL_DEPARTMENTS) {
    const matchedSub = dept.subs.find(
      (s) => s.toLowerCase() === trimmed.toLowerCase() ||
             (trimmed.toLowerCase().includes("casualty") && s.toLowerCase().includes("casualty")) ||
             (trimmed.toLowerCase().includes("emergency") && s.toLowerCase().includes("casualty")) ||
             (trimmed.toLowerCase() === "maternity" && s.toLowerCase() === "maternity") ||
             (trimmed.toLowerCase() === "icu" && s.toLowerCase() === "icu") ||
             (trimmed.toLowerCase() === "hdu" && s.toLowerCase() === "hdu") ||
             (trimmed.toLowerCase() === "nicu" && s.toLowerCase() === "nicu") ||
             (trimmed.toLowerCase() === "picu" && s.toLowerCase() === "picu")
    );
    if (matchedSub) {
      return {
        parent: dept.name,
        sub: matchedSub,
        isCustomParent: false,
        isCustomSub: false
      };
    }
  }

  // Check if it matches any parent department name
  const parentMatch = GLOBAL_DEPARTMENTS.find(
    (d) => d.name.toLowerCase() === trimmed.toLowerCase() ||
           trimmed.toLowerCase().includes("paediatric") ||
           trimmed.toLowerCase().includes("obstetrics")
  );
  if (parentMatch) {
    return {
      parent: parentMatch.name,
      sub: parentMatch.name.toLowerCase().includes("obstetrics") ? "Maternity" : "General",
      isCustomParent: false,
      isCustomSub: false
    };
  }

  // Case 3: Totally custom text
  return {
    parent: trimmed,
    sub: "Other",
    isCustomParent: true,
    isCustomSub: false
  };
}

/** Formats a parent and sub department choice into the saved string */
export function formatDepartmentString(parent: string, sub: string): string {
  const p = parent.trim();
  const s = sub.trim();
  if (!p) return "";
  if (!s) return p;
  return `${p}: ${s}`;
}
