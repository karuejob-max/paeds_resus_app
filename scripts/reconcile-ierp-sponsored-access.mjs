import mysql from "mysql2/promise";
import { getConnectionConfig } from "./db-connection-config.mjs";

const APPLY = process.argv.includes("--apply");
const FEE_KES = 15000;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for IERP reconciliation.");

function parseDate(value) {
  return value instanceof Date ? value : new Date(value);
}

function requireOneAffectedRow(result, description) {
  if (Number(result?.affectedRows ?? 0) !== 1) {
    throw new Error(`${description} did not update exactly one row; transaction rolled back.`);
  }
}

const db = await mysql.createConnection(await getConnectionConfig(databaseUrl));
const summary = { mode: APPLY ? "apply" : "dry_run", candidates: 0, reconciled: 0, skipped: 0 };

try {
  const [grants] = await db.query(`
    SELECT id, targetUserId, grantReference, createdByUserId
    FROM globalEntitlements
    WHERE programType = 'ierp'
      AND benefitType = 'free'
      AND targetUserId IS NOT NULL
      AND status = 'active'
      AND expiresAt > UTC_TIMESTAMP()
      AND redemptionCount < maxRedemptions
    ORDER BY id
  `);

  for (const grant of grants) {
    summary.candidates += 1;
    await db.beginTransaction();
    try {
      // Lock the unique enrollment before the grant so the script, admin, and
      // learner paths acquire locks in the same order.
      const [enrollments] = await db.query(
        `SELECT id
         FROM ierpProgramEnrollments
         WHERE userId = ?
           AND programKey = 'ierp'
           AND paymentStatus = 'pending'
           AND CAST(totalPaidAmount AS DECIMAL(10,2)) = 0
           AND (entitlementId IS NULL OR entitlementId = ?)
         ORDER BY id
         LIMIT 1
         FOR UPDATE`,
        [grant.targetUserId, grant.id],
      );
      const enrollment = enrollments[0];
      if (!enrollment) {
        summary.skipped += 1;
        await db.rollback();
        continue;
      }

      const [lockedGrants] = await db.query(
        `SELECT id, targetUserId, grantReference, createdByUserId, status, expiresAt, redemptionCount, maxRedemptions
         FROM globalEntitlements WHERE id = ? FOR UPDATE`,
        [grant.id],
      );
      const currentGrant = lockedGrants[0];
      if (
        !currentGrant ||
        Number(currentGrant.targetUserId) !== Number(grant.targetUserId) ||
        currentGrant.status !== "active" ||
        parseDate(currentGrant.expiresAt).getTime() <= Date.now() ||
        Number(currentGrant.redemptionCount) >= Number(currentGrant.maxRedemptions)
      ) {
        summary.skipped += 1;
        await db.rollback();
        continue;
      }

      const [existingRedemptions] = await db.query(
        `SELECT id, effectiveAmountKes FROM globalEntitlementRedemptions
         WHERE entitlementId = ? AND resourceReference = ? LIMIT 1`,
        [currentGrant.id, `ierp-enrollment-${enrollment.id}`],
      );
      if (existingRedemptions.length > 0) {
        if (Number(existingRedemptions[0].effectiveAmountKes) === 0 && APPLY) {
          const [updatedEnrollment] = await db.query(
            `UPDATE ierpProgramEnrollments
             SET entitlementId = ?, effectiveFeeKes = 0, paymentStatus = 'not_required',
                 paymentLockoutAt = NULL, updatedAt = UTC_TIMESTAMP()
             WHERE id = ? AND paymentStatus = 'pending' AND CAST(totalPaidAmount AS DECIMAL(10,2)) = 0`,
            [currentGrant.id, enrollment.id],
          );
          requireOneAffectedRow(updatedEnrollment, `IERP enrollment ${enrollment.id}`);
          summary.reconciled += 1;
          await db.commit();
        } else {
          summary.skipped += 1;
          await db.rollback();
        }
        continue;
      }

      if (APPLY) {
        const [insertedRedemption] = await db.query(
          `INSERT INTO globalEntitlementRedemptions
            (entitlementId, targetUserId, targetInstitutionalAccountId, programType,
             resourceReference, originalAmountKes, discountAmountKes, effectiveAmountKes,
             redeemedByUserId, redeemedAt)
           VALUES (?, ?, NULL, 'ierp', ?, ?, ?, 0, ?, UTC_TIMESTAMP())`,
          [currentGrant.id, currentGrant.targetUserId, `ierp-enrollment-${enrollment.id}`, FEE_KES, FEE_KES, currentGrant.createdByUserId],
        );
        requireOneAffectedRow(insertedRedemption, `Redemption for IERP enrollment ${enrollment.id}`);

        const [updatedGrant] = await db.query(
          `UPDATE globalEntitlements
           SET redemptionCount = redemptionCount + 1,
               status = CASE WHEN redemptionCount + 1 >= maxRedemptions THEN 'exhausted' ELSE status END,
               updatedAt = UTC_TIMESTAMP()
           WHERE id = ? AND status = 'active' AND expiresAt > UTC_TIMESTAMP()
             AND redemptionCount < maxRedemptions`,
          [currentGrant.id],
        );
        requireOneAffectedRow(updatedGrant, `Global entitlement ${currentGrant.id}`);

        const [updatedEnrollment] = await db.query(
          `UPDATE ierpProgramEnrollments
           SET entitlementId = ?, effectiveFeeKes = 0, paymentStatus = 'not_required',
               paymentLockoutAt = NULL, updatedAt = UTC_TIMESTAMP()
           WHERE id = ? AND paymentStatus = 'pending' AND CAST(totalPaidAmount AS DECIMAL(10,2)) = 0`,
          [currentGrant.id, enrollment.id],
        );
        requireOneAffectedRow(updatedEnrollment, `IERP enrollment ${enrollment.id}`);
        summary.reconciled += 1;
      } else {
        console.log(`[dry-run] grant ${currentGrant.grantReference} -> enrollment ${enrollment.id}`);
      }
      await db.commit();
    } catch (error) {
      await db.rollback();
      throw error;
    }
  }

  console.log(JSON.stringify(summary, null, 2));
} finally {
  await db.end();
}
