/**
 * fix-course-image-urls.ts
 *
 * Replaces all files.manuscdn.com CDN image URLs in moduleSections content
 * with self-hosted local paths (/assets/course-images/...).
 *
 * Run: DATABASE_URL="..." npx tsx fix-course-image-urls.ts
 */

import * as mysql from 'mysql2/promise';

// Map: CDN filename → local path
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

const CDN_BASE = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663302160278/';

async function main() {
  console.log('Starting course image URL migration...');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL not set');

  // Parse mysql URL
  const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+?)(\?|$)/);
  if (!match) throw new Error('Could not parse DATABASE_URL');
  const [, user, password, host, port, database] = match;

  const conn = await mysql.createConnection({
    host, port: parseInt(port), user, password, database,
    ssl: { rejectUnauthorized: false },
  });

  console.log('Connected to database');

  // Fetch all sections that contain CDN URLs
  const [rows] = await conn.execute<any[]>(
    "SELECT id, title, content FROM moduleSections WHERE content LIKE '%files.manuscdn.com%'"
  );

  console.log(`Found ${rows.length} sections with CDN image URLs`);

  let updated = 0;

  for (const row of rows) {
    let newContent: string = row.content;
    let changed = false;

    for (const [filename, localPath] of Object.entries(URL_MAP)) {
      const cdnUrl = CDN_BASE + filename;
      if (newContent.includes(cdnUrl)) {
        newContent = newContent.split(cdnUrl).join(localPath);
        changed = true;
      }
    }

    if (changed) {
      const [result] = await conn.execute<any>(
        'UPDATE moduleSections SET content = ? WHERE id = ?',
        [newContent, row.id]
      );
      if (result.affectedRows > 0) {
        console.log(`  ✅ Updated section ${row.id}: "${row.title}"`);
        updated++;
      }
    }
  }

  await conn.end();
  console.log(`\nDone. ${updated} sections updated.`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
