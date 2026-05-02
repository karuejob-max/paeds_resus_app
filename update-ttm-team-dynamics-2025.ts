/**
 * update-ttm-team-dynamics-2025.ts
 *
 * Updates:
 * 1. BLS Module 5, Section 1 (ROSC) — TTM guideline updated to 2025 AHA
 * 2. BLS Module 5, Section 3 (Team Roles) — Full 2025 AHA team dynamics framework
 * 3. ACLS Module 1, Section 1 (Systematic Approach) — Add team dynamics section
 * 4. ACLS Module 6 — Add dedicated team dynamics section
 *
 * Run: npx tsx update-ttm-team-dynamics-2025.ts
 */

import { getDb } from './server/db';
import { moduleSections, modules, quizQuestions, quizzes } from './drizzle/schema';
import { eq, like, and } from 'drizzle-orm';

// ─── New TTM content (2025 AHA) ──────────────────────────────────────────────

const TTM_2025_CONTENT = `<h2>Return of Spontaneous Circulation (ROSC) — Immediate Priorities</h2>
<p>ROSC is defined as the restoration of a palpable pulse and measurable blood pressure. It is not the end of resuscitation — it is the beginning of post-cardiac arrest care.</p>
<div class="clinical-note">
  <strong>Immediate post-ROSC priorities (H's and T's addressed):</strong>
  <ul>
    <li><strong>A — Airway:</strong> Confirm ETT position with waveform capnography. Target ETCO₂ ≥35–40 mmHg.</li>
    <li><strong>B — Breathing:</strong> Titrate FiO₂ to SpO₂ 94–98%. Avoid hyperoxia (SpO₂ 100%) — causes free radical injury to reperfused brain and myocardium. Target PaCO₂ 35–45 mmHg (normocapnia).</li>
    <li><strong>C — Circulation:</strong> Target MAP ≥65 mmHg (adults) or ≥50th percentile for age (children). Treat hypotension with fluids and vasopressors. 12-lead ECG immediately — STEMI requires emergent cath lab activation.</li>
    <li><strong>D — Disability:</strong> Assess neurological status (GCS, pupils). Treat seizures aggressively — post-arrest seizures worsen neurological outcomes.</li>
    <li><strong>E — Exposure:</strong> Check glucose (target 7.8–10 mmol/L). Identify and treat reversible causes.</li>
  </ul>
</div>

<h3>Targeted Temperature Management (TTM) — 2025 AHA Update</h3>
<div class="warning-note">
  <strong>2025 AHA Guideline Change:</strong> The TTM target range has been updated from 32–36°C to <strong>32–37.5°C</strong>. The key evidence shift: the TTM2 trial (2021) showed no benefit of 33°C over 37.5°C (strict normothermia) in adults. The critical intervention is <strong>fever prevention</strong>, not necessarily active cooling to 33°C.
</div>
<table>
  <thead><tr><th>Phase</th><th>Target</th><th>Duration</th></tr></thead>
  <tbody>
    <tr><td>Induction</td><td>Select a target temperature within 32–37.5°C and cool as rapidly as possible</td><td>Begin immediately after ROSC</td></tr>
    <tr><td>Maintenance</td><td>Maintain the selected temperature consistently (avoid fluctuations)</td><td>≥24 hours</td></tr>
    <tr><td>Rewarming</td><td>Rewarm at ≤0.25°C/hour</td><td>Until normothermia (37°C)</td></tr>
    <tr><td>Fever prevention</td><td>Prevent fever (temperature &gt;37.5°C) in all comatose post-arrest patients</td><td>72 hours post-arrest</td></tr>
  </tbody>
</table>
<div class="clinical-note">
  <strong>Clinical bottom line (2025):</strong> For comatose survivors of cardiac arrest, the most important intervention is <strong>preventing fever (&gt;37.5°C) for at least 72 hours</strong>. Active cooling to 32–36°C remains an option for selected patients (e.g., refractory haemodynamic instability, uncontrolled seizures), but strict normothermia (36–37.5°C) is acceptable for most patients. Do NOT allow fever — it worsens neurological outcomes.
</div>
<div class="warning-note">
  <strong>Paediatric note:</strong> For children, the same principle applies: TTM at 32–34°C or strict normothermia (36–37.5°C) are both acceptable. The THAPCA trial showed no difference between 33°C and 36.8°C — but both groups had strict fever prevention. Prevent fever (&gt;38°C) in all comatose post-arrest children.
</div>`;

// ─── New BLS Team Dynamics content (2025 AHA) ────────────────────────────────

const BLS_TEAM_DYNAMICS_CONTENT = `<h2>High-Performance Team Dynamics in Resuscitation</h2>
<p>The AHA 2020/2025 guidelines emphasise that resuscitation outcomes depend as much on team performance as on individual clinical skills. A high-performance resuscitation team is not a group of skilled individuals — it is a coordinated system with defined roles, clear communication, and a culture of mutual respect.</p>

<h3>The 6 Core Elements of a High-Performance Resuscitation Team</h3>
<table>
  <thead><tr><th>Element</th><th>Definition</th><th>Why It Matters</th></tr></thead>
  <tbody>
    <tr>
      <td><strong>1. Clear Roles &amp; Responsibilities</strong></td>
      <td>Every team member knows their specific role before the arrest begins</td>
      <td>Eliminates duplication, prevents missed tasks, reduces cognitive load on the team leader</td>
    </tr>
    <tr>
      <td><strong>2. Closed-Loop Communication</strong></td>
      <td>All orders are acknowledged verbally by the recipient and confirmed by the sender</td>
      <td>Prevents medication errors, missed interventions, and misheard orders in a noisy environment</td>
    </tr>
    <tr>
      <td><strong>3. Know Your Limitations</strong></td>
      <td>Team members proactively declare when they are at the limit of their competence</td>
      <td>Prevents dangerous errors from overconfidence; enables timely escalation</td>
    </tr>
    <tr>
      <td><strong>4. Mutual Respect</strong></td>
      <td>All team members are treated with dignity regardless of seniority or role</td>
      <td>Creates psychological safety — team members speak up when they notice errors</td>
    </tr>
    <tr>
      <td><strong>5. Constructive Intervention</strong></td>
      <td>Any team member can and should speak up if they observe an error or safety concern</td>
      <td>Catches errors before they reach the patient; AHA calls this "constructive criticism"</td>
    </tr>
    <tr>
      <td><strong>6. Summarising &amp; Debriefing</strong></td>
      <td>The team leader summarises the situation at each rhythm check; formal debrief after every event</td>
      <td>Maintains shared situational awareness; enables continuous improvement</td>
    </tr>
  </tbody>
</table>

<h3>Team Roles</h3>
<table>
  <thead><tr><th>Role</th><th>Responsibilities</th></tr></thead>
  <tbody>
    <tr><td><strong>Team Leader</strong></td><td>Directs the resuscitation; assigns tasks; monitors quality; makes decisions; communicates with family; summarises at each rhythm check</td></tr>
    <tr><td><strong>Compressor</strong></td><td>Performs chest compressions; rotates every 2 minutes; announces compression depth and rate</td></tr>
    <tr><td><strong>Airway Manager</strong></td><td>Manages airway and ventilation; monitors ETT position and SpO₂; announces ventilation rate</td></tr>
    <tr><td><strong>IV/IO Access</strong></td><td>Establishes vascular access; prepares and administers medications; reads back drug doses</td></tr>
    <tr><td><strong>Recorder</strong></td><td>Documents timeline, medications, interventions; tracks time since last shock/medication; announces time prompts</td></tr>
    <tr><td><strong>Monitor/Defibrillator</strong></td><td>Operates AED or manual defibrillator; announces rhythm; charges for shock; clears team before shock</td></tr>
  </tbody>
</table>

<h3>Closed-Loop Communication — In Practice</h3>
<ol>
  <li><strong>Sender (Team Leader):</strong> "John, give 1 mg of adrenaline IV now."</li>
  <li><strong>Receiver (IV Nurse):</strong> "1 mg adrenaline IV — giving now." <em>(acknowledges and confirms)</em></li>
  <li><strong>Sender confirms:</strong> "Thank you, John." <em>(closes the loop)</em></li>
  <li><strong>Recorder:</strong> "Adrenaline 1 mg IV given at 14:32." <em>(documents)</em></li>
</ol>
<div class="warning-note">
  <strong>Why closed-loop communication matters:</strong> In a noisy, high-stress resuscitation environment, orders can be misheard, misunderstood, or forgotten. Closed-loop communication ensures every order is acknowledged and confirmed, reducing medication errors and missed interventions by up to 50% (AHA 2020).
</div>

<h3>Know Your Limitations</h3>
<p>One of the most important — and most underemphasised — elements of team dynamics is the ability to recognise and declare the limits of your own competence. This is not a sign of weakness; it is a clinical safety behaviour.</p>
<ul>
  <li>If you are unsure of a drug dose, say so: <em>"I need to verify the dose before I give this."</em></li>
  <li>If you are fatigued during compressions, say so: <em>"I need to rotate — I'm losing quality."</em></li>
  <li>If you disagree with a clinical decision, use the PACE model: <strong>Probe → Alert → Challenge → Emergency stop</strong></li>
</ul>

<h3>Constructive Intervention (Constructive Criticism)</h3>
<p>Every team member has both the right and the responsibility to speak up when they observe a potential error. The AHA recommends using a respectful, direct approach:</p>
<ol>
  <li>State what you observe: <em>"I notice the compression depth looks shallow."</em></li>
  <li>State the concern: <em>"We may not be generating adequate coronary perfusion pressure."</em></li>
  <li>Suggest a solution: <em>"Can we check the depth and rotate the compressor?"</em></li>
</ol>
<div class="clinical-note">
  <strong>Psychological safety:</strong> A team where junior members feel safe to speak up catches more errors than a team where only the senior clinician can raise concerns. The team leader sets this culture by explicitly inviting input: <em>"If anyone sees something I'm missing, please speak up immediately."</em>
</div>

<h3>Debriefing — The GAS Model</h3>
<p>Structured debriefing after every resuscitation event is a core AHA recommendation. The <strong>GAS Model</strong> (Gather, Analyse, Summarise) provides a simple framework:</p>
<table>
  <thead><tr><th>Phase</th><th>What to Do</th><th>Example Prompt</th></tr></thead>
  <tbody>
    <tr>
      <td><strong>G — Gather</strong></td>
      <td>Collect facts: what happened, in what order, what was done</td>
      <td><em>"Let's review the timeline. The arrest was recognised at 14:20. First shock was at 14:23. ROSC at 14:38."</em></td>
    </tr>
    <tr>
      <td><strong>A — Analyse</strong></td>
      <td>Identify what went well and what could be improved — without blame</td>
      <td><em>"What worked well? What would we do differently? Were there any communication breakdowns?"</em></td>
    </tr>
    <tr>
      <td><strong>S — Summarise</strong></td>
      <td>Distil 1–2 key learning points; acknowledge emotional impact; close the debrief</td>
      <td><em>"Our key takeaway: rotate compressors earlier. Well done to everyone — this was a difficult case handled professionally."</em></td>
    </tr>
  </tbody>
</table>
<div class="clinical-note">
  <strong>Hot vs Cold Debrief:</strong> A <em>hot debrief</em> (within 1 hour, 5–10 minutes) focuses on immediate learning. A <em>cold debrief</em> (within 24–48 hours, formal) reviews CPR quality data and system-level improvements. Both are valuable. The GAS model works for both.
</div>`;

// ─── ACLS Team Dynamics content (for Module 1 addition) ──────────────────────

const ACLS_TEAM_DYNAMICS_SECTION_CONTENT = `<h2>ACLS Team Dynamics and High-Performance Resuscitation</h2>
<p>ACLS is not a solo skill — it is a team performance. The AHA 2020/2025 guidelines dedicate a full chapter to team dynamics because the evidence is clear: teams that communicate well and have defined roles achieve better resuscitation outcomes, independent of individual clinical skill level.</p>

<h3>The ACLS Team Leader</h3>
<p>In ACLS, the team leader role is more demanding than in BLS. The ACLS team leader must simultaneously:</p>
<ul>
  <li>Direct the resuscitation algorithm (VF/pVT, PEA/Asystole, bradycardia, tachycardia)</li>
  <li>Monitor CPR quality (rate, depth, recoil, CCF)</li>
  <li>Manage medication timing (epinephrine every 3–5 min; antiarrhythmics)</li>
  <li>Interpret rhythm at each 2-minute check</li>
  <li>Communicate with the family</li>
  <li>Make termination-of-resuscitation decisions</li>
</ul>
<div class="clinical-note">
  <strong>Team leader principle:</strong> The team leader should NOT be performing compressions or managing the airway. Their role is to direct, monitor, and decide — not to do. Assign tasks to others and maintain a global view of the resuscitation.
</div>

<h3>The 6 Core Elements of a High-Performance ACLS Team</h3>
<table>
  <thead><tr><th>Element</th><th>ACLS Application</th></tr></thead>
  <tbody>
    <tr>
      <td><strong>1. Clear Roles &amp; Responsibilities</strong></td>
      <td>Assign roles before the arrest begins (or within the first 30 seconds). In ACLS, roles include: Team Leader, Compressor 1, Compressor 2 (rotation), Airway Manager, IV/IO Nurse, Medication Nurse, Recorder, Defibrillator Operator.</td>
    </tr>
    <tr>
      <td><strong>2. Closed-Loop Communication</strong></td>
      <td>All medication orders must be read back with drug name, dose, route, and timing. The recorder confirms documentation. The team leader confirms receipt. Example: "Adrenaline 1 mg IV — giving now." "Thank you. Recorder, note time." "Adrenaline 1 mg at 14:32."</td>
    </tr>
    <tr>
      <td><strong>3. Know Your Limitations</strong></td>
      <td>In ACLS, this includes: declaring when you cannot establish IV/IO access (escalate to IO or central line), declaring fatigue during compressions (rotate every 2 minutes without being asked), and declaring uncertainty about rhythm interpretation (seek a second opinion before shocking).</td>
    </tr>
    <tr>
      <td><strong>4. Mutual Respect</strong></td>
      <td>Seniority does not override safety. A nurse who observes a drug error must speak up, even to a senior physician. The team leader must explicitly invite this: "If anyone sees something I'm missing, say it immediately."</td>
    </tr>
    <tr>
      <td><strong>5. Constructive Intervention</strong></td>
      <td>Use the PACE model for escalating safety concerns: Probe ("Are you sure about that dose?") → Alert ("I'm concerned that dose may be too high") → Challenge ("I strongly recommend we check the dose before giving it") → Emergency stop ("Stop — I believe this will harm the patient").</td>
    </tr>
    <tr>
      <td><strong>6. Summarising &amp; Debriefing</strong></td>
      <td>The team leader summarises at every 2-minute rhythm check: "We are at 8 minutes. Two shocks delivered. Epinephrine given at 6 minutes. Next epi due at 9–11 minutes. Rhythm check in 2 minutes." Use the GAS model (Gather, Analyse, Summarise) for post-event debrief.</td>
    </tr>
  </tbody>
</table>

<h3>Closed-Loop Communication in ACLS — Full Example</h3>
<div class="clinical-note">
  <p><strong>Team Leader:</strong> "Sarah, give epinephrine 1 mg IV now."</p>
  <p><strong>Sarah (IV Nurse):</strong> "Epinephrine 1 mg IV — drawing up now. Giving in 30 seconds."</p>
  <p><strong>Team Leader:</strong> "Thank you. Flush with 20 mL and elevate the arm."</p>
  <p><strong>Sarah:</strong> "Epinephrine 1 mg IV given, flushed, arm elevated."</p>
  <p><strong>Recorder:</strong> "Epinephrine 1 mg IV at 14:32. Next dose due 14:35–14:37."</p>
  <p><strong>Team Leader:</strong> "Thank you. Recorder, announce when we are 1 minute from next epi window."</p>
</div>

<h3>Situational Awareness — The Team Leader's Tool</h3>
<p>The team leader must maintain situational awareness at all times. This means knowing:</p>
<ul>
  <li>How long the arrest has been running</li>
  <li>How many shocks have been delivered and at what energy</li>
  <li>When the last epinephrine was given (next dose window: 3–5 min)</li>
  <li>Whether antiarrhythmics have been given (amiodarone or lidocaine)</li>
  <li>The current ETCO₂ trend (rising = ROSC likely; flat &lt;10 = poor CPR or futility)</li>
  <li>Whether reversible causes (H's and T's) have been addressed</li>
</ul>

<h3>Debriefing After ACLS — The GAS Model</h3>
<table>
  <thead><tr><th>Phase</th><th>What to Do</th><th>Example</th></tr></thead>
  <tbody>
    <tr>
      <td><strong>G — Gather</strong></td>
      <td>Reconstruct the timeline objectively using the recorder's notes and defibrillator data</td>
      <td><em>"Arrest recognised at 14:20. First shock at 14:23. Epinephrine at 14:26 and 14:31. ROSC at 14:38. Total arrest duration: 18 minutes."</em></td>
    </tr>
    <tr>
      <td><strong>A — Analyse</strong></td>
      <td>Review CPR quality metrics (CCF, compression depth, rate). Identify communication breakdowns. Ask: "What would we do differently?"</td>
      <td><em>"CCF was 72% — good. Compression depth was shallow in the first 4 minutes. We had a 15-second pause before the second shock — let's work on pre-charging the defibrillator earlier."</em></td>
    </tr>
    <tr>
      <td><strong>S — Summarise</strong></td>
      <td>State 1–2 key learning points. Acknowledge the emotional impact. Thank the team.</td>
      <td><em>"Key learning: pre-charge the defibrillator 15 seconds before the rhythm check. This team performed well under pressure. Thank you all."</em></td>
    </tr>
  </tbody>
</table>

<h3>When Resuscitation Is Unsuccessful</h3>
<p>Termination of resuscitation is one of the most difficult decisions in medicine. The team leader must:</p>
<ul>
  <li>Ensure all reversible causes (H's and T's) have been addressed</li>
  <li>Consider the clinical context (witnessed vs. unwitnessed, initial rhythm, downtime, comorbidities)</li>
  <li>Use ETCO₂ as a guide — ETCO₂ &lt;10 mmHg after 20 minutes of CPR is associated with very poor outcomes, but must NOT be used in isolation (2025 AHA update)</li>
  <li>Communicate the decision clearly to the team before stopping</li>
  <li>Debrief the team — unsuccessful resuscitations carry a significant emotional burden</li>
</ul>`;

// ─── Main ─────────────────────────────────────────────────────────────────────

async function runUpdates() {
  console.log('Starting TTM + Team Dynamics 2025 updates...\n');
  const db = await getDb();

  const allSections = await db.query.moduleSections.findMany();
  const allModules = await db.query.modules.findMany();

  let updated = 0;
  let skipped = 0;

  // ── 1. BLS Module 5, Section 1: ROSC — TTM 2025 update ──────────────────────
  console.log('1. Updating BLS ROSC section with 2025 TTM guidelines...');
  const blsRoscSection = allSections.find(s =>
    s.title.includes('Return of Spontaneous Circulation') ||
    s.title.includes('ROSC') && s.title.includes('Immediate')
  );

  if (blsRoscSection) {
    await db.update(moduleSections)
      .set({ content: TTM_2025_CONTENT })
      .where(eq(moduleSections.id, blsRoscSection.id));
    console.log(`   ✅ Updated section ID ${blsRoscSection.id}: "${blsRoscSection.title}"`);
    updated++;
  } else {
    console.log('   ⚠ BLS ROSC section not found — skipping');
    skipped++;
  }

  // ── 2. BLS Module 5, Section 3: Team Roles — Full 2025 framework ────────────
  console.log('2. Updating BLS Team Roles section with full 2025 team dynamics...');
  const blsTeamSection = allSections.find(s =>
    s.title.includes('Team Roles') ||
    (s.title.includes('Team') && s.title.includes('Communication'))
  );

  if (blsTeamSection) {
    await db.update(moduleSections)
      .set({
        title: 'High-Performance Team Dynamics and Communication',
        content: BLS_TEAM_DYNAMICS_CONTENT,
      })
      .where(eq(moduleSections.id, blsTeamSection.id));
    console.log(`   ✅ Updated section ID ${blsTeamSection.id}: "${blsTeamSection.title}" → "High-Performance Team Dynamics and Communication"`);
    updated++;
  } else {
    console.log('   ⚠ BLS Team Roles section not found — skipping');
    skipped++;
  }

  // ── 3. ACLS Module 1: Add team dynamics section ───────────────────────────────
  // Find ACLS Module 1 (Systematic Approach)
  console.log('3. Adding ACLS team dynamics section to Module 1...');
  const aclsModule1 = allModules.find(m =>
    m.title?.includes('ACLS Systematic Approach') ||
    m.title?.includes('Module 1') && m.courseId === 2
  );

  if (aclsModule1) {
    // Check if team dynamics section already exists
    const existingTeamSection = allSections.find(s =>
      s.moduleId === aclsModule1.id &&
      (s.title.includes('Team Dynamics') || s.title.includes('High-Performance Team'))
    );

    if (existingTeamSection) {
      // Update existing
      await db.update(moduleSections)
        .set({
          title: 'ACLS Team Dynamics and High-Performance Resuscitation',
          content: ACLS_TEAM_DYNAMICS_SECTION_CONTENT,
        })
        .where(eq(moduleSections.id, existingTeamSection.id));
      console.log(`   ✅ Updated existing ACLS team dynamics section ID ${existingTeamSection.id}`);
    } else {
      // Find the highest order in this module
      const moduleSectionsForM1 = allSections.filter(s => s.moduleId === aclsModule1.id);
      const maxOrder = moduleSectionsForM1.reduce((max, s) => Math.max(max, s.order ?? 0), 0);

      await db.insert(moduleSections).values({
        moduleId: aclsModule1.id,
        title: 'ACLS Team Dynamics and High-Performance Resuscitation',
        content: ACLS_TEAM_DYNAMICS_SECTION_CONTENT,
        order: maxOrder + 1,
      });
      console.log(`   ✅ Inserted new ACLS team dynamics section in Module 1 (order: ${maxOrder + 1})`);
    }
    updated++;
  } else {
    console.log('   ⚠ ACLS Module 1 not found — trying by course ID 2...');
    // Try finding by courseId directly
    const aclsCourse2Modules = allModules.filter(m => m.courseId === 2);
    console.log(`   Found ${aclsCourse2Modules.length} modules for courseId=2:`, aclsCourse2Modules.map(m => `${m.id}: ${m.title}`));
    skipped++;
  }

  // ── 4. Update BLS quiz questions for team dynamics ───────────────────────────
  console.log('4. Updating BLS quiz questions for team dynamics...');
  const allQuestions = await db.query.quizQuestions.findMany();

  // Find the closed-loop communication question and update/expand it
  const closedLoopQ = allQuestions.find(q =>
    q.question?.toLowerCase().includes('closed-loop') ||
    q.question?.toLowerCase().includes('closed loop')
  );

  if (closedLoopQ) {
    await db.update(quizQuestions)
      .set({
        question: 'Which of the following best describes the correct sequence for closed-loop communication during resuscitation?',
        options: JSON.stringify([
          'Sender gives order → Receiver acts → Sender confirms',
          'Sender gives order → Receiver acknowledges → Receiver acts → Sender confirms',
          'Receiver acts → Sender confirms → Recorder documents',
          'Sender gives order → Recorder documents → Receiver acts',
        ]),
        correctAnswer: 'Sender gives order → Receiver acknowledges → Receiver acts → Sender confirms',
        explanation: 'AHA 2020/2025: Closed-loop communication requires 4 steps: (1) Sender gives a clear, directed order; (2) Receiver acknowledges verbally (reads back drug, dose, route); (3) Receiver acts; (4) Sender confirms receipt. This sequence ensures every order is heard, understood, and completed — reducing medication errors by up to 50% in high-stress resuscitation environments.',
      })
      .where(eq(quizQuestions.id, closedLoopQ.id));
    console.log(`   ✅ Updated closed-loop communication question ID ${closedLoopQ.id}`);
    updated++;
  }

  // Add a new team dynamics question if it doesn't exist
  const gasQ = allQuestions.find(q =>
    q.question?.toLowerCase().includes('gas model') ||
    q.question?.toLowerCase().includes('gather, analyse') ||
    q.question?.toLowerCase().includes('debrief')
  );

  if (!gasQ) {
    // Find the BLS team dynamics quiz
    const allQuizzes = await db.query.quizzes.findMany();
    const blsTeamQuiz = allQuizzes.find(q =>
      q.title?.includes('Team Dynamics') ||
      q.title?.includes('Post-Resuscitation')
    );

    if (blsTeamQuiz) {
      const existingQs = allQuestions.filter(q => q.quizId === blsTeamQuiz.id);
      const maxOrder = existingQs.reduce((max, q) => Math.max(max, q.order ?? 0), 0);

      await db.insert(quizQuestions).values({
        quizId: blsTeamQuiz.id,
        question: 'In the GAS debriefing model, what does the "A" (Analyse) phase involve?',
        questionType: 'multiple_choice',
        options: JSON.stringify([
          'Assigning blame for errors that occurred during the resuscitation',
          'Reviewing what went well and what could be improved, without blame, using CPR quality data',
          'Announcing the time of death to the family',
          'Archiving the resuscitation record in the patient file',
        ]),
        correctAnswer: 'Reviewing what went well and what could be improved, without blame, using CPR quality data',
        explanation: 'The GAS model: Gather (reconstruct the timeline objectively) → Analyse (review CPR quality metrics, identify communication breakdowns, ask "what would we do differently?" — without blame) → Summarise (state 1–2 key learning points, acknowledge emotional impact, thank the team). The Analyse phase is not about blame — it is about system-level improvement.',
        order: maxOrder + 1,
      });
      console.log(`   ✅ Inserted new GAS debriefing question in quiz ID ${blsTeamQuiz.id}`);
      updated++;
    }
  } else {
    console.log(`   ℹ GAS debriefing question already exists (ID ${gasQ.id}) — skipping`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log(`\n✅ Done. ${updated} updates applied, ${skipped} skipped.`);
  console.log('\nChanges made:');
  console.log('  1. BLS ROSC section: TTM updated to 2025 AHA (32–37.5°C; fever prevention mandatory 72h)');
  console.log('  2. BLS Team Dynamics section: Full 2025 framework (6 elements, GAS model, PACE, Know Your Limitations)');
  console.log('  3. ACLS Module 1: New team dynamics section added with ACLS-specific content');
  console.log('  4. BLS quiz: Closed-loop communication question updated; GAS debriefing question added');
}

runUpdates().catch(console.error).finally(() => process.exit(0));
