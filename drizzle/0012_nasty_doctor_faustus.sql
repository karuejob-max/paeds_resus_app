CREATE TABLE `emergencyProtocols` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('diarrhea','pneumonia','malaria','meningitis','shock') NOT NULL,
	`description` text,
	`ageMin` int,
	`ageMax` int,
	`severity` enum('mild','moderate','severe','critical'),
	`estimatedMortality` decimal(5,2),
	`keySymptoms` text,
	`redFlags` text,
	`diagnosticCriteria` text,
	`initialAssessment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emergencyProtocols_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `protocolAdherenceLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`providerId` int NOT NULL,
	`protocolId` int NOT NULL,
	`startTime` timestamp NOT NULL DEFAULT (now()),
	`endTime` timestamp,
	`status` enum('started','in_progress','completed','abandoned') DEFAULT 'started',
	`stepsCompleted` int DEFAULT 0,
	`totalSteps` int,
	`adherenceScore` decimal(5,2),
	`deviations` text,
	`outcome` enum('improved','stable','deteriorated','transferred','unknown'),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `protocolAdherenceLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `protocolDecisionPoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`protocolId` int NOT NULL,
	`stepId` int NOT NULL,
	`question` text NOT NULL,
	`yesAction` text,
	`noAction` text,
	`yesNextStep` int,
	`noNextStep` int,
	`vitalSignCriteria` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `protocolDecisionPoints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `protocolRecommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`providerId` int NOT NULL,
	`protocolId` int NOT NULL,
	`confidence` decimal(5,2),
	`matchingSymptoms` text,
	`matchingVitalSigns` text,
	`reasoning` text,
	`priority` enum('critical','high','medium','low') DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `protocolRecommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `protocolSteps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`protocolId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`action` text,
	`expectedOutcome` text,
	`timeframe` varchar(100),
	`vitalSignThreshold` text,
	`nextStepIfYes` int,
	`nextStepIfNo` int,
	`medications` text,
	`investigations` text,
	`warnings` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `protocolSteps_id` PRIMARY KEY(`id`)
);
