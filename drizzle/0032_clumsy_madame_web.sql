CREATE TABLE `promoCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`discountPercent` int DEFAULT 0,
	`maxUses` int,
	`usesCount` int DEFAULT 0,
	`expiresAt` timestamp,
	`createdBy` int NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promoCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `promoCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `microCourseEnrollments` ADD `paymentMethod` enum('m-pesa','admin-free','promo-code');--> statement-breakpoint
ALTER TABLE `microCourseEnrollments` ADD `promoCodeId` int;--> statement-breakpoint
ALTER TABLE `microCourseEnrollments` ADD `amountPaid` int;--> statement-breakpoint
ALTER TABLE `microCourseEnrollments` ADD `transactionId` varchar(255);