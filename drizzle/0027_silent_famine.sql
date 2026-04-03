ALTER TABLE `certificates` MODIFY COLUMN `programType` enum('bls','acls','pals','fellowship','instructor') NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` MODIFY COLUMN `programType` enum('bls','acls','pals','fellowship','instructor') NOT NULL;--> statement-breakpoint
ALTER TABLE `enrollments` MODIFY COLUMN `programType` enum('bls','acls','pals','fellowship','instructor') NOT NULL;--> statement-breakpoint
ALTER TABLE `enrollments` ADD `courseId` int;--> statement-breakpoint
ALTER TABLE `users` ADD `instructorApprovedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `instructorNumber` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `instructorCertifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_instructorNumber_unique` UNIQUE(`instructorNumber`);