CREATE TABLE `conditionSymptomMapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conditionId` int NOT NULL,
	`symptomId` int NOT NULL,
	`frequency` enum('always','often','sometimes','rare') DEFAULT 'often',
	`importance` int DEFAULT 50,
	CONSTRAINT `conditionSymptomMapping_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diagnosisAccuracy` (
	`id` int AUTO_INCREMENT NOT NULL,
	`providerId` varchar(255) NOT NULL,
	`conditionId` int NOT NULL,
	`totalDiagnoses` int DEFAULT 0,
	`correctDiagnoses` int DEFAULT 0,
	`accuracy` decimal(5,2) DEFAULT 0,
	`averageConfidence` decimal(5,2) DEFAULT 0,
	`period` enum('all_time','monthly','quarterly') DEFAULT 'all_time',
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `diagnosisAccuracy_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diagnosisHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`providerId` varchar(255) NOT NULL,
	`symptoms` text,
	`vitalSigns` text,
	`suggestedConditions` text,
	`selectedCondition` int,
	`selectedConditionName` varchar(255),
	`confidence` decimal(5,2),
	`aiExplanation` text,
	`providerNotes` text,
	`outcome` enum('confirmed','ruled_out','pending','unknown') DEFAULT 'pending',
	`outcomeCondition` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `diagnosisHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `differentialDiagnosisScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`diagnosisHistoryId` int NOT NULL,
	`conditionId` int NOT NULL,
	`conditionName` varchar(255),
	`score` decimal(5,2) NOT NULL,
	`matchedSymptoms` int DEFAULT 0,
	`totalSymptoms` int DEFAULT 0,
	`vitalSignMatch` decimal(5,2) DEFAULT 0,
	`reasoning` text,
	`rank` int,
	CONSTRAINT `differentialDiagnosisScores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicalConditions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`icdCode` varchar(20),
	`category` enum('infectious','nutritional','metabolic','cardiovascular','respiratory','gastrointestinal','neurological','endocrine','hematologic','other') NOT NULL,
	`severity` enum('mild','moderate','severe','critical') DEFAULT 'moderate',
	`prevalence` varchar(50),
	`ageGroupsAffected` text,
	`commonSymptoms` text,
	`criticalVitalSigns` text,
	`treatmentApproach` text,
	`emergencyActions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medicalConditions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `symptoms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('fever','cough','diarrhea','vomiting','rash','lethargy','seizure','difficulty_breathing','abdominal_pain','other') NOT NULL,
	`severity` enum('mild','moderate','severe') DEFAULT 'mild',
	`duration` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `symptoms_id` PRIMARY KEY(`id`)
);
