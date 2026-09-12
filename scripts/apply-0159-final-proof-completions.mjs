import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0159] DATABASE_URL is required.");
  process.exit(1);
}

const connection = await createMysqlConnection(databaseUrl, mysql);

try {
  const [rows] = await connection.query("SHOW TABLES LIKE ?", ["externalTrainingCompletions"]);
  if (rows.length) {
    console.log("[0159] externalTrainingCompletions already exists");
  } else {
    await connection.query(`CREATE TABLE externalTrainingCompletions (
      id int NOT NULL AUTO_INCREMENT,
      recordKey varchar(255) NOT NULL,
      userId int NOT NULL,
      enrollmentId int NULL,
      pathway enum('ierp','nerp','open_enrolment','ilsp') NOT NULL,
      courseProgramType enum('bls','acls','pals','nrp','heartsaver','paeds_resus_ils') NOT NULL,
      phase2Completed boolean NOT NULL DEFAULT false,
      phase2CompletedAt timestamp NULL,
      phase3Completed boolean NOT NULL DEFAULT false,
      phase3CompletedAt timestamp NULL,
      evidenceReference text NULL,
      notes text NULL,
      recordedByUserId int NOT NULL,
      recordedByName varchar(255) NULL,
      recordedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      revokedAt timestamp NULL,
      revokedByUserId int NULL,
      revocationReason text NULL,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY external_training_completions_record_key_uq (recordKey),
      UNIQUE KEY external_training_completions_user_course_pathway_uq (userId, courseProgramType, pathway),
      KEY external_training_completions_user_idx (userId),
      KEY external_training_completions_course_idx (courseProgramType)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log("[0159] Created externalTrainingCompletions");
  }
  console.log("[0159] Final proof completion migration applied successfully.");
} finally {
  await connection.end();
}

export {};

/* c8 ignore next */
