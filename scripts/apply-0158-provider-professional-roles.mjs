import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[0158] DATABASE_URL is required.");
  process.exit(1);
}

const connection = await createMysqlConnection(databaseUrl, mysql);

try {
  const [rows] = await connection.query("SHOW TABLES LIKE ?", ["providerProfessionalRoles"]);
  if (rows.length) {
    console.log("[0158] providerProfessionalRoles already exists");
  } else {
    await connection.query(`CREATE TABLE providerProfessionalRoles (
      id int NOT NULL AUTO_INCREMENT,
      userId int NOT NULL,
      cadre varchar(128) NOT NULL,
      cadreOther varchar(128) NULL,
      specialization varchar(255) NULL,
      isPrimary boolean NOT NULL DEFAULT false,
      status enum('active','archived') NOT NULL DEFAULT 'active',
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY providerProfessionalRoles_user_status_idx (userId, status),
      KEY providerProfessionalRoles_user_cadre_status_idx (userId, cadre, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log("[0158] Created providerProfessionalRoles");
  }
  console.log("[0158] Provider professional roles migration applied successfully.");
} finally {
  await connection.end();
}

export {};

/* c8 ignore next */
