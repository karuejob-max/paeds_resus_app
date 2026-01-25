CREATE TABLE `cannedResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int,
	`title` varchar(255) NOT NULL,
	`shortcut` varchar(50),
	`content` text NOT NULL,
	`category` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cannedResponses_id` PRIMARY KEY(`id`),
	CONSTRAINT `cannedResponses_shortcut_unique` UNIQUE(`shortcut`)
);
--> statement-breakpoint
CREATE TABLE `chatAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`totalConversations` int DEFAULT 0,
	`resolvedConversations` int DEFAULT 0,
	`avgResolutionTime` int,
	`avgCustomerSatisfaction` decimal(3,2),
	`totalMessagesHandled` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentId` int,
	`topic` enum('activation_help','password_reset','course_enrollment','payment_issue','technical_support','other') NOT NULL,
	`priority` enum('low','medium','high','urgent') DEFAULT 'medium',
	`status` enum('open','assigned','in_progress','resolved','closed') DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	CONSTRAINT `chatConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`senderId` int NOT NULL,
	`senderType` enum('user','agent','system') NOT NULL,
	`content` text NOT NULL,
	`messageType` enum('text','file','system') DEFAULT 'text',
	`isRead` boolean DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supportAgents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentName` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`status` enum('available','busy','offline') DEFAULT 'offline',
	`activeConversations` int DEFAULT 0,
	`totalResolved` int DEFAULT 0,
	`avgResolutionTime` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supportAgents_id` PRIMARY KEY(`id`)
);
