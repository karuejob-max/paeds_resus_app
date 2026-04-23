-- Migration 0037: Care Signal — facility tracking, review workflow, fellowship eligibility
-- Generated: 2026-04-23
-- Purpose: Adds columns required for Phase 2 and Phase 3 Care Signal functionality:
--   - facilityId: links event to a facility for institutional reporting
--   - reviewerId: records which admin/coordinator reviewed the event
--   - eligibleForFellowship: marks whether this event counts toward Pillar C
--   - submissionVersion: tracks which form version was used (for audit trail)

ALTER TABLE `careSignalEvents`
  ADD COLUMN `facilityId` int NULL AFTER `userId`,
  ADD COLUMN `reviewerId` int NULL AFTER `status`,
  ADD COLUMN `eligibleForFellowship` boolean NOT NULL DEFAULT true AFTER `reviewerId`,
  ADD COLUMN `submissionVersion` varchar(16) NOT NULL DEFAULT 'v1' AFTER `eligibleForFellowship`;

-- Index for facility-level reporting queries
CREATE INDEX `idx_care_signal_facility` ON `careSignalEvents` (`facilityId`);

-- Index for review workflow queries
CREATE INDEX `idx_care_signal_status` ON `careSignalEvents` (`status`);

-- Index for fellowship pillar queries (userId + createdAt is the hot path)
CREATE INDEX `idx_care_signal_user_created` ON `careSignalEvents` (`userId`, `createdAt`);
