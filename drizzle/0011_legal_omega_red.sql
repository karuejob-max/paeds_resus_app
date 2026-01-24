CREATE TABLE `cprEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cprSessionId` int NOT NULL,
	`eventType` enum('compression_cycle','medication','defibrillation','airway','note','outcome') NOT NULL,
	`eventTime` int,
	`description` text,
	`value` varchar(255),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cprEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cprProtocols` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`ageMin` int,
	`ageMax` int,
	`weightMin` decimal(10,3),
	`weightMax` decimal(10,3),
	`compressionRate` varchar(100),
	`compressionDepth` varchar(100),
	`ventilationRate` varchar(100),
	`handPosition` text,
	`paddleSize` varchar(100),
	`initialEnergy` int,
	`subsequentEnergy` int,
	`medications` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cprProtocols_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cprSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`providerId` int NOT NULL,
	`startTime` timestamp NOT NULL DEFAULT (now()),
	`endTime` timestamp,
	`status` enum('active','completed','abandoned') NOT NULL DEFAULT 'active',
	`outcome` enum('ROSC','pCOSCA','mortality','ongoing') DEFAULT 'ongoing',
	`totalDuration` int,
	`cprQuality` enum('excellent','good','adequate','poor'),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cprSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `defibrillatorEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cprSessionId` int NOT NULL,
	`eventTime` int,
	`rhythm` enum('VF','pulseless_VT','asystole','PEA','sinus','unknown') NOT NULL,
	`shockDelivered` boolean DEFAULT false,
	`energyLevel` int,
	`energyPerKg` decimal(10,3),
	`outcome` enum('ROSC','no_change','deterioration'),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `defibrillatorEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emergencyMedications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('vasopressor','antiarrhythmic','sedative','paralytic','reversal','other') NOT NULL,
	`dosagePerKg` decimal(10,3),
	`maxDose` decimal(10,3),
	`route` enum('IV','IO','IM','ET','IN') NOT NULL,
	`concentration` varchar(100),
	`interval` int,
	`indication` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emergencyMedications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicationLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cprSessionId` int NOT NULL,
	`medicationId` int NOT NULL,
	`administeredAt` int,
	`dose` decimal(10,3),
	`dosePerKg` decimal(10,3),
	`route` enum('IV','IO','IM','ET','IN') NOT NULL,
	`administeredBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `medicationLog_id` PRIMARY KEY(`id`)
);
