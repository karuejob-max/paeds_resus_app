#!/usr/bin/env node

/**
 * Seed script for KMHFL facilities table.
 * Populates kmhflFacilities with a representative sample of Kenyan health facilities.
 * Run: node scripts/seed-kmhfl-facilities.mjs
 */

import { getDb } from "../server/db.ts";
import { kmhflFacilities } from "../drizzle/schema.ts";

const facilities = [
  // Nairobi
  { name: "Kenyatta National Hospital", code: "KNH-001", county: "Nairobi", facilityType: "hospital", operationalStatus: "operational" },
  { name: "Aga Khan University Hospital", code: "AKUH-001", county: "Nairobi", facilityType: "hospital", operationalStatus: "operational" },
  { name: "Nairobi Hospital", code: "NH-001", county: "Nairobi", facilityType: "hospital", operationalStatus: "operational" },
  { name: "MP Shah Hospital", code: "MPSH-001", county: "Nairobi", facilityType: "hospital", operationalStatus: "operational" },
  { name: "Coptic Hospital", code: "CH-001", county: "Nairobi", facilityType: "hospital", operationalStatus: "operational" },
  { name: "Nairobi City County Hospital", code: "NCCH-001", county: "Nairobi", facilityType: "hospital", operationalStatus: "operational" },

  // Nyeri
  { name: "Consolata Hospital Mathari", code: "CHM-001", county: "Nyeri", facilityType: "hospital", operationalStatus: "operational" },
  { name: "Nyeri County Hospital", code: "NCH-001", county: "Nyeri", facilityType: "hospital", operationalStatus: "operational" },
  { name: "Nyeri Provincial General Hospital", code: "NPGH-001", county: "Nyeri", facilityType: "hospital", operationalStatus: "operational" },

  // Karen
  { name: "Karen Hospital", code: "KH-001", county: "Nairobi", facilityType: "hospital", operationalStatus: "operational" },
  { name: "The Nairobi Clinic", code: "TNC-001", county: "Nairobi", facilityType: "clinic", operationalStatus: "operational" },

  // Kiambu
  { name: "Kiambu County Hospital", code: "KCH-001", county: "Kiambu", facilityType: "hospital", operationalStatus: "operational" },
  { name: "Thika Level 5 Hospital", code: "TH5-001", county: "Kiambu", facilityType: "hospital", operationalStatus: "operational" },

  // Mombasa
  { name: "Mombasa County Hospital", code: "MCH-001", county: "Mombasa", facilityType: "hospital", operationalStatus: "operational" },
  { name: "The Aga Khan Hospital Mombasa", code: "AKHM-001", county: "Mombasa", facilityType: "hospital", operationalStatus: "operational" },

  // Kisumu
  { name: "Kisumu County Hospital", code: "KCH-002", county: "Kisumu", facilityType: "hospital", operationalStatus: "operational" },
  { name: "Jaramogi Oginga Odinga Teaching and Referral Hospital", code: "JOOTRH-001", county: "Kisumu", facilityType: "hospital", operationalStatus: "operational" },

  // Nakuru
  { name: "Nakuru County Hospital", code: "NCH-002", county: "Nakuru", facilityType: "hospital", operationalStatus: "operational" },
  { name: "Nakuru Level 5 Hospital", code: "NH5-001", county: "Nakuru", facilityType: "hospital", operationalStatus: "operational" },

  // Eldoret
  { name: "Eldoret Teaching and Referral Hospital", code: "ETRH-001", county: "Uasin Gishu", facilityType: "hospital", operationalStatus: "operational" },
  { name: "Moi Teaching and Referral Hospital", code: "MTRH-001", county: "Uasin Gishu", facilityType: "hospital", operationalStatus: "operational" },

  // Kericho
  { name: "Kericho County Hospital", code: "KCH-003", county: "Kericho", facilityType: "hospital", operationalStatus: "operational" },

  // Machakos
  { name: "Machakos County Hospital", code: "MCH-002", county: "Machakos", facilityType: "hospital", operationalStatus: "operational" },

  // Naivasha
  { name: "Naivasha Subcounty Hospital", code: "NSH-001", county: "Nakuru", facilityType: "hospital", operationalStatus: "operational" },

  // Muranga
  { name: "Murang'a County Hospital", code: "MCH-003", county: "Murang'a", facilityType: "hospital", operationalStatus: "operational" },

  // Embu
  { name: "Embu County Hospital", code: "ECH-001", county: "Embu", facilityType: "hospital", operationalStatus: "operational" },

  // Meru
  { name: "Meru County Hospital", code: "MCH-004", county: "Meru", facilityType: "hospital", operationalStatus: "operational" },

  // Kisii
  { name: "Kisii County Hospital", code: "KCH-004", county: "Kisii", facilityType: "hospital", operationalStatus: "operational" },

  // Migori
  { name: "Migori County Hospital", code: "MCH-005", county: "Migori", facilityType: "hospital", operationalStatus: "operational" },

  // Homabay
  { name: "Homabay County Hospital", code: "HCH-001", county: "Homabay", facilityType: "hospital", operationalStatus: "operational" },

  // Siaya
  { name: "Siaya County Hospital", code: "SCH-001", county: "Siaya", facilityType: "hospital", operationalStatus: "operational" },

  // Bungoma
  { name: "Bungoma County Hospital", code: "BCH-001", county: "Bungoma", facilityType: "hospital", operationalStatus: "operational" },

  // Busia
  { name: "Busia County Hospital", code: "BCH-002", county: "Busia", facilityType: "hospital", operationalStatus: "operational" },

  // Vihiga
  { name: "Vihiga County Hospital", code: "VCH-001", county: "Vihiga", facilityType: "hospital", operationalStatus: "operational" },

  // Kakamega
  { name: "Kakamega County Hospital", code: "KCH-005", county: "Kakamega", facilityType: "hospital", operationalStatus: "operational" },

  // Nandi
  { name: "Nandi County Hospital", code: "NCH-003", county: "Nandi", facilityType: "hospital", operationalStatus: "operational" },

  // Bomet
  { name: "Bomet County Hospital", code: "BCH-003", county: "Bomet", facilityType: "hospital", operationalStatus: "operational" },

  // Samburu
  { name: "Samburu County Hospital", code: "SCH-002", county: "Samburu", facilityType: "hospital", operationalStatus: "operational" },

  // Turkana
  { name: "Turkana County Hospital", code: "TCH-001", county: "Turkana", facilityType: "hospital", operationalStatus: "operational" },

  // West Pokot
  { name: "West Pokot County Hospital", code: "WPCH-001", county: "West Pokot", facilityType: "hospital", operationalStatus: "operational" },

  // Laikipia
  { name: "Laikipia County Hospital", code: "LCH-001", county: "Laikipia", facilityType: "hospital", operationalStatus: "operational" },

  // Isiolo
  { name: "Isiolo County Hospital", code: "ICH-001", county: "Isiolo", facilityType: "hospital", operationalStatus: "operational" },

  // Garissa
  { name: "Garissa County Hospital", code: "GCH-001", county: "Garissa", facilityType: "hospital", operationalStatus: "operational" },

  // Wajir
  { name: "Wajir County Hospital", code: "WCH-001", county: "Wajir", facilityType: "hospital", operationalStatus: "operational" },

  // Mandera
  { name: "Mandera County Hospital", code: "MCH-006", county: "Mandera", facilityType: "hospital", operationalStatus: "operational" },

  // Makueni
  { name: "Makueni County Hospital", code: "MCH-007", county: "Makueni", facilityType: "hospital", operationalStatus: "operational" },

  // Kwale
  { name: "Kwale County Hospital", code: "KCH-006", county: "Kwale", facilityType: "hospital", operationalStatus: "operational" },

  // Kilifi
  { name: "Kilifi County Hospital", code: "KCH-007", county: "Kilifi", facilityType: "hospital", operationalStatus: "operational" },

  // Tana River
  { name: "Tana River County Hospital", code: "TRCH-001", county: "Tana River", facilityType: "hospital", operationalStatus: "operational" },

  // Lamu
  { name: "Lamu County Hospital", code: "LCH-002", county: "Lamu", facilityType: "hospital", operationalStatus: "operational" },
];

async function seedKmhflFacilities() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("Failed to connect to database");
      process.exit(1);
    }

    console.log(`Seeding ${facilities.length} KMHFL facilities...`);

    // Insert facilities
    const result = await db.insert(kmhflFacilities).values(facilities);
    console.log(`✓ Successfully seeded ${facilities.length} facilities`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding KMHFL facilities:", error);
    process.exit(1);
  }
}

seedKmhflFacilities();
