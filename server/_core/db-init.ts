/**
 * Database schema initialization
 * Ensures required columns exist in users table
 */

let initialized = false;

export async function initializeDatabase() {
  if (initialized) return;
  initialized = true;

  try {
    const { default: mysql } = await import("mysql2/promise");
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      console.log("[DB Init] DATABASE_URL not set, skipping schema initialization");
      return;
    }

    const url = new URL(DATABASE_URL);
    const config: any = {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
    };

    const connection = await mysql.createConnection(config);
    console.log("[DB Init] Connected to database");

    // Check and add missing columns
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = ?
    `, [url.pathname.slice(1)]);

    const existingColumns = new Set((columns as any[]).map(c => c.COLUMN_NAME));
    const requiredColumns = [
      { name: 'passwordHash', type: 'VARCHAR(255)', nullable: true },
      { name: 'loginMethod', type: 'VARCHAR(64)', nullable: true },
      { name: 'providerType', type: "ENUM('nurse', 'doctor', 'pharmacist', 'paramedic', 'lab_tech', 'respiratory_therapist', 'midwife', 'other')", nullable: true },
      { name: 'userType', type: "ENUM('individual', 'institutional', 'parent')", nullable: false, default: "'individual'" },
      { name: 'lastSignedIn', type: 'TIMESTAMP', nullable: false, default: 'CURRENT_TIMESTAMP' },
    ];

    const missingColumns = requiredColumns.filter(col => !existingColumns.has(col.name));

    if (missingColumns.length > 0) {
      console.log(`[DB Init] Adding ${missingColumns.length} missing column(s)...`);
      for (const col of missingColumns) {
        const nullableStr = col.nullable ? 'NULL' : 'NOT NULL';
        const defaultStr = col.default ? `DEFAULT ${col.default}` : '';
        const sql = `ALTER TABLE users ADD COLUMN ${col.name} ${col.type} ${nullableStr} ${defaultStr}`.trim();
        try {
          await connection.query(sql);
          console.log(`[DB Init] ✅ Added column: ${col.name}`);
        } catch (err: any) {
          if (err.code !== 'ER_DUP_FIELDNAME') {
            console.error(`[DB Init] Error adding column ${col.name}:`, err.message);
          }
        }
      }
    } else {
      console.log("[DB Init] All required columns exist");
    }

    await connection.end();
    console.log("[DB Init] Schema initialization complete");
  } catch (err: any) {
    console.error("[DB Init] Error during schema initialization:", err.message);
    // Don't exit - let the server start anyway
  }
}
