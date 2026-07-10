/**
 * Stopgap seed: well-known Kenyan hospitals into `careFacilities` (migration-free,
 * data-only — the table already exists).
 *
 * Context (see docs/WORK_STATUS.md): the global facility registry (healthsites.io
 * sync, KMHFR official API) is blocked on two separate external approvals with no
 * stated timeline. This script is NOT that — it's a stopgap so Care Signal's
 * FacilityPicker search actually finds major, well-known facilities (like Nyeri
 * County Referral Hospital, the one that originally surfaced this gap) in the
 * meantime. It seeds `careFacilities` directly, the same table the app already
 * searches today — no other code changes needed for these to show up in search.
 *
 * Idempotent: matched on `systemSlug`, safe to re-run.
 *
 * Accuracy note: this list was compiled from general knowledge of well-known
 * Kenyan public, county-referral, mission, and private hospitals — it has NOT
 * been cross-checked against an official registry (that's precisely what
 * Phases 2/3 will eventually replace it with). If you spot a wrong name, wrong
 * county, or a facility that's actually a different administrative level than
 * shown here, flag it and it can be corrected directly in this list before
 * re-running, or fixed later via the admin facility-merge tooling.
 *
 * facilityType mapping is a best fit against the existing 6-value enum
 * (primary_health_center / health_post / district_hospital / private_clinic /
 * ngo_clinic / other) — it does not have "national referral" or "mission
 * hospital" categories, so some choices below are approximations, consistent
 * with facility_level/facility_ownership being a documented, not-yet-built
 * gap on this table (see Observation Architecture v1.1 gap tracker).
 *
 * Run: pnpm run db:seed-kenya-hospitals
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { createMysqlConnection } from "./db-connection-config.mjs";

const HOSPITALS = [
  // ── National / tertiary referral ──────────────────────────────────────────
  { slug: "kh-knh", name: "Kenyatta National Hospital", county: "Nairobi", type: "other" },
  { slug: "kh-mtrh", name: "Moi Teaching and Referral Hospital", county: "Uasin Gishu", type: "other" },
  { slug: "kh-kutrrh", name: "Kenyatta University Teaching, Referral and Research Hospital", county: "Nairobi", type: "other" },

  // ── County referral hospitals ──────────────────────────────────────────────
  { slug: "kh-nyeri-county-referral", name: "Nyeri County Referral Hospital", county: "Nyeri", type: "district_hospital" },
  { slug: "kh-nakuru-level5", name: "Nakuru Level 5 Hospital", county: "Nakuru", type: "district_hospital" },
  { slug: "kh-jootrh", name: "Jaramogi Oginga Odinga Teaching and Referral Hospital", county: "Kisumu", type: "other" },
  { slug: "kh-coast-general", name: "Coast General Teaching and Referral Hospital", county: "Mombasa", type: "other" },
  { slug: "kh-machakos-level5", name: "Machakos Level 5 Hospital", county: "Machakos", type: "district_hospital" },
  { slug: "kh-meru-trh", name: "Meru Teaching and Referral Hospital", county: "Meru", type: "other" },
  { slug: "kh-embu-level5", name: "Embu Level 5 Hospital", county: "Embu", type: "district_hospital" },
  { slug: "kh-kakamega-general", name: "Kakamega County General Hospital", county: "Kakamega", type: "district_hospital" },
  { slug: "kh-garissa-referral", name: "Garissa County Referral Hospital", county: "Garissa", type: "district_hospital" },
  { slug: "kh-kitale-referral", name: "Kitale County Referral Hospital", county: "Trans Nzoia", type: "district_hospital" },
  { slug: "kh-kericho-referral", name: "Kericho County Referral Hospital", county: "Kericho", type: "district_hospital" },
  { slug: "kh-kisii-trh", name: "Kisii Teaching and Referral Hospital", county: "Kisii", type: "other" },
  { slug: "kh-bungoma-referral", name: "Bungoma County Referral Hospital", county: "Bungoma", type: "district_hospital" },
  { slug: "kh-nyahururu-referral", name: "Nyahururu County Referral Hospital", county: "Laikipia", type: "district_hospital" },
  { slug: "kh-nyamira-referral", name: "Nyamira County Referral Hospital", county: "Nyamira", type: "district_hospital" },
  { slug: "kh-kapenguria-referral", name: "Kapenguria County Referral Hospital", county: "West Pokot", type: "district_hospital" },
  { slug: "kh-kwale-referral", name: "Kwale County Referral Hospital", county: "Kwale", type: "district_hospital" },
  { slug: "kh-kilifi-county", name: "Kilifi County Hospital", county: "Kilifi", type: "district_hospital" },
  { slug: "kh-voi-referral", name: "Voi County Referral Hospital", county: "Taita Taveta", type: "district_hospital" },
  { slug: "kh-kiambu-level5", name: "Kiambu Level 5 Hospital", county: "Kiambu", type: "district_hospital" },
  { slug: "kh-thika-level5", name: "Thika Level 5 Hospital", county: "Kiambu", type: "district_hospital" },
  { slug: "kh-muranga-level5", name: "Murang'a Level 5 Hospital", county: "Murang'a", type: "district_hospital" },
  { slug: "kh-kerugoya-referral", name: "Kerugoya County Referral Hospital", county: "Kirinyaga", type: "district_hospital" },
  { slug: "kh-nyandarua-referral", name: "Nyandarua County Referral Hospital", county: "Nyandarua", type: "district_hospital" },
  { slug: "kh-kajiado-referral", name: "Kajiado County Referral Hospital", county: "Kajiado", type: "district_hospital" },
  { slug: "kh-narok-referral", name: "Narok County Referral Hospital", county: "Narok", type: "district_hospital" },
  { slug: "kh-bomet-referral", name: "Bomet County Referral Hospital", county: "Bomet", type: "district_hospital" },
  { slug: "kh-homabay-trh", name: "Homa Bay County Teaching and Referral Hospital", county: "Homa Bay", type: "other" },
  { slug: "kh-migori-referral", name: "Migori County Referral Hospital", county: "Migori", type: "district_hospital" },
  { slug: "kh-siaya-referral", name: "Siaya County Referral Hospital", county: "Siaya", type: "district_hospital" },
  { slug: "kh-busia-referral", name: "Busia County Referral Hospital", county: "Busia", type: "district_hospital" },
  { slug: "kh-vihiga-referral", name: "Vihiga County Referral Hospital", county: "Vihiga", type: "district_hospital" },
  { slug: "kh-isiolo-referral", name: "Isiolo County Referral Hospital", county: "Isiolo", type: "district_hospital" },
  { slug: "kh-marsabit-referral", name: "Marsabit County Referral Hospital", county: "Marsabit", type: "district_hospital" },
  { slug: "kh-wajir-referral", name: "Wajir County Referral Hospital", county: "Wajir", type: "district_hospital" },
  { slug: "kh-mandera-referral", name: "Mandera County Referral Hospital", county: "Mandera", type: "district_hospital" },
  { slug: "kh-lamu-referral", name: "Lamu County Referral Hospital", county: "Lamu", type: "district_hospital" },
  { slug: "kh-hola-referral", name: "Tana River (Hola) County Referral Hospital", county: "Tana River", type: "district_hospital" },
  { slug: "kh-maralal-referral", name: "Samburu County Referral Hospital", county: "Samburu", type: "district_hospital" },
  { slug: "kh-kabarnet-referral", name: "Baringo County Referral Hospital", county: "Baringo", type: "district_hospital" },
  { slug: "kh-iten-referral", name: "Elgeyo Marakwet County Referral Hospital", county: "Elgeyo Marakwet", type: "district_hospital" },
  { slug: "kh-lodwar-referral", name: "Turkana County Referral Hospital", county: "Turkana", type: "district_hospital" },
  { slug: "kh-makueni-referral", name: "Makueni County Referral Hospital", county: "Makueni", type: "district_hospital" },
  { slug: "kh-kitui-referral", name: "Kitui County Referral Hospital", county: "Kitui", type: "district_hospital" },
  { slug: "kh-chuka-referral", name: "Tharaka Nithi County Referral Hospital (Chuka)", county: "Tharaka Nithi", type: "district_hospital" },

  // ── Mission / faith-based ──────────────────────────────────────────────────
  { slug: "kh-consolata-mathari", name: "Consolata Hospital Mathari", county: "Nyeri", type: "ngo_clinic" },
  { slug: "kh-tenwek", name: "Tenwek Hospital", county: "Bomet", type: "ngo_clinic" },
  { slug: "kh-kijabe", name: "AIC Kijabe Hospital", county: "Kiambu", type: "ngo_clinic" },
  { slug: "kh-chogoria", name: "PCEA Chogoria Hospital", county: "Tharaka Nithi", type: "ngo_clinic" },
  { slug: "kh-mater", name: "Mater Misericordiae Hospital", county: "Nairobi", type: "ngo_clinic" },
  { slug: "kh-gertrudes", name: "Gertrude's Children's Hospital", county: "Nairobi", type: "ngo_clinic" },
  { slug: "kh-nazareth-kiambu", name: "Nazareth Hospital Kiambu", county: "Kiambu", type: "ngo_clinic" },

  // ── Major private ──────────────────────────────────────────────────────────
  { slug: "kh-akuh-nairobi", name: "Aga Khan University Hospital", county: "Nairobi", type: "private_clinic" },
  { slug: "kh-akh-kisumu", name: "Aga Khan Hospital Kisumu", county: "Kisumu", type: "private_clinic" },
  { slug: "kh-akh-mombasa", name: "The Aga Khan Hospital Mombasa", county: "Mombasa", type: "private_clinic" },
  { slug: "kh-nairobi-hospital", name: "The Nairobi Hospital", county: "Nairobi", type: "private_clinic" },
  { slug: "kh-mpshah", name: "MP Shah Hospital", county: "Nairobi", type: "private_clinic" },
  { slug: "kh-karen-hospital", name: "The Karen Hospital", county: "Nairobi", type: "private_clinic" },
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[seed-kenya-hospitals] DATABASE_URL is required.");
    process.exit(1);
  }

  const conn = await createMysqlConnection(databaseUrl, mysql);
  let created = 0, skipped = 0;

  try {
    console.log(`[seed-kenya-hospitals] Seeding ${HOSPITALS.length} well-known Kenyan hospitals into careFacilities...`);

    for (const h of HOSPITALS) {
      const [existing] = await conn.query(
        `SELECT id FROM careFacilities WHERE systemSlug = ? LIMIT 1`,
        [h.slug]
      );
      if (existing.length > 0) {
        skipped++;
        continue;
      }
      await conn.query(
        `INSERT INTO careFacilities (name, county, country, facilityType, isSystem, systemSlug)
         VALUES (?, ?, 'Kenya', ?, TRUE, ?)`,
        [h.name, h.county, h.type, h.slug]
      );
      created++;
      console.log(`[seed-kenya-hospitals]   + ${h.name} (${h.county})`);
    }

    console.log(`[seed-kenya-hospitals] Done. Created: ${created}, already existed: ${skipped}.`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[seed-kenya-hospitals] Fatal error:", err);
  process.exit(1);
});
