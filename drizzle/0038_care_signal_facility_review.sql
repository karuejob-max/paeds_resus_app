ALTER TABLE `careSignalEvents`
  ADD COLUMN `facilityId` int NULL AFTER `userId`,
  ADD COLUMN `reviewerId` int NULL AFTER `status`,
  ADD COLUMN `eligibleForFellowship` boolean NOT NULL DEFAULT true AFTER `reviewerId`,
  ADD COLUMN `submissionVersion` varchar(16) NOT NULL DEFAULT 'v1' AFTER `eligibleForFellowship`;

CREATE INDEX `idx_care_signal_facility` ON `careSignalEvents` (`facilityId`);
CREATE INDEX `idx_care_signal_status` ON `careSignalEvents` (`status`);
CREATE INDEX `idx_care_signal_user_created` ON `careSignalEvents` (`userId`, `createdAt`);
