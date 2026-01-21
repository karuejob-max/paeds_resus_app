CREATE TABLE `analyticsEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`eventType` varchar(255) NOT NULL,
	`eventName` varchar(255) NOT NULL,
	`pageUrl` text,
	`eventData` text,
	`sessionId` varchar(255),
	`duration` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyticsEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversionFunnelEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(255) NOT NULL,
	`funnelName` varchar(255) NOT NULL,
	`step` int NOT NULL,
	`stepName` varchar(255) NOT NULL,
	`completedAt` timestamp,
	`droppedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversionFunnelEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `errorTracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`errorType` varchar(255) NOT NULL,
	`errorMessage` text,
	`stackTrace` text,
	`endpoint` varchar(255),
	`statusCode` int,
	`severity` enum('low','medium','high','critical') DEFAULT 'medium',
	`status` enum('new','acknowledged','investigating','resolved') DEFAULT 'new',
	`occurrenceCount` int DEFAULT 1,
	`lastOccurredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `errorTracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `experimentAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experimentId` int NOT NULL,
	`userId` int NOT NULL,
	`variant` varchar(255) NOT NULL,
	`conversionValue` decimal(10,2),
	`convertedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `experimentAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `experiments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`experimentName` varchar(255) NOT NULL,
	`description` text,
	`status` enum('draft','running','paused','completed','archived') DEFAULT 'draft',
	`variant` enum('control','treatment_a','treatment_b','treatment_c') NOT NULL,
	`trafficPercentage` int DEFAULT 50,
	`metric` varchar(255),
	`targetValue` decimal(10,2),
	`startDate` timestamp,
	`endDate` timestamp,
	`winner` varchar(255),
	`statisticalSignificance` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `experiments_id` PRIMARY KEY(`id`),
	CONSTRAINT `experiments_experimentName_unique` UNIQUE(`experimentName`)
);
--> statement-breakpoint
CREATE TABLE `featureFlags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`flagName` varchar(255) NOT NULL,
	`description` text,
	`isEnabled` boolean DEFAULT false,
	`rolloutPercentage` int DEFAULT 0,
	`targetUserType` enum('all','admin','individual','institutional','parent') DEFAULT 'all',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `featureFlags_id` PRIMARY KEY(`id`),
	CONSTRAINT `featureFlags_flagName_unique` UNIQUE(`flagName`)
);
--> statement-breakpoint
CREATE TABLE `npsSurveyResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`score` int NOT NULL,
	`category` enum('promoter','passive','detractor'),
	`feedback` text,
	`followUpEmail` varchar(320),
	`followUpSent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `npsSurveyResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performanceMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricType` varchar(255) NOT NULL,
	`metricName` varchar(255) NOT NULL,
	`value` decimal(12,2) NOT NULL,
	`unit` varchar(50),
	`endpoint` varchar(255),
	`statusCode` int,
	`severity` enum('info','warning','critical') DEFAULT 'info',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performanceMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supportTicketMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`userId` int NOT NULL,
	`message` text,
	`isInternal` boolean DEFAULT false,
	`attachmentUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supportTicketMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supportTickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ticketNumber` varchar(255) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`description` text,
	`category` enum('technical','billing','enrollment','certificate','payment','other') NOT NULL,
	`priority` enum('low','medium','high','urgent') DEFAULT 'medium',
	`status` enum('open','in_progress','waiting_user','resolved','closed') DEFAULT 'open',
	`assignedTo` int,
	`resolution` text,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supportTickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `supportTickets_ticketNumber_unique` UNIQUE(`ticketNumber`)
);
--> statement-breakpoint
CREATE TABLE `userCohortMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cohortId` int NOT NULL,
	`userId` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userCohortMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userCohorts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cohortName` varchar(255) NOT NULL,
	`description` text,
	`criteria` text,
	`userCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userCohorts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userFeedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`feedbackType` enum('course','instructor','payment','platform','general') NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`sentiment` enum('positive','neutral','negative'),
	`status` enum('new','reviewed','addressed','archived') DEFAULT 'new',
	`followUpRequired` boolean DEFAULT false,
	`followUpSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userFeedback_id` PRIMARY KEY(`id`)
);
