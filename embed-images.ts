import * as mysql from 'mysql2/promise';

// CDN URLs for all uploaded assets
const ASSETS = {
  // BLS images
  AdultBLSAlgorithmHCP: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/uPVOEVMtdNNCAFxJ.jpg',
  AdultBLSCircular: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/JRhqhPQjUavvvnTi.jpg',
  HeadTiltChinLift: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/dlVFAvOxSQtIQAhD.jpg',
  SingleRescuer: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/bFYHIRnhYRSgoLLr.jpg',
  TwoRescuer: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/OiYeNjGHMerXxnuo.jpg',
  PadPlacement: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/zQTJdmBosnHpHqBa.jpg',
  AdultFBAO: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/EbUetJWLdlcFLPmd.jpg',
  BLSTermination: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/OppQyzCIqrmgrqWy.jpg',
  // ACLS images
  AdultCAAlgorithm: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/WMAFDEebhxuLTSvW.jpg',
  AdultCACircular: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/iqTAFIaeCgYxlqIE.jpg',
  AdultBradycardia: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/RxhFLJoAuwgNJyEN.jpg',
  AdultTachycardia: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/siCbDpWmTQthWUzd.jpg',
  ElectricalCardioversion: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/UchZBrALpalLmnEq.webp',
  AdvancedAirway: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/unzmuRCvlBKLAZbp.jpg',
  ALSTermination: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/qbHRuEaQatfuaYHh.jpg',
  // PDFs
  BLSManual: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/RRzDlIpiDEgEtykS.pdf',
  ACLSManual: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/eAvBbTqFQdfHvRma.pdf',
};

function imgBlock(url: string, caption: string): string {
  return `<div class="algorithm-image">
  <img src="${url}" alt="${caption}" style="max-width:100%;border-radius:8px;margin:16px 0;box-shadow:0 2px 8px rgba(0,0,0,0.15);" />
  <p class="image-caption" style="text-align:center;font-size:0.85em;color:#666;margin-top:4px;"><em>${caption} — © 2025 American Heart Association</em></p>
</div>`;
}

function pdfLink(url: string, label: string): string {
  return `<div class="resource-download" style="margin:16px 0;padding:12px 16px;background:#f0f7ff;border-left:4px solid #2563eb;border-radius:4px;">
  <a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-weight:600;text-decoration:none;">
    📄 Download: ${label}
  </a>
  <span style="color:#666;font-size:0.85em;margin-left:8px;">(PDF — 2025 AHA)</span>
</div>`;
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  let updated = 0;

  // Helper: append image block to section content (before closing </div> or at end)
  async function appendToSection(id: number, html: string, label: string) {
    const [rows] = await conn.execute<any[]>('SELECT content FROM moduleSections WHERE id = ?', [id]);
    const existing: string = (rows as any[])[0]?.content || '';
    // Don't double-add if already present
    if (existing.includes(html.substring(0, 60))) {
      console.log(`  SKIP ${id} (${label}) — already embedded`);
      return;
    }
    const newContent = existing.trimEnd() + '\n' + html;
    const [r] = await conn.execute<any>('UPDATE moduleSections SET content = ? WHERE id = ?', [newContent, id]);
    console.log(`  OK ${id} (${label}) — ${r.affectedRows} row updated`);
    updated += r.affectedRows;
  }

  console.log('\n=== BLS IMAGE EMBEDDING ===');

  // BLS M1 S1 (id=531) — BLS overview / Chain of Survival
  // Add: Adult BLS Circular Algorithm + HCP Algorithm + BLS Manual download
  await appendToSection(531,
    imgBlock(ASSETS.AdultBLSCircular, 'Adult BLS Circular Algorithm — Act Now. Save a Life.') + '\n' +
    imgBlock(ASSETS.AdultBLSAlgorithmHCP, 'Adult Basic Life Support Algorithm for Healthcare Professionals') + '\n' +
    pdfLink(ASSETS.BLSManual, '2025 AHA BLS Provider Manual'),
    'BLS overview algorithms + manual'
  );

  // BLS M2 S1 (id=534) — Adult CPR overview
  // Add: Single rescuer position + Head-tilt chin-lift
  await appendToSection(534,
    imgBlock(ASSETS.SingleRescuer, 'Single Rescuer CPR Position') + '\n' +
    imgBlock(ASSETS.HeadTiltChinLift, 'Head-Tilt Chin-Lift Technique'),
    'Adult CPR technique images'
  );

  // BLS M2 S2 (id=535) — High-quality CPR components
  // Add: Two-rescuer position
  await appendToSection(535,
    imgBlock(ASSETS.TwoRescuer, '2-Rescuer CPR — Role Division and Positioning'),
    '2-rescuer CPR image'
  );

  // BLS M4 S1 (id=543) — AED overview
  // Add: Pad placement image
  await appendToSection(543,
    imgBlock(ASSETS.PadPlacement, 'AED Pad Placement — Anterior-Lateral Position'),
    'AED pad placement image'
  );

  // BLS M3 S4 (id=542) — Special situations (choking/FBAO)
  // Add: Adult FBAO algorithm
  await appendToSection(542,
    imgBlock(ASSETS.AdultFBAO, 'Adult Foreign-Body Airway Obstruction Algorithm'),
    'Adult FBAO algorithm'
  );

  // BLS M5 S1 (id=545) — Post-resuscitation care overview
  // Add: BLS Termination of Resuscitation rules
  await appendToSection(545,
    imgBlock(ASSETS.BLSTermination, 'BLS/Universal Termination of Resuscitation Rules'),
    'BLS termination of resuscitation'
  );

  console.log('\n=== ACLS IMAGE EMBEDDING ===');

  // ACLS M1 S1 (id=551) — ACLS systematic approach overview
  // Add: ACLS manual download
  await appendToSection(551,
    pdfLink(ASSETS.ACLSManual, '2025 AHA ACLS Provider Manual'),
    'ACLS manual download'
  );

  // ACLS M2 S1 (id=555) — VF/pVT overview
  // Add: Adult Cardiac Arrest Algorithm (VF/pVT/Asystole/PEA)
  await appendToSection(555,
    imgBlock(ASSETS.AdultCAAlgorithm, 'Adult Cardiac Arrest Algorithm (VF/pVT/Asystole/PEA)') + '\n' +
    imgBlock(ASSETS.AdultCACircular, 'Adult Cardiac Arrest Circular Algorithm'),
    'Cardiac arrest algorithms'
  );

  // ACLS M3 S1 (id=558) — PEA/Asystole overview
  // Add: Adult Cardiac Arrest Algorithm (same — non-shockable arm)
  await appendToSection(558,
    imgBlock(ASSETS.AdultCAAlgorithm, 'Adult Cardiac Arrest Algorithm — Non-Shockable Arm (Asystole/PEA)'),
    'Non-shockable cardiac arrest algorithm'
  );

  // ACLS M4 S2 (id=564) — Bradycardia algorithm
  // Add: Adult Bradycardia With a Pulse Algorithm
  await appendToSection(564,
    imgBlock(ASSETS.AdultBradycardia, 'Adult Bradycardia With a Pulse Algorithm'),
    'Bradycardia algorithm'
  );

  // ACLS M4 S3 (id=565) — Tachycardia unstable
  // Add: Adult Tachyarrhythmia With a Pulse Algorithm + Electrical Cardioversion Algorithm
  await appendToSection(565,
    imgBlock(ASSETS.AdultTachycardia, 'Adult Tachyarrhythmia With a Pulse Algorithm') + '\n' +
    imgBlock(ASSETS.ElectricalCardioversion, 'Electrical Cardioversion Algorithm'),
    'Tachycardia + cardioversion algorithms'
  );

  // ACLS M4 S4 (id=566) — Tachycardia stable
  // Add: Advanced Airway Decision Making
  await appendToSection(566,
    imgBlock(ASSETS.AdvancedAirway, 'Advanced Airway Decision Making — Out-of-Hospital vs In-Hospital'),
    'Advanced airway decision making'
  );

  // ACLS M6 S4 (id=574) — Termination of resuscitation
  // Add: ALS Termination of Resuscitation
  await appendToSection(574,
    imgBlock(ASSETS.ALSTermination, 'ALS Termination of Resuscitation Criteria'),
    'ALS termination of resuscitation'
  );

  console.log(`\n=== TOTAL SECTIONS UPDATED: ${updated} ===`);
  await conn.end();
}

main().catch(e => { console.error(e); process.exit(1); });
