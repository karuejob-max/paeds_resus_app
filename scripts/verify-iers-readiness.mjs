/**
 * Verify the production IERS schema and essential operational columns.
 *
 * Run after applying migrations 0094–0100:
 *   pnpm run db:verify-iers
 *
 * The first IERS migrations use the repository's existing camelCase table
 * naming convention, while migrations 0097–0099 use snake_case names. The
 * verifier accepts both forms so it checks the deployed contract rather than
 * assuming one naming style.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function exists(conn, dbName, table, column = null) {
  const [rows] = await conn.query(
    column
      ? `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`
      : `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    column ? [dbName, table, column] : [dbName, table],
  );
  return Array.isArray(rows) && rows.length > 0;
}

export function firstAvailableName(availableNames, candidates) {
  return candidates.find((candidate) => availableNames.has(candidate)) ?? null;
}

async function resolveTable(conn, dbName, names) {
  for (const name of names) {
    if (await exists(conn, dbName, name)) return name;
  }
  return null;
}

export const REQUIRED_TABLES = [
  { key: "memberships", label: "provider memberships", names: ["institutionMemberships", "institution_memberships"] },
  { key: "activationEvents", label: "activation events", names: ["iersActivationEvents", "iers_activation_events"] },
  { key: "activationResponders", label: "activation responders", names: ["iersActivationResponders", "iers_activation_responders"] },
  { key: "activationTimeline", label: "activation timeline", names: ["iersActivationTimeline", "iers_activation_timeline"] },
  { key: "evidence", label: "evidence records", names: ["iers_evidence_records", "iersEvidenceRecords"] },
  { key: "actions", label: "action items", names: ["iers_action_items", "iersActionItems"] },
  { key: "drills", label: "drills", names: ["iers_drills", "iersDrills"] },
  { key: "drillParticipants", label: "drill participants", names: ["iers_drill_participants", "iersDrillParticipants"] },
  { key: "milestones", label: "implementation milestones", names: ["iers_implementation_milestones", "iersImplementationMilestones"] },
  { key: "competencyRecords", label: "IERS competency records", names: ["iersCompetencyRecords", "iers_competency_records"] },
  { key: "products", label: "institutional products", names: ["institutionalProducts", "institutional_products"] },
  { key: "capabilities", label: "product capabilities", names: ["institutionalProductCapabilities", "institutional_product_capabilities"] },
  { key: "plans", label: "product plans", names: ["institutionalProductPlans", "institutional_product_plans"] },
  { key: "subscriptions", label: "product subscriptions", names: ["institutionProductSubscriptions", "institution_product_subscriptions"] },
  { key: "entitlements", label: "product entitlements", names: ["institutionProductEntitlements", "institution_product_entitlements"] },
  { key: "productRoles", label: "product roles", names: ["institutionProductRoles", "institution_product_roles"] },
  { key: "subscriptionEvents", label: "subscription events", names: ["institutionSubscriptionEvents", "institution_subscription_events"] },
  { key: "entitlementAudit", label: "entitlement audit log", names: ["institutionEntitlementAuditLog", "institution_entitlement_audit_log"] },
  { key: "lifecyclePolicies", label: "data lifecycle policies", names: ["institutionDataLifecyclePolicies", "institution_data_lifecycle_policies"] },
  { key: "lifecycleRequests", label: "data lifecycle requests", names: ["institutionDataLifecycleRequests", "institution_data_lifecycle_requests"] },
  { key: "subscriptionPayments", label: "institutional subscription payments", names: ["institutionSubscriptionPayments", "institution_subscription_payments"] },
  { key: "renewalPreferences", label: "renewal notification preferences", names: ["institutionRenewalNotificationPreferences", "institution_renewal_notification_preferences"] },
  { key: "renewalNotifications", label: "renewal notification history", names: ["institutionRenewalNotifications", "institution_renewal_notifications"] },
];

export const REQUIRED_COLUMNS = [
  { tableKey: "memberships", label: "provider memberships responsibility role", names: ["responsibilityRole", "responsibility_role"] },
  { tableKey: "memberships", label: "provider memberships status", names: ["membershipStatus", "membership_status"] },
  { tableKey: "activationEvents", label: "activation event status", names: ["status"] },
  { tableKey: "activationEvents", label: "activation event triggered time", names: ["triggeredAt", "triggered_at"] },
  { tableKey: "activationResponders", label: "activation responder notification status", names: ["notificationStatus", "notification_status"] },
  { tableKey: "activationTimeline", label: "activation timeline event type", names: ["eventType", "event_type"] },
  { tableKey: "evidence", label: "evidence criterion code", names: ["criterion_code", "criterionCode"] },
  { tableKey: "evidence", label: "evidence reviewer", names: ["reviewed_by_user_id", "reviewedByUserId"] },
  { tableKey: "actions", label: "action owner", names: ["owner_user_id", "ownerUserId"] },
  { tableKey: "actions", label: "action closure evidence", names: ["closure_evidence_id", "closureEvidenceId"] },
  { tableKey: "actions", label: "legacy QI action provenance", names: ["legacy_action_log_id", "legacyActionLogId"] },
  { tableKey: "drills", label: "drill debrief note", names: ["debrief_note", "debriefNote"] },
  { tableKey: "milestones", label: "milestone evidence", names: ["evidence_id", "evidenceId"] },
  { tableKey: "competencyRecords", label: "competency program type", names: ["programType", "program_type"] },
  { tableKey: "competencyRecords", label: "competency status", names: ["competencyStatus", "competency_status"] },
  { tableKey: "competencyRecords", label: "competency source attendance", names: ["trainingAttendanceId", "training_attendance_id"] },
  { tableKey: "products", label: "product key", names: ["productKey", "product_key"] },
  { tableKey: "capabilities", label: "capability key", names: ["capabilityKey", "capability_key"] },
  { tableKey: "plans", label: "plan key", names: ["planKey", "plan_key"] },
  { tableKey: "subscriptions", label: "subscription status", names: ["subscriptionStatus", "subscription_status"] },
  { tableKey: "entitlements", label: "entitlement status", names: ["entitlementStatus", "entitlement_status"] },
  { tableKey: "productRoles", label: "product role status", names: ["roleStatus", "role_status"] },
  { tableKey: "productRoles", label: "product role key", names: ["roleKey", "role_key"] },
  { tableKey: "productRoles", label: "product role invite identity", names: ["invitedEmail", "invited_email"] },
  { tableKey: "subscriptionEvents", label: "subscription event type", names: ["eventType", "event_type"] },
  { tableKey: "entitlementAudit", label: "entitlement audit decision", names: ["decision"] },
  { tableKey: "lifecyclePolicies", label: "lifecycle policy product", names: ["productKey", "product_key"] },
  { tableKey: "lifecyclePolicies", label: "lifecycle retention days", names: ["retentionDays", "retention_days"] },
  { tableKey: "lifecyclePolicies", label: "lifecycle legal hold", names: ["legalHold", "legal_hold"] },
  { tableKey: "lifecycleRequests", label: "lifecycle request type", names: ["requestType", "request_type"] },
  { tableKey: "lifecycleRequests", label: "lifecycle request status", names: ["status"] },
  { tableKey: "lifecycleRequests", label: "lifecycle request reason", names: ["reason"] },
  { tableKey: "subscriptionPayments", label: "subscription payment reference", names: ["paymentReference", "payment_reference"] },
  { tableKey: "subscriptionPayments", label: "subscription payment idempotency", names: ["idempotencyKey", "idempotency_key"] },
  { tableKey: "renewalPreferences", label: "renewal in-app preference", names: ["inAppEnabled", "in_app_enabled"] },
  { tableKey: "renewalPreferences", label: "renewal reminder days", names: ["reminderDays", "reminder_days"] },
  { tableKey: "renewalNotifications", label: "renewal notification dedupe", names: ["dedupeKey", "dedupe_key"] },
  { tableKey: "renewalNotifications", label: "renewal notification status", names: ["status"] },
  { tableKey: "renewalNotifications", label: "renewal notification channel", names: ["channel"] },
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const dbName = new URL(databaseUrl).pathname.replace(/^\//, "");
  const conn = await createMysqlConnection(databaseUrl, mysql);
  let missing = 0;
  try {
    const resolvedTables = new Map();
    for (const requirement of REQUIRED_TABLES) {
      const actualName = await resolveTable(conn, dbName, requirement.names);
      resolvedTables.set(requirement.key, actualName);
      console.log(
        `${actualName ? "[ok]" : "[MISSING]"} table ${requirement.label}${actualName ? ` (${actualName})` : ` [expected ${requirement.names.join(" or ")}]`}`,
      );
      if (!actualName) missing += 1;
    }

    for (const requirement of REQUIRED_COLUMNS) {
      const table = resolvedTables.get(requirement.tableKey);
      let actualColumn = null;
      if (table) {
        for (const column of requirement.names) {
          if (await exists(conn, dbName, table, column)) {
            actualColumn = column;
            break;
          }
        }
      }
      console.log(
        `${actualColumn ? "[ok]" : "[MISSING]"} ${requirement.label}${actualColumn ? ` (${table}.${actualColumn})` : ` [expected ${requirement.names.join(" or ")}]`}`,
      );
      if (!actualColumn) missing += 1;
    }
  } finally {
    await conn.end();
  }
  if (missing) {
    console.error(`\nIERS verification FAILED — ${missing} missing object(s). Do not rerun migrations automatically; investigate the specific missing object(s).`);
    process.exit(1);
  }
  console.log("\nIERS verification PASSED — IERS operational objects and institutional product-entitlement objects are present.");
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error?.message || error);
    process.exit(1);
  });
}
