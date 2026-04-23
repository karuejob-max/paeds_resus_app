/**
 * clinicalDocuments.ts
 *
 * Generates two pre-filled clinical documents from an active ResusGPS session:
 *
 * 1. generateReferralLetter()
 *    — Formal inter-facility referral letter (SBAR-structured)
 *    — Suitable for printing, faxing, or pasting into an EHR
 *    — Includes: patient demographics, vitals, diagnosis, interventions given,
 *      resource gaps, and specific reason for referral
 *
 * 2. generateProgressNote()
 *    — Structured nursing progress note for the cardex or doctor's
 *      continuation notes
 *    — Format: Date/Time | Nurse | SOAPIE (Subjective, Objective, Assessment,
 *      Plan, Intervention, Evaluation) with a dedicated Handover section
 *    — Designed to be pasted directly into the patient chart
 *
 * Both functions are pure (no side effects) and return plain text strings
 * suitable for clipboard copy, file download, or print.
 */

import type { ResusSession } from './abcdeEngine';

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtDateTime(ts: number): string {
  return `${fmtDate(ts)} at ${fmtTime(ts)}`;
}

function elapsedMinutes(session: ResusSession): number {
  return Math.round((Date.now() - session.startTime) / 60000);
}

function vitalLine(label: string, value: string | number | undefined, unit: string): string {
  return value !== undefined ? `  ${label}: ${value} ${unit}`.trimEnd() : '';
}

function completedInterventions(session: ResusSession): string[] {
  return session.threats
    .flatMap((t) => t.interventions)
    .filter((i) => i.status === 'completed')
    .map((i) => i.action);
}

function inProgressInterventions(session: ResusSession): string[] {
  return session.threats
    .flatMap((t) => t.interventions)
    .filter((i) => i.status === 'in_progress')
    .map((i) => i.action);
}

function unavailableInterventions(session: ResusSession): string[] {
  return session.threats
    .flatMap((t) => t.interventions)
    .filter((i) => i.status === 'skipped' && (i as any).unavailableAt)
    .map((i) => i.action);
}

function threatsLine(session: ResusSession): string {
  const active = session.threats.filter((t) => t.status === 'active' || t.status === 'in_progress');
  if (!active.length) return 'No active threats identified.';
  return active.map((t) => `[${t.letter}] ${t.name} (${t.severity})`).join('; ');
}

function diagnosisLine(session: ResusSession): string {
  if (session.phase === 'CARDIAC_ARREST') return 'Cardiac Arrest — PALS protocol active';
  if (session.definitiveDiagnosis) return session.definitiveDiagnosis;
  const threats = session.threats.filter((t) => t.status === 'active' || t.status === 'in_progress');
  if (threats.length) return threats.map((t) => t.name).join(', ');
  return 'Under assessment — see findings below';
}

function fluidSummary(session: ResusSession): string {
  const ft = session.fluidTracker;
  if (ft.bolusCount === 0) return 'No fluid boluses administered.';
  const refractory = ft.isFluidRefractory ? ' ⚠ FLUID-REFRACTORY' : '';
  return (
    `${ft.bolusCount} bolus(es) of ${ft.fluidType} — ` +
    `Total: ${Math.round(ft.totalVolumeMl)} mL` +
    (session.patientWeight
      ? ` (${Math.round(ft.totalVolumePerKg)} mL/kg)`
      : '') +
    refractory
  );
}

function sampleBlock(session: ResusSession): string[] {
  const s = session.sampleHistory;
  const lines: string[] = [];
  if (s.signs) lines.push(`  S — Signs & Symptoms : ${s.signs}`);
  if (s.allergies) lines.push(`  A — Allergies        : ${s.allergies}`);
  if (s.medications) lines.push(`  M — Medications      : ${s.medications}`);
  if (s.pastHistory) lines.push(`  P — Past History     : ${s.pastHistory}`);
  if (s.lastMeal) lines.push(`  L — Last Meal        : ${s.lastMeal}`);
  if (s.events) lines.push(`  E — Events/Mechanism : ${s.events}`);
  return lines;
}

// ─── 1. Referral Letter ─────────────────────────────────────────────────────

export function generateReferralLetter(
  session: ResusSession,
  options?: {
    fromFacility?: string;
    fromProvider?: string;
    toFacility?: string;
    patientName?: string;
    patientId?: string;
  }
): string {
  const opt = options || {};
  const now = Date.now();
  const lines: string[] = [];

  const from = opt.fromFacility || '[REFERRING FACILITY]';
  const to = opt.toFacility || '[RECEIVING FACILITY]';
  const provider = opt.fromProvider || '[REFERRING PROVIDER / DESIGNATION]';
  const patientName = opt.patientName || '[PATIENT NAME]';
  const patientId = opt.patientId || '[IP/OP NUMBER]';

  // ── Header ──
  lines.push('══════════════════════════════════════════════════════════');
  lines.push('           INTER-FACILITY REFERRAL LETTER');
  lines.push('           Paeds Resus Platform — Auto-Generated');
  lines.push('══════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Date:               ${fmtDate(now)}`);
  lines.push(`Time:               ${fmtTime(now)}`);
  lines.push(`From:               ${from}`);
  lines.push(`Referring Provider: ${provider}`);
  lines.push(`To:                 ${to}`);
  lines.push('');
  lines.push('──────────────────────────────────────────────────────────');
  lines.push('PATIENT DETAILS');
  lines.push('──────────────────────────────────────────────────────────');
  lines.push(`Patient Name:  ${patientName}`);
  lines.push(`Patient ID:    ${patientId}`);
  if (session.patientAge) lines.push(`Age:           ${session.patientAge}`);
  if (session.patientWeight) lines.push(`Weight:        ${session.patientWeight} kg`);
  if (session.isTrauma) lines.push('Case Type:     TRAUMA');
  lines.push('');

  // ── S — Situation ──
  lines.push('──────────────────────────────────────────────────────────');
  lines.push('S — SITUATION');
  lines.push('──────────────────────────────────────────────────────────');
  lines.push(
    `This child was assessed at ${from} on ${fmtDateTime(session.startTime)} ` +
    `and requires urgent transfer to ${to} for higher-level care.`
  );
  lines.push('');
  lines.push(`Primary Problem: ${diagnosisLine(session)}`);
  lines.push(`Active Threats:  ${threatsLine(session)}`);
  lines.push('');

  // ── B — Background ──
  lines.push('──────────────────────────────────────────────────────────');
  lines.push('B — BACKGROUND');
  lines.push('──────────────────────────────────────────────────────────');
  const sample = sampleBlock(session);
  if (sample.length) {
    lines.push('SAMPLE History:');
    lines.push(...sample);
  } else {
    lines.push('SAMPLE History: Not documented at time of transfer.');
  }
  lines.push('');

  // ── A — Assessment ──
  lines.push('──────────────────────────────────────────────────────────');
  lines.push('A — ASSESSMENT (ABCDE Primary Survey)');
  lines.push('──────────────────────────────────────────────────────────');
  const vs = session.vitalSigns;
  const vitals = [
    vitalLine('Heart Rate', vs.hr, 'bpm'),
    vitalLine('Respiratory Rate', vs.rr, '/min'),
    vitalLine('SpO₂', vs.spo2, '%'),
    vs.sbp !== undefined && vs.dbp !== undefined
      ? `  BP: ${vs.sbp}/${vs.dbp} mmHg`
      : '',
    vitalLine('Temperature', vs.temp, '°C'),
    vitalLine('Blood Glucose', vs.glucose, 'mmol/L'),
    vitalLine('CRT', vs.crt, 'seconds'),
    vitalLine('Lactate', vs.lactate, 'mmol/L'),
  ].filter(Boolean);

  if (vitals.length) {
    lines.push('Vital Signs at Time of Transfer:');
    lines.push(...vitals);
  } else {
    lines.push('Vital Signs: Not documented.');
  }
  lines.push('');

  if (session.derivedPerfusion) {
    lines.push(`Perfusion State (engine-derived): ${session.derivedPerfusion}`);
    lines.push('');
  }

  // Findings summary
  if (session.findings.length) {
    lines.push('Key Findings:');
    for (const f of session.findings) {
      const val = f.value !== undefined ? ` = ${f.value}${f.unit ? ' ' + f.unit : ''}` : '';
      lines.push(`  [${f.letter}] ${f.description}${val}`);
    }
    lines.push('');
  }

  // ── R — Recommendation ──
  lines.push('──────────────────────────────────────────────────────────');
  lines.push('R — RECOMMENDATION & MANAGEMENT GIVEN');
  lines.push('──────────────────────────────────────────────────────────');

  const done = completedInterventions(session);
  const inProg = inProgressInterventions(session);
  const unavail = unavailableInterventions(session);

  if (done.length) {
    lines.push('Interventions Completed Prior to Transfer:');
    done.forEach((a) => lines.push(`  ✓ ${a}`));
    lines.push('');
  }
  if (inProg.length) {
    lines.push('Interventions In Progress (continuing en route):');
    inProg.forEach((a) => lines.push(`  ▶ ${a}`));
    lines.push('');
  }
  if (unavail.length) {
    lines.push('⚠ Resources Unavailable at This Facility (required at receiving centre):');
    unavail.forEach((a) => lines.push(`  ✗ ${a}`));
    lines.push('');
  }

  lines.push('Fluid Resuscitation:');
  lines.push(`  ${fluidSummary(session)}`);
  lines.push('');

  if (session.safetyAlerts.length) {
    lines.push('Safety Alerts / Escalation Flags:');
    session.safetyAlerts.forEach((a) =>
      lines.push(`  [${a.severity.toUpperCase()}] ${a.message}`)
    );
    lines.push('');
  }

  lines.push('Reason for Referral:');
  lines.push('  [COMPLETE: e.g., Requires PICU admission / surgical intervention / specialist review]');
  lines.push('');
  lines.push('Condition at Time of Transfer:');
  lines.push('  [COMPLETE: Stable / Unstable / Critical — with escort: Yes / No]');
  lines.push('');

  // ── Signature ──
  lines.push('──────────────────────────────────────────────────────────');
  lines.push(`Referring Provider: ${provider}`);
  lines.push('Signature: ________________________   Date: ____________');
  lines.push('');
  lines.push('Contact Number: ________________________');
  lines.push('');
  lines.push('──────────────────────────────────────────────────────────');
  lines.push('Generated by Paeds Resus Platform — ResusGPS');
  lines.push(`Session ID: ${session.id}  |  Duration: ${elapsedMinutes(session)} min`);
  lines.push('══════════════════════════════════════════════════════════');

  return lines.join('\n');
}

// ─── 2. Progress Note (Nurse Cardex / Doctor Continuation Note) ─────────────

export function generateProgressNote(
  session: ResusSession,
  options?: {
    nurseName?: string;
    designation?: string;
    ward?: string;
    patientName?: string;
    patientId?: string;
    bedNumber?: string;
    noteType?: 'nursing' | 'medical';
  }
): string {
  const opt = options || {};
  const now = Date.now();
  const lines: string[] = [];

  const nurseName = opt.nurseName || '[NURSE / CLINICIAN NAME]';
  const designation = opt.designation || (opt.noteType === 'medical' ? 'Medical Officer' : 'Registered Nurse');
  const ward = opt.ward || '[WARD / UNIT]';
  const patientName = opt.patientName || '[PATIENT NAME]';
  const patientId = opt.patientId || '[IP/OP NUMBER]';
  const bed = opt.bedNumber || '[BED]';
  const noteLabel = opt.noteType === 'medical' ? 'CONTINUATION NOTE' : 'NURSING PROGRESS NOTE';

  // ── Header ──
  lines.push('══════════════════════════════════════════════════════════');
  lines.push(`           ${noteLabel}`);
  lines.push('           Paeds Resus Platform — Auto-Generated');
  lines.push('══════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Date:        ${fmtDate(now)}    Time: ${fmtTime(now)}`);
  lines.push(`Ward/Unit:   ${ward}            Bed: ${bed}`);
  lines.push(`Patient:     ${patientName}     ID: ${patientId}`);
  if (session.patientAge) lines.push(`Age:         ${session.patientAge}`);
  if (session.patientWeight) lines.push(`Weight:      ${session.patientWeight} kg`);
  lines.push(`Clinician:   ${nurseName} (${designation})`);
  lines.push('');

  // ── S — Subjective ──
  lines.push('──────────────────────────────────────────────────────────');
  lines.push('S — SUBJECTIVE');
  lines.push('──────────────────────────────────────────────────────────');
  const sample = sampleBlock(session);
  if (sample.length) {
    lines.push(...sample);
  } else {
    lines.push('  History not documented — see admitting notes.');
  }
  lines.push('');

  // ── O — Objective ──
  lines.push('──────────────────────────────────────────────────────────');
  lines.push('O — OBJECTIVE (Vital Signs & Examination)');
  lines.push('──────────────────────────────────────────────────────────');
  const vs = session.vitalSigns;
  const vitals = [
    vitalLine('HR', vs.hr, 'bpm'),
    vitalLine('RR', vs.rr, '/min'),
    vitalLine('SpO₂', vs.spo2, '%'),
    vs.sbp !== undefined && vs.dbp !== undefined
      ? `  BP: ${vs.sbp}/${vs.dbp} mmHg`
      : '',
    vitalLine('Temp', vs.temp, '°C'),
    vitalLine('BSL', vs.glucose, 'mmol/L'),
    vitalLine('CRT', vs.crt, 'sec'),
    vitalLine('Lactate', vs.lactate, 'mmol/L'),
  ].filter(Boolean);

  if (vitals.length) {
    lines.push(...vitals);
  } else {
    lines.push('  Vital signs not documented.');
  }
  lines.push('');

  if (session.derivedPerfusion) {
    lines.push(`  Perfusion State: ${session.derivedPerfusion}`);
    lines.push('');
  }

  if (session.findings.length) {
    lines.push('  ABCDE Findings:');
    for (const f of session.findings) {
      const val = f.value !== undefined ? ` = ${f.value}${f.unit ? ' ' + f.unit : ''}` : '';
      lines.push(`    [${f.letter}] ${f.description}${val}`);
    }
    lines.push('');
  }

  // ── A — Assessment ──
  lines.push('──────────────────────────────────────────────────────────');
  lines.push('A — ASSESSMENT');
  lines.push('──────────────────────────────────────────────────────────');
  lines.push(`  Diagnosis / Working Diagnosis: ${diagnosisLine(session)}`);
  lines.push(`  Active Threats: ${threatsLine(session)}`);
  if (session.safetyAlerts.length) {
    lines.push('  Safety Alerts:');
    session.safetyAlerts.forEach((a) =>
      lines.push(`    [${a.severity.toUpperCase()}] ${a.message}`)
    );
  }
  lines.push('');

  // ── P — Plan ──
  lines.push('──────────────────────────────────────────────────────────');
  lines.push('P — PLAN');
  lines.push('──────────────────────────────────────────────────────────');
  lines.push('  [COMPLETE: e.g., Continue monitoring, IV antibiotics, escalate to PICU if deteriorates]');
  lines.push('');

  // ── I — Interventions ──
  lines.push('──────────────────────────────────────────────────────────');
  lines.push('I — INTERVENTIONS PERFORMED');
  lines.push('──────────────────────────────────────────────────────────');

  const done = completedInterventions(session);
  const inProg = inProgressInterventions(session);
  const unavail = unavailableInterventions(session);

  if (done.length) {
    lines.push('  Completed:');
    done.forEach((a) => lines.push(`    ✓ ${a}`));
    lines.push('');
  }
  if (inProg.length) {
    lines.push('  In Progress / Ongoing:');
    inProg.forEach((a) => lines.push(`    ▶ ${a}`));
    lines.push('');
  }
  if (unavail.length) {
    lines.push('  ⚠ Recommended but Unavailable at This Facility:');
    unavail.forEach((a) => lines.push(`    ✗ ${a}`));
    lines.push('');
  }

  lines.push('  Fluid Balance:');
  lines.push(`    ${fluidSummary(session)}`);
  lines.push('');

  // Timed event log (clinical only)
  const clinicalTypes = [
    'intervention_started', 'intervention_completed', 'threat_identified',
    'reassessment', 'cardiac_arrest_start', 'rosc', 'diagnosis',
    'resource_unavailable', 'safety_alert',
  ];
  const events = session.events.filter((e) => clinicalTypes.includes(e.type));
  if (events.length) {
    lines.push('  Timed Event Log:');
    events.forEach((e) => {
      lines.push(`    [${fmtTime(e.timestamp)}] ${e.detail}`);
    });
    lines.push('');
  }

  // ── E — Evaluation ──
  lines.push('──────────────────────────────────────────────────────────');
  lines.push('E — EVALUATION / RESPONSE TO TREATMENT');
  lines.push('──────────────────────────────────────────────────────────');
  lines.push('  [COMPLETE: e.g., Child responded to fluid bolus — HR improved from 160 to 120 bpm]');
  lines.push('  [COMPLETE: Reassessment findings after interventions]');
  lines.push('');

  // ── Handover Section ──
  lines.push('──────────────────────────────────────────────────────────');
  lines.push('HANDOVER SUMMARY (ISBAR)');
  lines.push('──────────────────────────────────────────────────────────');
  lines.push(`  I — I am ${nurseName}, ${designation} in ${ward}.`);
  lines.push(`  S — This is ${patientName}, ${session.patientAge || '[age]'}, ` +
    `${session.patientWeight ? session.patientWeight + ' kg, ' : ''}` +
    `admitted with ${diagnosisLine(session)}.`);
  lines.push(`  B — Background: ${
    session.sampleHistory.pastHistory || session.sampleHistory.events || '[see SAMPLE above]'
  }`);
  lines.push(`  A — Currently: ${threatsLine(session)}. ` +
    `${session.derivedPerfusion ? 'Perfusion: ' + session.derivedPerfusion + '.' : ''}`);
  lines.push(`  R — Requires: [COMPLETE — e.g., 30-min reassessment, repeat glucose, senior review]`);
  lines.push('');

  // ── Signature ──
  lines.push('──────────────────────────────────────────────────────────');
  lines.push(`Signed: ${nurseName} (${designation})`);
  lines.push('Signature: ________________________   Time: ____________');
  lines.push('');
  lines.push('──────────────────────────────────────────────────────────');
  lines.push('Generated by Paeds Resus Platform — ResusGPS');
  lines.push(`Session ID: ${session.id}  |  Duration: ${elapsedMinutes(session)} min`);
  lines.push('══════════════════════════════════════════════════════════');

  return lines.join('\n');
}
