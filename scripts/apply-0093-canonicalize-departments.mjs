/**
 * Migration 0093 -- Canonicalize department names.
 * Scans providerProfiles, institutionalStaffMembers, cpdAttendees, and cpdEvents,
 * and normalizes any dirty/arbitrary department names using alias and keyword matching.
 * Idempotent.
 *
 * Run: pnpm run db:apply-0093
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const GLOBAL_DEPARTMENTS = [
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

const DEPARTMENT_ALIASES = {
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

function parseDepartmentString(deptStr) {
  if (!deptStr) {
    return { parent: "", sub: "", isCustomParent: false, isCustomSub: false };
  }

  const trimmed = deptStr.trim();
  if (!trimmed) {
    return { parent: "", sub: "", isCustomParent: false, isCustomSub: false };
  }

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

  return {
    parent: trimmed,
    sub: "Other",
    isCustomParent: true,
    isCustomSub: false
  };
}

function formatDepartmentString(parent, sub) {
  const p = parent.trim();
  const s = sub.trim();
  if (!p) return "";
  if (!s) return p;
  return `${p}: ${s}`;
}

function findMatchingCanonicalDepartments(userInput) {
  if (!userInput) return [];
  const cleanInput = userInput.trim().toLowerCase();
  if (cleanInput.length < 2) return [];

  const matches = [];
  const stopWords = new Set(["ward", "staff", "department", "dept", "unit", "and", "or", "of", "centre", "center", "clinic", "clinics", "general", "other", "specify", "please"]);
  const inputWords = cleanInput.split(/[\s,:/()]+/).map(w => w.trim()).filter(w => w.length > 1 && !stopWords.has(w));

  const hasWord = (input, word) => {
    const words = input.toLowerCase().split(/[\s,:/()]+/).map(w => w.trim());
    return words.includes(word.toLowerCase());
  };

  for (const dept of GLOBAL_DEPARTMENTS) {
    const parentLower = dept.name.toLowerCase();
    const parentAliases = DEPARTMENT_ALIASES[dept.name] || [];

    for (const sub of dept.subs) {
      const subLower = sub.toLowerCase();
      const subAliases = DEPARTMENT_ALIASES[sub] || [];

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

  const uniqueMatches = [];
  const seen = new Set();
  for (const m of matches) {
    const key = `${m.parent}:${m.sub}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueMatches.push(m);
    }
  }

  return uniqueMatches;
}

function normalizeDepartmentString(deptStr) {
  if (!deptStr) return "";
  const trimmed = deptStr.trim();
  if (!trimmed) return "";

  const parsed = parseDepartmentString(trimmed);
  if (!parsed.isCustomParent && !parsed.isCustomSub && parsed.parent && parsed.sub) {
    return formatDepartmentString(parsed.parent, parsed.sub);
  }

  const matches = findMatchingCanonicalDepartments(trimmed);
  if (matches.length > 0) {
    return formatDepartmentString(matches[0].parent, matches[0].sub);
  }

  return trimmed;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0093] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  try {
    console.log("[0093] Running department canonicalization migration...");

    // 1. Normalize providerProfiles
    const [profiles] = await conn.query("SELECT id, department FROM `providerProfiles` WHERE department IS NOT NULL AND department != ''");
    console.log(`[0093]   Scanning ${profiles.length} providerProfiles...`);
    let profileUpdatedCount = 0;
    for (const row of profiles) {
      const orig = row.department;
      const normalized = normalizeDepartmentString(orig);
      if (normalized && normalized !== orig) {
        await conn.query("UPDATE `providerProfiles` SET department = ? WHERE id = ?", [normalized, row.id]);
        profileUpdatedCount++;
      }
    }
    console.log(`[0093]   ✓ Normalized ${profileUpdatedCount} providerProfiles.`);

    // 2. Normalize institutionalStaffMembers
    const [staff] = await conn.query("SELECT id, department FROM `institutionalStaffMembers` WHERE department IS NOT NULL AND department != ''");
    console.log(`[0093]   Scanning ${staff.length} institutionalStaffMembers...`);
    let staffUpdatedCount = 0;
    for (const row of staff) {
      const orig = row.department;
      const normalized = normalizeDepartmentString(orig);
      if (normalized && normalized !== orig) {
        await conn.query("UPDATE `institutionalStaffMembers` SET department = ? WHERE id = ?", [normalized, row.id]);
        staffUpdatedCount++;
      }
    }
    console.log(`[0093]   ✓ Normalized ${staffUpdatedCount} institutionalStaffMembers.`);

    // 3. Normalize cpdAttendees
    const [attendees] = await conn.query("SELECT id, department FROM `cpdAttendees` WHERE department IS NOT NULL AND department != ''");
    console.log(`[0093]   Scanning ${attendees.length} cpdAttendees...`);
    let attendeesUpdatedCount = 0;
    for (const row of attendees) {
      const orig = row.department;
      const normalized = normalizeDepartmentString(orig);
      if (normalized && normalized !== orig) {
        await conn.query("UPDATE `cpdAttendees` SET department = ? WHERE id = ?", [normalized, row.id]);
        attendeesUpdatedCount++;
      }
    }
    console.log(`[0093]   ✓ Normalized ${attendeesUpdatedCount} cpdAttendees.`);

    // 4. Normalize cpdEvents (presenterDepartment)
    const [events] = await conn.query("SELECT id, presenterDepartment FROM `cpdEvents` WHERE presenterDepartment IS NOT NULL AND presenterDepartment != ''");
    console.log(`[0093]   Scanning ${events.length} cpdEvents...`);
    let eventsUpdatedCount = 0;
    for (const row of events) {
      const orig = row.presenterDepartment;
      const normalized = normalizeDepartmentString(orig);
      if (normalized && normalized !== orig) {
        await conn.query("UPDATE `cpdEvents` SET presenterDepartment = ? WHERE id = ?", [normalized, row.id]);
        eventsUpdatedCount++;
      }
    }
    console.log(`[0093]   ✓ Normalized ${eventsUpdatedCount} cpdEvents.`);

    console.log("[0093] Done.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0093] Fatal error:", err);
  process.exit(1);
});
