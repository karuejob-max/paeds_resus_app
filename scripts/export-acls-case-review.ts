/**
 * Generates docs/ACLS_CASE_DEFINITIONS_REVIEW.md from the case definitions so the
 * clinical owner reviews exactly what the engine enforces (not a paraphrase).
 * Run: npx tsx scripts/export-acls-case-review.ts
 */
import { writeFileSync } from "node:fs";
import { ADULT_ACLS_CASE_DEFINITIONS } from "../shared/adult-acls-case-definitions";
import { ADULT_ACLS_SCENARIOS, ADULT_ACLS_SCENARIO_VERSION } from "../shared/adult-acls-simulation-world";

const cmd = (c: { type: string; target?: string; cause?: string }) => c.type + (c.target ? `(${c.target})` : "") + (c.cause ? `(${c.cause})` : "");
const compact = (path: readonly { type: string; target?: string; cause?: string }[]) => {
  const out: string[] = [];
  for (let i = 0; i < path.length; ) {
    let j = i; while (j < path.length && cmd(path[j]) === cmd(path[i])) j++;
    out.push(j - i > 1 ? `${cmd(path[i])} x${j - i}` : cmd(path[i])); i = j;
  }
  return out.join(" -> ");
};
const req = (r: { type: string; descriptionIncludes?: string }) => r.type + (r.descriptionIncludes ? ` ("${r.descriptionIncludes}")` : "");

let md = `# ACLS case definitions for clinical review\n\n_Generated from \`shared/adult-acls-case-definitions.ts\` (engine ${ADULT_ACLS_SCENARIO_VERSION}). Do not edit by hand; run \`npx tsx scripts/export-acls-case-review.ts\`._\n\nBasis: 2025 AHA Guidelines for CPR and ECC. Every row is enforced by the scorer and a generated test harness.\n\n`;
for (const d of ADULT_ACLS_CASE_DEFINITIONS) {
  const scenario = ADULT_ACLS_SCENARIOS.find((s) => s.id === d.id)!;
  md += `## ${scenario.title} (\`${d.id}\`, ${d.family})\n\n${scenario.subtitle}\n\n`;
  md += `**Guideline basis**\n${d.guidelines.map((g) => `- ${g}`).join("\n")}\n\n`;
  md += `**Required (all)**: ${d.requiredEvents.length ? d.requiredEvents.map(req).join(", ") : "none beyond the flags below"}`;
  if (d.requiresRhythmAssessment) md += "; rhythm assessed before treatment";
  if (d.requiresPostRoscCare) md += "; post-ROSC care (oxygen, ventilation, perfusion support, reassessment; SpO2 >= 90 and SBP >= 90)";
  md += "\n\n";
  if (d.conditionalRequirements?.length) md += `**Conditional**: ${d.conditionalRequirements.map((c) => `if \`${c.whenEventType}\` occurs then ${c.require.map(req).join(", ")}`).join("; ")}\n\n`;
  if (d.poorChoices?.length) md += `**Poor choices (score capped below pass, not critical)**\n${d.poorChoices.map((p) => `- ${p.reason}`).join("\n")}\n\n`;
  md += `**Reference honest path**: ${compact(d.honestPath)}\n\n`;
  if (d.mustNotPassPaths?.length) md += `**Must not pass**\n${d.mustNotPassPaths.map((p) => `- ${p.label}: ${compact(p.path)}`).join("\n")}\n\n`;
  md += "**Clinical owner decision**: [ ] approved  [ ] changes requested\n\n---\n\n";
}
writeFileSync("docs/ACLS_CASE_DEFINITIONS_REVIEW.md", md);
console.log("Wrote docs/ACLS_CASE_DEFINITIONS_REVIEW.md");
