import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

/**
 * Migration 0120 — governed all-ages UTL readiness checklist.
 *
 * The seeded template is deliberately `draft`: a facility Resuscitation
 * Committee/pharmacy/clinical-governance owner must approve local formulations,
 * quantities, locations, and enabled age/setting modules before UTL use.
 */
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0120] DATABASE_URL is required.");
  process.exit(1);
}

const ITEMS = [
  { code: "cart_present_accessible", category: "access", label: "Crash cart present, accessible, and route known", kind: "access", age: "universal", urgency: "immediate", critical: true, functionCheck: false },
  { code: "cart_seal_or_security", category: "access", label: "Cart seal/security intact or access exception documented", kind: "safety", age: "universal", urgency: "immediate", critical: true, functionCheck: false },
  { code: "oxygen_source", category: "breathing", label: "Oxygen source, regulator, tubing, and backup route", kind: "equipment", age: "universal", urgency: "immediate", critical: true, functionCheck: true },
  { code: "suction_function", category: "airway", label: "Suction device, tubing, and collection canister", kind: "equipment", age: "universal", urgency: "immediate", critical: true, functionCheck: true },
  { code: "defibrillator_self_test", category: "monitoring", label: "Defibrillator/AED available and self-test passed", kind: "equipment", age: "universal", urgency: "immediate", critical: true, functionCheck: true },
  { code: "adult_defib_pads", category: "monitoring", label: "Adult defibrillation pads/paddles, facility-approved", kind: "equipment", age: "adolescent_adult", urgency: "immediate", critical: true, functionCheck: false },
  { code: "paediatric_defib_pads", category: "monitoring", label: "Paediatric defibrillation pads/paddles, facility-approved", kind: "equipment", age: "infant_child", urgency: "immediate", critical: true, functionCheck: false },
  { code: "neonatal_resuscitation_interface", category: "airway", label: "Neonatal resuscitation interface and approved newborn equipment", kind: "equipment", age: "neonatal", urgency: "immediate", critical: true, functionCheck: false },
  { code: "adult_bvm_masks", category: "breathing", label: "Adult BVM and required mask sizes", kind: "equipment", age: "adolescent_adult", urgency: "immediate", critical: true, functionCheck: false },
  { code: "paediatric_bvm_masks", category: "breathing", label: "Infant/child BVM and required mask sizes", kind: "equipment", age: "infant_child", urgency: "immediate", critical: true, functionCheck: false },
  { code: "neonatal_bvm_masks", category: "breathing", label: "Neonatal BVM and required mask sizes", kind: "equipment", age: "neonatal", urgency: "immediate", critical: true, functionCheck: false },
  { code: "airway_adjuncts", category: "airway", label: "Age-appropriate airway adjuncts, locally approved", kind: "equipment", age: "universal", urgency: "accessible", critical: true, functionCheck: false },
  { code: "vascular_access_supplies", category: "circulation", label: "IV access supplies across required sizes", kind: "equipment", age: "universal", urgency: "immediate", critical: true, functionCheck: false },
  { code: "io_access_supplies", category: "circulation", label: "IO access device and approved needle sizes", kind: "equipment", age: "infant_child", urgency: "accessible", critical: true, functionCheck: false },
  { code: "fluids_and_admin_sets", category: "circulation", label: "Facility-approved emergency fluids and administration sets", kind: "equipment", age: "universal", urgency: "accessible", critical: true, functionCheck: false },
  { code: "approved_epinephrine_formulation", category: "medications", label: "Facility-approved adrenaline/epinephrine formulation and expiry checked", kind: "drug", age: "universal", urgency: "immediate", critical: true, expiryCheck: true },
  { code: "approved_glucose_formulation", category: "medications", label: "Facility-approved glucose/dextrose formulation and expiry checked", kind: "drug", age: "universal", urgency: "accessible", critical: true, expiryCheck: true },
  { code: "age_band_emergency_medicines", category: "medications", label: "Age-band emergency medicines approved by local pharmacy and resuscitation governance", kind: "drug", age: "universal", urgency: "accessible", critical: true, expiryCheck: true },
  { code: "ppe_and_sharps", category: "safety", label: "PPE, sharps container, clinical waste bags, and hand hygiene supplies", kind: "safety", age: "universal", urgency: "immediate", critical: true, functionCheck: false },
  { code: "emergency_algorithms_current", category: "guidance", label: "Current locally approved emergency algorithms and escalation contacts", kind: "document", age: "universal", urgency: "accessible", critical: true, functionCheck: false },
  { code: "neonatal_module", category: "local_module", label: "Neonatal-at-birth module enabled and locally approved where applicable", kind: "document", age: "neonatal", urgency: "accessible", critical: false, functionCheck: false },
  { code: "maternity_module", category: "local_module", label: "Maternity module enabled and locally approved where applicable", kind: "document", age: "maternity", urgency: "accessible", critical: false, functionCheck: false },
  { code: "trauma_module", category: "local_module", label: "Trauma module enabled and locally approved where applicable", kind: "document", age: "trauma", urgency: "accessible", critical: false, functionCheck: false },
];

const conn = await createMysqlConnection(databaseUrl, mysql);
try {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS iers_readiness_templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      institution_id INT NOT NULL,
      template_name VARCHAR(128) NOT NULL,
      template_version VARCHAR(32) NOT NULL,
      status ENUM('draft','approved','active','superseded') NOT NULL DEFAULT 'active',
      approved_by_user_id INT NULL,
      approved_at TIMESTAMP NULL,
      effective_from DATE NOT NULL,
      superseded_at TIMESTAMP NULL,
      created_by_user_id INT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY iers_readiness_templates_institution_version_unique (institution_id, template_version),
      KEY iers_readiness_templates_institution_status_idx (institution_id, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await conn.query(`
    CREATE TABLE IF NOT EXISTS iers_readiness_template_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      template_id INT NOT NULL,
      item_code VARCHAR(96) NOT NULL,
      category VARCHAR(64) NOT NULL,
      item_label VARCHAR(255) NOT NULL,
      item_kind ENUM('equipment','drug','safety','document','access') NOT NULL,
      age_band ENUM('universal','neonatal','infant_child','adolescent_adult','maternity','trauma','local') NOT NULL,
      urgency ENUM('immediate','accessible') NOT NULL,
      is_critical BOOLEAN NOT NULL DEFAULT FALSE,
      expected_quantity INT NULL,
      quantity_unit VARCHAR(32) NULL,
      requires_expiry_check BOOLEAN NOT NULL DEFAULT FALSE,
      requires_function_check BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY iers_readiness_template_items_code_unique (template_id, item_code),
      KEY iers_readiness_template_items_order_idx (template_id, sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await conn.query(`
    CREATE TABLE IF NOT EXISTS iers_utl_readiness_checks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      institution_id INT NOT NULL,
      pole_id INT NOT NULL,
      department_id INT NOT NULL,
      team_id INT NULL,
      shift_utl_roster_id INT NULL,
      template_id INT NOT NULL,
      checked_by_user_id INT NOT NULL,
      idempotency_key VARCHAR(128) NOT NULL,
      status ENUM('draft','submitted','ready','ready_with_gaps','not_ready','superseded') NOT NULL DEFAULT 'draft',
      attestation VARCHAR(500) NOT NULL,
      general_note TEXT NULL,
      checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY iers_utl_readiness_checks_institution_checked_idx (institution_id, checked_at),
      KEY iers_utl_readiness_checks_team_status_idx (team_id, status),
      UNIQUE KEY iers_utl_readiness_checks_idempotency_unique (checked_by_user_id, idempotency_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await conn.query(`
    CREATE TABLE IF NOT EXISTS iers_utl_readiness_check_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      check_id INT NOT NULL,
      template_item_id INT NOT NULL,
      item_status ENUM('present_and_functional','present_not_tested','missing','expired','damaged','insufficient_quantity','inaccessible','not_applicable','not_observed') NOT NULL,
      observed_quantity INT NULL,
      expiry_date DATE NULL,
      function_tested BOOLEAN NULL,
      note VARCHAR(1000) NULL,
      is_critical_gap BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY iers_utl_readiness_check_items_check_item_unique (check_id, template_item_id),
      KEY iers_utl_readiness_check_items_check_status_idx (check_id, item_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await conn.query(`
    INSERT IGNORE INTO iers_readiness_templates
      (institution_id, template_name, template_version, status, effective_from, created_by_user_id)
    SELECT ia.id, 'Core + age-band emergency readiness', 'v1', 'draft', CURRENT_DATE, ia.userId
    FROM institutionalAccounts ia
    WHERE ia.status = 'active'
  `);
  const [templates] = await conn.query(`SELECT id FROM iers_readiness_templates WHERE template_version = 'v1'`);
  for (const template of templates) {
    for (const [sortOrder, item] of ITEMS.entries()) {
      await conn.query(
        `INSERT IGNORE INTO iers_readiness_template_items
          (template_id, item_code, category, item_label, item_kind, age_band, urgency, is_critical, requires_expiry_check, requires_function_check, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [template.id, item.code, item.category, item.label, item.kind, item.age, item.urgency, item.critical, Boolean(item.expiryCheck), Boolean(item.functionCheck), sortOrder],
      );
    }
  }
  console.log(`[0120] Readiness schema is ready; seeded ${ITEMS.length} review-required core/age-band items per active institution template.`);
} finally {
  await conn.end();
}
