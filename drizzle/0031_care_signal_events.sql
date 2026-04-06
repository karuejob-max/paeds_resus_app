-- Care Signal — provider (and parent-observation) clinical event log
CREATE TABLE IF NOT EXISTS `careSignalEvents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL,
  `eventDate` timestamp NOT NULL,
  `childAge` int NOT NULL,
  `eventType` varchar(255) NOT NULL,
  `presentation` text NOT NULL,
  `isAnonymous` tinyint(1) NOT NULL DEFAULT '0',
  `chainOfSurvival` text NOT NULL,
  `systemGaps` text NOT NULL,
  `gapDetails` text NOT NULL,
  `outcome` varchar(512) NOT NULL,
  `neurologicalStatus` varchar(512) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'submitted',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `idx_careSignalEvents_userId` (`userId`),
  KEY `idx_careSignalEvents_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
