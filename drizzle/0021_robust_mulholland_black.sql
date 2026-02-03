ALTER TABLE `cprSessions` MODIFY COLUMN `patientId` int;--> statement-breakpoint
ALTER TABLE `cprSessions` MODIFY COLUMN `providerId` int;--> statement-breakpoint
ALTER TABLE `cprSessions` ADD `sessionCode` varchar(8);--> statement-breakpoint
ALTER TABLE `cprSessions` ADD `patientWeight` decimal(5,2);--> statement-breakpoint
ALTER TABLE `cprSessions` ADD `patientAgeMonths` int;--> statement-breakpoint
ALTER TABLE `cprSessions` ADD `createdBy` int;--> statement-breakpoint
ALTER TABLE `cprSessions` ADD CONSTRAINT `cprSessions_sessionCode_unique` UNIQUE(`sessionCode`);