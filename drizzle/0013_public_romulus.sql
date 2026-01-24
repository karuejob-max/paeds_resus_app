CREATE TABLE `alertConfigurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`providerId` varchar(255) NOT NULL,
	`alertType` enum('critical_risk_score','vital_sign_change','patient_deterioration','intervention_reminder','protocol_recommendation','peer_comparison','learning_milestone') NOT NULL,
	`riskScoreThreshold` int DEFAULT 70,
	`vitalSignThresholds` text,
	`enabled` boolean DEFAULT true,
	`soundEnabled` boolean DEFAULT true,
	`vibrationEnabled` boolean DEFAULT true,
	`pushNotificationEnabled` boolean DEFAULT true,
	`emailNotificationEnabled` boolean DEFAULT false,
	`quietHoursStart` varchar(5),
	`quietHoursEnd` varchar(5),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alertConfigurations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alertDeliveryLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertId` int NOT NULL,
	`deliveryMethod` enum('push_notification','email','sms','in_app','websocket') NOT NULL,
	`status` enum('pending','sent','delivered','failed') DEFAULT 'pending',
	`errorMessage` text,
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alertDeliveryLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alertHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`providerId` varchar(255) NOT NULL,
	`alertsReceivedToday` int DEFAULT 0,
	`alertsAcknowledgedToday` int DEFAULT 0,
	`criticalAlertsToday` int DEFAULT 0,
	`averageResponseTime` int,
	`lastAlertTime` timestamp,
	`date` date NOT NULL,
	CONSTRAINT `alertHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alertStatistics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`providerId` varchar(255) NOT NULL,
	`alertType` varchar(100) NOT NULL,
	`totalAlerts` int DEFAULT 0,
	`acknowledgedAlerts` int DEFAULT 0,
	`dismissedAlerts` int DEFAULT 0,
	`actionTakenAlerts` int DEFAULT 0,
	`averageTimeToAcknowledge` int,
	`period` enum('daily','weekly','monthly') NOT NULL,
	`date` date NOT NULL,
	CONSTRAINT `alertStatistics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alertSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`providerId` varchar(255) NOT NULL,
	`patientId` int NOT NULL,
	`subscriptionType` enum('all_alerts','critical_only','vital_signs_only','protocol_only') DEFAULT 'all_alerts',
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alertSubscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`providerId` varchar(255) NOT NULL,
	`alertType` enum('critical_risk_score','vital_sign_change','patient_deterioration','intervention_reminder','protocol_recommendation','peer_comparison','learning_milestone') NOT NULL,
	`severity` enum('critical','high','medium','low') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`data` text,
	`isRead` boolean DEFAULT false,
	`isAcknowledged` boolean DEFAULT false,
	`acknowledgedAt` timestamp,
	`actionTaken` varchar(255),
	`actionTakenAt` timestamp,
	`status` enum('pending','delivered','read','acknowledged','dismissed') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
