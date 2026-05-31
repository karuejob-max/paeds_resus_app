CREATE TABLE IF NOT EXISTS `contentSafetyReports` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `courseId` varchar(64) NOT NULL,
  `moduleId` int,
  `message` text NOT NULL,
  `status` enum('open','reviewed','closed') NOT NULL DEFAULT 'open',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `contentSafetyReports_id` PRIMARY KEY(`id`)
);

CREATE INDEX `contentSafetyReports_status_createdAt` ON `contentSafetyReports` (`status`, `createdAt`);
