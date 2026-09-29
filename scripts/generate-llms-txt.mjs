import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const source = readFileSync(
  resolve(root, "client/src/const/marketingCopy.ts"),
  "utf8"
);
const institutionalPricingSource = readFileSync(
  resolve(root, "shared/institutional-pricing.ts"),
  "utf8"
);

function readNumber(name) {
  const match = source.match(new RegExp(`export const ${name} = ([0-9_]+);`));
  if (!match) throw new Error(`Missing marketing constant: ${name}`);
  return Number(match[1].replaceAll("_", ""));
}

function readString(name) {
  const marker = `export const ${name} =`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Missing marketing constant: ${name}`);
  const rest = source.slice(start + marker.length).trimStart();
  const quote = rest[0];
  const end = rest.indexOf(quote, 1);
  if (!quote || end < 0) throw new Error(`Invalid marketing string: ${name}`);
  return rest.slice(1, end);
}

function readSharedNumber(pattern, name) {
  const match = institutionalPricingSource.match(pattern);
  if (!match) throw new Error(`Missing shared pricing constant: ${name}`);
  return Number(match[1].replaceAll("_", ""));
}

const cohortLabel = readString("COHORT_LABEL");
const blsPrice = readNumber("BLS_PRICE").toLocaleString("en-KE");
const blsCohortPrice = readNumber("BLS_COHORT_PRICE").toLocaleString("en-KE");
const aclsPrice = readNumber("ACLS_PRICE").toLocaleString("en-KE");
const aclsCohortPrice = readNumber("ACLS_COHORT_PRICE").toLocaleString("en-KE");
const iersPrice = [
  readSharedNumber(/level_4:\s*([0-9_]+)/, "IERS Level 4"),
  readSharedNumber(/level_5:\s*([0-9_]+)/, "IERS Level 5"),
  readSharedNumber(/level_6:\s*([0-9_]+)/, "IERS Level 6"),
].map(value => value.toLocaleString("en-KE")).join(" / ");
const icpdPrice = [1000, 900, 800, 700, 600]
  .map(value => value.toLocaleString("en-KE"))
  .join(" / ");
const geography = readString("INSTITUTIONAL_GEOGRAPHY_COPY");

const output = `# Paeds Resus

> Paeds Resus is an emergency-care organisation and platform based in Kenya, serving providers and institutions across all patient populations. Current institutional focus is Central Kenya; expansion across Kenya is planned, while East African Community expansion is not yet active.

## Canonical product architecture

### Individual products

- AHA BLS: basic life support training for individual healthcare providers. Price anchor: KES ${blsPrice} per person; KES ${blsCohortPrice} per person for ${cohortLabel}.
- AHA ACLS: advanced cardiovascular life support training for individual healthcare providers. Price anchor: KES ${aclsPrice} per person; KES ${aclsCohortPrice} per person for ${cohortLabel}.
- NERP: Nurses Emergency Readiness Program. Individual nurse pathway; request the current offer.
- IERP: Interns Emergency Readiness Program. Individual intern pathway; request the current offer.
- Paeds Resus Fellowship: individual paediatric emergency micro-course pathway; catalogue pricing applies.

### Institutional products

- ILSP: Institutional Life Support Program for institution-paid life-support cohorts, delivery, practical assessment, and completion evidence.
- IERS: Institutional Emergency Readiness System for hospital-wide emergency-response governance, activation, readiness evidence, drills, equipment gaps, corrective actions, and reporting. Annual price tiers (Levels 4/5/6): KES ${iersPrice}.
- ICPD: Institutional Continuous Professional Development for verified professional-development activity, attendance, targets, certificates, and leadership reporting. Per-staff price tiers: KES ${icpdPrice}, based on verified staff bands.

## Products within IERS

- ResusGPS is a product within IERS and is the IERS bedside-guidance product. It supports structured paediatric emergency assessment, CPR timing, weight-based calculations, protocols, and reassessment prompts. It does not replace local protocols, senior clinical judgement, supervision, or emergency services.
- Care Signal is the improvement layer within IERS. It supports honest reporting and review of incidents, near-misses, and corrective actions. It is not a punitive reporting tool and is not a substitute for a formal clinical record.

## Public pages

- Home: https://www.paedsresus.com/
- About: https://www.paedsresus.com/about
- Individual providers: https://www.paedsresus.com/for-providers
- Institutions: https://www.paedsresus.com/for-institutions
- Institutional product details: https://www.paedsresus.com/institutional
- Training catalogue: https://www.paedsresus.com/training
- AHA courses: https://www.paedsresus.com/aha-courses
- NERP: https://www.paedsresus.com/programs/nerp-acls
- IERP: https://www.paedsresus.com/programs/ierp
- Fellowship: https://www.paedsresus.com/fellowship
- IERS orientation: https://www.paedsresus.com/iers/orientation
- Family & Caregiver Safe-Truth: https://www.paedsresus.com/parent-safe-truth

## Institutional presence

${geography}

## Naming and claims rules

- Paeds Resus is the organisation and platform.
- Paeds Resus Limited is the training legal entity used on course pages.
- ResusGPS is an IERS product, not a standalone top-level institutional product.
- Use AHA-aligned unless the exact certification wording has been approved for the relevant course and delivery arrangement.
- Do not claim that software, training, or a certificate replaces clinical judgement, local protocols, supervision, or emergency services.
- Do not make unsupported mortality, competence, readiness, or certification guarantees.
- No facility, partner, case study, outcome figure, or testimonial is public unless the organisation has consented to publication.

## Contact

- Email: paedsresus254@gmail.com
- Phone/WhatsApp: +254 706 781 260
- Canonical website: https://www.paedsresus.com
`;

const target = resolve(root, "client/public/llms.txt");
writeFileSync(target, output, "utf8");
console.log(`Generated ${target}`);
