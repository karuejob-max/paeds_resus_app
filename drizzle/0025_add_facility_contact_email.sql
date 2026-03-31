-- REF-1: optional receiving-facility contact for referral emails
-- Apply manually if `drizzle-kit generate` is blocked by snapshot issues.
ALTER TABLE `clinicalReferrals` ADD COLUMN `facilityContactEmail` varchar(320);
