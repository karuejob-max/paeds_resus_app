#!/usr/bin/env node

/**
 * Migration script to fix missing columns in users table
 * Run with: node scripts/fix-users-schema.mjs
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

async function fixUsersSchema() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    
    // Parse DATABASE_URL
    const url = new URL(DATABASE_URL);
    const config = {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: url.searchParams.get('ssl-mode') === 'REQUIRED' ? 'Amazon RootCA1' : false,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
    };

    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database');

    // Check current columns
    console.log('\n📋 Checking current users table structure...');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = ?
      ORDER BY ORDINAL_POSITION
    `, [url.pathname.slice(1)]);

    console.log('Current columns:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (nullable: ${col.IS_NULLABLE})`);
    });

    const existingColumns = new Set(columns.map(c => c.COLUMN_NAME));

    // Define required columns
    const requiredColumns = [
      { name: 'passwordHash', type: 'VARCHAR(255)', nullable: true },
      { name: 'loginMethod', type: 'VARCHAR(64)', nullable: true },
      { name: 'providerType', type: "ENUM('nurse', 'doctor', 'pharmacist', 'paramedic', 'lab_tech', 'respiratory_therapist', 'midwife', 'other')", nullable: true },
      { name: 'userType', type: "ENUM('individual', 'institutional', 'parent')", nullable: false, default: "'individual'" },
      { name: 'lastSignedIn', type: 'TIMESTAMP', nullable: false, default: 'CURRENT_TIMESTAMP' },
    ];

    // Add missing columns
    const missingColumns = requiredColumns.filter(col => !existingColumns.has(col.name));

    if (missingColumns.length === 0) {
      console.log('\n✅ All required columns already exist!');
    } else {
      console.log(`\n🔧 Adding ${missingColumns.length} missing column(s)...`);
      
      for (const col of missingColumns) {
        const nullableStr = col.nullable ? 'NULL' : 'NOT NULL';
        const defaultStr = col.default ? `DEFAULT ${col.default}` : '';
        const sql = `ALTER TABLE users ADD COLUMN ${col.name} ${col.type} ${nullableStr} ${defaultStr}`.trim();
        
        try {
          await connection.query(sql);
          console.log(`  ✅ Added column: ${col.name}`);
        } catch (err) {
          console.error(`  ❌ Failed to add column ${col.name}:`, err.message);
        }
      }
    }

    // Verify the fix
    console.log('\n🔍 Verifying schema fix...');
    const [finalColumns] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = ?
      ORDER BY ORDINAL_POSITION
    `, [url.pathname.slice(1)]);

    console.log('Final columns:');
    finalColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
    });

    // Test the login query
    console.log('\n🧪 Testing login query...');
    const [testResult] = await connection.query(`
      SELECT \`id\`, \`openId\`, \`name\`, \`email\`, \`phone\`, \`loginMethod\`, \`passwordHash\`, \`role\`, \`providerType\`, \`userType\`, \`createdAt\`, \`updatedAt\`, \`lastSignedIn\`
      FROM \`users\`
      LIMIT 1
    `);

    if (testResult.length > 0) {
      console.log('✅ Login query works! Sample result:');
      console.log(JSON.stringify(testResult[0], null, 2));
    } else {
      console.log('⚠️  Login query works but no users in table');
    }

    console.log('\n✅ Schema fix completed successfully!');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixUsersSchema();
