CREATE TABLE `webhookRetryQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`webhookType` varchar(50) NOT NULL,
	`payload` json NOT NULL,
	`checkoutRequestID` varchar(255),
	`retryCount` int DEFAULT 0,
	`maxRetries` int DEFAULT 5,
	`nextRetryAt` timestamp,
	`lastError` text,
	`status` enum('pending','processing','completed','dead_letter') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhookRetryQueue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `certificates` ADD `renewalReminderSentAt` timestamp;--> statement-breakpoint
ALTER TABLE `clinicalReferrals` ADD `facilityContactEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `institutionalStaffMembers` ADD `institutionalRole` enum('director','coordinator','finance_officer','department_head','staff_member') DEFAULT 'staff_member';--> statement-breakpoint
ALTER TABLE `payments` ADD `idempotencyKey` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `institutionalRole` enum('director','coordinator','finance_officer','department_head','staff_member');--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_idempotencyKey_unique` UNIQUE(`idempotencyKey`);