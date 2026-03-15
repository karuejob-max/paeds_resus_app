CREATE TABLE `clinicalReferrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`patientName` varchar(255) NOT NULL,
	`patientAge` int NOT NULL,
	`diagnosis` text NOT NULL,
	`urgency` enum('routine','urgent','emergency') NOT NULL DEFAULT 'routine',
	`reason` text NOT NULL,
	`referralType` enum('hospital','specialist','imaging','lab') NOT NULL,
	`facilityName` varchar(255) NOT NULL,
	`notes` text,
	`status` enum('pending','accepted','rejected','completed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinicalReferrals_id` PRIMARY KEY(`id`)
);
