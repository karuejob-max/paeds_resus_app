CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementType` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(255),
	`earnedAt` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leaderboardRankings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` varchar(255) NOT NULL,
	`rank` int NOT NULL,
	`score` decimal(10,2) NOT NULL,
	`percentile` decimal(5,2) DEFAULT '0',
	`previousRank` int,
	`rankChange` int DEFAULT 0,
	`lastUpdated` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leaderboardRankings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performanceEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` varchar(255) NOT NULL,
	`eventData` text,
	`severity` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performanceEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performanceHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`metricType` varchar(255) NOT NULL,
	`value` decimal(10,2) NOT NULL,
	`recordedAt` timestamp DEFAULT (now()),
	CONSTRAINT `performanceHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `providerStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalPatientsServed` int DEFAULT 0,
	`totalInterventions` int DEFAULT 0,
	`averageResponseTime` decimal(10,2) DEFAULT '0',
	`successRate` decimal(5,2) DEFAULT '0',
	`patientsImproved` int DEFAULT 0,
	`certificationsCompleted` int DEFAULT 0,
	`trainingHoursCompleted` int DEFAULT 0,
	`performanceScore` decimal(5,2) DEFAULT '0',
	`lastUpdated` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `providerStats_id` PRIMARY KEY(`id`),
	CONSTRAINT `providerStats_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `teamPerformance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`institutionalAccountId` int NOT NULL,
	`teamName` varchar(255),
	`totalStaffCount` int DEFAULT 0,
	`averagePerformanceScore` decimal(5,2) DEFAULT '0',
	`totalPatientsServed` int DEFAULT 0,
	`totalInterventions` int DEFAULT 0,
	`teamRank` int,
	`lastUpdated` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teamPerformance_id` PRIMARY KEY(`id`),
	CONSTRAINT `teamPerformance_institutionalAccountId_unique` UNIQUE(`institutionalAccountId`)
);
