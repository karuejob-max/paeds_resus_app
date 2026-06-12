-- Migration 0051: feedback ticket severity, issue type, agent workflow, duplicate status
-- Apply: pnpm run db:apply-0051

ALTER TABLE `platformFeedbackTickets`
  MODIFY `status` enum('open','in_progress','resolved','wont_fix','duplicate') NOT NULL DEFAULT 'open';

ALTER TABLE `platformFeedbackTickets`
  ADD COLUMN `severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium' AFTER `priority`;

ALTER TABLE `platformFeedbackTickets`
  ADD COLUMN `issueType` enum('bug','content','ux','billing','clinical','other') NULL AFTER `category`;

ALTER TABLE `platformFeedbackTickets`
  ADD COLUMN `assignedAgent` varchar(64) NULL AFTER `respondedBy`;

ALTER TABLE `platformFeedbackTickets`
  ADD COLUMN `agentTags` json NULL AFTER `assignedAgent`;

ALTER TABLE `platformFeedbackTickets`
  ADD COLUMN `statusHistoryJson` json NULL AFTER `agentTags`;

ALTER TABLE `platformFeedbackTickets`
  ADD COLUMN `duplicateOfTicketId` int NULL AFTER `statusHistoryJson`;

CREATE INDEX `platformFeedbackTickets_severity_status` ON `platformFeedbackTickets` (`severity`, `status`);
CREATE INDEX `platformFeedbackTickets_issueType` ON `platformFeedbackTickets` (`issueType`);
