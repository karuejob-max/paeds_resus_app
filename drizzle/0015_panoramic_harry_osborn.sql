ALTER TABLE `diagnosisAccuracy` MODIFY COLUMN `accuracy` decimal(5,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `diagnosisAccuracy` MODIFY COLUMN `averageConfidence` decimal(5,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `differentialDiagnosisScores` MODIFY COLUMN `vitalSignMatch` decimal(5,2) DEFAULT '0';