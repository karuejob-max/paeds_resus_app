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
    name: "Emergency Medicine",
    subs: ["Accident and Emergency / Casualty", "Triage"]
  },
  {
    name: "Anaesthesia and Critical Care Support",
    subs: ["Anaesthesia", "Pain Management"]
  },
  {
    name: "Pharmacy",
    subs: ["Inpatient Pharmacy", "Outpatient Pharmacy"]
  },
  {
    name: "Laboratory",
    subs: ["Haematology", "Microbiology", "Biochemistry", "Blood Bank"]
  },
  {
    name: "Radiology and Imaging",
    subs: ["Imaging Centre", "Ultrasound", "X-Ray"]
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
  { id: "male_surgical", name: "Male Surgical", category: "clinical" },
  { id: "female_surgical", name: "Female Surgical", category: "clinical" },
  { id: "theatre", name: "Theatre", category: "clinical" },
  { id: "obstetrics", name: "Obstetrics and Gyenocology (Maternity)", category: "clinical" },
  { id: "maternity", name: "Maternity", category: "clinical" },
  { id: "critical_care", name: "Critical Care", category: "clinical" },
  { id: "icu", name: "ICU", category: "clinical" },
  { id: "hdu", name: "HDU", category: "clinical" },
  { id: "nicu", name: "NICU", category: "clinical" },
  { id: "picu", name: "PICU", category: "clinical" },
  { id: "opd", name: "Out Patient Department", category: "clinical" },
  { id: "accident_emergency", name: "Accident and Emergency / Casualty", category: "clinical" },
  { id: "emergency_medicine", name: "Emergency Medicine", category: "clinical" },
  { id: "triage", name: "Triage", category: "clinical" },
  { id: "anaesthesia_support", name: "Anaesthesia and Critical Care Support", category: "support" },
  { id: "anaesthesia", name: "Anaesthesia", category: "support" },
  { id: "pain_management", name: "Pain Management", category: "support" },
  { id: "pharmacy", name: "Pharmacy", category: "support" },
  { id: "inpatient_pharmacy", name: "Inpatient Pharmacy", category: "support" },
  { id: "outpatient_pharmacy", name: "Outpatient Pharmacy", category: "support" },
  { id: "laboratory", name: "Laboratory", category: "diagnostic" },
  { id: "haematology", name: "Haematology", category: "diagnostic" },
  { id: "microbiology", name: "Microbiology", category: "diagnostic" },
  { id: "biochemistry", name: "Biochemistry", category: "diagnostic" },
  { id: "blood_bank", name: "Blood Bank", category: "diagnostic" },
  { id: "radiology", name: "Radiology and Imaging", category: "diagnostic" },
  { id: "imaging_centre", name: "Imaging Centre", category: "diagnostic" },
  { id: "ultrasound", name: "Ultrasound", category: "diagnostic" },
  { id: "x_ray", name: "X-Ray", category: "diagnostic" },
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

export interface DepartmentMatch {
  parent: string;
  sub: string;
}

export const DEPARTMENT_ALIASES: Record<string, string[]> = {
  "Paediatrics and Child Health": ["pediatric", "pediatrics", "paediatric", "paediatrics", "child", "children", "baby", "babies", "nursery"],
  "Paediatric Ward": ["pediatric", "pediatrics", "paediatric", "paediatrics", "child", "children", "peds"],
  "New Born Unit (NBU)": ["newborn", "new born", "nbu", "neonatal", "neonatology", "scbu", "nicu", "nursery"],
  "Internal Medicine": ["medical", "medicine", "physician", "adult", "physicians"],
  "Female Medical Ward": ["female medical", "female adult", "medical ward"],
  "Male Medical Ward": ["male medical", "male adult", "medical ward"],
  "Private Ward": ["private", "paying", "vip"],
  "Surgery": ["surgical", "surgery", "theatre", "or", "operation", "operating", "surgeon", "surgeons"],
  "Male Surgical": ["male surgical", "male surgery", "surgical ward"],
  "Female Surgical": ["female surgical", "female surgery", "surgical ward"],
  "Theatre": ["theatre", "or", "operating", "operation", "ot"],
  "Obstetrics and Gyenocology (Maternity)": ["obstetrics", "gynecology", "gynaecology", "maternity", "obs", "gyn", "obgyn", "delivery", "labour"],
  "Maternity": ["maternity", "delivery", "labour", "postnatal", "antenatal", "obs", "gyn", "obgyn"],
  "Critical Care": ["icu", "hdu", "nicus", "picus", "critical", "intensive"],
  "ICU": ["icu", "intensive care", "itu"],
  "HDU": ["hdu", "high dependency"],
  "NICU": ["nicu", "neonatal icu"],
  "PICU": ["picu", "paediatric icu", "pediatric icu"],
  "Out Patient Department": ["opd", "outpatient", "out-patient", "casualty", "emergency", "accident"],
  "Accident and Emergency / Casualty": ["accident", "emergency", "casualty", "a&e", "ae", "er"],
  "Clinics": ["clinic", "outpatient clinic"],
  "MCH": ["mch", "maternal", "child health", "immunization", "vaccine", "anc", "pnc"],
  "ENT": ["ent", "ear", "nose", "throat"],
  "Ophthalmology": ["eye", "ophthalmology", "ophthalmic"]
};

/** Finds any canonical pre-listed departments matching user-entered text. */
export function findMatchingCanonicalDepartments(userInput: string): DepartmentMatch[] {
  if (!userInput) return [];
  const cleanInput = userInput.trim().toLowerCase();
  if (cleanInput.length < 2) return [];

  const matches: DepartmentMatch[] = [];

  // Stop words to ignore during word-by-word token matching
  const stopWords = new Set(["ward", "staff", "department", "dept", "unit", "and", "or", "of", "centre", "center", "clinic", "clinics", "general", "other", "specify", "please"]);
  const inputWords = cleanInput.split(/[\s,:/()]+/).map(w => w.trim()).filter(w => w.length > 1 && !stopWords.has(w));

  const hasWord = (input: string, word: string): boolean => {
    const words = input.toLowerCase().split(/[\s,:/()]+/).map(w => w.trim());
    return words.includes(word.toLowerCase());
  };

  for (const dept of GLOBAL_DEPARTMENTS) {
    const parentLower = dept.name.toLowerCase();
    const parentAliases = DEPARTMENT_ALIASES[dept.name] || [];

    for (const sub of dept.subs) {
      const subLower = sub.toLowerCase();
      const subAliases = DEPARTMENT_ALIASES[sub] || [];

      // Check direct substring matches
      const isDirectMatch =
        (cleanInput.length >= 4 && parentLower.includes(cleanInput)) ||
        (parentLower.length >= 4 && cleanInput.includes(parentLower)) ||
        (cleanInput.length >= 4 && subLower.includes(cleanInput)) ||
        (subLower.length >= 4 && cleanInput.includes(subLower)) ||
        hasWord(cleanInput, parentLower) || hasWord(parentLower, cleanInput) ||
        hasWord(cleanInput, subLower) || hasWord(subLower, cleanInput);

      if (isDirectMatch) {
        matches.push({ parent: dept.name, sub });
        continue;
      }

      // Check aliases matches
      const allAliases = [...parentAliases, ...subAliases];
      const isAliasMatch = allAliases.some(alias => {
        const aliasLower = alias.toLowerCase();
        return (cleanInput.length >= 4 && aliasLower.includes(cleanInput)) ||
               (aliasLower.length >= 4 && cleanInput.includes(aliasLower)) ||
               hasWord(cleanInput, aliasLower) || hasWord(aliasLower, cleanInput);
      });

      if (isAliasMatch) {
        matches.push({ parent: dept.name, sub });
        continue;
      }

      // Check word-by-word token overlap
      const subWords = subLower.split(/[\s,:/()]+/).map(w => w.trim()).filter(w => w.length > 1 && !stopWords.has(w));
      const parentWords = parentLower.split(/[\s,:/()]+/).map(w => w.trim()).filter(w => w.length > 1 && !stopWords.has(w));

      const hasTokenMatch = inputWords.some(inWord => {
        const isSubWordMatch = subWords.some(subWord =>
          (inWord.length >= 4 && (subWord.startsWith(inWord) || inWord.startsWith(subWord))) ||
          subWord === inWord
        );
        const isParentWordMatch = parentWords.some(pWord =>
          (inWord.length >= 4 && (pWord.startsWith(inWord) || inWord.startsWith(pWord))) ||
          pWord === inWord
        );
        const isAliasWordMatch = allAliases.some(alias => {
          const aliasLower = alias.toLowerCase();
          return aliasLower === inWord || (inWord.length >= 4 && aliasLower.includes(inWord));
        });
        return isSubWordMatch || isParentWordMatch || isAliasWordMatch;
      });

      if (hasTokenMatch) {
        matches.push({ parent: dept.name, sub });
      }
    }
  }

  // Deduplicate matches
  const uniqueMatches: DepartmentMatch[] = [];
  const seen = new Set<string>();
  for (const m of matches) {
    const key = `${m.parent}:${m.sub}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueMatches.push(m);
    }
  }

  return uniqueMatches.slice(0, 5);
}

/** Normalizes a dirty/arbitrary department string to standard "Parent: Sub" format if it matches aliases. */
export function normalizeDepartmentString(deptStr: string | null | undefined): string {
  if (!deptStr) return "";
  const trimmed = deptStr.trim();
  if (!trimmed) return "";

  // Check if it's already a canonical "Parent: Sub"
  const parsed = parseDepartmentString(trimmed);
  if (!parsed.isCustomParent && !parsed.isCustomSub && parsed.parent && parsed.sub) {
    return formatDepartmentString(parsed.parent, parsed.sub);
  }

  // Try matching
  const matches = findMatchingCanonicalDepartments(trimmed);
  if (matches.length > 0) {
    return formatDepartmentString(matches[0].parent, matches[0].sub);
  }

  return trimmed;
}

export interface PresetDepartmentResolution {
  key: string;
  label: string;
  parent: string;
  sub: string;
}

/**
 * Resolve either a stored parent/sub label or a legacy single department name
 * to the same preset catalog used by profile and CPD forms.
 */
export function resolvePresetDepartment(value: string | null | undefined): PresetDepartmentResolution | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const normalized = trimmed.toLowerCase();

  for (const parent of GLOBAL_DEPARTMENTS) {
    if (parent.name.toLowerCase() === normalized) {
      const sub = parent.subs[0] ?? "General";
      return { key: `${parent.name}:${sub}`, label: formatDepartmentString(parent.name, sub), parent: parent.name, sub };
    }
    for (const sub of parent.subs) {
      const label = formatDepartmentString(parent.name, sub);
      if (label.toLowerCase() === normalized || sub.toLowerCase() === normalized) {
        return { key: `${parent.name}:${sub}`, label, parent: parent.name, sub };
      }
    }
  }

  if (trimmed.includes(":")) {
    const parsed = parseDepartmentString(trimmed);
    if (!parsed.isCustomParent && !parsed.isCustomSub && parsed.parent && parsed.sub) {
      const parent = GLOBAL_DEPARTMENTS.find((item) => item.name.toLowerCase() === parsed.parent.toLowerCase());
      const sub = parent?.subs.find((item) => item.toLowerCase() === parsed.sub.toLowerCase());
      if (parent && sub) {
        return { key: `${parent.name}:${sub}`, label: formatDepartmentString(parent.name, sub), parent: parent.name, sub };
      }
    }
  }

  return null;
}

/** Canonicalize a preset label; custom values remain trimmed and untouched. */
export function canonicalizeDepartmentLabel(value: string): string {
  return resolvePresetDepartment(value)?.label ?? value.trim();
}

export function isPresetDepartment(value: string | null | undefined): boolean {
  return resolvePresetDepartment(value) !== null;
}

export function departmentLabelsMatch(left: string | null | undefined, right: string | null | undefined): boolean {
  const leftPreset = resolvePresetDepartment(left);
  const rightPreset = resolvePresetDepartment(right);
  if (leftPreset && rightPreset) return leftPreset.key === rightPreset.key;
  return Boolean(left?.trim() && right?.trim() && left.trim().toLowerCase() === right.trim().toLowerCase());
}

export function getPresetDepartmentLabels(): string[] {
  return GLOBAL_DEPARTMENTS.flatMap((parent) => parent.subs.map((sub) => formatDepartmentString(parent.name, sub)));
}
