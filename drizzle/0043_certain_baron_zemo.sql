CREATE TABLE `adminAlertDispatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleKey` varchar(64) NOT NULL,
	`channel` enum('email','sms') NOT NULL DEFAULT 'email',
	`recipient` varchar(320) NOT NULL,
	`subject` varchar(255),
	`bodySnippet` text,
	`metricValue` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adminAlertDispatches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ahaPracticeLabAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enrollmentId` int NOT NULL,
	`programType` enum('bls','acls','pals','heartsaver','nrp') NOT NULL,
	`trackId` varchar(64) NOT NULL,
	`scenarioId` varchar(64) NOT NULL,
	`score` int NOT NULL,
	`passed` boolean NOT NULL DEFAULT false,
	`eventLog` json,
	`isBooster` boolean NOT NULL DEFAULT false,
	`durationSeconds` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ahaPracticeLabAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `careFacilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`county` varchar(128),
	`country` varchar(128) NOT NULL DEFAULT 'Kenya',
	`subCounty` varchar(128),
	`facilityType` enum('primary_health_center','health_post','district_hospital','private_clinic','ngo_clinic','other'),
	`mergedIntoId` int,
	`institutionalAccountId` int,
	`isSystem` boolean NOT NULL DEFAULT false,
	`systemSlug` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `careFacilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `careSignalReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analyticsEventId` int NOT NULL,
	`reporterUserId` int NOT NULL,
	`reviewerUserId` int NOT NULL,
	`interventionName` varchar(128) NOT NULL,
	`responseText` text NOT NULL,
	`actionTaken` varchar(64) NOT NULL DEFAULT 'acknowledged',
	`expectedResolutionDate` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `careSignalReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentSafetyReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` varchar(64) NOT NULL,
	`moduleId` int,
	`message` text NOT NULL,
	`status` enum('open','reviewed','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contentSafetyReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inAppNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(64) NOT NULL,
	`title` varchar(256) NOT NULL,
	`body` text NOT NULL,
	`actionUrl` varchar(512),
	`relatedId` int,
	`read` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inAppNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `institutionalActionLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`institutionalAccountId` int NOT NULL,
	`createdByUserId` int,
	`gapIdentified` text NOT NULL,
	`systemChange` text NOT NULL,
	`status` enum('open','in_progress','completed') NOT NULL DEFAULT 'open',
	`careSignalEventId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `institutionalActionLogs_id` PRIMARY KEY(`id`)
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
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `legalDataRequests_id` PRIMARY KEY(`id`)
);
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
CREATE TABLE `moduleSections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moduleId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text,
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `moduleSections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mpesaWebhookLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`callbackType` enum('stk','stk_timeout','stk_query','c2b_validation','c2b_confirmation') NOT NULL,
	`checkoutRequestId` varchar(255),
	`resultCode` int,
	`resultDesc` varchar(512),
	`httpStatus` int NOT NULL,
	`outcome` enum('received','signature_rejected','invalid_payload','duplicate_idempotency','payment_not_found','payment_completed','payment_failed','already_finalized','persist_error','acknowledged','error') NOT NULL,
	`paymentId` int,
	`enrollmentId` int,
	`amountCents` int,
	`mpesaReceiptNumber` varchar(64),
	`errorMessage` text,
	`payloadSnippet` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mpesaWebhookLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platformFeedbackTickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` enum('course_content','resus_gps','care_signal','payment_technical','safety_concern','other') NOT NULL,
	`subject` varchar(255),
	`message` text NOT NULL,
	`contextJson` json,
	`status` enum('open','in_progress','resolved','wont_fix') NOT NULL DEFAULT 'open',
	`priority` enum('normal','safety') NOT NULL DEFAULT 'normal',
	`adminResponse` text,
	`respondedAt` timestamp,
	`respondedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platformFeedbackTickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `providerSampleHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`signs` text,
	`allergies` text,
	`medications` text,
	`pastHistory` text,
	`lastMeal` text,
	`events` text,
	`caseWeight` decimal(5,1),
	`caseAge` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `providerSampleHistory_id` PRIMARY KEY(`id`),
	CONSTRAINT `providerSampleHistory_userId_unique` UNIQUE(`userId`)
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
--> statement-breakpoint
ALTER TABLE `certificates` MODIFY COLUMN `programType` enum('bls','acls','pals','fellowship','instructor','fellowship_diploma','heartsaver','nrp','bls_cognitive','acls_cognitive','pals_cognitive','heartsaver_cognitive','nrp_cognitive') NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` MODIFY COLUMN `programType` enum('bls','acls','pals','fellowship','instructor','fellowship_diploma','heartsaver','nrp') NOT NULL;--> statement-breakpoint
ALTER TABLE `enrollments` MODIFY COLUMN `programType` enum('bls','acls','pals','fellowship','instructor','fellowship_diploma','heartsaver','nrp') NOT NULL;--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `facilityId` int;--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `reviewerId` int;--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `eligibleForFellowship` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `submissionVersion` varchar(16) DEFAULT 'v1' NOT NULL;--> statement-breakpoint
ALTER TABLE `certificates` ADD `microCourseEnrollmentId` int;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `cognitiveModulesComplete` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `practicalSkillsSignedOff` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `practicalSignedOffAt` timestamp;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `practicalSignedOffByUserId` int;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `practicalSignedOffByName` varchar(255);--> statement-breakpoint
ALTER TABLE `parentSafeTruthSubmissions` ADD `symptomOnsetDate` varchar(20);--> statement-breakpoint
ALTER TABLE `parentSafeTruthSubmissions` ADD `decisionDelayBand` varchar(50);--> statement-breakpoint
ALTER TABLE `parentSafeTruthSubmissions` ADD `decisionDelayReasons` text;--> statement-breakpoint
ALTER TABLE `parentSafeTruthSubmissions` ADD `transportMode` varchar(50);--> statement-breakpoint
ALTER TABLE `parentSafeTruthSubmissions` ADD `transportDurationBand` varchar(50);--> statement-breakpoint
ALTER TABLE `parentSafeTruthSubmissions` ADD `ambulanceCalled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `parentSafeTruthSubmissions` ADD `ambulanceWaitBand` varchar(50);--> statement-breakpoint
ALTER TABLE `parentSafeTruthSubmissions` ADD `priorFacilityVisit` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `parentSafeTruthSubmissions` ADD `priorFacilityChain` text;--> statement-breakpoint
ALTER TABLE `parentSafeTruthSubmissions` ADD `referralReason` varchar(100);--> statement-breakpoint
ALTER TABLE `parentSafeTruthSubmissions` ADD `preHospitalDelayMinutes` int;--> statement-breakpoint
ALTER TABLE `providerProfiles` ADD `facilityId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `termsAcceptedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `termsVersion` varchar(16);--> statement-breakpoint
ALTER TABLE `users` ADD `privacyAcceptedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `privacyVersion` varchar(16);--> statement-breakpoint
ALTER TABLE `users` ADD `careSignalConsentAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `careSignalConsentVersion` varchar(16);--> statement-breakpoint
ALTER TABLE `users` ADD `institutionalB2bAcceptedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `institutionalB2bVersion` varchar(16);--> statement-breakpoint
ALTER TABLE `users` ADD `resusGpsAckAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `resusGpsAckVersion` varchar(16);--> statement-breakpoint
ALTER TABLE `users` ADD `safeTruthGuardianAckAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `safeTruthGuardianAckVersion` varchar(16);