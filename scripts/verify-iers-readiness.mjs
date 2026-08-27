/**
 * Verify the production IERS schema and essential operational columns.
 *
 * Run after applying the guarded institutional migrations, including migrations 0125–0127:
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
  { key: "membershipEvents", label: "institution membership audit history", names: ["institution_membership_events"] },
  { key: "activationEvents", label: "activation events", names: ["iersActivationEvents", "iers_activation_events"] },
  { key: "activationResponders", label: "activation responders", names: ["iersActivationResponders", "iers_activation_responders"] },
  { key: "activationTimeline", label: "activation timeline", names: ["iersActivationTimeline", "iers_activation_timeline"] },
  { key: "evidence", label: "evidence records", names: ["iers_evidence_records", "iersEvidenceRecords"] },
  { key: "actions", label: "action items", names: ["iers_action_items", "iersActionItems"] },
  { key: "drills", label: "drills", names: ["iers_drills", "iersDrills"] },
  { key: "drillParticipants", label: "drill participants", names: ["iers_drill_participants", "iersDrillParticipants"] },
  { key: "milestones", label: "implementation milestones", names: ["iers_implementation_milestones", "iersImplementationMilestones"] },
  { key: "competencyRecords", label: "IERS competency records", names: ["iersCompetencyRecords", "iers_competency_records"] },
  { key: "trainingSchedules", label: "institutional training schedules", names: ["trainingSchedules", "training_schedules"] },
  { key: "products", label: "institutional products", names: ["institutionalProducts", "institutional_products"] },
  { key: "capabilities", label: "product capabilities", names: ["institutionalProductCapabilities", "institutional_product_capabilities"] },
  { key: "plans", label: "product plans", names: ["institutionalProductPlans", "institutional_product_plans"] },
  { key: "subscriptions", label: "product subscriptions", names: ["institutionProductSubscriptions", "institution_product_subscriptions"] },
  { key: "entitlements", label: "product entitlements", names: ["institutionProductEntitlements", "institution_product_entitlements"] },
  { key: "productRoles", label: "product roles", names: ["institutionProductRoles", "institution_product_roles"] },
  { key: "accountScopes", label: "shared institution account scopes", names: ["institutionAccountScopes", "institution_account_scopes"] },
  { key: "accountScopeEvents", label: "shared institution scope history", names: ["institutionAccountScopeEvents", "institution_account_scope_events"] },
  { key: "subscriptionEvents", label: "subscription events", names: ["institutionSubscriptionEvents", "institution_subscription_events"] },
  { key: "entitlementAudit", label: "entitlement audit log", names: ["institutionEntitlementAuditLog", "institution_entitlement_audit_log"] },
  { key: "lifecyclePolicies", label: "data lifecycle policies", names: ["institutionDataLifecyclePolicies", "institution_data_lifecycle_policies"] },
  { key: "lifecycleRequests", label: "data lifecycle requests", names: ["institutionDataLifecycleRequests", "institution_data_lifecycle_requests"] },
  { key: "subscriptionPayments", label: "institutional subscription payments", names: ["institutionSubscriptionPayments", "institution_subscription_payments"] },
  { key: "subscriptionPaymentIntents", label: "institutional M-Pesa payment intents", names: ["institutionSubscriptionPaymentIntents", "institution_subscription_payment_intents"] },
  { key: "renewalPreferences", label: "renewal notification preferences", names: ["institutionRenewalNotificationPreferences", "institution_renewal_notification_preferences"] },
  { key: "renewalNotifications", label: "renewal notification history", names: ["institutionRenewalNotifications", "institution_renewal_notifications"] },
  { key: "connectedServices", label: "connected services registry", names: ["institutionConnectedServices", "institution_connected_services"] },
  { key: "connectedServiceEvents", label: "connected services review history", names: ["institutionConnectedServiceEvents", "institution_connected_service_events"] },
  { key: "safeTruthPolicies", label: "Safe Truth governance policies", names: ["safeTruthGovernancePolicies", "safe_truth_governance_policies"] },
  { key: "safeTruthPolicyEvents", label: "Safe Truth governance history", names: ["safeTruthGovernancePolicyEvents", "safe_truth_governance_policy_events"] },
  { key: "facilityPoles", label: "facility response poles", names: ["facility_poles", "facilityPoles"] },
  { key: "facilityDepartments", label: "facility departments", names: ["facility_departments", "facilityDepartments"] },
  { key: "institutionalStaffMembers", label: "institutional staff roster", names: ["institutionalStaffMembers", "institutional_staff_members"] },
  { key: "cpdAttendees", label: "CPD attendance records", names: ["cpdAttendees", "cpd_attendees"] },
  { key: "weeklyErtlRotations", label: "weekly ERTL rotations", names: ["ertl_weekly_rotations", "ertlWeeklyRotations"] },
  { key: "monthlyUtlRotations", label: "monthly UTL rotations", names: ["monthly_utl_rotations", "monthlyUtlRotations"] },
  { key: "shiftUtlRosters", label: "shift UTL rosters", names: ["shift_utl_rosters", "shiftUtlRosters"] },
  { key: "institutionShiftTemplates", label: "institution shift templates", names: ["institution_shift_templates", "institutionShiftTemplates"] },
  { key: "departmentErcos", label: "department ERCo assignments", names: ["institution_department_response_coordinators", "institutionDepartmentResponseCoordinators"] },
  { key: "departmentErcoEvents", label: "department ERCo assignment history", names: ["institution_department_response_coordinator_events", "institutionDepartmentResponseCoordinatorEvents"] },
  { key: "departmentReconciliations", label: "department reconciliation state", names: ["institution_department_reconciliations"] },
  { key: "departmentAuditEvents", label: "department reconciliation audit history", names: ["institution_department_audit_events"] },
  { key: "cpdDepartmentResolutions", label: "CPD Other department resolutions", names: ["institution_cpd_department_resolutions"] },
  { key: "shiftTeams", label: "versioned IERS shift teams", names: ["iers_shift_teams"] },
  { key: "shiftRoleAssignments", label: "IERS shift role assignments", names: ["iers_shift_role_assignments"] },
  { key: "shiftRoleRecommendations", label: "IERS role recommendations", names: ["iers_shift_role_recommendations"] },
  { key: "shiftRoleEvents", label: "IERS shift role audit events", names: ["iers_shift_role_events"] },
  { key: "readinessTemplates", label: "IERS readiness templates", names: ["iers_readiness_templates"] },
  { key: "readinessTemplateItems", label: "IERS readiness template items", names: ["iers_readiness_template_items"] },
  { key: "utlReadinessChecks", label: "UTL readiness checks", names: ["iers_utl_readiness_checks"] },
  { key: "utlReadinessCheckItems", label: "UTL readiness check items", names: ["iers_utl_readiness_check_items"] },
  { key: "activationTeamSnapshots", label: "activation team snapshots", names: ["iers_activation_team_snapshots"] },
  { key: "targetedRoleReports", label: "targeted ERT role reports", names: ["iers_targeted_role_reports"] },
  { key: "pushSubscriptions", label: "IERS Web Push subscriptions", names: ["iers_push_subscriptions"] },
  { key: "pushDeliveryLog", label: "IERS push delivery log", names: ["iers_push_delivery_log"] },
  { key: "userNotificationPreferences", label: "durable user notification preferences", names: ["userNotificationPreferences", "user_notification_preferences"] },
  { key: "professionalCredentials", label: "structured professional credentials", names: ["professionalCredentials", "professional_credentials"] },
  { key: "professionalCredentialReminderEvents", label: "professional credential reminder events", names: ["professionalCredentialReminderEvents", "professional_credential_reminder_events"] },
  { key: "institutionDepartmentHeads", label: "Departmental Head appointments", names: ["institutionDepartmentHeads", "institution_department_heads"] },
  { key: "institutionDepartmentHeadEvents", label: "Departmental Head appointment audit history", names: ["institutionDepartmentHeadEvents", "institution_department_head_events"] },
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
  { tableKey: "drills", label: "drill simulation safety", names: ["is_simulation", "isSimulation"] },
  { tableKey: "drills", label: "drill simulation label", names: ["simulation_label", "simulationLabel"] },
  { tableKey: "drills", label: "drill no-patient-identifiers acknowledgement", names: ["no_patient_identifiers_acknowledged", "noPatientIdentifiersAcknowledged"] },
  { tableKey: "milestones", label: "milestone evidence", names: ["evidence_id", "evidenceId"] },
  { tableKey: "competencyRecords", label: "competency program type", names: ["programType", "program_type"] },
  { tableKey: "competencyRecords", label: "competency status", names: ["competencyStatus", "competency_status"] },
  { tableKey: "competencyRecords", label: "competency source attendance", names: ["trainingAttendanceId", "training_attendance_id"] },
  { tableKey: "trainingSchedules", label: "training schedule end date", names: ["endDate", "end_date"] },
  { tableKey: "products", label: "product key", names: ["productKey", "product_key"] },
  { tableKey: "capabilities", label: "capability key", names: ["capabilityKey", "capability_key"] },
  { tableKey: "plans", label: "plan key", names: ["planKey", "plan_key"] },
  { tableKey: "subscriptions", label: "subscription status", names: ["subscriptionStatus", "subscription_status"] },
  { tableKey: "entitlements", label: "entitlement status", names: ["entitlementStatus", "entitlement_status"] },
  { tableKey: "productRoles", label: "product role status", names: ["roleStatus", "role_status"] },
  { tableKey: "productRoles", label: "product role key", names: ["roleKey", "role_key"] },
  { tableKey: "productRoles", label: "product role invite identity", names: ["invitedEmail", "invited_email"] },
  { tableKey: "accountScopes", label: "account scope key", names: ["scopeKey", "scope_key"] },
  { tableKey: "accountScopes", label: "account scope status", names: ["scopeStatus", "scope_status"] },
  { tableKey: "accountScopes", label: "account scope invite identity", names: ["invitedEmail", "invited_email"] },
  { tableKey: "accountScopeEvents", label: "account scope event type", names: ["eventType", "event_type"] },
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
  { tableKey: "subscriptionPaymentIntents", label: "institutional payment checkout request", names: ["checkoutRequestId", "checkout_request_id"] },
  { tableKey: "subscriptionPaymentIntents", label: "institutional payment idempotency", names: ["idempotencyKey", "idempotency_key"] },
  { tableKey: "subscriptionPaymentIntents", label: "institutional payment status", names: ["status"] },
  { tableKey: "subscriptionPaymentIntents", label: "institutional payment receipt", names: ["mpesaReceiptNumber", "mpesa_receipt_number"] },
  { tableKey: "renewalPreferences", label: "renewal in-app preference", names: ["inAppEnabled", "in_app_enabled"] },
  { tableKey: "renewalPreferences", label: "renewal reminder days", names: ["reminderDays", "reminder_days"] },
  { tableKey: "renewalNotifications", label: "renewal notification dedupe", names: ["dedupeKey", "dedupe_key"] },
  { tableKey: "renewalNotifications", label: "renewal notification status", names: ["status"] },
  { tableKey: "renewalNotifications", label: "renewal notification channel", names: ["channel"] },
  { tableKey: "connectedServices", label: "connected service key", names: ["serviceKey", "service_key"] },
  { tableKey: "connectedServices", label: "connected service lifecycle", names: ["lifecycleStatus", "lifecycle_status"] },
  { tableKey: "connectedServices", label: "connected service privacy class", names: ["privacyClass", "privacy_class"] },
  { tableKey: "connectedServices", label: "connected service owner", names: ["owner"] },
  { tableKey: "safeTruthPolicies", label: "Safe Truth boundary status", names: ["boundaryStatus", "boundary_status"] },
  { tableKey: "safeTruthPolicies", label: "Safe Truth allowed route", names: ["allowedRoute", "allowed_route"] },
  { tableKey: "safeTruthPolicies", label: "Safe Truth patient identifier policy", names: ["patientIdentifiersAllowed", "patient_identifiers_allowed"] },
  { tableKey: "safeTruthPolicies", label: "Safe Truth provider linkage policy", names: ["providerLinkageAllowed", "provider_linkage_allowed"] },
  { tableKey: "facilityPoles", label: "facility pole institution", names: ["institution_id", "institutionId"] },
  { tableKey: "facilityPoles", label: "facility pole display order", names: ["pole_order", "poleOrder"] },
  { tableKey: "institutionalStaffMembers", label: "staff removal timestamp", names: ["removedAt", "removed_at"] },
  { tableKey: "institutionalStaffMembers", label: "staff removal actor", names: ["removedByUserId", "removed_by_user_id"] },
  { tableKey: "institutionalStaffMembers", label: "staff removal reason", names: ["removalReason", "removal_reason"] },
  { tableKey: "membershipEvents", label: "membership audit event type", names: ["event_type", "eventType"] },
  { tableKey: "membershipEvents", label: "membership audit actor", names: ["actor_user_id", "actorUserId"] },
  { tableKey: "membershipEvents", label: "membership audit reason", names: ["reason"] },
  { tableKey: "facilityDepartments", label: "facility department pole", names: ["pole_id", "poleId"] },
  { tableKey: "facilityDepartments", label: "facility department active state", names: ["is_active", "isActive"] },
  { tableKey: "facilityDepartments", label: "facility department confirmation timestamp", names: ["confirmed_at", "confirmedAt"] },
  { tableKey: "facilityDepartments", label: "facility department confirmation actor", names: ["confirmed_by_user_id", "confirmedByUserId"] },
  { tableKey: "facilityDepartments", label: "facility department IERS pole requirement", names: ["requires_pole", "requiresPole"] },
  { tableKey: "facilityDepartments", label: "facility department pole sequence", names: ["pole_sequence", "poleSequence"] },
  { tableKey: "facilityPoles", label: "facility pole rotation anchor", names: ["rotation_anchor_date", "rotationAnchorDate"] },
  { tableKey: "institutionalStaffMembers", label: "staff canonical facility department", names: ["facilityDepartmentId", "facility_department_id"] },
  { tableKey: "cpdAttendees", label: "CPD canonical facility department", names: ["facilityDepartmentId", "facility_department_id"] },
  { tableKey: "weeklyErtlRotations", label: "weekly ERTL department", names: ["department_id", "departmentId"] },
  { tableKey: "weeklyErtlRotations", label: "weekly ERTL provider", names: ["ertl_user_id", "ertlUserId"] },
  { tableKey: "weeklyErtlRotations", label: "weekly ERTL assignment status", names: ["assignment_status", "assignmentStatus"] },
  { tableKey: "weeklyErtlRotations", label: "weekly ERTL acceptance", names: ["accepted_at", "acceptedAt"] },
  { tableKey: "monthlyUtlRotations", label: "monthly UTL department", names: ["department_id", "departmentId"] },
  { tableKey: "monthlyUtlRotations", label: "monthly UTL provider", names: ["provider_user_id", "providerUserId"] },
  { tableKey: "monthlyUtlRotations", label: "monthly UTL assignment status", names: ["assignment_status", "assignmentStatus"] },
  { tableKey: "monthlyUtlRotations", label: "monthly UTL month start", names: ["month_start", "monthStart"] },
  { tableKey: "shiftUtlRosters", label: "shift UTL user", names: ["utl_user_id", "utlUserId"] },
  { tableKey: "shiftUtlRosters", label: "shift UTL assignment status", names: ["assignment_status", "assignmentStatus"] },
  { tableKey: "shiftUtlRosters", label: "shift UTL acceptance", names: ["accepted_at", "acceptedAt"] },
  { tableKey: "shiftUtlRosters", label: "shift monthly UTL provenance", names: ["monthly_utl_rotation_id", "monthlyUtlRotationId"] },
  { tableKey: "shiftUtlRosters", label: "shift UTL exact start time", names: ["shift_start_time", "shiftStartTime"] },
  { tableKey: "shiftUtlRosters", label: "shift UTL exact end time", names: ["shift_end_time", "shiftEndTime"] },
  { tableKey: "shiftUtlRosters", label: "shift UTL overnight offset", names: ["shift_end_day_offset", "shiftEndDayOffset"] },
  { tableKey: "shiftUtlRosters", label: "shift UTL template", names: ["shift_template_id", "shiftTemplateId"] },
  { tableKey: "institutionShiftTemplates", label: "shift template start time", names: ["start_time", "startTime"] },
  { tableKey: "institutionShiftTemplates", label: "shift template end time", names: ["end_time", "endTime"] },
  { tableKey: "institutionShiftTemplates", label: "shift template overnight offset", names: ["end_day_offset", "endDayOffset"] },
  { tableKey: "departmentErcos", label: "department ERCo coordinator", names: ["coordinator_user_id", "coordinatorUserId"] },
  { tableKey: "departmentErcos", label: "department ERCo assignment status", names: ["assignment_status", "assignmentStatus"] },
  { tableKey: "departmentErcos", label: "department ERCo effective date", names: ["effective_from", "effectiveFrom"] },
  { tableKey: "departmentErcos", label: "department ERCo uniqueness department", names: ["department_id", "departmentId"] },
  { tableKey: "departmentErcoEvents", label: "department ERCo event type", names: ["event_type", "eventType"] },
  { tableKey: "departmentErcoEvents", label: "department ERCo event actor", names: ["actor_user_id", "actorUserId"] },
  { tableKey: "departmentReconciliations", label: "department reconciliation normalized label", names: ["normalized_label"] },
  { tableKey: "departmentReconciliations", label: "department reconciliation review status", names: ["status"] },
  { tableKey: "departmentReconciliations", label: "department reconciliation attendance count", names: ["attendance_count"] },
  { tableKey: "departmentAuditEvents", label: "department reconciliation audit event type", names: ["event_type"] },
  { tableKey: "departmentAuditEvents", label: "department reconciliation audit actor", names: ["actor_user_id"] },
  { tableKey: "departmentAuditEvents", label: "department reconciliation audit reason", names: ["reason"] },
  { tableKey: "cpdDepartmentResolutions", label: "CPD Other resolution attendee", names: ["cpd_attendee_id"] },
  { tableKey: "cpdDepartmentResolutions", label: "CPD Other resolution target", names: ["facility_department_id"] },
  { tableKey: "cpdDepartmentResolutions", label: "CPD Other resolution decision status", names: ["status"] },
  { tableKey: "shiftTeams", label: "shift team pole", names: ["pole_id"] },
  { tableKey: "shiftTeams", label: "shift team date", names: ["shift_date"] },
  { tableKey: "shiftTeams", label: "shift team exact start", names: ["shift_start_time"] },
  { tableKey: "shiftTeams", label: "shift team version", names: ["team_version"] },
  { tableKey: "shiftRoleAssignments", label: "shift role provider", names: ["provider_user_id"] },
  { tableKey: "shiftRoleAssignments", label: "shift role scope", names: ["role_scope"] },
  { tableKey: "shiftRoleAssignments", label: "shift role acceptance status", names: ["assignment_status"] },
  { tableKey: "shiftRoleRecommendations", label: "role recommendation status", names: ["status"] },
  { tableKey: "shiftRoleRecommendations", label: "role recommendation reason", names: ["reason"] },
  { tableKey: "shiftRoleEvents", label: "shift role event type", names: ["event_type"] },
  { tableKey: "shiftRoleEvents", label: "shift role event actor", names: ["actor_user_id"] },
  { tableKey: "readinessTemplates", label: "readiness template version", names: ["template_version"] },
  { tableKey: "readinessTemplates", label: "readiness template approval status", names: ["status"] },
  { tableKey: "readinessTemplateItems", label: "readiness item age band", names: ["age_band"] },
  { tableKey: "readinessTemplateItems", label: "readiness item criticality", names: ["is_critical"] },
  { tableKey: "utlReadinessChecks", label: "UTL readiness checker", names: ["checked_by_user_id"] },
  { tableKey: "utlReadinessChecks", label: "UTL readiness idempotency key", names: ["idempotency_key"] },
  { tableKey: "utlReadinessChecks", label: "UTL readiness status", names: ["status"] },
  { tableKey: "utlReadinessCheckItems", label: "UTL readiness item status", names: ["item_status"] },
  { tableKey: "utlReadinessCheckItems", label: "UTL readiness critical gap", names: ["is_critical_gap"] },
  { tableKey: "activationTeamSnapshots", label: "activation snapshot provider", names: ["provider_user_id"] },
  { tableKey: "activationTeamSnapshots", label: "activation snapshot role", names: ["role_key"] },
  { tableKey: "activationTeamSnapshots", label: "activation snapshot time", names: ["snapshotted_at"] },
  { tableKey: "targetedRoleReports", label: "targeted report activation", names: ["activation_event_id"] },
  { tableKey: "targetedRoleReports", label: "targeted report idempotency key", names: ["idempotency_key"] },
  { tableKey: "targetedRoleReports", label: "targeted report role-at-event", names: ["role_at_event"] },
  { tableKey: "targetedRoleReports", label: "targeted report phase", names: ["report_phase"] },
  { tableKey: "targetedRoleReports", label: "targeted report no-patient-identifiers acknowledgement", names: ["no_patient_identifiers_acknowledged"] },
  { tableKey: "targetedRoleReports", label: "targeted report submission state", names: ["submission_state"] },
  { tableKey: "pushSubscriptions", label: "push subscription endpoint hash", names: ["endpoint_hash"] },
  { tableKey: "pushSubscriptions", label: "push subscription active state", names: ["is_active"] },
  { tableKey: "pushSubscriptions", label: "push subscription last seen", names: ["last_seen_at"] },
  { tableKey: "pushDeliveryLog", label: "push delivery activation", names: ["activation_event_id"] },
  { tableKey: "pushDeliveryLog", label: "push delivery status", names: ["status"] },
  { tableKey: "pushDeliveryLog", label: "push delivery idempotency key", names: ["delivery_key"] },
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
