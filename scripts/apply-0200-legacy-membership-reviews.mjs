import "dotenv/config";
import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const connection = await mysql.createConnection(await getConnectionConfig(process.env.DATABASE_URL));
try {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS institutionMembershipReviews (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      institutionalAccountId INT NOT NULL,
      membershipId INT NOT NULL,
      decision ENUM('legacy_pending','confirmed','not_in_my_department','department_assigned','removed') NOT NULL,
      reviewerUserId INT NULL,
      reviewerRole VARCHAR(64) NULL,
      departmentId INT NULL,
      note VARCHAR(500) NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY institutionMembershipReviews_membership_idx (membershipId, id),
      KEY institutionMembershipReviews_institution_idx (institutionalAccountId, decision)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("[0200] institutionMembershipReviews exists and is ready.");

  // Active memberships that have no audit event at all predate the membership audit trail:
  // they were created by self-selection or CPD attendance before institutions had to approve.
  // 1) open a review for each (nobody is removed or changed); 2) give each an audit event so
  // the history is not empty. Both steps are skipped for memberships already handled.
  const [reviews] = await connection.execute(`
    INSERT INTO institutionMembershipReviews (institutionalAccountId, membershipId, decision, note)
    SELECT m.institutionalAccountId, m.id, 'legacy_pending',
           'Active before institution approval was required; awaiting confirmation.'
    FROM institutionMemberships m
    WHERE m.membershipStatus = 'active'
      AND NOT EXISTS (SELECT 1 FROM institution_membership_events e WHERE e.membership_id = m.id)
      AND NOT EXISTS (SELECT 1 FROM institutionMembershipReviews r WHERE r.membershipId = m.id)
  `);
  console.log(`[0200] Opened ${reviews.affectedRows ?? 0} legacy membership review(s).`);

  const [events] = await connection.execute(`
    INSERT INTO institution_membership_events
      (institutional_account_id, membership_id, staff_member_id, user_id, event_type,
       previous_membership_status, current_membership_status, actor_user_id, reason, occurred_at)
    SELECT m.institutionalAccountId, m.id, m.staffMemberId, m.userId, 'accepted',
           NULL, 'active', COALESCE(m.userId, 0),
           'Legacy: self-selected before institution approval was required (backfilled).',
           COALESCE(m.acceptedAt, m.createdAt)
    FROM institutionMemberships m
    WHERE m.membershipStatus = 'active'
      AND NOT EXISTS (SELECT 1 FROM institution_membership_events e WHERE e.membership_id = m.id)
  `);
  console.log(`[0200] Backfilled ${events.affectedRows ?? 0} audit event(s) for legacy memberships.`);
} finally {
  await connection.end();
}
