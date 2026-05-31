/**
 * P0 clinical content lint — forbidden phrases in fellowship seed + ResusGPS strings.
 * Exit 1 on match (wired into pnpm run check / CI gate).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

type Rule = {
  id: string;
  pattern: RegExp;
  /** If set, match is allowed when this pattern also matches nearby text */
  allowIfAlso?: RegExp;
  paths: string[];
};

const FELLOWSHIP_GLOB_DIRS = [
  "server/data",
  "scripts/fellowship-seed-lib.ts",
  "scripts/seed-fellowship-content.ts",
];

const AHA_CONTENT_PATHS = [
  "update-acls-pals-2025.ts",
  "update-bls-heartsaver-2025.ts",
  "update-ttm-team-dynamics-2025.ts",
  "server/seed-bls-acls-courses.ts",
  "server/seed-courses.ts",
];

const RESUS_PATHS = [
  "client/src/lib/resus",
  "client/src/lib/courseContent.ts",
  "shared/fellowship-microcourse-resus-conditions.ts",
];

/** All clinical content paths scanned by P0 lint rules. */
const CLINICAL_LINT_PATHS = [...FELLOWSHIP_GLOB_DIRS, ...AHA_CONTENT_PATHS, ...RESUS_PATHS];

const RULES: Rule[] = [
  {
    id: "insulin-bolus-children",
    pattern: /insulin\s+bolus/i,
    allowIfAlso: /no\s+bolus|never\s+bolus|never give insulin bolus|Do not.*bolus|no bolus in children|NOT.*bolus|without insulin bolus|infusion only|use infusion/i,
    paths: CLINICAL_LINT_PATHS,
  },
  {
    id: "kcl-iv-push",
    pattern: /KCl\s+(?:as\s+)?(?:an?\s+)?IV\s+(?:bolus|push)/i,
    allowIfAlso: /never|Do not|not IV push|never IV push|options:|wrong|distractor/i,
    paths: CLINICAL_LINT_PATHS,
  },
  {
    id: "artemether-severe-malaria-first-line",
    pattern: /artemether\s+(?:as\s+)?(?:first[- ]line|first line).{0,40}severe\s+malaria|severe\s+malaria.{0,60}artemether\s+(?:as\s+)?first[- ]line/i,
    allowIfAlso: /artesunate|options:|not first|IV\/IM artesunate/i,
    paths: CLINICAL_LINT_PATHS,
  },
  {
    id: "neonate-benzo-without-warning",
    pattern: /neonate.*benzodiazepine|benzodiazepine.*neonate|benzodiazepines.*neonate/i,
    allowIfAlso: /Do not|no benzos|avoid benzos|avoid benzodiazepine|not use benzodiazepines|non-neonate|NOT in neonates|Phenobarbitone first-line|phenobarbitone/i,
    paths: CLINICAL_LINT_PATHS,
  },
  {
    id: "mgdl-only-glucose",
    pattern: /(?:glucose|hypoglyc|hyperglyc|glycaemic|glycemic).{0,100}mg\/dL|mg\/dL.{0,100}(?:glucose|hypoglyc|hyperglyc)/i,
    allowIfAlso: /mmol\/L|mmol\/l|glucoseUnit|unit.*mg/i,
    paths: [...FELLOWSHIP_GLOB_DIRS, ...AHA_CONTENT_PATHS, "client/src/lib/courseContent.ts"],
  },
];

function collectFiles(dirOrFile: string): string[] {
  const abs = path.join(root, dirOrFile);
  if (!fs.existsSync(abs)) return [];
  const stat = fs.statSync(abs);
  if (stat.isFile()) return [abs];
  const out: string[] = [];
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === "dist") continue;
    const p = path.join(abs, ent.name);
    if (ent.isDirectory()) out.push(...collectFiles(path.relative(root, p)));
    else if (/\.(ts|tsx|js|mjs)$/.test(ent.name) && !/\.test\.(ts|tsx)$/.test(ent.name)) out.push(p);
  }
  return out;
}

function lineHasAllowance(line: string, allow?: RegExp): boolean {
  return allow ? allow.test(line) : false;
}

function main() {
  const fileSet = new Set<string>();
  for (const rule of RULES) {
    for (const p of rule.paths) {
      for (const f of collectFiles(p)) fileSet.add(f);
    }
  }

  let violations = 0;

  function fileInScope(rel: string, rule: Rule): boolean {
    const norm = rel.replace(/\\/g, "/");
    return rule.paths.some((p) => norm.startsWith(p.replace(/\\/g, "/")) || norm.includes(p));
  }

  for (const file of fileSet) {
    const rel = path.relative(root, file);
    const lines = fs.readFileSync(file, "utf8").split("\n");
    for (const rule of RULES) {
      if (!fileInScope(rel, rule)) continue;
      lines.forEach((line, idx) => {
        if (!rule.pattern.test(line)) return;
        const contextBlock = lines.slice(Math.max(0, idx - 4), idx + 6).join("\n");
        if (lineHasAllowance(line, rule.allowIfAlso) || lineHasAllowance(contextBlock, rule.allowIfAlso)) return;
        console.error(`[lint-clinical] ${rule.id} @ ${rel}:${idx + 1}`);
        console.error(`  ${line.trim().slice(0, 120)}`);
        violations++;
      });
    }
  }

  if (violations > 0) {
    console.error(`\n[lint-clinical] ${violations} P0 violation(s). Fix content or add safe-context allowance.`);
    process.exit(1);
  }
  console.log("[lint-clinical] OK — no P0 forbidden phrases in fellowship / AHA / ResusGPS paths.");
}

main();
