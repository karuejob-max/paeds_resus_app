CREATE TABLE `accreditationApplications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`facilityId` int NOT NULL,
	`facilityName` varchar(255) NOT NULL,
	`contactPerson` varchar(255) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(20) NOT NULL,
	`applicationDate` timestamp NOT NULL DEFAULT (now()),
	`status` enum('submitted','under_review','approved','rejected','accredited','revoked') DEFAULT 'submitted',
	`reviewerNotes` text,
	`facilityScore` decimal(5,2),
	`badgeAwarded` boolean DEFAULT false,
	`badgeAwardedDate` timestamp,
	`accreditationExpiryDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accreditationApplications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accreditedFacilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`facilityId` int NOT NULL,
	`facilityName` varchar(255) NOT NULL,
	`location` varchar(255),
	`county` varchar(255),
	`contactPhone` varchar(20),
	`contactEmail` varchar(320),
	`pCOSCARate` decimal(5,2),
	`accreditationDate` timestamp NOT NULL,
	`expiryDate` timestamp,
	`badgeUrl` text,
	`publicProfile` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accreditedFacilities_id` PRIMARY KEY(`id`),
	CONSTRAINT `accreditedFacilities_facilityId_unique` UNIQUE(`facilityId`)
);
--> statement-breakpoint
CREATE TABLE `chainOfSurvivalCheckpoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`recognitionCompleted` boolean DEFAULT false,
	`recognitionNotes` text,
	`activationCompleted` boolean DEFAULT false,
	`activationNotes` text,
	`cprCompleted` boolean DEFAULT false,
	`cprQuality` enum('excellent','good','adequate','poor','not_performed'),
	`cprNotes` text,
	`defibrillationCompleted` boolean DEFAULT false,
	`defibrillationNotes` text,
	`advancedCareCompleted` boolean DEFAULT false,
	`advancedCareDetails` text,
	`postResuscitationCompleted` boolean DEFAULT false,
	`postResuscitationNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chainOfSurvivalCheckpoints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `eventOutcomes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`outcome` enum('pCOSCA','ROSC_with_disability','ROSC_unknown','mortality','ongoing_resuscitation') NOT NULL,
	`neurologicalStatus` enum('intact','mild_impairment','moderate_impairment','severe_impairment','unknown'),
	`timeToROSC` int,
	`hospitalStayDays` int,
	`dischargeDiagnosis` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `eventOutcomes_id` PRIMARY KEY(`id`),
	CONSTRAINT `eventOutcomes_eventId_unique` UNIQUE(`eventId`)
);
--> statement-breakpoint
CREATE TABLE `facilityScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`facilityId` int NOT NULL,
	`facilityName` varchar(255) NOT NULL,
	`pCOSCARate` decimal(5,2) DEFAULT 0,
	`totalEventsReported` int DEFAULT 0,
	`systemGapRemediationSpeed` int DEFAULT 0,
	`staffEngagementScore` decimal(5,2) DEFAULT 0,
	`eventReportingFrequency` int DEFAULT 0,
	`insightAdoptionRate` decimal(5,2) DEFAULT 0,
	`overallScore` decimal(5,2) DEFAULT 0,
	`scoreVisibility` enum('hidden','visible_to_facility','public') DEFAULT 'hidden',
	`lastUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `facilityScores_id` PRIMARY KEY(`id`),
	CONSTRAINT `facilityScores_facilityId_unique` UNIQUE(`facilityId`)
);
--> statement-breakpoint
CREATE TABLE `safetruthEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`facilityId` int,
	`facilityName` varchar(255),
	`eventDate` timestamp NOT NULL,
	`childAge` int,
	`childAgeGroup` enum('newborn_0_3m','infant_3_12m','toddler_1_3y','preschool_3_5y','school_5_12y','adolescent_12_18y'),
	`eventType` enum('cardiac_arrest','respiratory_failure','severe_sepsis','trauma','drowning','choking','other') NOT NULL,
	`initialPresentation` text,
	`isAnonymous` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `safetruthEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemGaps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`gapCategory` enum('knowledge_gap','resources_gap','leadership_gap','communication_gap','protocol_gap','equipment_gap','training_gap','staffing_gap','infrastructure_gap','other') NOT NULL,
	`severity` enum('low','medium','high','critical') DEFAULT 'medium',
	`description` text NOT NULL,
	`impact` text,
	`remediationStatus` enum('identified','in_progress','resolved','not_applicable') DEFAULT 'identified',
	`remediationDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `systemGaps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userInsights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`insightType` enum('performance_metric','peer_comparison','gap_recommendation','improvement_suggestion','milestone_achievement','alert') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`actionable` boolean DEFAULT true,
	`actionUrl` text,
	`priority` enum('low','medium','high') DEFAULT 'medium',
	`isRead` boolean DEFAULT false,
	`readAt` timestamp,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userInsights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`primaryRole` enum('clinician','nurse','paramedic','facility_manager','parent_caregiver','government','insurance','other'),
	`workstation` enum('emergency_department','icu','ward','clinic','home','other'),
	`facilityId` int,
	`facilityName` varchar(255),
	`yearsOfExperience` int,
	`specialization` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `userProfiles_userId_unique` UNIQUE(`userId`)
);
