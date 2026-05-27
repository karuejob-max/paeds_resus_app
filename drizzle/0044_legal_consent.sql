-- Migration 0044: Legal consent, DSAR, document versions
ALTER TABLE `users` ADD COLUMN `termsAcceptedAt` timestamp NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `termsVersion` varchar(16) NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `privacyAcceptedAt` timestamp NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `privacyVersion` varchar(16) NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `careSignalConsentAt` timestamp NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `careSignalConsentVersion` varchar(16) NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `institutionalB2bAcceptedAt` timestamp NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `institutionalB2bVersion` varchar(16) NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `resusGpsAckAt` timestamp NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `resusGpsAckVersion` varchar(16) NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `safeTruthGuardianAckAt` timestamp NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `safeTruthGuardianAckVersion` varchar(16) NULL;
--> statement-breakpoint
CREATE TABLE `legalDocumentVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentKey` varchar(64) NOT NULL,
	`version` varchar(16) NOT NULL,
	`effectiveAt` timestamp NOT NULL,
	`summary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `legalDocumentVersions_id` PRIMARY KEY(`id`),
	CONSTRAINT `legalDocumentVersions_documentKey_unique` UNIQUE(`documentKey`)
);
--> statement-breakpoint
CREATE TABLE `legalDataRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`requesterEmail` varchar(320) NOT NULL,
	`requesterName` varchar(255),
	`requestType` enum('access','correction','deletion','objection','portability') NOT NULL,
	`details` text,
	`status` enum('received','in_progress','completed','rejected') NOT NULL DEFAULT 'received',
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `legalDataRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userConsentEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`consentType` varchar(64) NOT NULL,
	`documentVersion` varchar(16),
	`ipAddress` varchar(64),
	`userAgent` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userConsentEvents_id` PRIMARY KEY(`id`)
);
