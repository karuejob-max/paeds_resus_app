CREATE TABLE `investigationAnalysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`investigationId` int NOT NULL,
	`aiInterpretation` text,
	`confidence` decimal(5,2) DEFAULT '0',
	`differentialDiagnoses` text,
	`recommendations` text,
	`clinicalSignificance` text,
	`followUpSuggestions` text,
	`analyzedAt` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `investigationAnalysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investigationHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`providerId` int NOT NULL,
	`testName` varchar(255) NOT NULL,
	`result` text,
	`interpretation` text,
	`date` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `investigationHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investigationResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`investigationId` int NOT NULL,
	`resultType` enum('numeric','text','image','other') NOT NULL,
	`resultName` varchar(255) NOT NULL,
	`resultValue` text,
	`unit` varchar(100),
	`normalRange` varchar(255),
	`isAbnormal` boolean DEFAULT false,
	`severity` enum('normal','mild','moderate','severe') DEFAULT 'normal',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `investigationResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investigationTrends` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`testName` varchar(255) NOT NULL,
	`trend` enum('improving','stable','deteriorating') NOT NULL,
	`changePercent` decimal(8,2),
	`daysAnalyzed` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `investigationTrends_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investigations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`providerId` int NOT NULL,
	`investigationType` enum('lab','imaging','other') NOT NULL,
	`testName` varchar(255) NOT NULL,
	`description` text,
	`uploadedAt` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `investigations_id` PRIMARY KEY(`id`)
);
