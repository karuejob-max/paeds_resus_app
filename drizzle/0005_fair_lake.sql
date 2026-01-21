ALTER TABLE `facilityScores` MODIFY COLUMN `pCOSCARate` decimal(5,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `facilityScores` MODIFY COLUMN `staffEngagementScore` decimal(5,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `facilityScores` MODIFY COLUMN `insightAdoptionRate` decimal(5,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `facilityScores` MODIFY COLUMN `overallScore` decimal(5,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `safetruthEvents` MODIFY COLUMN `childAge` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `userProfiles` MODIFY COLUMN `yearsOfExperience` int DEFAULT 0;