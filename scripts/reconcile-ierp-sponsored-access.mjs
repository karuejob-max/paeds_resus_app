import mysql from "mysql2/promise";

const APPLY = process.argv.includes("--apply");
const FEE_KES = 15000;

function parseDate(value) {
  return value instanceof Date ? value : new Date(value);
}

const db = await mysql.createConnection(process.env.DATABASE_URL);
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
      const [lockedGrants] = await db.query(
        `SELECT id, targetUserId, grantReference, createdByUserId, status, expiresAt, redemptionCount, maxRedemptions
         FROM globalEntitlements WHERE id = ? FOR UPDATE`,
        [grant.id],
      );
      const currentGrant = lockedGrants[0];
      if (
        !currentGrant ||
        currentGrant.status !== "active" ||
        parseDate(currentGrant.expiresAt).getTime() <= Date.now() ||
        Number(currentGrant.redemptionCount) >= Number(currentGrant.maxRedemptions)
      ) {
        summary.skipped += 1;
        await db.rollback();
        continue;
      }

      const [enrollments] = await db.query(
        `SELECT id
         FROM ierpProgramEnrollments
         WHERE userId = ?
           AND programKey = 'ierp'
           AND paymentStatus = 'pending'
           AND CAST(totalPaidAmount AS DECIMAL(10,2)) = 0
         ORDER BY id
         LIMIT 1
         FOR UPDATE`,
        [currentGrant.targetUserId],
      );
      const enrollment = enrollments[0];
      if (!enrollment) {
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
          await db.query(
            `UPDATE ierpProgramEnrollments
             SET entitlementId = ?, effectiveFeeKes = 0, paymentStatus = 'not_required',
                 paymentLockoutAt = NULL, updatedAt = UTC_TIMESTAMP()
             WHERE id = ? AND paymentStatus = 'pending' AND CAST(totalPaidAmount AS DECIMAL(10,2)) = 0`,
            [currentGrant.id, enrollment.id],
          );
          summary.reconciled += 1;
          await db.commit();
        } else {
          summary.skipped += 1;
          await db.rollback();
        }
        continue;
      }

      if (APPLY) {
        await db.query(
          `INSERT INTO globalEntitlementRedemptions
            (entitlementId, targetUserId, targetInstitutionalAccountId, programType,
             resourceReference, originalAmountKes, discountAmountKes, effectiveAmountKes,
             redeemedByUserId, redeemedAt)
           VALUES (?, ?, NULL, 'ierp', ?, ?, ?, 0, ?, UTC_TIMESTAMP())`,
          [currentGrant.id, currentGrant.targetUserId, `ierp-enrollment-${enrollment.id}`, FEE_KES, FEE_KES, currentGrant.createdByUserId],
        );
        await db.query(
          `UPDATE globalEntitlements
           SET redemptionCount = redemptionCount + 1,
               status = CASE WHEN redemptionCount + 1 >= maxRedemptions THEN 'exhausted' ELSE status END,
               updatedAt = UTC_TIMESTAMP()
           WHERE id = ?`,
          [currentGrant.id],
        );
        await db.query(
          `UPDATE ierpProgramEnrollments
           SET entitlementId = ?, effectiveFeeKes = 0, paymentStatus = 'not_required',
               paymentLockoutAt = NULL, updatedAt = UTC_TIMESTAMP()
           WHERE id = ? AND paymentStatus = 'pending' AND CAST(totalPaidAmount AS DECIMAL(10,2)) = 0`,
          [currentGrant.id, enrollment.id],
        );
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
