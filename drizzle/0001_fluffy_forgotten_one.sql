CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollmentId` int NOT NULL,
	`userId` int NOT NULL,
	`certificateNumber` varchar(255),
	`programType` enum('bls','acls','pals','fellowship') NOT NULL,
	`issueDate` timestamp NOT NULL,
	`expiryDate` timestamp,
	`certificateUrl` text,
	`verificationCode` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `certificates_certificateNumber_unique` UNIQUE(`certificateNumber`),
	CONSTRAINT `certificates_verificationCode_unique` UNIQUE(`verificationCode`)
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`programType` enum('bls','acls','pals','fellowship') NOT NULL,
	`trainingDate` timestamp NOT NULL,
	`paymentStatus` enum('pending','partial','completed') DEFAULT 'pending',
	`amountPaid` int DEFAULT 0,
	`ahaPrecourseCompleted` boolean DEFAULT false,
	`ahaCertificateUrl` text,
	`certificateVerified` boolean DEFAULT false,
	`reminderSent` boolean DEFAULT false,
	`reminderSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `institutionalAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`industry` varchar(255),
	`staffCount` int,
	`contactName` varchar(255) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(20),
	`status` enum('prospect','active','inactive') DEFAULT 'prospect',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `institutionalAccounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `institutionalInquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`staffCount` int NOT NULL,
	`specificNeeds` text,
	`contactName` varchar(255) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(20),
	`status` enum('new','contacted','qualified','converted','rejected') DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `institutionalInquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learnerProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enrollmentId` int NOT NULL,
	`progressPercentage` int DEFAULT 0,
	`modulesCompleted` int DEFAULT 0,
	`totalModules` int DEFAULT 0,
	`badges` text,
	`leaderboardRank` int,
	`lastActivityAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learnerProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollmentId` int NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`paymentMethod` enum('mpesa','bank_transfer','card') NOT NULL,
	`transactionId` varchar(255),
	`status` enum('pending','completed','failed') DEFAULT 'pending',
	`smsConfirmationSent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platformSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(255) NOT NULL,
	`settingValue` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platformSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `platformSettings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
CREATE TABLE `smsReminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enrollmentId` int NOT NULL,
	`userId` int NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`reminderType` enum('enrollment_confirmation','payment_reminder','training_reminder','post_training') NOT NULL,
	`status` enum('pending','sent','failed') DEFAULT 'pending',
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `smsReminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `providerType` enum('nurse','doctor','pharmacist','paramedic','lab_tech','respiratory_therapist','midwife','other');--> statement-breakpoint
ALTER TABLE `users` ADD `userType` enum('individual','institutional','parent') DEFAULT 'individual';