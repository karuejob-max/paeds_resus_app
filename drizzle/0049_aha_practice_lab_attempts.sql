CREATE TABLE `ahaPracticeLabAttempts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `enrollmentId` int NOT NULL,
  `programType` enum('bls','acls','pals','heartsaver','nrp') NOT NULL,
  `trackId` varchar(64) NOT NULL,
  `scenarioId` varchar(64) NOT NULL,
  `score` int NOT NULL,
  `passed` boolean NOT NULL DEFAULT false,
  `eventLog` json,
  `isBooster` boolean NOT NULL DEFAULT false,
  `durationSeconds` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `ahaPracticeLabAttempts_id` PRIMARY KEY(`id`)
);

CREATE INDEX `ahaPracticeLabAttempts_userId_idx` ON `ahaPracticeLabAttempts` (`userId`);
CREATE INDEX `ahaPracticeLabAttempts_enrollmentId_idx` ON `ahaPracticeLabAttempts` (`enrollmentId`);
CREATE INDEX `ahaPracticeLabAttempts_track_scenario_idx` ON `ahaPracticeLabAttempts` (`trackId`, `scenarioId`);
CREATE INDEX `ahaPracticeLabAttempts_createdAt_idx` ON `ahaPracticeLabAttempts` (`createdAt`);
