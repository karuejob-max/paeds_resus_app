import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  // Check if microCourseEnrollmentId column exists
  const [cols] = await conn.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'certificates' 
     AND COLUMN_NAME = 'microCourseEnrollmentId'`
  );
  console.log('microCourseEnrollmentId column exists:', (cols as any[]).length > 0);

  // Check recent certificates
  const [certs] = await conn.execute(
    `SELECT id, userId, certificateNumber, programType, enrollmentId, 
     microCourseEnrollmentId, issueDate 
     FROM certificates ORDER BY id DESC LIMIT 10`
  );
  console.log('\nRecent certificates:', JSON.stringify(certs, null, 2));

  // Check microCourseEnrollments with completed status
  const [mce] = await conn.execute(
    `SELECT id, userId, microCourseId, enrollmentStatus, certificateIssuedAt 
     FROM microCourseEnrollments 
     WHERE enrollmentStatus = 'completed' 
     LIMIT 10`
  );
  console.log('\nCompleted micro-course enrollments:', JSON.stringify(mce, null, 2));

  // Check certificateDownloadFeedback table exists
  const [fbTable] = await conn.execute(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'certificateDownloadFeedback'`
  );
  console.log('\ncertificateDownloadFeedback table exists:', (fbTable as any[]).length > 0);

  // Check if any feedback exists
  if ((fbTable as any[]).length > 0) {
    const [fb] = await conn.execute(
      `SELECT id, userId, certificateId, rating FROM certificateDownloadFeedback LIMIT 10`
    );
    console.log('\nExisting feedback entries:', JSON.stringify(fb, null, 2));
  }

  await conn.end();
}

main().catch(console.error);
