CREATE TABLE `assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`assessmentType` varchar(50) NOT NULL,
	`responses` text,
	`score` int,
	`recommendedCourses` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `impactMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`period` enum('daily','weekly','monthly') NOT NULL,
	`interventionsLogged` int DEFAULT 0,
	`outcomesLogged` int DEFAULT 0,
	`livesSaved` int DEFAULT 0,
	`coursesCompleted` int DEFAULT 0,
	`certificationsEarned` int DEFAULT 0,
	`referralsMade` int DEFAULT 0,
	`viralCoefficient` decimal(5,2) DEFAULT '0',
	`timestamp` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `impactMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interventions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`userId` int NOT NULL,
	`interventionType` varchar(100) NOT NULL,
	`description` text,
	`timestamp` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interventions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `outcomes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interventionId` int NOT NULL,
	`patientId` int NOT NULL,
	`outcome` enum('improved','stable','deteriorated','died') NOT NULL,
	`timeToOutcome` int,
	`notes` text,
	`timestamp` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `outcomes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patientVitals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`heartRate` int,
	`respiratoryRate` int,
	`systolicBP` int,
	`diastolicBP` int,
	`oxygenSaturation` int,
	`temperature` decimal(5,2),
	`symptoms` text,
	`timestamp` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `patientVitals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`hospitalId` int,
	`name` varchar(255) NOT NULL,
	`age` int,
	`gender` enum('male','female','other'),
	`diagnosis` varchar(255),
	`patientId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patients_id` PRIMARY KEY(`id`)
);
