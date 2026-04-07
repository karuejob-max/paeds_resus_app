CREATE TABLE `fellowshipGraceUsage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`year` int NOT NULL,
	`month` int NOT NULL,
	`reason` varchar(64) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fellowshipGraceUsage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fellowshipProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalCoursesRequired` int DEFAULT 26,
	`coursesCompleted` int DEFAULT 0,
	`coursesPercentage` int DEFAULT 0,
	`resusGPSCasesCompleted` int DEFAULT 0,
	`conditionsWithThreshold` int DEFAULT 0,
	`totalConditionsTaught` int DEFAULT 0,
	`resusGPSPercentage` int DEFAULT 0,
	`careSignalStreak` int DEFAULT 0,
	`careSignalEventsSubmitted` int DEFAULT 0,
	`careSignalPercentage` int DEFAULT 0,
	`isQualified` boolean DEFAULT false,
	`qualifiedAt` timestamp,
	`overallPercentage` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fellowshipProgress_id` PRIMARY KEY(`id`),
	CONSTRAINT `fellowshipProgress_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `fellowshipStreakResets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`year` int NOT NULL,
	`month` int NOT NULL,
	`reason` varchar(64) NOT NULL,
	`previousStreak` int NOT NULL,
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fellowshipStreakResets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resusGPSCases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`caseNumber` int NOT NULL,
	`diagnosis` varchar(255) NOT NULL,
	`abcdeCompleted` boolean DEFAULT false,
	`interventions` text,
	`reassessments` text,
	`outcome` varchar(64),
	`depthScore` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resusGPSCases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resusGPSSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`primaryDiagnosis` varchar(255) NOT NULL,
	`secondaryDiagnoses` text,
	`patientAgeMonths` int NOT NULL,
	`patientWeightKg` decimal(5,2),
	`isTrauma` boolean DEFAULT false,
	`isCardiacArrest` boolean DEFAULT false,
	`status` enum('ongoing','completed','abandoned') DEFAULT 'ongoing',
	`interventionCount` int DEFAULT 0,
	`reassessmentCount` int DEFAULT 0,
	`durationSeconds` int,
	`outcome` varchar(64),
	`depthScore` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resusGPSSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `resusGPSSessions_sessionId_unique` UNIQUE(`sessionId`)
);
