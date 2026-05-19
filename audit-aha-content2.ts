import mysql from "mysql2/promise";

async function main() {
  const pool = mysql.createPool(process.env.DATABASE_URL!);
  
  // Check column names
  const [modCols] = await pool.query('DESCRIBE modules');
  console.log('modules columns:', (modCols as any[]).map((c: any) => c.Field).join(', '));
  
  const [secCols] = await pool.query('DESCRIBE moduleSections');
  console.log('moduleSections columns:', (secCols as any[]).map((c: any) => c.Field).join(', '));
  
  const [qCols] = await pool.query('DESCRIBE quizQuestions');
  console.log('quizQuestions columns:', (qCols as any[]).map((c: any) => c.Field).join(', '));
  
  await pool.end();
}

main().catch(console.error);
