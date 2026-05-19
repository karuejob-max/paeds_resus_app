CREATE TABLE `capstoneSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enrollmentId` int NOT NULL,
	`courseId` varchar(255) NOT NULL,
	`caseResponse` text NOT NULL,
	`status` enum('pending','under_review','graded','passed','failed') NOT NULL DEFAULT 'pending',
	`score` int,
	`instructorId` int,
	`instructorFeedback` text,
	`gradedAt` timestamp,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `capstoneSubmissions_id` PRIMARY KEY(`id`)
);
