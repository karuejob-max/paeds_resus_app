import { getDb } from "../server/db";
import { queueRenewalNotifications } from "../server/lib/institution-renewal-notifications";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const result = await queueRenewalNotifications(db);
  console.log(`[renewals] processed=${result.processed} sent=${result.sent} skipped=${result.skipped} failed=${result.failed}`);
  if (result.failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("[renewals] Fatal error:", error);
  process.exitCode = 1;
});
