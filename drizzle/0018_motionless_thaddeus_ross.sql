CREATE TABLE `hospitalImprovementMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hospitalId` int NOT NULL,
	`totalSubmissions` int DEFAULT 0,
	`avgArrivalToDoctorDelay` decimal(5,1),
	`avgDoctorToInterventionDelay` decimal(5,1),
	`communicationGapPercentage` decimal(5,1),
	`monitoringGapPercentage` decimal(5,1),
	`improvementTrend` enum('improving','stable','declining'),
	`lastAnalyzedAt` timestamp,
	`topImprovementAreas` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hospitalImprovementMetrics_id` PRIMARY KEY(`id`),
	CONSTRAINT `hospitalImprovementMetrics_hospitalId_unique` UNIQUE(`hospitalId`)
);
--> statement-breakpoint
CREATE TABLE `parentSafeTruthEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` int NOT NULL,
	`eventType` enum('arrival','symptoms','doctor-seen','intervention','oxygen','communication','fluids','concern-raised','monitoring','medication','referral-decision','referral-organized','transferred','update') NOT NULL,
	`eventTime` timestamp NOT NULL,
	`description` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `parentSafeTruthEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parentSafeTruthSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`hospitalId` int,
	`childName` varchar(255),
	`childAge` int,
	`childOutcome` enum('discharged','referred','passed-away') NOT NULL,
	`arrivalTime` timestamp NOT NULL,
	`dischargeOrReferralTime` timestamp,
	`totalDurationMinutes` int,
	`communicationGaps` int DEFAULT 0,
	`interventionDelays` int DEFAULT 0,
	`monitoringGaps` int DEFAULT 0,
	`delayAnalysis` text,
	`improvements` text,
	`isAnonymous` boolean DEFAULT true,
	`parentName` varchar(255),
	`parentEmail` varchar(255),
	`status` enum('draft','submitted','reviewed','archived') DEFAULT 'submitted',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parentSafeTruthSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemDelayAnalysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` int NOT NULL,
	`hospitalId` int NOT NULL,
	`arrivalToDoctorDelay` int,
	`doctorToInterventionDelay` int,
	`interventionToMonitoringDelay` int,
	`communicationDelay` int,
	`hasMonitoringGap` boolean DEFAULT false,
	`hasCommunicationGap` boolean DEFAULT false,
	`hasInterventionDelay` boolean DEFAULT false,
	`recommendations` text,
	`improvementAreas` text,
	`severityScore` decimal(3,1),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `systemDelayAnalysis_id` PRIMARY KEY(`id`)
);
