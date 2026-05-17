/**
 * Sprint 1 verification: rollup self-test (no DB) + optional live DB check.
 *
 * Usage:
 *   pnpm run verify:sprint1          # rollup + taxonomy (no DATABASE_URL required)
 *   DATABASE_URL=... pnpm run verify:sprint1  # also runs verify:analytics
 */
import { spawnSync } from "node:child_process";
import {
  SPRINT1_RESUS_EVENT_TYPES,
  SPRINT1_SERVER_EVENT_TYPES,
} from "../shared/sprint1-expected-events";
import {
  rollupAnalyticsLastDays,
  rollupResusGpsLastDays,
} from "../server/lib/admin-analytics-rollup";

function syntheticFixture() {
  return [
    ...SPRINT1_SERVER_EVENT_TYPES.map((eventType) => ({
      eventType,
      eventName: `${eventType} smoke`,
    })),
    ...SPRINT1_RESUS_EVENT_TYPES.map((eventType) => ({
      eventType,
      eventName: `${eventType} smoke`,
    })),
  ];
}

function runRollupSelfTest(): boolean {
  const rows = syntheticFixture();
  const all = rollupAnalyticsLastDays(rows);
  const resus = rollupResusGpsLastDays(rows);

  console.log("── Sprint 1 rollup self-test (no DB) ──\n");
  console.log(`Synthetic rows: ${rows.length}`);
  console.log(`Product activity total: ${all.count}`);
  console.log(`ResusGPS slice total: ${resus.totalEvents}`);

  const ok =
    all.count === rows.length &&
    resus.totalEvents === SPRINT1_RESUS_EVENT_TYPES.length &&
    all.eventTypes.length >= 15;

  if (!ok) {
    console.error("\nFAIL: rollup counts do not match fixture.");
    return false;
  }
  console.log("\nOK: rollup matches Admin Reports bucketing logic.\n");
  return true;
}

function runDbVerify(): number {
  if (!process.env.DATABASE_URL) {
    console.log(
      "Skip live DB check (DATABASE_URL unset). Set it to compare with Admin → Reports.\n"
    );
    return 0;
  }
  console.log("── Live DB check (verify:analytics) ──\n");
  const r = spawnSync("pnpm", ["run", "verify:analytics"], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  return r.status ?? 1;
}

const selfOk = runRollupSelfTest();
const dbCode = selfOk ? runDbVerify() : 1;
process.exit(selfOk && dbCode === 0 ? 0 : 1);
