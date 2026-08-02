import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

async function run() {
  console.log("=== Running Migration 0082: IERMS Institutional Portal Tables ===");
  const db = await mysql.createConnection(connectionString);

  try {
    // 1. Add governance_role column to institutionalStaffMembers if missing
    const [cols] = await db.query(
      `SHOW COLUMNS FROM institutionalStaffMembers LIKE 'governance_role'`
    );
    if (cols.length === 0) {
      console.log("Adding governance_role to institutionalStaffMembers...");
      await db.query(`
        ALTER TABLE institutionalStaffMembers 
        ADD COLUMN governance_role ENUM('executive', 'erc_chair', 'erc_member', 'er_coordinator', 'unit_team_leader', 'ert_leader', 'ert_responder', 'general_staff') 
        DEFAULT 'general_staff'
      `);
    } else {
      console.log("Column governance_role already exists.");
    }

    // 2. Create facility_poles table
    console.log("Creating facility_poles table if not exists...");
    await db.query(`
      CREATE TABLE IF NOT EXISTS facility_poles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institution_id INT NOT NULL,
        pole_name VARCHAR(128) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Create facility_departments table
    console.log("Creating facility_departments table if not exists...");
    await db.query(`
      CREATE TABLE IF NOT EXISTS facility_departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institution_id INT NOT NULL,
        pole_id INT NULL,
        department_name VARCHAR(128) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Create ertl_weekly_rotations table
    console.log("Creating ertl_weekly_rotations table if not exists...");
    await db.query(`
      CREATE TABLE IF NOT EXISTS ertl_weekly_rotations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institution_id INT NOT NULL,
        pole_id INT NOT NULL,
        department_id INT NOT NULL,
        week_number INT NOT NULL,
        year INT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Create shift_utl_rosters table
    console.log("Creating shift_utl_rosters table if not exists...");
    await db.query(`
      CREATE TABLE IF NOT EXISTS shift_utl_rosters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institution_id INT NOT NULL,
        pole_id INT NOT NULL,
        department_id INT NOT NULL,
        shift_date DATE NOT NULL,
        shift_type ENUM('morning', 'evening', 'night') NOT NULL,
        utl_user_id INT NOT NULL,
        is_shift_ertl TINYINT(1) DEFAULT 0 NOT NULL,
        readiness_signoff_at TIMESTAMP NULL,
        status ENUM('active', 'completed', 'absent') DEFAULT 'active' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Create ierms_audit_scorecards table
    console.log("Creating ierms_audit_scorecards table if not exists...");
    await db.query(`
      CREATE TABLE IF NOT EXISTS ierms_audit_scorecards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institution_id INT NOT NULL,
        auditor_user_id INT NOT NULL,
        audit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        domain1_score INT NOT NULL,
        domain2_score INT NOT NULL,
        domain3_score INT NOT NULL,
        domain4_score INT NOT NULL,
        domain5_score INT NOT NULL,
        total_score INT NOT NULL,
        accreditation_level ENUM('level_1_unprepared', 'level_2_baseline', 'level_3_certified', 'level_4_exemplar') NOT NULL,
        notes TEXT,
        valid_until TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. Create equipment_audit_logs table
    console.log("Creating equipment_audit_logs table if not exists...");
    await db.query(`
      CREATE TABLE IF NOT EXISTS equipment_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institution_id INT NOT NULL,
        department VARCHAR(128) NOT NULL,
        audited_by_user_id INT NOT NULL,
        audit_type ENUM('daily_seal_check', 'monthly_100_percent') NOT NULL,
        cart_seal_intact TINYINT(1) DEFAULT 1 NOT NULL,
        has_paeds_airways TINYINT(1) DEFAULT 1 NOT NULL,
        has_paeds_bvm TINYINT(1) DEFAULT 1 NOT NULL,
        has_io_needles TINYINT(1) DEFAULT 1 NOT NULL,
        has_paeds_defib_pads TINYINT(1) DEFAULT 1 NOT NULL,
        has_paeds_suction TINYINT(1) DEFAULT 1 NOT NULL,
        deficits_found TEXT,
        audit_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 8. Create ierms_implementation_trackers table
    console.log("Creating ierms_implementation_trackers table if not exists...");
    await db.query(`
      CREATE TABLE IF NOT EXISTS ierms_implementation_trackers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        institution_id INT NOT NULL,
        phase1_status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending' NOT NULL,
        phase2_status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending' NOT NULL,
        phase3_status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending' NOT NULL,
        phase4_status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending' NOT NULL,
        target_completion_date DATE NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log("Migration 0082 completed successfully.");
  } catch (err) {
    console.error("Migration 0082 failed:", err);
    process.exit(1);
  } finally {
    await db.end();
  }
}

run();
