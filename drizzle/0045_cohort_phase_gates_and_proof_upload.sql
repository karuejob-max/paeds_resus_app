CREATE TABLE `care_signal_raw_narrative_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`care_signal_event_id` int NOT NULL,
	`old_value` text,
	`new_value` text,
	`reason` text NOT NULL,
	`changed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `care_signal_raw_narrative_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cneAttendees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cneEventId` int NOT NULL,
	`institutionalAccountId` int NOT NULL,
	`fullName` varchar(256) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`cadre` enum('BSN','MSN','KRCHN','KRN','KRNM','ERN','HND','Student Nurse','Other') NOT NULL,
	`cadreOther` varchar(128),
	`higherDiploma` varchar(256),
	`department` varchar(256) NOT NULL,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cneAttendees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cneEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`institutionalAccountId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`eventDate` varchar(64) NOT NULL,
	`isOpen` boolean NOT NULL DEFAULT false,
	`openedAt` timestamp,
	`closedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cneEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `facilities` (
	`facility_id` varchar(36) NOT NULL,
	`internal_name` varchar(255) NOT NULL,
	`country_code` varchar(2) NOT NULL,
	`admin_level_1` varchar(128),
	`admin_level_2` varchar(128),
	`facility_level` varchar(64),
	`facility_level_who` varchar(16),
	`facility_ownership` enum('GOVERNMENT','FAITH_BASED','PRIVATE_FOR_PROFIT','PRIVATE_NOT_FOR_PROFIT','MILITARY','OTHER'),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`source` enum('HEALTHSITES_IO','KMHFL','OTHER_NATIONAL_REGISTRY','MANUAL') NOT NULL DEFAULT 'MANUAL',
	`source_record_id` varchar(128),
	`legacy_care_facility_id` int,
	`legacy_kmhfl_facility_id` int,
	`is_verified` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `facilities_facility_id` PRIMARY KEY(`facility_id`)
);
--> statement-breakpoint
CREATE TABLE `fellowshipTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tokenId` varchar(36) NOT NULL,
	`recoveryCodeHash` varchar(128) NOT NULL,
	`careSignalStreak` int DEFAULT 0,
	`careSignalEventsSubmitted` int DEFAULT 0,
	`careSignalPercentage` int DEFAULT 0,
	`linkedUserId` int,
	`linkedAt` timestamp,
	`titleDisplayRevokedAt` timestamp,
	`lastSubmissionAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fellowshipTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `fellowshipTokens_tokenId_unique` UNIQUE(`tokenId`)
);
--> statement-breakpoint
CREATE TABLE `individualInstallmentPayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enrollmentId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`paymentDate` timestamp NOT NULL DEFAULT (now()),
	`mpesaReceiptNumber` varchar(50) NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`status` enum('pending','completed','failed') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `individualInstallmentPayments_id` PRIMARY KEY(`id`),
	CONSTRAINT `individualInstallmentPayments_mpesaReceiptNumber_unique` UNIQUE(`mpesaReceiptNumber`)
);
--> statement-breakpoint
CREATE TABLE `kb_content_versions` (
	`id` varchar(36) NOT NULL,
	`content_type` enum('RESUSGPS_PATHWAY','MICROCOURSE_CONTENT','CARE_SIGNAL_RULE','FELLOWSHIP_CURRICULUM','ERS_STANDARD','OTHER') NOT NULL,
	`content_identifier` varchar(255) NOT NULL,
	`content_version` varchar(32) NOT NULL,
	`change_description` text NOT NULL,
	`source_pattern_ids` text,
	`source_recommendation_ids` text,
	`external_guideline_reference` text,
	`knowledge_stewardship_approved_by` varchar(36) NOT NULL,
	`knowledge_stewardship_approved_at` timestamp NOT NULL,
	`deployed_at` timestamp,
	`deprecated_at` timestamp,
	`deprecated_by_version_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kb_content_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kb_evidence_links` (
	`id` varchar(36) NOT NULL,
	`pattern_id` varchar(36) NOT NULL,
	`evidence_source_type` enum('OBSERVATIONAL','EXPERIMENTAL','EXPERT','ADAPTIVE') NOT NULL,
	`evidence_description` text NOT NULL,
	`evidence_direction` enum('SUPPORTS','CHALLENGES','NEUTRAL','SUPERSEDES') NOT NULL,
	`citation` text,
	`guideline_body` varchar(255),
	`guideline_year` int,
	`lmic_applicability` enum('HIGH','MODERATE','LOW','NOT_ASSESSED'),
	`added_at` timestamp NOT NULL DEFAULT (now()),
	`added_by` varchar(36) NOT NULL,
	CONSTRAINT `kb_evidence_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kb_failure_modes` (
	`id` varchar(36) NOT NULL,
	`failure_mode_code` varchar(64) NOT NULL,
	`failure_domain` enum('RECOGNITION','ESCALATION','VASCULAR_ACCESS','TREATMENT','REFERRAL','MONITORING','COMMUNICATION','RESOURCE_AVAILABILITY') NOT NULL,
	`failure_mode_name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`condition_categories` text,
	`taxonomy_version` varchar(16) NOT NULL DEFAULT '1.0',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`retired_at` timestamp,
	`retired_reason` text,
	CONSTRAINT `kb_failure_modes_id` PRIMARY KEY(`id`),
	CONSTRAINT `kb_failure_modes_failure_mode_code_unique` UNIQUE(`failure_mode_code`)
);
--> statement-breakpoint
CREATE TABLE `kb_governance_audit` (
	`id` varchar(36) NOT NULL,
	`actor_user_id` varchar(36) NOT NULL,
	`action_type` enum('PATTERN_CREATED','PATTERN_CONFIDENCE_CHANGED','PATTERN_RETIRED','PATTERN_REINSTATED','RECOMMENDATION_APPROVED','RECOMMENDATION_REJECTED','RECOMMENDATION_SUPERSEDED','CONTENT_VERSION_APPROVED','CONTENT_VERSION_DEPLOYED','IMPLEMENTATION_OUTCOME_LABELLED','REVIEW_COMPLETED','OTHER') NOT NULL,
	`entity_type` enum('PATTERN','FAILURE_MODE','SUCCESS_FACTOR','RECOMMENDATION','INTERVENTION','IMPLEMENTATION','CONTENT_VERSION','REVIEW') NOT NULL,
	`entity_id` varchar(36) NOT NULL,
	`previous_state` text,
	`new_state` text,
	`reasoning` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kb_governance_audit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kb_implementations` (
	`id` varchar(36) NOT NULL,
	`intervention_id` varchar(36) NOT NULL,
	`actual_implementation_date` date,
	`actual_scope` enum('ED_ONLY','WARD','HOSPITAL_WIDE','NETWORK','NATIONAL'),
	`modifications_from_plan` text,
	`implementation_fidelity` enum('HIGH','PARTIAL','LOW','NOT_IMPLEMENTED'),
	`outcome_label` enum('IMPROVED','NO_IMPROVEMENT','WORSENED','EVALUATION_PENDING'),
	`outcome_evidence_notes` text,
	`outcome_observation_ids` text,
	`outcome_recorded_at` timestamp,
	`outcome_recorded_by` varchar(36),
	`confidence_impact_applied` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`created_by` varchar(36) NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kb_implementations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kb_interventions` (
	`id` varchar(36) NOT NULL,
	`recommendation_id` varchar(36) NOT NULL,
	`committing_entity_type` enum('FACILITY','NETWORK','MINISTRY','TRAINING_INSTITUTION','OTHER') NOT NULL,
	`committing_entity_id` varchar(36) NOT NULL,
	`intervention_scope` enum('ED_ONLY','WARD','HOSPITAL_WIDE','NETWORK','NATIONAL') NOT NULL,
	`intervention_description` text NOT NULL,
	`planned_implementation_date` date,
	`defined_outcome_measure` text NOT NULL,
	`evaluation_window_months` int NOT NULL DEFAULT 6,
	`intervention_status` enum('PLANNED','IN_PROGRESS','COMPLETED','ABANDONED') NOT NULL DEFAULT 'PLANNED',
	`status_updated_at` timestamp,
	`abandonment_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`created_by` varchar(36) NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kb_interventions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kb_pattern_modes` (
	`id` varchar(36) NOT NULL,
	`pattern_id` varchar(36) NOT NULL,
	`mode_id` varchar(36) NOT NULL,
	`mode_track` enum('FAILURE','SUCCESS') NOT NULL,
	`is_primary` boolean NOT NULL DEFAULT false,
	`sequence_position` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kb_pattern_modes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kb_pattern_observations` (
	`id` varchar(36) NOT NULL,
	`pattern_id` varchar(36) NOT NULL,
	`observation_source` enum('CARE_SIGNAL','SAFE_TRUTH','RESUSGPS','ASSESSMENT','INSTITUTIONAL_AUDIT') NOT NULL,
	`observation_id` varchar(36) NOT NULL,
	`observation_table` varchar(64) NOT NULL,
	`country` varchar(2),
	`admin_level_1` varchar(128),
	`facility_level` varchar(32),
	`condition_category` varchar(64),
	`observation_period` varchar(7) NOT NULL,
	`linked_at` timestamp NOT NULL DEFAULT (now()),
	`linked_by` varchar(36) NOT NULL DEFAULT 'system',
	`taxonomy_version_at_link` varchar(16) NOT NULL DEFAULT '1.0',
	CONSTRAINT `kb_pattern_observations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kb_patterns` (
	`id` varchar(36) NOT NULL,
	`pattern_track` enum('FAILURE','SUCCESS') NOT NULL,
	`pattern_code` varchar(64) NOT NULL,
	`pattern_name` varchar(512) NOT NULL,
	`primary_domain` enum('RECOGNITION','ESCALATION','VASCULAR_ACCESS','TREATMENT','REFERRAL','MONITORING','COMMUNICATION','RESOURCE_AVAILABILITY') NOT NULL,
	`description` text NOT NULL,
	`confidence_level` enum('SIGNAL','CANDIDATE','CONFIRMED','ESTABLISHED','CANDIDATE_SUCCESS','EMERGING_SUCCESS','VALIDATED_SUCCESS','STANDARD_PRACTICE') NOT NULL DEFAULT 'SIGNAL',
	`confidence_dimensions` text NOT NULL,
	`supporting_observation_count` int NOT NULL DEFAULT 0,
	`first_detected_at` timestamp,
	`last_confirmed_at` timestamp,
	`trend_direction` enum('INCREASING','DECREASING','STABLE','INSUFFICIENT_DATA'),
	`geographic_scope` text,
	`admin_scope` text,
	`condition_scope` text,
	`facility_level_scope` text,
	`cadre_scope` text,
	`preventability_distribution` text,
	`taxonomy_version` varchar(16) NOT NULL DEFAULT '1.0',
	`knowledge_status` enum('ACTIVE','UNDER_REVIEW','RETIRED') NOT NULL DEFAULT 'ACTIVE',
	`review_due_at` timestamp,
	`retired_at` timestamp,
	`retired_reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_by` varchar(36) NOT NULL DEFAULT 'system',
	CONSTRAINT `kb_patterns_id` PRIMARY KEY(`id`),
	CONSTRAINT `kb_patterns_pattern_code_unique` UNIQUE(`pattern_code`)
);
--> statement-breakpoint
CREATE TABLE `kb_recommendations` (
	`id` varchar(36) NOT NULL,
	`source_pattern_id` varchar(36) NOT NULL,
	`recommendation_code` varchar(64) NOT NULL,
	`recommendation_type` enum('TRAINING','PROCUREMENT','PROTOCOL','STAFFING','RESUSGPS_UPDATE','CURRICULUM_UPDATE','CARE_SIGNAL_RULE','INSTITUTIONAL_PROCESS','OTHER') NOT NULL,
	`recommendation_text` text NOT NULL,
	`target_audience` enum('INDIVIDUAL_PROVIDER','FACILITY','NETWORK','MINISTRY','CURRICULUM_TEAM','RESUSGPS_TEAM') NOT NULL,
	`confidence_level_at_generation` varchar(64) NOT NULL,
	`evidence_basis` text NOT NULL,
	`governance_status` enum('PENDING','APPROVED','REJECTED','SUPERSEDED') NOT NULL DEFAULT 'PENDING',
	`governance_approved_by` varchar(36),
	`governance_approved_at` timestamp,
	`governance_notes` text,
	`superseded_by_id` varchar(36),
	`valid_from` timestamp,
	`valid_until` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`created_by` varchar(36) NOT NULL DEFAULT 'system',
	CONSTRAINT `kb_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kb_review_schedule` (
	`id` varchar(36) NOT NULL,
	`pattern_id` varchar(36) NOT NULL,
	`review_due_at` timestamp NOT NULL,
	`review_type` enum('SCHEDULED','TRIGGERED_BY_NEW_EVIDENCE','TRIGGERED_BY_CONCEPT_DRIFT','MANUAL') NOT NULL,
	`review_status` enum('PENDING','IN_PROGRESS','COMPLETED','DEFERRED') NOT NULL DEFAULT 'PENDING',
	`reviewed_at` timestamp,
	`reviewed_by` varchar(36),
	`review_outcome` enum('CONFIDENCE_MAINTAINED','CONFIDENCE_UPGRADED','CONFIDENCE_DOWNGRADED','PATTERN_RETIRED','PATTERN_SPLIT','DEFERRED_TO_NEXT_CYCLE'),
	`review_notes` text,
	`next_review_due_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kb_review_schedule_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kb_success_factors` (
	`id` varchar(36) NOT NULL,
	`success_factor_code` varchar(64) NOT NULL,
	`success_domain` enum('RECOGNITION','ESCALATION','VASCULAR_ACCESS','TREATMENT','REFERRAL','MONITORING','COMMUNICATION','RESOURCE_AVAILABILITY') NOT NULL,
	`success_factor_name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`condition_categories` text,
	`taxonomy_version` varchar(16) NOT NULL DEFAULT '1.0',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`retired_at` timestamp,
	`retired_reason` text,
	CONSTRAINT `kb_success_factors_id` PRIMARY KEY(`id`),
	CONSTRAINT `kb_success_factors_success_factor_code_unique` UNIQUE(`success_factor_code`)
);
--> statement-breakpoint
CREATE TABLE `kmhflFacilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(64),
	`county` varchar(100),
	`facilityType` varchar(100),
	`operationalStatus` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kmhflFacilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `safeTruthDisclaimerAcks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`device_session_id` varchar(36) NOT NULL,
	`disclaimer_version` varchar(16) NOT NULL,
	`accepted_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `safeTruthDisclaimerAcks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `safeTruthFacilityVisits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submission_id` int NOT NULL,
	`visit_sequence` int NOT NULL,
	`visit_facility_name_raw` text NOT NULL,
	`visit_facility_id_matched` varchar(36),
	`visit_facility_is_final` boolean NOT NULL DEFAULT false,
	`was_seen_promptly` varchar(32) NOT NULL,
	`turned_away` boolean NOT NULL DEFAULT false,
	`turned_away_reason` text,
	`information_received` varchar(64),
	`family_involvement` varchar(64),
	`visit_experience_raw` text,
	`danger_sign_advice_at_discharge` boolean,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `safeTruthFacilityVisits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `safeTruthSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submission_uuid` varchar(36) NOT NULL,
	`observation_timestamp` timestamp NOT NULL DEFAULT (now()),
	`schema_version` varchar(16) NOT NULL DEFAULT '1.0',
	`observer_class` varchar(16) NOT NULL DEFAULT 'CAREGIVER',
	`country` varchar(2) NOT NULL,
	`admin_level_1` varchar(128) NOT NULL,
	`admin_level_2` varchar(128),
	`facility_name_raw` text NOT NULL,
	`facility_id_matched` varchar(36),
	`facility_level` varchar(64),
	`child_age_band` varchar(32) NOT NULL,
	`condition_category` varchar(64) NOT NULL,
	`outcome_category` varchar(64) NOT NULL,
	`is_case_linkage_consented` boolean NOT NULL DEFAULT false,
	`event_code_entered` varchar(36),
	`symptom_onset_days_ago` varchar(32) NOT NULL,
	`first_symptom_noticed` text,
	`danger_signs_present` text,
	`advice_received_before_facility` text NOT NULL,
	`advice_content_raw` text,
	`reassured_despite_danger` boolean,
	`decision_to_seek_care_trigger` text,
	`transport_used` text NOT NULL,
	`transport_delay_occurred` boolean NOT NULL,
	`transport_delay_reason` text,
	`travel_time_to_first_facility` varchar(32) NOT NULL,
	`cost_barrier_occurred` boolean NOT NULL,
	`cost_barrier_details` text,
	`facilities_visited_count` varchar(64) NOT NULL,
	`follow_up_instructions_received` boolean,
	`able_to_follow_instructions` boolean,
	`unable_to_follow_reason` text,
	`overall_experience_rating` varchar(32),
	`what_could_have_been_better` text,
	`raw_narrative` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `safeTruthSubmissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `safeTruthSubmissions_submission_uuid_unique` UNIQUE(`submission_uuid`)
);
--> statement-breakpoint
ALTER TABLE `platformFeedbackTickets` MODIFY COLUMN `status` enum('open','in_progress','resolved','wont_fix','duplicate') NOT NULL DEFAULT 'open';--> statement-breakpoint
ALTER TABLE `trainingAttendance` MODIFY COLUMN `attendanceStatus` enum('registered','attended','absent','cancelled','waitlisted') DEFAULT 'registered';--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `country` varchar(2);--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `admin_level_1` varchar(128);--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `admin_level_2` varchar(128);--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `facility_ownership` varchar(64);--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `schema_version` varchar(16) DEFAULT '1.0' NOT NULL;--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `condition_category` varchar(64);--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `child_age_band` varchar(32);--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `outcome_category` varchar(64);--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `role_at_time_of_event` varchar(64);--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `provider_cadre` varchar(64);--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `report_track` varchar(16) DEFAULT 'FAILURE' NOT NULL;--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `failure_mode_codes` text;--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `success_factor_codes` text;--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `raw_narrative` text;--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `temporal_intervals` text;--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `event_id` varchar(36);--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `submissionMode` enum('named','pseudonymous','anonymous') DEFAULT 'named' NOT NULL;--> statement-breakpoint
ALTER TABLE `careSignalEvents` ADD `fellowshipTokenId` varchar(36);--> statement-breakpoint
ALTER TABLE `institutionalAccounts` ADD `cneCoordinatorName` varchar(255);--> statement-breakpoint
ALTER TABLE `institutionalAccounts` ADD `cneCoordinatorSignature` text;--> statement-breakpoint
ALTER TABLE `institutionalStaffMembers` ADD `designation` enum('bsn_intern','coi_bsc','coi_diploma','moi','permanent_nurse','permanent_doctor','other') DEFAULT 'other';--> statement-breakpoint
ALTER TABLE `institutionalStaffMembers` ADD `phaseStatus` enum('phase_1','phase_2','phase_3','completed') DEFAULT 'phase_1';--> statement-breakpoint
ALTER TABLE `institutionalStaffMembers` ADD `facilityLinkStatus` enum('pending','linked','rejected') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `institutionalStaffMembers` ADD `totalPaidAmount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `institutionalStaffMembers` ADD `phase1ProofUrl` text;--> statement-breakpoint
ALTER TABLE `institutionalStaffMembers` ADD `phase1ProofApprovedAt` timestamp;--> statement-breakpoint
ALTER TABLE `platformFeedbackTickets` ADD `issueType` enum('bug','content','ux','billing','clinical','other');--> statement-breakpoint
ALTER TABLE `platformFeedbackTickets` ADD `severity` enum('low','medium','high','critical') DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE `platformFeedbackTickets` ADD `assignedAgent` varchar(64);--> statement-breakpoint
ALTER TABLE `platformFeedbackTickets` ADD `agentTags` json;--> statement-breakpoint
ALTER TABLE `platformFeedbackTickets` ADD `statusHistoryJson` json;--> statement-breakpoint
ALTER TABLE `platformFeedbackTickets` ADD `duplicateOfTicketId` int;--> statement-breakpoint
ALTER TABLE `trainingAttendance` ADD `simulationRole` enum('team_member','team_leader');--> statement-breakpoint
ALTER TABLE `trainingAttendance` ADD `simulationCompetencyPassed` boolean DEFAULT false;