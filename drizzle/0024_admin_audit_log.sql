-- Phase 3 security baseline: admin audit log
CREATE TABLE IF NOT EXISTS `adminAuditLog` (
  `id` int AUTO_INCREMENT NOT NULL,
  `adminUserId` int NOT NULL,
  `procedurePath` varchar(255) NOT NULL,
  `inputSummary` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `adminAuditLog_id` PRIMARY KEY(`id`)
);
