-- Pre-download course feedback (one row per user per certificate)
CREATE TABLE IF NOT EXISTS `certificateDownloadFeedback` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `certificateId` int NOT NULL,
  `rating` int NOT NULL,
  `improvements` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  PRIMARY KEY (`id`),
  UNIQUE KEY `cert_dl_fb_user_cert` (`userId`, `certificateId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
