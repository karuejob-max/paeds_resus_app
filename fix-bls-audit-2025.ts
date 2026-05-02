import { getDb } from './server/db';
import { moduleSections, quizQuestions } from './drizzle/schema';
import { eq } from 'drizzle-orm';

async function runMigration() {
  console.log('Starting BLS AHA 2025 Audit Fixes...');
  const db = await getDb();

  // ---------------------------------------------------------------------------
  // ISSUE 1: Chain of Survival (Module 1, Section 1)
  // ---------------------------------------------------------------------------
  console.log('Fixing Issue 1: Chain of Survival link names...');
  const m1s1 = await db.query.moduleSections.findFirst({
    where: eq(moduleSections.id, 613) // Assuming this is the correct ID based on typical order, will use UPDATE with LIKE to be safe
  });
  
  // Actually, safer to update by title/content match
  const allSections = await db.query.moduleSections.findMany();
  const chainSection = allSections.find(s => s.title.includes('The BLS Chain of Survival'));
  if (chainSection) {
    let content = chainSection.content;
    content = content.replace('<li>Recognition of cardiac arrest and activation of the emergency response system</li>', '<li>Recognition and Emergency Activation</li>');
    content = content.replace('<li>High-quality CPR</li>', '<li>High-Quality CPR</li>');
    content = content.replace('<li>Rapid defibrillation</li>', '<li>Defibrillation</li>');
    content = content.replace('<li>Advanced resuscitation</li>', '<li>Advanced Resuscitation</li>');
    content = content.replace('<li>Post-cardiac arrest care</li>', '<li>Post–Cardiac Arrest Care</li>');
    content = content.replace('<li>Recovery</li>', '<li>Recovery and Survivorship</li>');
    
    await db.update(moduleSections)
      .set({ content })
      .where(eq(moduleSections.id, chainSection.id));
  }

  // ---------------------------------------------------------------------------
  // ISSUE 2: Infant Compression Technique (Module 3, Section 3)
  // ---------------------------------------------------------------------------
  console.log('Fixing Issue 2: Infant compression technique (heel-of-1-hand)...');
  const infantSection = allSections.find(s => s.title.includes('Infant CPR (Under 1 Year)'));
  if (infantSection) {
    const newContent = `<div class="module-content"> <h2>Infant CPR — 2025 AHA Updated Technique</h2>  <div class="callout callout-warning">   <strong>2025 Change:</strong> The 2-finger technique for infant chest compressions is no longer recommended. The AHA 2025 guidelines introduce the <strong>heel-of-1-hand</strong> technique as the standard for single rescuers or when the chest cannot be encircled. </div>  <h3>Recommended Infant Compression Techniques (2025)</h3>  <table>   <thead><tr><th>Technique</th><th>When to Use</th><th>How to Perform</th></tr></thead>   <tbody>     <tr><td><strong>Heel-of-1-Hand</strong></td><td>Single rescuer OR if unable to encircle chest</td><td>Place the heel of one hand in the centre of the chest, just below the nipple line. Compress at least 4 cm.</td></tr>     <tr><td><strong>2 Thumb-Encircling</strong></td><td>Two or more rescuers (preferred)</td><td>Place both thumbs side by side in the centre of the chest. Encircle chest with fingers. Compress at least 4 cm.</td></tr>   </tbody> </table> </div>`;
    await db.update(moduleSections)
      .set({ content: newContent })
      .where(eq(moduleSections.id, infantSection.id));
  }

  // ---------------------------------------------------------------------------
  // ISSUE 4, 8, 9, 10, 11: Other Content Section Updates
  // ---------------------------------------------------------------------------
  console.log('Fixing Content Sections (Witnessed arrest, Opioid, Drowning, AED pads)...');
  
  // M1S3: Activating EMS (Witnessed vs Unwitnessed & Opioid)
  const emsSection = allSections.find(s => s.title.includes('Activating the Emergency Response System'));
  if (emsSection) {
    const newContent = `<h2>Activating the Emergency Response System</h2> <p>Once cardiac arrest is recognised, activating the emergency response system must happen rapidly.</p> <h3>Single Rescuer Protocol</h3> <table>   <thead><tr><th>Scenario</th><th>Action</th></tr></thead>   <tbody>     <tr><td><strong>Adult</strong></td><td>Call emergency services FIRST, get AED, then begin CPR. <em>(Note: If opioid overdose suspected, give naloxone if available)</em></td></tr>     <tr><td><strong>Child/Infant (Witnessed collapse)</strong></td><td>Call emergency services FIRST, get AED, then begin CPR.</td></tr>     <tr><td><strong>Child/Infant (Unwitnessed collapse)</strong></td><td>Begin CPR FIRST for 2 minutes (5 cycles), THEN call emergency services and get AED.</td></tr>   </tbody> </table>`;
    await db.update(moduleSections).set({ content: newContent }).where(eq(moduleSections.id, emsSection.id));
  }

  // M2S3: Rescue Breathing (Opioid)
  const breathSection = allSections.find(s => s.title.includes('Rescue Breathing — Adult'));
  if (breathSection) {
    let content = breathSection.content;
    content += `<h3>Opioid-Associated Emergency</h3> <ul><li>If an opioid overdose is suspected and the patient is in respiratory arrest (has a pulse but not breathing normally), administer an opioid antagonist (e.g., naloxone) if available, in addition to providing rescue breaths.</li></ul>`;
    await db.update(moduleSections).set({ content }).where(eq(moduleSections.id, breathSection.id));
  }

  // M3S4: Drowning
  const specialSection = allSections.find(s => s.title.includes('Special Situations: Drowning, Choking'));
  if (specialSection) {
    let content = specialSection.content;
    content = content.replace('Begin rescue breaths FIRST (5 initial breaths)', 'Begin rescue breaths FIRST (5 initial breaths for paediatric drowning; for adults, prioritise early ventilation and CPR)');
    await db.update(moduleSections).set({ content }).where(eq(moduleSections.id, specialSection.id));
  }

  // M4S2: AED Pads
  const padSection = allSections.find(s => s.title.includes('Pad Placement and Special Situations'));
  if (padSection) {
    let content = padSection.content;
    content = content.replace('Use paediatric pads (with dose attenuator) for children under 8 years. If unavailable, use adult pads in anterior-posterior position.', 'Use paediatric pads (with dose attenuator) for children under 8 years. Pad placement may be anterior-posterior OR anterolateral depending on the AED model — always follow the diagram on the pads. If paediatric pads are unavailable, use adult pads.');
    await db.update(moduleSections).set({ content }).where(eq(moduleSections.id, padSection.id));
  }

  // ---------------------------------------------------------------------------
  // QUIZ QUESTIONS UPDATES (Issues 3, 4, 5, 6, 7)
  // ---------------------------------------------------------------------------
  console.log('Fixing Quiz Questions...');

  // Q1432: Infant 2-rescuer technique explanation
  await db.update(quizQuestions)
    .set({ explanation: "The two-thumb encircling technique is preferred for infant CPR when two rescuers are present. The AHA 2025 guidelines recommend the heel-of-1-hand technique for single rescuers or when the chest cannot be encircled." })
    .where(eq(quizQuestions.id, 1432));

  // Q1426: Witnessed vs Unwitnessed Child (Formative)
  await db.update(quizQuestions)
    .set({ 
      question: "You are alone and find an 8-year-old child unresponsive and not breathing (unwitnessed collapse). There is no one else present. What is the correct sequence?",
      explanation: "For an UNWITNESSED paediatric cardiac arrest, a single rescuer should perform 2 minutes of CPR before leaving to call emergency services. If the collapse was WITNESSED, the single rescuer should call emergency services and get an AED FIRST before starting CPR." 
    })
    .where(eq(quizQuestions.id, 1426));

  // Q1496: Witnessed vs Unwitnessed Child (Final Exam)
  await db.update(quizQuestions)
    .set({ 
      question: "A child collapses in front of you (witnessed collapse) and you are alone. What should you do first?",
      correctAnswer: "Call emergency services and get an AED, then begin CPR",
      explanation: "For a WITNESSED sudden collapse of a child, a single rescuer should leave the child to activate the emergency response system and get an AED FIRST. The 'CPR for 2 minutes first' rule only applies to UNWITNESSED paediatric arrests." 
    })
    .where(eq(quizQuestions.id, 1496));

  // Q1507: Atropine 0.5mg label fix
  await db.update(quizQuestions)
    .set({ correctAnswer: "Atropine 1 mg IV (first-line)" })
    .where(eq(quizQuestions.id, 1507));

  // Q1503: Replace ACLS VF question with BLS AED question
  await db.update(quizQuestions)
    .set({ 
      question: "You are using an AED on a 5-year-old child, but paediatric pads are not available. What should you do?",
      correctAnswer: "Use adult pads, ensuring they do not touch each other",
      explanation: "If paediatric pads or a dose attenuator are not available, use standard adult pads. Place them in an anterior-posterior position if they would touch each other on the child's chest. Never cut pads to make them smaller." 
    })
    .where(eq(quizQuestions.id, 1503));

  // Q1504: Replace ACLS Adrenaline question with BLS Opioid question
  await db.update(quizQuestions)
    .set({ 
      question: "You find an unresponsive adult who is not breathing normally but has a strong pulse. You suspect an opioid overdose. What is the correct action?",
      correctAnswer: "Provide rescue breathing and administer naloxone if available",
      explanation: "For a suspected opioid overdose with respiratory arrest (pulse present but not breathing), provide rescue breathing (1 breath every 6 seconds) and administer an opioid antagonist like naloxone if available." 
    })
    .where(eq(quizQuestions.id, 1504));

  // Q1505: Replace ACLS Amiodarone question with BLS CCF question
  await db.update(quizQuestions)
    .set({ 
      question: "What is the primary goal regarding the Chest Compression Fraction (CCF) during CPR?",
      correctAnswer: "Maximise CCF to at least 60%, ideally >80%",
      explanation: "Chest Compression Fraction (CCF) is the proportion of time during cardiac arrest that compressions are being performed. The AHA 2025 guidelines recommend a CCF of at least 60%, with a goal of >80% to maximise survival." 
    })
    .where(eq(quizQuestions.id, 1505));

  // Q1508: Replace ACLS SVT question with BLS Team Dynamics question
  await db.update(quizQuestions)
    .set({ 
      question: "During a resuscitation attempt, the Team Leader asks you to perform chest compressions. You notice the patient is on a soft mattress. What should you do?",
      correctAnswer: "Place a CPR board under the patient to provide a firm surface",
      explanation: "High-quality CPR requires a firm, flat surface. If the patient is on a soft bed, a CPR board must be placed underneath them to ensure compressions depress the chest rather than pushing the patient into the mattress." 
    })
    .where(eq(quizQuestions.id, 1508));

  // Q1509: Replace ACLS Cardioversion question with BLS Recovery Position question
  await db.update(quizQuestions)
    .set({ 
      question: "When is it appropriate to place a victim in the recovery position?",
      correctAnswer: "When the victim is unresponsive but breathing normally",
      explanation: "The recovery position is used for unresponsive victims who are breathing normally and have adequate circulation. It helps maintain a patent airway and reduces the risk of aspiration." 
    })
    .where(eq(quizQuestions.id, 1509));

  console.log('All BLS AHA 2025 Audit Fixes applied successfully!');
  process.exit(0);
}

runMigration().catch(console.error);
