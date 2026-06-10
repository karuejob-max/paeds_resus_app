CREATE TABLE `fellowshipSimulations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `courseId` varchar(255) NOT NULL,
  `level` enum('foundational','advanced') NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `scenarioData` json NOT NULL,
  `order` int DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fellowshipSimulations_id` PRIMARY KEY(`id`)
);

ALTER TABLE `userProgress` ADD `fellowshipSimulationId` int;
