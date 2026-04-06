CREATE TABLE `careSignalEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`eventDate` timestamp NOT NULL,
	`childAge` int NOT NULL,
	`eventType` varchar(255) NOT NULL,
	`presentation` text NOT NULL,
	`isAnonymous` boolean NOT NULL DEFAULT false,
	`chainOfSurvival` text NOT NULL,
	`systemGaps` text NOT NULL,
	`gapDetails` text NOT NULL,
	`outcome` varchar(512) NOT NULL,
	`neurologicalStatus` varchar(512) NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'submitted',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `careSignalEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `certificateDownloadFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`certificateId` int NOT NULL,
	`rating` int NOT NULL,
	`improvements` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `certificateDownloadFeedback_id` PRIMARY KEY(`id`)
);
