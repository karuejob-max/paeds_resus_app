-- Migration 0042: Care Signal reviews, in-app notifications, provider SAMPLE history
-- Required by careSignalReview.* and sampleHistory.* tRPC routers (production 500s without these tables).

CREATE TABLE `careSignalReviews` (
  `id` int AUTO_INCREMENT NOT NULL,
  `analyticsEventId` int NOT NULL,
  `reporterUserId` int NOT NULL,
  `reviewerUserId` int NOT NULL,
  `interventionName` varchar(128) NOT NULL,
  `responseText` text NOT NULL,
  `actionTaken` varchar(64) NOT NULL DEFAULT 'acknowledged',
  `expectedResolutionDate` varchar(32),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `careSignalReviews_id` PRIMARY KEY(`id`)
);

CREATE INDEX `idx_care_signal_reviews_reporter` ON `careSignalReviews` (`reporterUserId`);
CREATE INDEX `idx_care_signal_reviews_event` ON `careSignalReviews` (`analyticsEventId`);

CREATE TABLE `inAppNotifications` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `type` varchar(64) NOT NULL,
  `title` varchar(256) NOT NULL,
  `body` text NOT NULL,
  `actionUrl` varchar(512),
  `relatedId` int,
  `read` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `inAppNotifications_id` PRIMARY KEY(`id`)
);

CREATE INDEX `idx_in_app_notifications_user` ON `inAppNotifications` (`userId`);
CREATE INDEX `idx_in_app_notifications_user_read` ON `inAppNotifications` (`userId`, `read`);

CREATE TABLE `providerSampleHistory` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `signs` text,
  `allergies` text,
  `medications` text,
  `pastHistory` text,
  `lastMeal` text,
  `events` text,
  `caseWeight` decimal(5, 1),
  `caseAge` varchar(32),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `providerSampleHistory_id` PRIMARY KEY(`id`),
  CONSTRAINT `providerSampleHistory_userId_unique` UNIQUE(`userId`)
);
