import test from "node:test";
import assert from "node:assert/strict";
import { firstAvailableName, REQUIRED_COLUMNS, REQUIRED_TABLES } from "./verify-iers-readiness.mjs";

test("IERS verifier accepts the deployed mixed table naming contract", () => {
  const deployedTables = new Set([
    "institutionMemberships",
    "iersActivationEvents",
    "iersActivationResponders",
    "iersActivationTimeline",
    "iers_evidence_records",
    "iers_action_items",
    "iers_drills",
    "iers_drill_participants",
    "iers_implementation_milestones",
  ]);

  for (const requirement of REQUIRED_TABLES) {
    assert.ok(
      firstAvailableName(deployedTables, requirement.names),
      `expected a deployed table alias for ${requirement.label}`,
    );
  }
});

test("IERS verifier accepts camelCase columns for the first two migration groups", () => {
  const deployedColumns = new Set([
    "responsibilityRole",
    "membershipStatus",
    "status",
    "triggeredAt",
    "notificationStatus",
    "eventType",
    "criterion_code",
    "reviewed_by_user_id",
    "owner_user_id",
    "closure_evidence_id",
    "debrief_note",
    "evidence_id",
  ]);

  for (const requirement of REQUIRED_COLUMNS) {
    assert.ok(
      firstAvailableName(deployedColumns, requirement.names),
      `expected a deployed column alias for ${requirement.label}`,
    );
  }
});
