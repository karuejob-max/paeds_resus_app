CREATE TABLE IF NOT EXISTS `platformFeedbackTickets` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `category` enum('course_content','resus_gps','care_signal','payment_technical','safety_concern','other') NOT NULL,
  `subject` varchar(255),
  `message` text NOT NULL,
  `contextJson` json,
  `status` enum('open','in_progress','resolved','wont_fix') NOT NULL DEFAULT 'open',
  `priority` enum('normal','safety') NOT NULL DEFAULT 'normal',
  `adminResponse` text,
  `respondedAt` timestamp NULL,
  `respondedBy` int NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `platformFeedbackTickets_id` PRIMARY KEY(`id`)
);

CREATE INDEX `platformFeedbackTickets_status_category` ON `platformFeedbackTickets` (`status`, `category`);
CREATE INDEX `platformFeedbackTickets_priority_createdAt` ON `platformFeedbackTickets` (`priority`, `createdAt`);
CREATE INDEX `platformFeedbackTickets_userId` ON `platformFeedbackTickets` (`userId`);
