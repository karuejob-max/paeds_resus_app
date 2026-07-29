CREATE TABLE `cpdCodeRevealLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cneAttendeeId` int NOT NULL,
	`cneEventId` int NOT NULL,
	`revealedAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	`userAgent` varchar(512),
	CONSTRAINT `cpdCodeRevealLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `institutionalAccountAdmins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`institutionalAccountId` int NOT NULL,
	`userId` int NOT NULL,
	`addedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `institutionalAccountAdmins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `institutionalAdminInvites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`institutionalAccountId` int NOT NULL,
	`invitedEmail` varchar(320) NOT NULL,
	`invitedName` varchar(255),
	`invitedPhone` varchar(20),
	`invitedByUserId` int,
	`source` enum('registration','admin_invite','recovery_approval') NOT NULL,
	`status` enum('pending','accepted','revoked') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	CONSTRAINT `institutionalAdminInvites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `institutionalRecoveryRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyNameClaimed` varchar(255) NOT NULL,
	`claimedRegistrationNumber` varchar(255),
	`requesterName` varchar(255) NOT NULL,
	`requesterEmail` varchar(320) NOT NULL,
	`requesterPhone` varchar(20),
	`requesterRoleClaim` varchar(255),
	`letterheadUrl` text NOT NULL,
	`notes` text,
	`status` enum('pending','approved','rejected') DEFAULT 'pending',
	`matchedInstitutionalAccountId` int,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `institutionalRecoveryRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `instructorMentorshipGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mentorshipId` int NOT NULL,
	`institutionalAccountId` int,
	`programType` enum('bls','acls','pals','fellowship','instructor','fellowship_diploma','heartsaver','nrp') NOT NULL,
	`confirmedByUserId` int NOT NULL,
	`notes` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `instructorMentorshipGroups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `instructorMentorships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`menteeUserId` int NOT NULL,
	`mentorUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `instructorMentorships_id` PRIMARY KEY(`id`),
	CONSTRAINT `instructorMentorships_menteeUserId_unique` UNIQUE(`menteeUserId`)
);
--> statement-breakpoint
CREATE TABLE `instructorQualifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`programType` enum('bls','acls','pals','fellowship','instructor','fellowship_diploma','heartsaver','nrp') NOT NULL,
	`qualifiedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `instructorQualifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `phase3CrossFacilityApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`staffMemberId` int NOT NULL,
	`scheduleId` int NOT NULL,
	`approvedByUserId` int NOT NULL,
	`notes` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `phase3CrossFacilityApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `featureFlags` MODIFY COLUMN `targetUserType` enum('all','admin','individual','institutional') DEFAULT 'all';--> statement-breakpoint
ALTER TABLE `institutionalStaffMembers` MODIFY COLUMN `designation` enum('noi','coi_bsc','coi_diploma','moi','permanent_nurse','permanent_doctor','other') DEFAULT 'other';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `userType` enum('individual','institutional') DEFAULT 'individual';--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `redacted_narrative` text;--> statement-breakpoint
ALTER TABLE `cneEvents` ADD `cpdCode` varchar(128);--> statement-breakpoint
ALTER TABLE `fellowshipTokens` ADD `recoveryCodeLookupHash` varchar(64);--> statement-breakpoint
ALTER TABLE `institutionalAccounts` ADD `registrationNumber` varchar(255);--> statement-breakpoint
ALTER TABLE `providerProfiles` ADD `facilityAdminLevel2` varchar(128);--> statement-breakpoint
ALTER TABLE `safeTruthSubmissions` ADD `event_code_resolved_care_signal_event_id` int;--> statement-breakpoint
ALTER TABLE `users` ADD `instructorTier` enum('provisional','qualified','lead_instructor');