CREATE TABLE `guidelineChanges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guidelineId` int NOT NULL,
	`previousVersion` varchar(50),
	`newVersion` varchar(50) NOT NULL,
	`changeType` enum('major_revision','minor_update','clarification','new_evidence','withdrawn_recommendation') NOT NULL,
	`severity` enum('critical','high','moderate','low') NOT NULL,
	`changeDescription` text NOT NULL,
	`affectedProtocols` json,
	`clinicalImpact` text,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewStatus` enum('pending','under_review','implemented','not_applicable') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`implementationNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guidelineChanges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guidelines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization` enum('AHA','WHO','ACOG','ERC','ILCOR','AAP','RCOG','NICE') NOT NULL,
	`title` text NOT NULL,
	`version` varchar(50) NOT NULL,
	`publicationDate` date NOT NULL,
	`effectiveDate` date,
	`url` text,
	`documentHash` varchar(64),
	`status` enum('current','superseded','withdrawn') NOT NULL DEFAULT 'current',
	`category` enum('cardiac_arrest','respiratory','shock','trauma','toxicology','neonatal','obstetric','pediatric','general') NOT NULL,
	`summary` text,
	`keyChanges` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guidelines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `protocolGuidelines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`protocolId` varchar(100) NOT NULL,
	`protocolName` text NOT NULL,
	`guidelineId` int NOT NULL,
	`relevance` enum('primary','secondary','reference') NOT NULL DEFAULT 'primary',
	`specificSections` json,
	`lastReviewed` timestamp NOT NULL DEFAULT (now()),
	`reviewedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `protocolGuidelines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `protocolStatus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`protocolId` varchar(100) NOT NULL,
	`protocolName` text NOT NULL,
	`currentStatus` enum('current','outdated','under_review','flagged') NOT NULL DEFAULT 'current',
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	`lastReviewed` timestamp NOT NULL DEFAULT (now()),
	`nextReviewDue` date,
	`pendingChanges` int DEFAULT 0,
	`flagReason` text,
	`assignedTo` int,
	`priority` enum('urgent','high','normal','low') NOT NULL DEFAULT 'normal',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `protocolStatus_id` PRIMARY KEY(`id`),
	CONSTRAINT `protocolStatus_protocolId_unique` UNIQUE(`protocolId`)
);
