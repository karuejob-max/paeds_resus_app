/**
 * Idempotent: Failure Pattern Knowledge Base — 11 kb_ tables (migration 0057).
 *
 * Creates (in dependency order per FPKB_SCHEMA_V1.md §5.3):
 *   A. kb_failure_modes
 *   B. kb_success_factors
 *   C. kb_patterns
 *   D. kb_pattern_modes
 *   E. kb_pattern_observations
 *   F. kb_evidence_links
 *   G. kb_recommendations
 *   H. kb_interventions
 *   I. kb_implementations
 *   J. kb_review_schedule
 *   K. kb_content_versions
 *   L. kb_governance_audit  (append-only — no UPDATE/DELETE on this table ever)
 *   + All required indexes
 *
 * Run: pnpm run db:apply-0057
 *
 * NOTE: Apply AFTER migration 0056 (Care Signal v3 columns).
 *       Do NOT run this until Care Signal v3 is shipping — the FPKB
 *       needs real observations to populate. Schema is idempotent;
 *       running early is safe but pointless.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
    [table]
  );
  return rows.length > 0;
}

async function indexExists(conn, table, indexName) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [table, indexName]
  );
  return rows.length > 0;
}

async function createTableIfMissing(conn, name, ddl) {
  if (await tableExists(conn, name)) {
    console.log(`[0057]   ✓ ${name} already exists — skipping.`);
    return;
  }
  await conn.query(ddl);
  console.log(`[0057]   + Created ${name}.`);
}

async function createIndexIfMissing(conn, table, indexName, ddl) {
  if (await indexExists(conn, table, indexName)) {
    console.log(`[0057]   ✓ Index ${indexName} on ${table} already exists — skipping.`);
    return;
  }
  await conn.query(ddl);
  console.log(`[0057]   + Created index ${indexName} on ${table}.`);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[0057] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);

  try {
    console.log("[0057] Starting FPKB schema migration (11 tables)...");

    // ── A. kb_failure_modes ─────────────────────────────────────────────────
    await createTableIfMissing(conn, "kb_failure_modes", `
      CREATE TABLE \`kb_failure_modes\` (
        \`id\`                 VARCHAR(36)   NOT NULL DEFAULT (UUID()),
        \`failure_mode_code\`  VARCHAR(64)   NOT NULL COMMENT 'Stable machine-readable code — never changed after first use',
        \`failure_domain\`     ENUM(
          'RECOGNITION','ESCALATION','VASCULAR_ACCESS','TREATMENT',
          'REFERRAL','MONITORING','COMMUNICATION','RESOURCE_AVAILABILITY'
        ) NOT NULL,
        \`failure_mode_name\`  VARCHAR(255)  NOT NULL,
        \`description\`        TEXT          NOT NULL,
        \`condition_categories\` TEXT        NULL     COMMENT 'JSON array of condition_category values',
        \`taxonomy_version\`   VARCHAR(16)   NOT NULL DEFAULT '1.0',
        \`is_active\`          TINYINT(1)    NOT NULL DEFAULT 1,
        \`created_at\`         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\`         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        \`retired_at\`         DATETIME(3)   NULL,
        \`retired_reason\`     TEXT          NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_kbfm_code\` (\`failure_mode_code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // ── B. kb_success_factors ───────────────────────────────────────────────
    await createTableIfMissing(conn, "kb_success_factors", `
      CREATE TABLE \`kb_success_factors\` (
        \`id\`                   VARCHAR(36)   NOT NULL DEFAULT (UUID()),
        \`success_factor_code\`  VARCHAR(64)   NOT NULL,
        \`success_domain\`       ENUM(
          'RECOGNITION','ESCALATION','VASCULAR_ACCESS','TREATMENT',
          'REFERRAL','MONITORING','COMMUNICATION','RESOURCE_AVAILABILITY'
        ) NOT NULL,
        \`success_factor_name\`  VARCHAR(255)  NOT NULL,
        \`description\`          TEXT          NOT NULL,
        \`condition_categories\` TEXT          NULL,
        \`taxonomy_version\`     VARCHAR(16)   NOT NULL DEFAULT '1.0',
        \`is_active\`            TINYINT(1)    NOT NULL DEFAULT 1,
        \`created_at\`           DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\`           DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        \`retired_at\`           DATETIME(3)   NULL,
        \`retired_reason\`       TEXT          NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_kbsf_code\` (\`success_factor_code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // ── C. kb_patterns ──────────────────────────────────────────────────────
    await createTableIfMissing(conn, "kb_patterns", `
      CREATE TABLE \`kb_patterns\` (
        \`id\`                       VARCHAR(36)   NOT NULL DEFAULT (UUID()),
        \`pattern_track\`            ENUM('FAILURE','SUCCESS')  NOT NULL,
        \`pattern_code\`             VARCHAR(64)   NOT NULL,
        \`pattern_name\`             VARCHAR(512)  NOT NULL,
        \`primary_domain\`           ENUM(
          'RECOGNITION','ESCALATION','VASCULAR_ACCESS','TREATMENT',
          'REFERRAL','MONITORING','COMMUNICATION','RESOURCE_AVAILABILITY'
        ) NOT NULL,
        \`description\`              TEXT          NOT NULL,
        \`confidence_level\`         ENUM(
          'SIGNAL','CANDIDATE','CONFIRMED','ESTABLISHED',
          'CANDIDATE_SUCCESS','EMERGING_SUCCESS','VALIDATED_SUCCESS','STANDARD_PRACTICE'
        ) NOT NULL DEFAULT 'SIGNAL',
        \`confidence_dimensions\`    TEXT          NOT NULL COMMENT 'JSON: {clinical,statistical,external_evidence,platform_replication,geographic_diversity,recency}',
        \`supporting_observation_count\` INT       NOT NULL DEFAULT 0,
        \`first_detected_at\`        DATETIME(3)   NULL,
        \`last_confirmed_at\`        DATETIME(3)   NULL,
        \`trend_direction\`          ENUM('INCREASING','DECREASING','STABLE','INSUFFICIENT_DATA') NULL,
        \`geographic_scope\`         TEXT          NULL COMMENT 'JSON array of country codes',
        \`admin_scope\`              TEXT          NULL COMMENT 'JSON array of admin_level_1 values',
        \`condition_scope\`          TEXT          NULL COMMENT 'JSON array of condition_category values',
        \`facility_level_scope\`     TEXT          NULL,
        \`cadre_scope\`              TEXT          NULL,
        \`preventability_distribution\` TEXT       NULL COMMENT 'JSON: {L0,L1,L2,L3,L4,L5: count}',
        \`taxonomy_version\`         VARCHAR(16)   NOT NULL DEFAULT '1.0',
        \`knowledge_status\`         ENUM('ACTIVE','UNDER_REVIEW','RETIRED') NOT NULL DEFAULT 'ACTIVE',
        \`review_due_at\`            DATETIME(3)   NULL,
        \`retired_at\`               DATETIME(3)   NULL,
        \`retired_reason\`           TEXT          NULL,
        \`created_at\`               DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updated_at\`               DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        \`created_by\`               VARCHAR(36)   NOT NULL DEFAULT 'system',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_kbp_code\` (\`pattern_code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // ── D. kb_pattern_modes ─────────────────────────────────────────────────
    await createTableIfMissing(conn, "kb_pattern_modes", `
      CREATE TABLE \`kb_pattern_modes\` (
        \`id\`               VARCHAR(36)  NOT NULL DEFAULT (UUID()),
        \`pattern_id\`       VARCHAR(36)  NOT NULL,
        \`mode_id\`          VARCHAR(36)  NOT NULL COMMENT 'FK to kb_failure_modes.id OR kb_success_factors.id',
        \`mode_track\`       ENUM('FAILURE','SUCCESS') NOT NULL,
        \`is_primary\`       TINYINT(1)   NOT NULL DEFAULT 0,
        \`sequence_position\` TINYINT     NULL,
        \`created_at\`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        KEY \`idx_kbpm_pattern\` (\`pattern_id\`),
        CONSTRAINT \`fk_kbpm_pattern\` FOREIGN KEY (\`pattern_id\`) REFERENCES \`kb_patterns\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // ── E. kb_pattern_observations ──────────────────────────────────────────
    await createTableIfMissing(conn, "kb_pattern_observations", `
      CREATE TABLE \`kb_pattern_observations\` (
        \`id\`                      VARCHAR(36)   NOT NULL DEFAULT (UUID()),
        \`pattern_id\`              VARCHAR(36)   NOT NULL,
        \`observation_source\`      ENUM('CARE_SIGNAL','SAFE_TRUTH','RESUSGPS','ASSESSMENT','INSTITUTIONAL_AUDIT') NOT NULL,
        \`observation_id\`          VARCHAR(36)   NOT NULL COMMENT 'Soft reference — not a DB FK (cross-table flexibility)',
        \`observation_table\`       VARCHAR(64)   NOT NULL COMMENT 'careSignalEvents | parentSafeTruthSubmissions | resusGPSCases | etc.',
        \`country\`                 VARCHAR(2)    NULL,
        \`admin_level_1\`           VARCHAR(128)  NULL,
        \`facility_level\`          VARCHAR(32)   NULL,
        \`condition_category\`      VARCHAR(64)   NULL,
        \`observation_period\`      VARCHAR(7)    NOT NULL COMMENT 'EAT YYYY-MM',
        \`linked_at\`               DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`linked_by\`               VARCHAR(36)   NOT NULL DEFAULT 'system',
        \`taxonomy_version_at_link\` VARCHAR(16)  NOT NULL DEFAULT '1.0',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_kbpo_pattern_obs\` (\`pattern_id\`, \`observation_source\`, \`observation_id\`),
        CONSTRAINT \`fk_kbpo_pattern\` FOREIGN KEY (\`pattern_id\`) REFERENCES \`kb_patterns\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // ── F. kb_evidence_links ────────────────────────────────────────────────
    await createTableIfMissing(conn, "kb_evidence_links", `
      CREATE TABLE \`kb_evidence_links\` (
        \`id\`                   VARCHAR(36)   NOT NULL DEFAULT (UUID()),
        \`pattern_id\`           VARCHAR(36)   NOT NULL,
        \`evidence_source_type\` ENUM('OBSERVATIONAL','EXPERIMENTAL','EXPERT','ADAPTIVE') NOT NULL,
        \`evidence_description\` TEXT          NOT NULL,
        \`evidence_direction\`   ENUM('SUPPORTS','CHALLENGES','NEUTRAL','SUPERSEDES') NOT NULL,
        \`citation\`             TEXT          NULL,
        \`guideline_body\`       VARCHAR(255)  NULL,
        \`guideline_year\`       SMALLINT      NULL,
        \`lmic_applicability\`   ENUM('HIGH','MODERATE','LOW','NOT_ASSESSED') NULL,
        \`added_at\`             DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`added_by\`             VARCHAR(36)   NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`idx_kbel_pattern\` (\`pattern_id\`),
        CONSTRAINT \`fk_kbel_pattern\` FOREIGN KEY (\`pattern_id\`) REFERENCES \`kb_patterns\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // ── G. kb_recommendations ───────────────────────────────────────────────
    await createTableIfMissing(conn, "kb_recommendations", `
      CREATE TABLE \`kb_recommendations\` (
        \`id\`                            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
        \`source_pattern_id\`             VARCHAR(36)   NOT NULL,
        \`recommendation_code\`           VARCHAR(64)   NOT NULL,
        \`recommendation_type\`           ENUM(
          'TRAINING','PROCUREMENT','PROTOCOL','STAFFING',
          'RESUSGPS_UPDATE','CURRICULUM_UPDATE','CARE_SIGNAL_RULE','INSTITUTIONAL_PROCESS','OTHER'
        ) NOT NULL,
        \`recommendation_text\`           TEXT          NOT NULL,
        \`target_audience\`               ENUM(
          'INDIVIDUAL_PROVIDER','FACILITY','NETWORK','MINISTRY','CURRICULUM_TEAM','RESUSGPS_TEAM'
        ) NOT NULL,
        \`confidence_level_at_generation\` VARCHAR(64)  NOT NULL,
        \`evidence_basis\`                TEXT          NOT NULL COMMENT 'JSON: {observational_count, experimental_references, expert_references, adaptive_evidence}',
        \`governance_status\`             ENUM('PENDING','APPROVED','REJECTED','SUPERSEDED') NOT NULL DEFAULT 'PENDING',
        \`governance_approved_by\`        VARCHAR(36)   NULL,
        \`governance_approved_at\`        DATETIME(3)   NULL,
        \`governance_notes\`              TEXT          NULL,
        \`superseded_by_id\`              VARCHAR(36)   NULL,
        \`valid_from\`                    DATETIME(3)   NULL,
        \`valid_until\`                   DATETIME(3)   NULL,
        \`created_at\`                    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`created_by\`                    VARCHAR(36)   NOT NULL DEFAULT 'system',
        PRIMARY KEY (\`id\`),
        KEY \`idx_kbrec_pattern\` (\`source_pattern_id\`),
        KEY \`idx_kbrec_status\` (\`governance_status\`),
        CONSTRAINT \`fk_kbrec_pattern\` FOREIGN KEY (\`source_pattern_id\`) REFERENCES \`kb_patterns\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // ── H. kb_interventions ─────────────────────────────────────────────────
    await createTableIfMissing(conn, "kb_interventions", `
      CREATE TABLE \`kb_interventions\` (
        \`id\`                        VARCHAR(36)   NOT NULL DEFAULT (UUID()),
        \`recommendation_id\`         VARCHAR(36)   NOT NULL,
        \`committing_entity_type\`    ENUM('FACILITY','NETWORK','MINISTRY','TRAINING_INSTITUTION','OTHER') NOT NULL,
        \`committing_entity_id\`      VARCHAR(36)   NOT NULL COMMENT 'facility UUID or other entity ID — never a facility name',
        \`intervention_scope\`        ENUM('ED_ONLY','WARD','HOSPITAL_WIDE','NETWORK','NATIONAL') NOT NULL,
        \`intervention_description\`  TEXT          NOT NULL,
        \`planned_implementation_date\` DATE        NULL,
        \`defined_outcome_measure\`   TEXT          NOT NULL,
        \`evaluation_window_months\`  TINYINT       NOT NULL DEFAULT 6,
        \`intervention_status\`       ENUM('PLANNED','IN_PROGRESS','COMPLETED','ABANDONED') NOT NULL DEFAULT 'PLANNED',
        \`status_updated_at\`         DATETIME(3)   NULL,
        \`abandonment_reason\`        TEXT          NULL,
        \`created_at\`                DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`created_by\`                VARCHAR(36)   NOT NULL,
        \`updated_at\`                DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        KEY \`idx_kbint_rec\` (\`recommendation_id\`),
        CONSTRAINT \`fk_kbint_rec\` FOREIGN KEY (\`recommendation_id\`) REFERENCES \`kb_recommendations\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // ── I. kb_implementations ───────────────────────────────────────────────
    await createTableIfMissing(conn, "kb_implementations", `
      CREATE TABLE \`kb_implementations\` (
        \`id\`                          VARCHAR(36)   NOT NULL DEFAULT (UUID()),
        \`intervention_id\`             VARCHAR(36)   NOT NULL,
        \`actual_implementation_date\`  DATE          NULL,
        \`actual_scope\`                ENUM('ED_ONLY','WARD','HOSPITAL_WIDE','NETWORK','NATIONAL') NULL,
        \`modifications_from_plan\`     TEXT          NULL,
        \`implementation_fidelity\`     ENUM('HIGH','PARTIAL','LOW','NOT_IMPLEMENTED') NULL,
        \`outcome_label\`               ENUM('IMPROVED','NO_IMPROVEMENT','WORSENED','EVALUATION_PENDING') NULL
          COMMENT 'NEVER auto-assigned — requires human Knowledge Stewardship review',
        \`outcome_evidence_notes\`      TEXT          NULL,
        \`outcome_observation_ids\`     TEXT          NULL COMMENT 'JSON array of observation IDs',
        \`outcome_recorded_at\`         DATETIME(3)   NULL,
        \`outcome_recorded_by\`         VARCHAR(36)   NULL,
        \`confidence_impact_applied\`   TINYINT(1)    NOT NULL DEFAULT 0,
        \`created_at\`                  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`created_by\`                  VARCHAR(36)   NOT NULL,
        \`updated_at\`                  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        KEY \`idx_kbimp_intervention\` (\`intervention_id\`),
        KEY \`idx_kbimp_outcome\` (\`outcome_label\`),
        CONSTRAINT \`fk_kbimp_intervention\` FOREIGN KEY (\`intervention_id\`) REFERENCES \`kb_interventions\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // ── J. kb_review_schedule ───────────────────────────────────────────────
    await createTableIfMissing(conn, "kb_review_schedule", `
      CREATE TABLE \`kb_review_schedule\` (
        \`id\`               VARCHAR(36)   NOT NULL DEFAULT (UUID()),
        \`pattern_id\`       VARCHAR(36)   NOT NULL,
        \`review_due_at\`    DATETIME(3)   NOT NULL,
        \`review_type\`      ENUM('SCHEDULED','TRIGGERED_BY_NEW_EVIDENCE','TRIGGERED_BY_CONCEPT_DRIFT','MANUAL') NOT NULL,
        \`review_status\`    ENUM('PENDING','IN_PROGRESS','COMPLETED','DEFERRED') NOT NULL DEFAULT 'PENDING',
        \`reviewed_at\`      DATETIME(3)   NULL,
        \`reviewed_by\`      VARCHAR(36)   NULL,
        \`review_outcome\`   ENUM(
          'CONFIDENCE_MAINTAINED','CONFIDENCE_UPGRADED','CONFIDENCE_DOWNGRADED',
          'PATTERN_RETIRED','PATTERN_SPLIT','DEFERRED_TO_NEXT_CYCLE'
        ) NULL,
        \`review_notes\`     TEXT          NULL,
        \`next_review_due_at\` DATETIME(3) NULL,
        \`created_at\`       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        KEY \`idx_kbrs_due\` (\`review_due_at\`, \`review_status\`),
        CONSTRAINT \`fk_kbrs_pattern\` FOREIGN KEY (\`pattern_id\`) REFERENCES \`kb_patterns\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // ── K. kb_content_versions ──────────────────────────────────────────────
    await createTableIfMissing(conn, "kb_content_versions", `
      CREATE TABLE \`kb_content_versions\` (
        \`id\`                               VARCHAR(36)   NOT NULL DEFAULT (UUID()),
        \`content_type\`                     ENUM(
          'RESUSGPS_PATHWAY','MICROCOURSE_CONTENT','CARE_SIGNAL_RULE',
          'FELLOWSHIP_CURRICULUM','ERS_STANDARD','OTHER'
        ) NOT NULL,
        \`content_identifier\`               VARCHAR(255)  NOT NULL,
        \`content_version\`                  VARCHAR(32)   NOT NULL,
        \`change_description\`               TEXT          NOT NULL,
        \`source_pattern_ids\`               TEXT          NULL COMMENT 'JSON array of kb_patterns.id',
        \`source_recommendation_ids\`        TEXT          NULL COMMENT 'JSON array of kb_recommendations.id',
        \`external_guideline_reference\`     TEXT          NULL,
        \`knowledge_stewardship_approved_by\` VARCHAR(36)  NOT NULL,
        \`knowledge_stewardship_approved_at\` DATETIME(3)  NOT NULL,
        \`deployed_at\`                      DATETIME(3)   NULL,
        \`deprecated_at\`                    DATETIME(3)   NULL,
        \`deprecated_by_version_id\`         VARCHAR(36)   NULL,
        \`created_at\`                       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_kbcv_identifier_version\` (\`content_type\`, \`content_identifier\`, \`content_version\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // ── L. kb_governance_audit (APPEND-ONLY) ────────────────────────────────
    await createTableIfMissing(conn, "kb_governance_audit", `
      CREATE TABLE \`kb_governance_audit\` (
        \`id\`             VARCHAR(36)   NOT NULL DEFAULT (UUID()),
        \`actor_user_id\`  VARCHAR(36)   NOT NULL COMMENT '"system" for automated actions',
        \`action_type\`    ENUM(
          'PATTERN_CREATED','PATTERN_CONFIDENCE_CHANGED','PATTERN_RETIRED','PATTERN_REINSTATED',
          'RECOMMENDATION_APPROVED','RECOMMENDATION_REJECTED','RECOMMENDATION_SUPERSEDED',
          'CONTENT_VERSION_APPROVED','CONTENT_VERSION_DEPLOYED',
          'IMPLEMENTATION_OUTCOME_LABELLED','REVIEW_COMPLETED','OTHER'
        ) NOT NULL,
        \`entity_type\`    ENUM(
          'PATTERN','FAILURE_MODE','SUCCESS_FACTOR','RECOMMENDATION',
          'INTERVENTION','IMPLEMENTATION','CONTENT_VERSION','REVIEW'
        ) NOT NULL,
        \`entity_id\`      VARCHAR(36)   NOT NULL,
        \`previous_state\` TEXT          NULL COMMENT 'JSON — null for creation actions',
        \`new_state\`      TEXT          NULL COMMENT 'JSON — null for deletion actions',
        \`reasoning\`      TEXT          NULL,
        \`created_at\`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        COMMENT 'APPEND-ONLY — no UPDATE or DELETE ever permitted on this table',
        PRIMARY KEY (\`id\`),
        KEY \`idx_kbga_entity\` (\`entity_type\`, \`entity_id\`),
        KEY \`idx_kbga_actor\` (\`actor_user_id\`),
        KEY \`idx_kbga_created\` (\`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // ── Additional indexes ───────────────────────────────────────────────────
    await createIndexIfMissing(conn, "kb_patterns", "idx_kbp_status",
      "ALTER TABLE `kb_patterns` ADD INDEX `idx_kbp_status` (`knowledge_status`)");
    await createIndexIfMissing(conn, "kb_patterns", "idx_kbp_track",
      "ALTER TABLE `kb_patterns` ADD INDEX `idx_kbp_track` (`pattern_track`)");
    await createIndexIfMissing(conn, "kb_patterns", "idx_kbp_domain",
      "ALTER TABLE `kb_patterns` ADD INDEX `idx_kbp_domain` (`primary_domain`)");
    await createIndexIfMissing(conn, "kb_patterns", "idx_kbp_confidence",
      "ALTER TABLE `kb_patterns` ADD INDEX `idx_kbp_confidence` (`confidence_level`)");
    await createIndexIfMissing(conn, "kb_patterns", "idx_kbp_review_due",
      "ALTER TABLE `kb_patterns` ADD INDEX `idx_kbp_review_due` (`review_due_at`)");
    await createIndexIfMissing(conn, "kb_pattern_observations", "idx_kbpo_source",
      "ALTER TABLE `kb_pattern_observations` ADD INDEX `idx_kbpo_source` (`observation_source`, `observation_id`)");
    await createIndexIfMissing(conn, "kb_pattern_observations", "idx_kbpo_period",
      "ALTER TABLE `kb_pattern_observations` ADD INDEX `idx_kbpo_period` (`observation_period`)");
    await createIndexIfMissing(conn, "kb_pattern_observations", "idx_kbpo_country",
      "ALTER TABLE `kb_pattern_observations` ADD INDEX `idx_kbpo_country` (`country`)");
    await createIndexIfMissing(conn, "kb_pattern_observations", "idx_kbpo_condition",
      "ALTER TABLE `kb_pattern_observations` ADD INDEX `idx_kbpo_condition` (`condition_category`)");

    console.log("[0057] FPKB schema migration complete. 11 tables ready.");
    console.log("[0057] Next step: run apply-0058-fpkb-seed.mjs to insert taxonomy v1.0 data.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[0057] Fatal error:", err);
  process.exit(1);
});
