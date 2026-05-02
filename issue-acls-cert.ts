import { getDb } from "./server/db";
import { saveAhaCognitiveCertificate } from "./server/certificates";
import { users } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) { console.error("No DB"); process.exit(1); }

  const userRows = await db.select({ name: users.name }).from(users).where(eq(users.id, 1)).limit(1);
  const recipientName = userRows[0]?.name ?? "Job Karue";

  console.log(`Issuing ACLS cognitive cert for enrollment 3 (recipient: ${recipientName})...`);
  const result = await saveAhaCognitiveCertificate(3, 1, recipientName, "acls");
  console.log("Result:", JSON.stringify(result));
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
