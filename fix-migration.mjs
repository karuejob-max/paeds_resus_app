import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import crypto from 'crypto';

const env = readFileSync('.env', 'utf8');
const match = env.match(/DATABASE_URL=(.+)/);
if (!match) throw new Error('DATABASE_URL not found in .env');
const url = match[1].trim().replace(/^["']|["']$/g, '');

console.log('Connecting...');
const conn = await mysql.createConnection(url);

// Step A: Delete the wrong 0034 record we inserted earlier
await conn.query("DELETE FROM `__drizzle_migrations` WHERE `hash` = 'fe379de657f2fbd25d39fdb9d9cb58e154515aa289d615964d104b955e6b2659'");
console.log('Removed old 0034 record.');

// Step B: Insert correct 0034 record (no-op SQL)
const noopSql = '-- Migration 0034: no-op. Column `resusGpsAccessExpiresAt` was already added by migration 0033.\nSELECT 1;\n';
const hash0034 = crypto.createHash('sha256').update(noopSql).digest('hex');
await conn.query("INSERT INTO `__drizzle_migrations` (`hash`, `created_at`) VALUES (?, ?)", [hash0034, 1776408757379]);
console.log('Inserted correct 0034 record. Hash:', hash0034);

// Step C: Apply migration 0035 (capstoneSubmissions table) directly
console.log('\nApplying migration 0035...');
const sql0035 = readFileSync('./drizzle/0035_worthless_famine.sql', 'utf8');
const hash0035 = crypto.createHash('sha256').update(sql0035).digest('hex');
try {
  await conn.query(sql0035);
  await conn.query("INSERT INTO `__drizzle_migrations` (`hash`, `created_at`) VALUES (?, ?)", [hash0035, 1776872061837]);
  console.log('✅ Migration 0035 applied.');
} catch (e) {
  if (e.code === 'ER_TABLE_EXISTS_ERROR') {
    console.log('⚠️  Table already exists, marking as applied.');
    await conn.query("INSERT IGNORE INTO `__drizzle_migrations` (`hash`, `created_at`) VALUES (?, ?)", [hash0035, 1776872061837]);
  } else { throw e; }
}

// Step D: Apply migration 0036 (microCourses.isPublished column)
console.log('\nApplying migration 0036...');
const sql0036 = readFileSync('./drizzle/0036_safe_wilson_fisk.sql', 'utf8');
const hash0036 = crypto.createHash('sha256').update(sql0036).digest('hex');
try {
  await conn.query(sql0036);
  await conn.query("INSERT INTO `__drizzle_migrations` (`hash`, `created_at`) VALUES (?, ?)", [hash0036, 1776872368057]);
  console.log('✅ Migration 0036 applied.');
} catch (e) {
  if (e.code === 'ER_DUP_FIELDNAME') {
    console.log('⚠️  Column already exists, marking as applied.');
    await conn.query("INSERT IGNORE INTO `__drizzle_migrations` (`hash`, `created_at`) VALUES (?, ?)", [hash0036, 1776872368057]);
  } else { throw e; }
}

const [rows] = await conn.query('SELECT id, hash, created_at FROM `__drizzle_migrations` ORDER BY created_at DESC LIMIT 5');
console.table(rows);
await conn.end();
console.log('\n✅ All done! Run pnpm db:push to confirm.');
