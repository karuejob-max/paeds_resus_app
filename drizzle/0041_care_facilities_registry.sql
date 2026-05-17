CREATE TABLE `careFacilities` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `county` varchar(128),
  `country` varchar(128) NOT NULL DEFAULT 'Kenya',
  `subCounty` varchar(128),
  `facilityType` enum('primary_health_center','health_post','district_hospital','private_clinic','ngo_clinic','other'),
  `mergedIntoId` int,
  `institutionalAccountId` int,
  `isSystem` boolean NOT NULL DEFAULT false,
  `systemSlug` varchar(64),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `careFacilities_id` PRIMARY KEY(`id`),
  CONSTRAINT `careFacilities_systemSlug_unique` UNIQUE(`systemSlug`)
);

CREATE INDEX `idx_care_facilities_name` ON `careFacilities` (`name`);
CREATE INDEX `idx_care_facilities_county` ON `careFacilities` (`county`);
CREATE INDEX `idx_care_facilities_country` ON `careFacilities` (`country`);
CREATE INDEX `idx_care_facilities_merged` ON `careFacilities` (`mergedIntoId`);

ALTER TABLE `providerProfiles` ADD `facilityId` int;
CREATE INDEX `idx_provider_profiles_facility` ON `providerProfiles` (`facilityId`);

INSERT INTO `careFacilities` (`name`, `county`, `country`, `isSystem`, `systemSlug`) VALUES
  ('Outreach / mobile / multiple sites', NULL, 'Kenya', true, 'outreach-mobile');
