/**
 * DSAR account deletion handler per DSAR_PROCEDURE.md §6.
 *
 *   pnpm run dsar:deletion -- --user-id=123 --dry-run
 *   pnpm run dsar:deletion -- --request-id=456 --execute
 */
import { eq } from "drizzle-orm";
import { legalDataRequests } from "../drizzle/schema";
import { getDb } from "../server/db";
import { buildDsarDeletionPlan, executeDsarAccountDeletion } from "../server/lib/dsar-deletion";

function parseArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("DATABASE_URL / database connection required.");
    process.exit(1);
  }

  const userIdRaw = parseArg("user-id");
  const requestIdRaw = parseArg("request-id");
  const execute = process.argv.includes("--execute");
  const dryRun = !execute;

  let userId = userIdRaw ? parseInt(userIdRaw, 10) : undefined;
  let requestId = requestIdRaw ? parseInt(requestIdRaw, 10) : undefined;

  if (requestId && !userId) {
    const [row] = await db
      .select({ userId: legalDataRequests.userId, requestType: legalDataRequests.requestType })
      .from(legalDataRequests)
      .where(eq(legalDataRequests.id, requestId))
      .limit(1);

    if (!row) {
      console.error(`DSAR request #${requestId} not found.`);
      process.exit(1);
    }
    if (row.requestType !== "deletion") {
      console.error(
        `Request #${requestId} is type "${row.requestType}" — deletion handler applies to deletion only.`
      );
      process.exit(1);
    }
    if (!row.userId) {
      console.error(`Request #${requestId} has no linked userId — verify identity manually first.`);
      process.exit(1);
    }
    userId = row.userId;
  }

  if (!userId || Number.isNaN(userId)) {
    console.error("Provide --user-id=N or --request-id=N (deletion type with linked user).");
    process.exit(1);
  }

  const plan = await buildDsarDeletionPlan(db, userId);
  if (!plan) {
    console.error(`User ${userId} not found.`);
    process.exit(1);
  }

  console.log(`DSAR deletion plan for userId=${userId}${requestId ? ` requestId=${requestId}` : ""}`);
  console.log(`Email: ${plan.email ?? "(none)"}`);
  console.log(`Mode: ${dryRun ? "DRY-RUN" : "EXECUTE"}\n`);
  for (const step of plan.steps) {
    console.log(`- ${step.table}: ${step.action} (${step.count} row(s))`);
  }

  if (dryRun) {
    console.log("\nDry-run only. Pass --execute after privacy lead approval.");
    process.exit(0);
  }

  const result = await executeDsarAccountDeletion(db, { userId, requestId, dryRun: false });
  if (!result.completed) {
    console.error("Deletion failed:", result.error);
    process.exit(1);
  }

  console.log("\nAccount deletion completed.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
