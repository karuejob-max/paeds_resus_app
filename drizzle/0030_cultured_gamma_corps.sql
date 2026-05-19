CREATE TABLE `microCourseEnrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`microCourseId` int NOT NULL,
	`enrollmentStatus` enum('pending','active','completed','expired') DEFAULT 'pending',
	`paymentStatus` enum('pending','completed','free') DEFAULT 'pending',
	`paymentId` int,
	`progressPercentage` int DEFAULT 0,
	`quizScore` int,
	`certificateUrl` text,
	`certificateIssuedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `microCourseEnrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `microCourses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`level` enum('foundational','advanced') NOT NULL,
	`emergencyType` enum('respiratory','shock','seizure','toxicology','metabolic','infectious','burns','trauma') NOT NULL,
	`duration` int NOT NULL,
	`price` int NOT NULL,
	`prerequisiteId` varchar(64),
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `microCourses_id` PRIMARY KEY(`id`),
	CONSTRAINT `microCourses_courseId_unique` UNIQUE(`courseId`)
);
