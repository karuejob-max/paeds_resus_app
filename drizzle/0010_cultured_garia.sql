CREATE TABLE `interventionLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`userId` int NOT NULL,
	`interventionType` enum('medication','procedure','monitoring','referral','other') NOT NULL,
	`interventionName` varchar(255) NOT NULL,
	`dosage` varchar(100),
	`route` varchar(100),
	`indication` text,
	`outcome` varchar(255),
	`notes` text,
	`performedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interventionLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referenceRanges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ageMin` int,
	`ageMax` int,
	`weightMin` decimal(6,2),
	`weightMax` decimal(6,2),
	`heartRateMin` int,
	`heartRateMax` int,
	`respiratoryRateMin` int,
	`respiratoryRateMax` int,
	`systolicBPMin` int,
	`systolicBPMax` int,
	`diastolicBPMin` int,
	`diastolicBPMax` int,
	`oxygenSaturationMin` int,
	`temperatureMin` decimal(5,2),
	`temperatureMax` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referenceRanges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `riskScoreHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`vitalSignsHistoryId` int NOT NULL,
	`riskScore` int,
	`riskLevel` enum('CRITICAL','HIGH','MEDIUM','LOW') NOT NULL,
	`riskFactors` text,
	`deteriorationPattern` varchar(100),
	`timeToDeterioration` int,
	`recommendations` text,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `riskScoreHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vitalSignsHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`userId` int NOT NULL,
	`heartRate` int,
	`respiratoryRate` int,
	`systolicBP` int,
	`diastolicBP` int,
	`oxygenSaturation` int,
	`temperature` decimal(5,2),
	`weight` decimal(6,2),
	`height` decimal(6,2),
	`age` int,
	`ageMonths` int,
	`riskScore` int,
	`riskLevel` enum('CRITICAL','HIGH','MEDIUM','LOW') NOT NULL,
	`symptoms` text,
	`notes` text,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vitalSignsHistory_id` PRIMARY KEY(`id`)
);
