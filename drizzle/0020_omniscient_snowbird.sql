CREATE TABLE `cprTeamMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int,
	`providerName` varchar(255) NOT NULL,
	`role` enum('team_leader','compressions','airway','iv_access','medications','recorder','observer'),
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`leftAt` timestamp,
	CONSTRAINT `cprTeamMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cprEvents` ADD `memberId` int;