/**
 * update-image-urls.ts
 * Replaces all old Manus CDN image/PDF URLs in moduleSections.content
 * with the new assets.paedsresus.com custom domain URLs.
 *
 * Run: npx tsx update-image-urls.ts
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

// Mapping: old Manus CDN hash URL → new assets.paedsresus.com URL
const URL_MAP: Record<string, string> = {
  // BLS images
  'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/uPVOEVMtdNNCAFxJ.jpg':
    'https://assets.paedsresus.com/AdultBLSAlgorithmforHealthcareProviders.jpg',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/JRhqhPQjUavvvnTi.jpg':
    'https://assets.paedsresus.com/AdultBLSCircularAlgorithm.jpg',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/dlVFAvOxSQtIQAhD.jpg':
    'https://assets.paedsresus.com/HeadTiltChinLift.jpg',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/bFYHIRnhYRSgoLLr.jpg':
    'https://assets.paedsresus.com/SingleRescuerPosition.jpg',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/OiYeNjGHMerXxnuo.jpg':
    'https://assets.paedsresus.com/2RescuerPosition.jpg',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/zQTJdmBosnHpHqBa.jpg':
    'https://assets.paedsresus.com/PadPlacement.jpg',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/EbUetJWLdlcFLPmd.jpg':
    'https://assets.paedsresus.com/AdultForeignBodyAirwayObstruction.jpg',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/OppQyzCIqrmgrqWy.jpg':
    'https://assets.paedsresus.com/BLSUniversalTerminationofResuscitationRules.jpg',
  // ACLS images
  'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/WMAFDEebhxuLTSvW.jpg':
    'https://assets.paedsresus.com/AdultCardiacArrestAlgorithm.jpg',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/iqTAFIaeCgYxlqIE.jpg':
    'https://assets.paedsresus.com/AdultCardiacArrestCircularAlgorithm.jpg',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/RxhFLJoAuwgNJyEN.jpg':
    'https://assets.paedsresus.com/AdultBradycardiaWithaPulseAlgorithm.jpg',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/siCbDpWmTQthWUzd.jpg':
    'https://assets.paedsresus.com/AdultTachyarrythmiaWithaPulseAlgorithm.jpg',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/UchZBrALpalLmnEq.webp':
    'https://assets.paedsresus.com/ElectricalCardioversionAlgorithm.webp',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/unzmuRCvlBKLAZbp.jpg':
    'https://assets.paedsresus.com/AdvancedAirwayDecisionMaking.jpg',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/qbHRuEaQatfuaYHh.jpg':
    'https://assets.paedsresus.com/ALSTerminationofResuscitation.jpg',
  // PDFs
  'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/RRzDlIpiDEgEtykS.pdf':
    'https://assets.paedsresus.com/2025BLSManualBook.pdf',
  'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/eAvBbTqFQdfHvRma.pdf':
    'https://assets.paedsresus.com/2025ACLSManualBook.pdf',
};

async function main() {
  const dbUrl = process.env.DATABASE_URL!;
  const url = new URL(dbUrl);
  const needsSsl = /ssl-mode=REQUIRED|ssl=true/i.test(dbUrl) || url.hostname.endsWith('.aivencloud.com');

  const conn = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || '3306'),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  });

  console.log('\n=== FETCHING SECTIONS WITH EMBEDDED IMAGES ===');
  const [sections] = await conn.execute<any[]>(
    "SELECT id, content FROM moduleSections WHERE content LIKE '%files.manuscdn.com%' ORDER BY id"
  );
  console.log(`Found ${sections.length} sections with old URLs`);

  let totalUpdated = 0;

  for (const section of sections) {
    let content: string = section.content;
    let changed = false;

    for (const [oldUrl, newUrl] of Object.entries(URL_MAP)) {
      if (content.includes(oldUrl)) {
        content = content.split(oldUrl).join(newUrl);
        changed = true;
        console.log(`  Section ${section.id}: ${oldUrl.split('/').pop()} → ${newUrl.split('/').pop()}`);
      }
    }

    if (changed) {
      const [r] = await conn.execute<any>(
        'UPDATE moduleSections SET content = ? WHERE id = ?',
        [content, section.id]
      );
      console.log(`  ✓ Section ${section.id} updated (${r.affectedRows} row)`);
      totalUpdated++;
    }
  }

  console.log(`\n=== DONE: ${totalUpdated} sections updated ===`);

  // Verify: check no old URLs remain
  const [remaining] = await conn.execute<any[]>(
    "SELECT id FROM moduleSections WHERE content LIKE '%files.manuscdn.com%'"
  );
  if (remaining.length === 0) {
    console.log('✓ Verification passed: no old Manus CDN URLs remain in DB');
  } else {
    console.log(`⚠ WARNING: ${remaining.length} sections still have old URLs: ${remaining.map((r: any) => r.id).join(', ')}`);
  }

  await conn.end();
}

main().catch(e => { console.error(e); process.exit(1); });
