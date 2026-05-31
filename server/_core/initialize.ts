/**
 * Server Initialization Module
 * Runs on server startup to apply DB migrations and seed data (courses, etc.)
 */

import { getDb } from "../db";
import { eq, like, sql } from "drizzle-orm";
import { microCourses, moduleSections, quizQuestions } from "../../drizzle/schema";
import { ensureMicroCoursesCatalog, MICRO_COURSE_CATALOG } from "../lib/micro-course-catalog";


/**
 * Run pending Drizzle migrations at server startup.
 * Safe to call on every deploy — Drizzle tracks applied migrations in __drizzle_migrations table.
 */
export async function runMigrations() {
  try {
    const db = await getDb();
    if (!db) {
      console.log('[Migrations] Database not available, skipping migrations');
      return;
    }
    // 0039: add microCourseEnrollmentId to certificates (idempotent column-existence check)
    const [cols] = await db.execute(sql`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'certificates'
        AND COLUMN_NAME = 'microCourseEnrollmentId'
    `);
    if (Array.isArray(cols) && (cols as any[]).length === 0) {
      console.log('[Migrations] Adding microCourseEnrollmentId to certificates...');
      await db.execute(sql`ALTER TABLE \`certificates\` ADD COLUMN \`microCourseEnrollmentId\` int`);
      console.log('[Migrations] ✓ microCourseEnrollmentId column added');
    } else {
      console.log('[Migrations] ✓ microCourseEnrollmentId already exists, skipping');
    }

    // 0030: pre-download certificate feedback (required before PDF download)
    const [fbTable] = await db.execute(sql`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'certificateDownloadFeedback'
    `);
    if (Array.isArray(fbTable) && (fbTable as { TABLE_NAME?: string }[]).length === 0) {
      console.log('[Migrations] Creating certificateDownloadFeedback table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS \`certificateDownloadFeedback\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`userId\` int NOT NULL,
          \`certificateId\` int NOT NULL,
          \`rating\` int NOT NULL,
          \`improvements\` text,
          \`createdAt\` timestamp NOT NULL DEFAULT (now()),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`cert_dl_fb_user_cert\` (\`userId\`, \`certificateId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('[Migrations] ✓ certificateDownloadFeedback table created');
    } else {
      console.log('[Migrations] ✓ certificateDownloadFeedback already exists, skipping');
    }
    // ── Course image CDN → self-hosted migration ──────────────────────────────
    // Replaces files.manuscdn.com URLs with local /assets/course-images/ paths
    // to fix CORS-blocked images in the course player.
    const CDN_BASE = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/';
    const URL_MAP: Record<string, string> = {
      'uPVOEVMtdNNCAFxJ.jpg':  '/assets/course-images/AdultBLSAlgorithmHCP.jpg',
      'JRhqhPQjUavvvnTi.jpg':  '/assets/course-images/AdultBLSCircular.jpg',
      'dlVFAvOxSQtIQAhD.jpg':  '/assets/course-images/HeadTiltChinLift.jpg',
      'bFYHIRnhYRSgoLLr.jpg':  '/assets/course-images/SingleRescuer.jpg',
      'OiYeNjGHMerXxnuo.jpg':  '/assets/course-images/TwoRescuer.jpg',
      'zQTJdmBosnHpHqBa.jpg':  '/assets/course-images/PadPlacement.jpg',
      'EbUetJWLdlcFLPmd.jpg':  '/assets/course-images/AdultFBAO.jpg',
      'OppQyzCIqrmgrqWy.jpg':  '/assets/course-images/BLSTermination.jpg',
      'WMAFDEebhxuLTSvW.jpg':  '/assets/course-images/AdultCAAlgorithm.jpg',
      'iqTAFIaeCgYxlqIE.jpg':  '/assets/course-images/AdultCACircular.jpg',
      'RxhFLJoAuwgNJyEN.jpg':  '/assets/course-images/AdultBradycardia.jpg',
      'siCbDpWmTQthWUzd.jpg':  '/assets/course-images/AdultTachycardia.jpg',
      'UchZBrALpalLmnEq.webp': '/assets/course-images/ElectricalCardioversion.webp',
      'unzmuRCvlBKLAZbp.jpg':  '/assets/course-images/AdvancedAirway.jpg',
      'qbHRuEaQatfuaYHh.jpg':  '/assets/course-images/ALSTermination.jpg',
    };
    try {
      // Use Drizzle ORM like() — avoids MySQL parameterized LIKE escaping bug with raw sql template
      const cdnRows = await db
        .select({ id: moduleSections.id, content: moduleSections.content })
        .from(moduleSections)
        .where(like(moduleSections.content, '%files.manuscdn.com%'));
      if (cdnRows.length > 0) {
        console.log(`[Migrations] Migrating ${cdnRows.length} sections from CDN to self-hosted images...`);
        let imgUpdated = 0;
        for (const row of cdnRows) {
          let newContent: string = row.content ?? '';
          let changed = false;
          for (const [filename, localPath] of Object.entries(URL_MAP)) {
            const cdnUrl = CDN_BASE + filename;
            if (newContent.includes(cdnUrl)) {
              newContent = newContent.split(cdnUrl).join(localPath);
              changed = true;
            }
          }
          if (changed) {
            await db.update(moduleSections)
              .set({ content: newContent })
              .where(eq(moduleSections.id, row.id));
            imgUpdated++;
          }
        }
        console.log(`[Migrations] ✓ Image URLs migrated: ${imgUpdated} sections updated`);
      } else {
        console.log('[Migrations] ✓ Image URLs already migrated, skipping');
      }
    } catch (imgErr) {
      console.error('[Migrations] Image URL migration error (non-fatal):', imgErr instanceof Error ? imgErr.message : imgErr);
    }

    // ── PALS 2025 content migration ───────────────────────────────────────────
    // Updates: Hs & Ts (full 8H+5T table), TTM 32-37.5°C, MAP ≥50th percentile,
    // cuffed ETT Q2 answer (5.0→4.5 mm), final exam Q6 atropine + MAP + TTM.
    try {
      // 1. Fix cuffed ETT quiz question (correctAnswer 5.0 mm → 4.5 mm)
      const ettRows = await db
        .select({ id: quizQuestions.id, correctAnswer: quizQuestions.correctAnswer })
        .from(quizQuestions)
        .where(like(quizQuestions.question, '%ETT size for a 4-year-old%'));
      for (const row of ettRows) {
        if (row.correctAnswer === '5.0 mm') {
          await db.update(quizQuestions)
            .set({
              correctAnswer: '4.5 mm',
              explanation: 'Cuffed ETT size formula: (Age/4) + 3.5. For a 4-year-old: (4/4) + 3.5 = 1 + 3.5 = 4.5 mm. 4.5 mm IS a standard cuffed ETT size and is the correct answer. Always prepare one size up (5.0 mm) and one size down (4.0 mm) at the bedside. Cuff pressure must be maintained at <20 cmH₂O to prevent tracheal injury.'
            })
            .where(eq(quizQuestions.id, row.id));
          console.log(`[Migrations] ✓ Fixed cuffed ETT question (id=${row.id}): 5.0 mm → 4.5 mm`);
        }
      }

      // 2. Fix final exam atropine question (add mg/kg context to options)
      const atropineRows = await db
        .select({ id: quizQuestions.id, options: quizQuestions.options })
        .from(quizQuestions)
        .where(like(quizQuestions.question, '%minimum atropine dose in children%'));
      for (const row of atropineRows) {
        const opts = JSON.parse(row.options ?? '[]');
        if (opts.includes('0.01 mg') && !opts[0].includes('mg/kg')) {
          await db.update(quizQuestions)
            .set({
              question: 'What is the minimum atropine dose in children (weight-based dose 0.02 mg/kg)?',
              options: JSON.stringify(['0.01 mg (0.0005 mg/kg in a 20 kg child)', '0.05 mg (0.0025 mg/kg in a 20 kg child)', '0.1 mg (minimum regardless of weight)', '0.5 mg (maximum dose in children)']),
              correctAnswer: '0.1 mg (minimum regardless of weight)',
              explanation: 'Atropine dose in children: 0.02 mg/kg IV/IO. However, the minimum dose is always 0.1 mg regardless of weight — doses below 0.1 mg can paradoxically worsen bradycardia. Maximum dose in children: 0.5 mg. For a 3 kg infant: 0.02 × 3 = 0.06 mg — round up to 0.1 mg minimum. For a 25 kg child: 0.02 × 25 = 0.5 mg (at maximum).'
            })
            .where(eq(quizQuestions.id, row.id));
          console.log(`[Migrations] ✓ Fixed atropine question (id=${row.id}): added mg/kg context`);
        }
      }

      // 3. Fix final exam MAP question (5th → 50th percentile)
      const mapRows = await db
        .select({ id: quizQuestions.id, correctAnswer: quizQuestions.correctAnswer })
        .from(quizQuestions)
        .where(like(quizQuestions.question, '%post-ROSC blood pressure%'));
      for (const row of mapRows) {
        if (row.correctAnswer?.includes('5th percentile')) {
          await db.update(quizQuestions)
            .set({
              question: 'What is the correct post-ROSC blood pressure target in children (2025 AHA)?',
              options: JSON.stringify(['Systolic BP >60 mmHg', 'Age-appropriate BP; MAP ≥50th percentile for age', 'Systolic BP >100 mmHg', 'Mean arterial pressure >65 mmHg (adult target)']),
              correctAnswer: 'Age-appropriate BP; MAP ≥50th percentile for age',
              explanation: '2025 AHA PALS Update: Post-ROSC BP target in children is MAP ≥50th percentile for age (updated from 5th percentile). This more aggressive target reduces post-arrest brain injury by ensuring adequate cerebral perfusion pressure. Normal MAP varies by age — use age-specific reference ranges. Avoid both hypotension and hypertension.'
            })
            .where(eq(quizQuestions.id, row.id));
          console.log(`[Migrations] ✓ Fixed MAP question (id=${row.id}): 5th → 50th percentile`);
        }
      }

      // 4. Fix final exam TTM question (32-34°C → 32-37.5°C 2025 update)
      const ttmRows = await db
        .select({ id: quizQuestions.id, correctAnswer: quizQuestions.correctAnswer })
        .from(quizQuestions)
        .where(like(quizQuestions.question, '%post-cardiac arrest temperature%'));
      for (const row of ttmRows) {
        if (row.correctAnswer?.includes('32–34°C') || row.correctAnswer?.includes('32-34')) {
          await db.update(quizQuestions)
            .set({
              question: 'What is the post-cardiac arrest temperature target for comatose paediatric survivors (2025 AHA)?',
              options: JSON.stringify(['32–34°C only (strict cooling)', 'TTM 32–37.5°C for ≥24h; prevent fever >37.5°C for 72h', '38–39°C (mild hyperthermia)', 'No temperature target — let temperature normalise spontaneously']),
              correctAnswer: 'TTM 32–37.5°C for ≥24h; prevent fever >37.5°C for 72h',
              explanation: '2025 AHA PALS Update: TTM target 32–37.5°C for ≥24 hours in comatose survivors. Fever prevention (>37.5°C) is mandatory for 72 hours post-ROSC. The THAPCA trial showed no difference between 33°C and 36.8°C — but both groups had strict fever prevention. The non-negotiable minimum: prevent fever. Active cooling to 32–34°C is an option for selected patients.'
            })
            .where(eq(quizQuestions.id, row.id));
          console.log(`[Migrations] ✓ Fixed TTM question (id=${row.id}): updated to 2025 AHA`);
        }
      }

      // 5. Fix moduleSections: post-arrest MAP (5th → 50th percentile) and TTM (32-34 → 32-37.5)
      const mapSections = await db
        .select({ id: moduleSections.id, content: moduleSections.content })
        .from(moduleSections)
        .where(like(moduleSections.content, '%MAP ≥5th percentile%'));
      for (const row of mapSections) {
        const updated = (row.content ?? '').replace(/MAP ≥5th percentile for age/g, 'MAP ≥50th percentile for age');
        await db.update(moduleSections).set({ content: updated }).where(eq(moduleSections.id, row.id));
        console.log(`[Migrations] ✓ Fixed MAP in section (id=${row.id})`);
      }

      const ttmSections = await db
        .select({ id: moduleSections.id, content: moduleSections.content })
        .from(moduleSections)
        .where(like(moduleSections.content, '%TTM (32–34°C)%'));
      for (const row of ttmSections) {
        let updated = (row.content ?? '')
          .replace(/Normothermia \(36–37\.5°C\) or TTM \(32–34°C\)/g, 'TTM 32–37.5°C for ≥24h; prevent fever >37.5°C for 72h')
          .replace(/TTM \(32–34°C\) or strict normothermia \(36–37\.5°C\)/g, 'TTM 32–37.5°C for ≥24h; prevent fever >37.5°C for 72h')
          .replace(/AHA 2020 guidelines recommend TTM \(32–34°C\) or strict normothermia \(36–37\.5°C\)/g, '2025 AHA: TTM 32–37.5°C for ≥24h; prevent fever >37.5°C for 72h');
        await db.update(moduleSections).set({ content: updated }).where(eq(moduleSections.id, row.id));
        console.log(`[Migrations] ✓ Fixed TTM in section (id=${row.id})`);
      }

      // 6. Replace old 4-cause Hs/Ts note with full 8H+5T table
      const htSections = await db
        .select({ id: moduleSections.id, content: moduleSections.content })
        .from(moduleSections)
        .where(like(moduleSections.content, '%Most common reversible causes in paediatric PEA%'));
      const FULL_HT_TABLE = `<div class="warning-note">
  <strong>Reversible Causes of Paediatric Cardiac Arrest — The H's and T's</strong>
  <p>Identifying and treating reversible causes is the most critical step in managing PEA and refractory VF/pVT. All 8 H's and 5 T's must be systematically considered.</p>
  <table>
    <thead><tr><th>Cause</th><th>Clinical Clues</th><th>Treatment</th></tr></thead>
    <tbody>
      <tr><td><strong>Hypoxia</strong></td><td>Most common cause in children; cyanosis; low SpO₂; inadequate ventilation</td><td>Secure airway; 100% O₂; confirm ETT position; BVM if needed</td></tr>
      <tr><td><strong>Hypovolaemia</strong></td><td>Haemorrhage; dehydration; burns; flat neck veins; history of fluid loss</td><td>IV/IO fluid bolus 20 mL/kg; blood products if haemorrhage</td></tr>
      <tr><td><strong>Hydrogen ion (Acidosis)</strong></td><td>DKA; sepsis; prolonged arrest; pH &lt;7.1 on ABG</td><td>Sodium bicarbonate 1 mEq/kg IV/IO; treat underlying cause</td></tr>
      <tr><td><strong>Hypo/Hyperkalaemia</strong></td><td>Renal failure; ECG changes (peaked T waves, wide QRS); history of K⁺ disorder</td><td>Hypokalaemia: KCl IV; Hyperkalaemia: calcium gluconate + insulin/dextrose + sodium bicarbonate</td></tr>
      <tr><td><strong>Hypoglycaemia</strong></td><td>Neonates; diabetics; prolonged illness; BGL &lt;2.6 mmol/L</td><td>Dextrose 0.5–1 g/kg IV/IO (2–4 mL/kg of 25% dextrose)</td></tr>
      <tr><td><strong>Hypothermia</strong></td><td>Cold exposure; submersion; core temp &lt;30°C; J-waves on ECG</td><td>Active rewarming; do not declare death until warm; continue CPR until core temp &gt;32°C</td></tr>
      <tr><td><strong>Hypomagnesaemia</strong></td><td>Torsades de pointes; prolonged QT; malnutrition; diuretic use</td><td>Magnesium sulphate 25–50 mg/kg IV/IO over 10–20 min (max 2 g)</td></tr>
      <tr><td><strong>Hypoxaemia (Respiratory)</strong></td><td>Severe pneumonia; ARDS; pulmonary haemorrhage</td><td>Optimise ventilation; PEEP; consider HFOV</td></tr>
      <tr><td><strong>Tension Pneumothorax</strong></td><td>Absent breath sounds; tracheal deviation away; distended neck veins; recent intubation or trauma</td><td>Immediate needle decompression: 2nd ICS, MCL; then chest drain</td></tr>
      <tr><td><strong>Tamponade (Cardiac)</strong></td><td>Beck’s triad: hypotension + distended neck veins + muffled heart sounds; recent cardiac surgery or trauma</td><td>Pericardiocentesis; emergency thoracotomy if traumatic</td></tr>
      <tr><td><strong>Toxins/Poisons</strong></td><td>History of ingestion; specific toxidrome; prolonged QT; bradycardia</td><td>Specific antidotes (naloxone for opioids; atropine for organophosphates; sodium bicarbonate for TCA); activated charcoal if early</td></tr>
      <tr><td><strong>Thrombosis (Pulmonary)</strong></td><td>Sudden arrest in context of immobility, malignancy, central line; right heart strain on echo</td><td>Thrombolytics (alteplase 0.5 mg/kg IV); consider ECMO; continue CPR for 60–90 min post-thrombolysis</td></tr>
      <tr><td><strong>Thrombosis (Coronary)</strong></td><td>Rare in children; Kawasaki disease; anomalous coronary artery; ST changes</td><td>Aspirin; urgent cardiology review; PCI if available</td></tr>
    </tbody>
  </table>
  <p><strong>Memory aid:</strong> 8 H’s — Hypoxia, Hypovolaemia, Hydrogen ion, Hypo/Hyperkalaemia, Hypoglycaemia, Hypothermia, Hypomagnesaemia, Hypoxaemia | 5 T’s — Tension pneumothorax, Tamponade, Toxins, Thrombosis (PE), Thrombosis (coronary)</p>
</div>`;
      for (const row of htSections) {
        if ((row.content ?? '').includes('Most common reversible causes in paediatric PEA') && !(row.content ?? '').includes('Hypomagnesaemia')) {
          const updated = (row.content ?? '').replace(
            /<div class="warning-note">\s*<strong>Most common reversible causes in paediatric PEA:<\/strong>[\s\S]*?<\/div>/,
            FULL_HT_TABLE
          );
          await db.update(moduleSections).set({ content: updated }).where(eq(moduleSections.id, row.id));
          console.log(`[Migrations] ✓ Expanded Hs & Ts section (id=${row.id}) to full 8H+5T table`);
        }
      }

      console.log('[Migrations] ✓ PALS 2025 content migration complete');
    } catch (palsErr) {
      console.error('[Migrations] PALS content migration error (non-fatal):', palsErr instanceof Error ? palsErr.message : palsErr);
    }

    // ── Heartsaver 2025 infant CPR technique migration ────────────────────────
    // Final Knowledge Check Q9 + Module 4 quiz: 2-finger eliminated; heel of 1 hand.
    try {
      const hsInfantExplanation =
        "The 2025 AHA ECC Guidelines eliminate the 2-finger technique for infant CPR. For a single rescuer, use the heel of 1 hand on the sternum. The 2 thumb-encircling hands technique is preferred when 2 rescuers are available or when a single rescuer can encircle the chest.";

      const isTwoFingerAnswer = (value: string | null | undefined) => {
        if (!value) return false;
        let parsed = value;
        try {
          const json = JSON.parse(value);
          if (typeof json === "string") parsed = json;
        } catch {
          /* plain string */
        }
        return /two.?finger/i.test(parsed);
      };

      const finalInfantRows = await db
        .select({ id: quizQuestions.id, correctAnswer: quizQuestions.correctAnswer })
        .from(quizQuestions)
        .where(like(quizQuestions.question, "%infant CPR technique for a single rescuer%"));
      for (const row of finalInfantRows) {
        if (isTwoFingerAnswer(row.correctAnswer)) {
          await db
            .update(quizQuestions)
            .set({ correctAnswer: "Heel of one hand", explanation: hsInfantExplanation })
            .where(eq(quizQuestions.id, row.id));
          console.log(`[Migrations] ✓ Fixed Heartsaver Final infant CPR Q (id=${row.id}): heel of 1 hand`);
        }
      }

      const moduleInfantRows = await db
        .select({ id: quizQuestions.id, correctAnswer: quizQuestions.correctAnswer })
        .from(quizQuestions)
        .where(like(quizQuestions.question, "%compression technique for a single rescuer performing infant CPR%"));
      for (const row of moduleInfantRows) {
        if (isTwoFingerAnswer(row.correctAnswer)) {
          await db
            .update(quizQuestions)
            .set({
              correctAnswer: "Heel of one hand on the sternum",
              explanation: hsInfantExplanation,
            })
            .where(eq(quizQuestions.id, row.id));
          console.log(`[Migrations] ✓ Fixed Heartsaver module infant CPR Q (id=${row.id}): heel of 1 hand`);
        }
      }

      const twoFingerSections = await db
        .select({ id: moduleSections.id, content: moduleSections.content })
        .from(moduleSections)
        .where(like(moduleSections.content, "%Two-finger technique%"));
      for (const row of twoFingerSections) {
        const content = row.content ?? "";
        if (!content.includes("Two-finger technique") && !content.includes("Two-finger")) continue;
        const updated = content
          .replace(
            /<td>Two fingers \(1 rescuer\) or two-thumb encircling \(2 rescuers\)<\/td>/g,
            "<td>Heel of 1 hand (1 rescuer) or two-thumb encircling (2 rescuers or when chest can be encircled)</td>"
          )
          .replace(
            /<li><strong>1 rescuer:<\/strong> Two-finger technique[^<]*<\/li>/g,
            "<li><strong>1 rescuer:</strong> Heel of 1 hand on the lower half of the sternum</li>"
          )
          .replace(
            /than the two-finger technique\. Use it whenever 2 rescuers are available\./g,
            ". Use it whenever 2 rescuers are available, or when a single rescuer can encircle the chest with both hands."
          );
        if (updated !== content) {
          await db.update(moduleSections).set({ content: updated }).where(eq(moduleSections.id, row.id));
          console.log(`[Migrations] ✓ Updated infant CPR section (id=${row.id}) for 2025 technique`);
        }
      }

      console.log("[Migrations] ✓ Heartsaver 2025 infant CPR migration complete");
    } catch (hsErr) {
      console.error(
        "[Migrations] Heartsaver content migration error (non-fatal):",
        hsErr instanceof Error ? hsErr.message : hsErr
      );
    }
  } catch (error) {
    console.error('[Migrations] Migration error (non-fatal):', error instanceof Error ? error.message : error);
    // Don't throw — allow server to start even if a migration fails
  }
}

export async function initializeDatabase() {
  try {
    const db = await getDb();
    if (!db) {
      console.log('[Initialize] Database not available, skipping seed');
      return;
    }

    // Check if courses already exist
    const existing = await db.query.microCourses.findFirst();
    if (existing) {
      console.log('[Initialize] Courses already seeded, skipping');
      return;
    }

    const fellowshipCount = MICRO_COURSE_CATALOG.filter((c) => c.isPublished).length;
    console.log(`[Initialize] Seeding ${fellowshipCount} micro-courses from catalog...`);
    await ensureMicroCoursesCatalog();
    console.log(`[Initialize] ✓ Successfully seeded micro-course catalog`);
  } catch (error) {
    console.error('[Initialize] Error seeding courses:', error instanceof Error ? error.message : error);
    // Don't throw - allow server to continue even if seeding fails
  }
}
