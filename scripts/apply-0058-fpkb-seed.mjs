/**
 * Idempotent: FPKB taxonomy seed data v1.0 (migration 0058).
 *
 * Inserts into kb_failure_modes: 28 failure modes across 8 domains.
 * Inserts into kb_success_factors: 10 success factors across 6 domains.
 *
 * All records carry taxonomy_version = '1.0'.
 * All inserts are idempotent — uses INSERT IGNORE on the unique code key.
 *
 * Run: pnpm run db:apply-0058
 *
 * NOTE: Requires migration 0057 (FPKB schema) to have run first.
 *       Taxonomy is version-controlled — new modes added in future migrations,
 *       never by editing this file. Retiring a mode sets is_active = 0.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

// ─── Failure modes v1.0 (28 modes, 8 domains) ───────────────────────────────
// Spec: docs/FPKB_SCHEMA_V1.md §6.1 and docs/EVENT_MODELS_V1.md §5
const FAILURE_MODES = [
  // RECOGNITION
  {
    code: "RECOG_SHOCK_DELAYED",
    domain: "RECOGNITION",
    name: "Delayed shock recognition despite tachycardia and prolonged CRT",
    description:
      "The child had tachycardia and prolonged capillary refill time (CRT) present for more than 1 hour before shock was recognised by the clinical team. The signs were observable but were not acted upon.",
    conditions: ["CARDIOVASCULAR", "INFECTIOUS_BACTERIAL"],
  },
  {
    code: "RECOG_FEEDING_DIFFICULTY",
    domain: "RECOGNITION",
    name: "Feeding difficulty not recognised as emergency indicator",
    description:
      "The child was not feeding or had markedly reduced feeding for more than 6 hours, which was not identified by the clinical team as a WHO danger sign requiring urgent action.",
    conditions: ["INFECTIOUS_BACTERIAL", "METABOLIC", "NEONATAL"],
  },
  {
    code: "RECOG_DANGER_SIGNS_MISSED",
    domain: "RECOGNITION",
    name: "WHO danger signs present but not acted upon",
    description:
      "One or more WHO Integrated Management of Childhood Illness (IMCI) danger signs were present (convulsions, unable to drink/breastfeed, vomits everything, lethargic/unconscious, stridor, severe wasting, chest indrawing) but were not identified as requiring urgent referral or management.",
    conditions: null,
  },
  {
    code: "RECOG_RESP_SEVERITY",
    domain: "RECOGNITION",
    name: "Respiratory distress severity not graded correctly",
    description:
      "The severity of respiratory distress was underestimated (mild vs moderate, or moderate vs severe) leading to delayed or inadequate intervention. Common contributing factors include unfamiliarity with respiratory rate norms by age and failure to count respiratory rate over a full 60 seconds.",
    conditions: ["RESPIRATORY"],
  },
  {
    code: "RECOG_DECOMPENSATION",
    domain: "RECOGNITION",
    name: "Decompensation from compensated to decompensated state not recognised in time",
    description:
      "The child transitioned from compensated (normal blood pressure, tachycardia) to decompensated (hypotension, altered consciousness) shock without the team recognising and acting on the transitional signs. This commonly occurs between observations when vital signs are not repeated at sufficient intervals after an abnormal first reading.",
    conditions: ["CARDIOVASCULAR", "INFECTIOUS_BACTERIAL"],
  },
  // ESCALATION
  {
    code: "ESCL_SENIOR_DELAY",
    domain: "ESCALATION",
    name: "Delay calling for senior review despite threshold criteria being met",
    description:
      "The clinical team identified a deteriorating or critically unwell child but delayed calling for senior review beyond the threshold at which escalation should have occurred. Contributing factors include hierarchical hesitation, uncertainty about who to call, or lack of a defined escalation pathway.",
    conditions: null,
  },
  {
    code: "ESCL_NO_PROTOCOL",
    domain: "ESCALATION",
    name: "Escalation pathway not known or not followed",
    description:
      "The facility lacked a defined escalation protocol or the existing protocol was not followed. The team did not have a clear shared understanding of at what point, to whom, and using what communication method escalation should occur.",
    conditions: null,
  },
  {
    code: "ESCL_INOTROPE_DELAY",
    domain: "ESCALATION",
    name: "Inotropic support escalation delayed beyond clinical threshold",
    description:
      "A child in refractory shock (persisting despite adequate fluid resuscitation) did not receive inotropic support within the recommended timeframe. This may reflect scope-of-practice uncertainty, unavailability of the drug, or failure to recognise fluid-refractory shock.",
    conditions: ["CARDIOVASCULAR", "INFECTIOUS_BACTERIAL"],
  },
  // VASCULAR ACCESS
  {
    code: "ACCESS_IO_NOT_ATTEMPTED",
    domain: "VASCULAR_ACCESS",
    name: "Intraosseous access not attempted despite failed peripheral IV access",
    description:
      "After two or more failed peripheral IV attempts in a critically unwell child, intraosseous (IO) access was not attempted. Contributing factors include lack of IO training, unavailability of IO kit, scope-of-practice uncertainty, or unfamiliarity with IO as a standard emergency access route in children.",
    conditions: null,
  },
  {
    code: "ACCESS_PERIPHERAL_DELAY",
    domain: "VASCULAR_ACCESS",
    name: "Delay in establishing peripheral IV in deteriorating child",
    description:
      "A deteriorating child requiring intravenous treatment experienced a clinically significant delay in establishment of peripheral venous access. This may reflect lack of skills, equipment, or task allocation in the team.",
    conditions: null,
  },
  // TREATMENT
  {
    code: "TREAT_ANTIBIOTIC_DELAY",
    domain: "TREATMENT",
    name: "Antibiotic not administered within target time of sepsis recognition",
    description:
      "A child with suspected bacterial sepsis did not receive an appropriate antibiotic within 60 minutes of recognition of sepsis. This is one of the most consistently evidenced time-sensitive interventions in paediatric sepsis management.",
    conditions: ["INFECTIOUS_BACTERIAL"],
  },
  {
    code: "TREAT_DOSE_ERROR",
    domain: "TREATMENT",
    name: "Wrong weight-based dose calculated or administered",
    description:
      "A drug or fluid dose was calculated or administered at a dose that differed from the weight-based recommendation by more than 20%. This commonly reflects absence of a weight-based dosing reference at the bedside, incorrect weight estimation, or calculation errors under stress.",
    conditions: null,
  },
  {
    code: "TREAT_BOLUS_NOT_REASSESSED",
    domain: "TREATMENT",
    name: "Fluid bolus not reassessed after administration",
    description:
      "A fluid bolus was administered but the child was not formally reassessed for response (heart rate, capillary refill, blood pressure, respiratory signs of fluid overload) before the next bolus was given or management changed. This prevents detection of bolus-related complications and fails to confirm efficacy.",
    conditions: ["CARDIOVASCULAR", "INFECTIOUS_BACTERIAL"],
  },
  {
    code: "TREAT_ORS_OMITTED",
    domain: "TREATMENT",
    name: "ORS not administered in dehydration management",
    description:
      "A child with diarrhoea and dehydration did not receive oral rehydration solution (ORS) as part of management. This is a core WHO IMCI recommendation and one of the most effective and available interventions for childhood diarrhoea-related mortality.",
    conditions: ["METABOLIC"],
  },
  {
    code: "TREAT_ZINC_OMITTED",
    domain: "TREATMENT",
    name: "Zinc not administered in diarrhoea management",
    description:
      "A child with diarrhoea did not receive zinc supplementation as part of management. WHO and UNICEF recommend zinc for all children over 6 months with diarrhoea. Zinc reduces duration and severity of diarrhoeal episodes and subsequent incidence.",
    conditions: ["METABOLIC"],
  },
  {
    code: "TREAT_OXYGEN_NOT_GIVEN",
    domain: "TREATMENT",
    name: "Oxygen not administered despite availability and clinical indication",
    description:
      "A child with hypoxaemia (SpO2 < 90%, or clinical signs of severe respiratory distress) did not receive oxygen despite oxygen being physically available at the facility. This represents an execution failure rather than a resource failure.",
    conditions: ["RESPIRATORY"],
  },
  // REFERRAL
  {
    code: "REFER_DECISION_DELAY",
    domain: "REFERRAL",
    name: "Transfer decision delayed beyond clinical threshold",
    description:
      "A child requiring transfer to a higher-level facility for a level of care not available at the current facility did not have a transfer decision made within a clinically appropriate time. Delays commonly reflect uncertainty about transfer criteria, waiting for investigations that will not change the transfer decision, or administrative barriers.",
    conditions: null,
  },
  {
    code: "REFER_UNSTABILISED",
    domain: "REFERRAL",
    name: "Transfer initiated without adequate stabilisation",
    description:
      "A child was transferred to another facility without receiving the stabilisation interventions that were available and indicated at the sending facility (airway management, oxygen, IV access, first fluid bolus, first antibiotic dose). Pre-transfer stabilisation is a key determinant of outcome during transfer.",
    conditions: null,
  },
  {
    code: "REFER_NO_NOTIFICATION",
    domain: "REFERRAL",
    name: "Receiving facility not notified before transfer",
    description:
      "A child was transferred to another facility without prior notification to the receiving team. This prevents the receiving team from preparing, identifying an appropriate bed, and activating specialist support. It also risks the receiving facility being unable to accept the child on arrival.",
    conditions: null,
  },
  // MONITORING
  {
    code: "MON_NO_REPEAT_VITALS",
    domain: "MONITORING",
    name: "Vital signs not repeated after intervention",
    description:
      "After a clinical intervention (fluid bolus, drug administration, oxygen initiation), vital signs were not repeated within a clinically appropriate interval to assess response. This prevents early detection of treatment failure or complications.",
    conditions: null,
  },
  {
    code: "MON_DETERIORATION_MISSED",
    domain: "MONITORING",
    name: "Deterioration not detected between scheduled observations",
    description:
      "A child deteriorated significantly between scheduled vital sign observations and the deterioration was not detected until the next scheduled observation or when the child was found in extremis. This reflects either insufficient observation frequency for the child's acuity or lack of a system for prompting reassessment when initial observations are abnormal.",
    conditions: null,
  },
  // COMMUNICATION
  {
    code: "COMM_CLOSED_LOOP_FAILURE",
    domain: "COMMUNICATION",
    name: "Closed-loop communication failure during resuscitation",
    description:
      "During a resuscitation or emergency event, instructions were not confirmed by the recipient (closed-loop communication failed), leading to tasks not being performed, wrong doses being given, or tasks being performed by multiple people simultaneously. This is a team communication failure mode associated with poor resuscitation outcomes.",
    conditions: null,
  },
  {
    code: "COMM_HANDOVER_LOSS",
    domain: "COMMUNICATION",
    name: "Handover information lost or incomplete",
    description:
      "Critical clinical information about a deteriorating or at-risk child was not communicated effectively during a shift handover or transfer of care, resulting in the receiving team being unaware of important findings, trends, or planned actions.",
    conditions: null,
  },
  {
    code: "COMM_FAMILY_NOT_INFORMED",
    domain: "COMMUNICATION",
    name: "Family not informed of deterioration",
    description:
      "The family or caregiver of a critically unwell or deteriorating child was not informed of the child's condition, the seriousness of the situation, or the planned management. This prevents families from making informed decisions about transfer, intervention, or being present with their child.",
    conditions: null,
  },
  // RESOURCE AVAILABILITY
  {
    code: "RES_OXYGEN_UNAVAILABLE",
    domain: "RESOURCE_AVAILABILITY",
    name: "Oxygen not available or not functioning at time of need",
    description:
      "Oxygen was not available at the facility or the delivery system was not functioning when a child required it. This is a structural resource failure (distinct from execution failure where oxygen is available but not administered).",
    conditions: ["RESPIRATORY"],
  },
  {
    code: "RES_WRONG_SIZE_EQUIPMENT",
    domain: "RESOURCE_AVAILABILITY",
    name: "Equipment wrong size for paediatric patient",
    description:
      "Equipment required for the child's management (defibrillator pads, bag-mask device, airway adjuncts, blood pressure cuff) was only available in adult sizes, making it unusable or suboptimal for a paediatric patient. This reflects inadequate paediatric emergency equipment stocking.",
    conditions: null,
  },
  {
    code: "RES_DRUG_STOCKOUT",
    domain: "RESOURCE_AVAILABILITY",
    name: "Essential drug out of stock at time of need",
    description:
      "A drug required for the child's management was not available at the facility due to stock depletion. This is a resource failure distinct from cases where the drug was available but not prescribed or administered.",
    conditions: null,
  },
  {
    code: "RES_IO_KIT_UNAVAILABLE",
    domain: "RESOURCE_AVAILABILITY",
    name: "IO needle or kit not available when needed",
    description:
      "An intraosseous (IO) needle or IO insertion kit was not available at the point of need when a child required emergency vascular access. This may reflect poor emergency trolley stocking, kit stored in an inaccessible location, or prior use without restocking.",
    conditions: null,
  },
];

// ─── Success factors v1.0 (10 factors, 6 domains) ───────────────────────────
// Spec: docs/FPKB_SCHEMA_V1.md §6.2
const SUCCESS_FACTORS = [
  {
    code: "RECOG_NURSE_SEPSIS_CHECKLIST",
    domain: "RECOGNITION",
    name: "Nurse-led sepsis checklist at triage for all febrile children under 5",
    description:
      "A structured nurse-initiated checklist applied at triage to all febrile children under 5 years, systematically screening for danger signs of sepsis before physician review. Associated with earlier identification of sepsis and reduced time-to-treatment in facilities where implemented.",
  },
  {
    code: "RECOG_STRUCTURED_TRIAGE",
    domain: "RECOGNITION",
    name: "Structured paediatric triage tool applied at point of first contact",
    description:
      "A validated paediatric triage tool (e.g. ETAT, traffic-light system) applied systematically at the point of first patient contact, enabling early identification of emergency cases and priority treatment before full assessment.",
  },
  {
    code: "ACCESS_IO_KIT_AT_TRIAGE",
    domain: "VASCULAR_ACCESS",
    name: "IO kit stored at triage enabling access without delay",
    description:
      "Intraosseous (IO) insertion kits stored at the triage point rather than in a central store or on a trolley, enabling immediate IO access without delay for equipment retrieval in a child who requires it.",
  },
  {
    code: "ACCESS_IO_DRILL_MONTHLY",
    domain: "VASCULAR_ACCESS",
    name: "Monthly IO drill reduced mean access time in resuscitation scenarios",
    description:
      "A structured monthly simulation drill for IO insertion practice by all ward nursing staff, associated with a measurable reduction in mean time-to-IO-access during resuscitation scenarios.",
  },
  {
    code: "TREAT_WEIGHT_CHART_BEDSIDE",
    domain: "TREATMENT",
    name: "Weight-based dosing chart at bedside eliminated calculation errors",
    description:
      "A laminated weight-band-based dosing reference chart kept at each bedside, eliminating the need for mental calculation of weight-based drug doses under stress and associated with a reduction in dosing errors.",
  },
  {
    code: "TREAT_ANTIBIOTIC_BUNDLE",
    domain: "TREATMENT",
    name: "Antibiotic bundle protocol reduced time-to-antibiotic in sepsis",
    description:
      "A structured sepsis bundle protocol including pre-prescribed weight-based antibiotic doses that can be initiated by a nurse without waiting for a doctor's prescription, associated with a measurable reduction in time-to-first-antibiotic in suspected sepsis.",
  },
  {
    code: "REFER_NOTIFICATION_PROTOCOL",
    domain: "REFERRAL",
    name: "Structured receiving facility notification protocol reduced handover gaps",
    description:
      "A structured communication protocol requiring the sending team to call and provide an SBAR (Situation, Background, Assessment, Recommendation) summary to the receiving facility before transfer, associated with reduced handover gaps and improved receiving facility preparation.",
  },
  {
    code: "MON_OBSERVATION_CHART_REDESIGN",
    domain: "MONITORING",
    name: "Observation chart redesign prompted reassessment at 15-minute intervals after abnormal vitals",
    description:
      "Redesign of the ward observation chart to include a mandatory 15-minute reassessment trigger when any vital sign is outside normal limits, associated with earlier detection of deterioration and reduced time-to-intervention.",
  },
  {
    code: "COMM_SBAR_HANDOVER",
    domain: "COMMUNICATION",
    name: "SBAR handover structure reduced information loss at shift change",
    description:
      "Implementation of the SBAR (Situation, Background, Assessment, Recommendation) structured handover format for shift changeovers, associated with reduced information loss and improved awareness of at-risk patients by the incoming team.",
  },
  {
    code: "ESCL_STRUCTURED_ESCALATION",
    domain: "ESCALATION",
    name: "Nurse-initiated structured escalation pathway reduced time-to-senior from 45 to 8 minutes",
    description:
      "Implementation of a nurse-initiated escalation pathway with defined criteria (specific vital sign thresholds), a named senior to contact, and a defined response time expectation, associated with a reduction in mean time-to-senior-review from 45 to 8 minutes in one observed implementation.",
  },
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0058] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);

  try {
    console.log("[0058] Seeding FPKB taxonomy v1.0...");

    // ── Failure modes ────────────────────────────────────────────────────────
    console.log(`[0058] Inserting ${FAILURE_MODES.length} failure modes...`);
    let fmInserted = 0;
    let fmSkipped = 0;

    for (const mode of FAILURE_MODES) {
      const [result] = await conn.query(
        `INSERT IGNORE INTO \`kb_failure_modes\`
         (id, failure_mode_code, failure_domain, failure_mode_name, description, condition_categories, taxonomy_version)
         VALUES (UUID(), ?, ?, ?, ?, ?, '1.0')`,
        [
          mode.code,
          mode.domain,
          mode.name,
          mode.description,
          mode.conditions ? JSON.stringify(mode.conditions) : null,
        ]
      );
      if (result.affectedRows > 0) {
        fmInserted++;
      } else {
        fmSkipped++;
      }
    }
    console.log(`[0058]   ✓ Failure modes: ${fmInserted} inserted, ${fmSkipped} already existed.`);

    // ── Success factors ──────────────────────────────────────────────────────
    console.log(`[0058] Inserting ${SUCCESS_FACTORS.length} success factors...`);
    let sfInserted = 0;
    let sfSkipped = 0;

    for (const factor of SUCCESS_FACTORS) {
      const [result] = await conn.query(
        `INSERT IGNORE INTO \`kb_success_factors\`
         (id, success_factor_code, success_domain, success_factor_name, description, taxonomy_version)
         VALUES (UUID(), ?, ?, ?, ?, '1.0')`,
        [factor.code, factor.domain, factor.name, factor.description]
      );
      if (result.affectedRows > 0) {
        sfInserted++;
      } else {
        sfSkipped++;
      }
    }
    console.log(`[0058]   ✓ Success factors: ${sfInserted} inserted, ${sfSkipped} already existed.`);

    console.log("[0058] Seed complete.");
    console.log("[0058] The Failure Pattern Atlas is ready to receive its first observations.");
    console.log("[0058] Next: deploy Care Signal v3 and watch the pattern data arrive.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0058] Fatal error:", err);
  process.exit(1);
});
