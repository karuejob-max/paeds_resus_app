CREATE TABLE IF NOT EXISTS `institutionalActionLogs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `institutionalAccountId` int NOT NULL,
  `createdByUserId` int,
  `gapIdentified` text NOT NULL,
  `systemChange` text NOT NULL,
  `status` enum('open','in_progress','completed') NOT NULL DEFAULT 'open',
  `careSignalEventId` int,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `institutionalActionLogs_id` PRIMARY KEY(`id`)
);
