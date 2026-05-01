
import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("Failed to connect to database");
    process.exit(1);
  }

  console.log("Updating schema to include moduleSections table...");

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS moduleSections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        moduleId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        \`order\` INT DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      )
    `);
    console.log("Successfully created moduleSections table.");
  } catch (error) {
    console.error("Error creating moduleSections table:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
