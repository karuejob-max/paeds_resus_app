import mysql from "mysql2/promise";
import { resolveDbConfig } from "./db-connection-config.mjs";

const config = await resolveDbConfig();
const connection = await mysql.createConnection(config);
try {
  const [emailColumns] = await connection.query("SHOW COLUMNS FROM globalEntitlements LIKE 'recipientEmailHash'");
  if (!emailColumns.length) {
    await connection.query("ALTER TABLE globalEntitlements ADD COLUMN recipientEmailHash varchar(64) NULL AFTER accessCodePrefix");
    console.log("[0155] Added globalEntitlements.recipientEmailHash");
  } else {
    console.log("[0155] recipientEmailHash already exists");
  }

  const [tables] = await connection.query("SHOW TABLES LIKE 'providerProfessionalRoles'");
  if (!tables.length) {
    await connection.query(`
      CREATE TABLE providerProfessionalRoles (
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
        KEY providerProfessionalRoles_userId_idx (userId),
        CONSTRAINT providerProfessionalRoles_user_fk FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("[0155] Created providerProfessionalRoles");
  } else {
    console.log("[0155] providerProfessionalRoles already exists");
  }

  console.log("[0155] Identity and workspace hardening migration applied successfully.");
} finally {
  await connection.end();
}

export {};
