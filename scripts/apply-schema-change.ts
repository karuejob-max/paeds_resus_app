import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("Failed to connect to database");
    process.exit(1);
  }

  console.log("Applying schema change: Adding 'fellowship_diploma' to programType enums...");

  try {
    // MySQL requires modifying the column to update the enum
    // We need to do this for all three tables
    await db.execute(sql`ALTER TABLE enrollments MODIFY COLUMN programType ENUM('bls', 'acls', 'pals', 'fellowship', 'instructor', 'fellowship_diploma') NOT NULL`);
    console.log("Updated enrollments table.");

    await db.execute(sql`ALTER TABLE certificates MODIFY COLUMN programType ENUM('bls', 'acls', 'pals', 'fellowship', 'instructor', 'fellowship_diploma') NOT NULL`);
    console.log("Updated certificates table.");

    await db.execute(sql`ALTER TABLE courses MODIFY COLUMN programType ENUM('bls', 'acls', 'pals', 'fellowship', 'instructor', 'fellowship_diploma') NOT NULL`);
    console.log("Updated courses table.");

    console.log("Schema change applied successfully.");
  } catch (error) {
    console.error("Error applying schema change:", error);
    process.exit(1);
  }
}

main();
