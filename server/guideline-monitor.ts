// @ts-nocheck
// Automated Guideline Monitoring System
// Tracks AHA/WHO/ACOG/ERC/ILCOR updates and flags protocols needing revision

import { getDb } from './db';
import { guidelines, guidelineChanges, protocolStatus } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Guideline source configurations
 * Each organization has RSS feeds, web scraping endpoints, or API access
 */
interface GuidelineSource {
  organization: string;
  name: string;
  rssFeed?: string;
  webUrl?: string;
  apiEndpoint?: string;
  checkInterval: number; // hours
  lastChecked?: Date;
}

const GUIDELINE_SOURCES: GuidelineSource[] = [
  {
    organization: 'AHA',
    name: 'American Heart Association',
    rssFeed: 'https://www.ahajournals.org/action/showFeed?type=etoc&feed=rss&jc=circ',
    webUrl: 'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines',
    checkInterval: 24, // Check daily
  },
  {
    organization: 'WHO',
    name: 'World Health Organization',
    webUrl: 'https://www.who.int/publications/guidelines',
    checkInterval: 168, // Check weekly (7 days)
  },
  {
    organization: 'ACOG',
    name: 'American College of Obstetricians and Gynecologists',
    webUrl: 'https://www.acog.org/clinical-information/practice-bulletins',
    checkInterval: 168, // Check weekly
  },
  {
    organization: 'ERC',
    name: 'European Resuscitation Council',
    webUrl: 'https://www.erc.edu/guidelines',
    checkInterval: 168, // Check weekly
  },
  {
    organization: 'ILCOR',
    name: 'International Liaison Committee on Resuscitation',
    webUrl: 'https://www.ilcor.org/consensus-on-science',
    checkInterval: 168, // Check weekly
  },
  {
    organization: 'AAP',
    name: 'American Academy of Pediatrics',
    webUrl: 'https://publications.aap.org/pediatrics',
    checkInterval: 168, // Check weekly
  },
];

/**
 * Protocol-to-guideline mapping
 * Maps each protocol ID to its source guidelines
 */
interface ProtocolGuidelineMapping {
  protocolId: string;
  protocolName: string;
  guidelines: {
    organization: string;
    category: string;
    relevance: 'primary' | 'secondary' | 'reference';
    specificSections?: string[];
  }[];
}

export const PROTOCOL_GUIDELINE_MAPPINGS: ProtocolGuidelineMapping[] = [
  // Cardiac Arrest Protocols
  {
    protocolId: 'cardiac_arrest',
    protocolName: 'Cardiac Arrest (Pediatric)',
    guidelines: [
      { organization: 'AHA', category: 'cardiac_arrest', relevance: 'primary', specificSections: ['PALS', 'BLS'] },
      { organization: 'ERC', category: 'cardiac_arrest', relevance: 'secondary' },
      { organization: 'ILCOR', category: 'cardiac_arrest', relevance: 'reference' },
    ],
  },
  {
    protocolId: 'neonatal_resuscitation',
    protocolName: 'Neonatal Resuscitation',
    guidelines: [
      { organization: 'AHA', category: 'neonatal', relevance: 'primary', specificSections: ['NRP'] },
      { organization: 'WHO', category: 'neonatal', relevance: 'secondary' },
      { organization: 'AAP', category: 'neonatal', relevance: 'primary' },
    ],
  },
  
  // Respiratory Emergencies
  {
    protocolId: 'status_asthmaticus',
    protocolName: 'Status Asthmaticus',
    guidelines: [
      { organization: 'WHO', category: 'respiratory', relevance: 'primary' },
      { organization: 'AAP', category: 'respiratory', relevance: 'secondary' },
    ],
  },
  {
    protocolId: 'anaphylaxis',
    protocolName: 'Anaphylaxis',
    guidelines: [
      { organization: 'AHA', category: 'cardiac_arrest', relevance: 'primary', specificSections: ['Anaphylaxis'] },
      { organization: 'WHO', category: 'general', relevance: 'secondary' },
    ],
  },
  
  // Shock Protocols
  {
    protocolId: 'septic_shock',
    protocolName: 'Septic Shock',
    guidelines: [
      { organization: 'WHO', category: 'shock', relevance: 'primary' },
      { organization: 'AAP', category: 'pediatric', relevance: 'secondary' },
    ],
  },
  {
    protocolId: 'hypovolemic_shock',
    protocolName: 'Hypovolemic Shock',
    guidelines: [
      { organization: 'AHA', category: 'shock', relevance: 'primary', specificSections: ['PALS'] },
      { organization: 'WHO', category: 'shock', relevance: 'secondary' },
    ],
  },
  
  // Metabolic Emergencies
  {
    protocolId: 'dka',
    protocolName: 'Diabetic Ketoacidosis',
    guidelines: [
      { organization: 'WHO', category: 'general', relevance: 'primary' },
      { organization: 'AAP', category: 'pediatric', relevance: 'primary' },
    ],
  },
  
  // Obstetric Emergencies
  {
    protocolId: 'eclampsia',
    protocolName: 'Eclampsia',
    guidelines: [
      { organization: 'ACOG', category: 'obstetric', relevance: 'primary' },
      { organization: 'WHO', category: 'obstetric', relevance: 'primary' },
    ],
  },
  {
    protocolId: 'postpartum_hemorrhage',
    protocolName: 'Postpartum Hemorrhage',
    guidelines: [
      { organization: 'ACOG', category: 'obstetric', relevance: 'primary' },
      { organization: 'WHO', category: 'obstetric', relevance: 'primary' },
    ],
  },
  {
    protocolId: 'maternal_cardiac_arrest',
    protocolName: 'Maternal Cardiac Arrest',
    guidelines: [
      { organization: 'AHA', category: 'cardiac_arrest', relevance: 'primary', specificSections: ['Maternal Resuscitation'] },
      { organization: 'ACOG', category: 'obstetric', relevance: 'primary' },
    ],
  },
  
  // Neurological Emergencies
  {
    protocolId: 'status_epilepticus',
    protocolName: 'Status Epilepticus',
    guidelines: [
      { organization: 'WHO', category: 'neurological', relevance: 'primary' },
      { organization: 'AAP', category: 'pediatric', relevance: 'secondary' },
    ],
  },
  {
    protocolId: 'stroke',
    protocolName: 'Stroke',
    guidelines: [
      { organization: 'AHA', category: 'general', relevance: 'primary', specificSections: ['Stroke Guidelines'] },
      { organization: 'WHO', category: 'neurological', relevance: 'secondary' },
    ],
  },
  {
    protocolId: 'meningitis',
    protocolName: 'Bacterial Meningitis',
    guidelines: [
      { organization: 'WHO', category: 'infectious', relevance: 'primary' },
      { organization: 'AAP', category: 'pediatric', relevance: 'secondary' },
    ],
  },
];

/**
 * Check for guideline updates from all sources
 * This would be called by a scheduled job (e.g., daily cron)
 */
export async function checkGuidelineUpdates(): Promise<{
  newGuidelines: number;
  updatedGuidelines: number;
  flaggedProtocols: number;
}> {
  let newGuidelines = 0;
  let updatedGuidelines = 0;
  let flaggedProtocols = 0;

  for (const source of GUIDELINE_SOURCES) {
    try {
      // Check if it's time to check this source
      if (source.lastChecked) {
        const hoursSinceLastCheck =
          (Date.now() - source.lastChecked.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastCheck < source.checkInterval) {
          continue; // Skip this source
        }
      }

      // Fetch latest guidelines from source
      const latestGuidelines = await fetchGuidelinesFromSource(source);

      for (const guideline of latestGuidelines) {
        // Check if guideline already exists
  const db = await getDb();
  if (!db) return [];
  const existing = await db
    .select()
    .from(guidelines)
          .where(eq(guidelines.title, guideline.title))
          .limit(1);

        if (existing.length === 0) {
          // New guideline - insert
         const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.insert(guidelines).values(guideline);
          newGuidelines++;

          // Flag affected protocols
          const affected = await flagAffectedProtocols(guideline);
          flaggedProtocols += affected;
        } else {
          // Check if guideline has been updated (compare document hash)
          const existingGuideline = existing[0];
          if (existingGuideline.documentHash !== guideline.documentHash) {
            // Guideline updated - create change record
            await db.insert(guidelineChanges).values({
              guidelineId: existingGuideline.id,
              previousVersion: existingGuideline.version,
              newVersion: guideline.version,
              changeType: 'major_revision',
              severity: 'high',
              changeDescription: `Guideline updated from ${existingGuideline.version} to ${guideline.version}`,
              affectedProtocols: [], // Will be populated by NLP analysis
              clinicalImpact: 'Pending review',
              detectedAt: new Date(),
              reviewStatus: 'pending',
            });

            // Update guideline record
            await db
              .update(guidelines)
              .set({
                version: guideline.version,
                publicationDate: guideline.publicationDate,
                documentHash: guideline.documentHash,
                status: 'current',
                updatedAt: new Date(),
              })
              .where(eq(guidelines.id, existingGuideline.id));

            // Mark old version as superseded
            await db
              .update(guidelines)
              .set({ status: 'superseded' })
              .where(eq(guidelines.id, existingGuideline.id));

            updatedGuidelines++;

            // Flag affected protocols
            const affected = await flagAffectedProtocols(guideline);
            flaggedProtocols += affected;
          }
        }
      }

      // Update last checked time
      source.lastChecked = new Date();
    } catch (error) {
      console.error(`Error checking guideline source ${source.organization}:`, error);
    }
  }

  return { newGuidelines, updatedGuidelines, flaggedProtocols };
}

/**
 * Fetch guidelines from a specific source
 * This is a placeholder - actual implementation would use RSS parsing, web scraping, or API calls
 */
async function fetchGuidelinesFromSource(
  source: GuidelineSource
): Promise<Array<{
  organization: string;
  title: string;
  version: string;
  publicationDate: Date;
  url: string;
  documentHash: string;
  category: string;
  summary: string;
}>> {
  // Placeholder implementation
  // In production, this would:
  // 1. Parse RSS feed if available
  // 2. Scrape web page if no RSS
  // 3. Call API if available
  // 4. Extract guideline metadata
  // 5. Download PDF and calculate hash for change detection

  // For now, return empty array
  // This would be replaced with actual implementation using:
  // - RSS parser (e.g., rss-parser npm package)
  // - Web scraper (e.g., cheerio, puppeteer)
  // - HTTP client (e.g., axios)

  return [];
}

/**
 * Flag protocols affected by guideline change
 */
async function flagAffectedProtocols(guideline: {
  organization: string;
  category: string;
}): Promise<number> {
  let flaggedCount = 0;

  // Find protocols that reference this guideline
  const affectedMappings = PROTOCOL_GUIDELINE_MAPPINGS.filter((mapping) =>
    mapping.guidelines.some(
      (g) => g.organization === guideline.organization && g.category === guideline.category
    )
  );

  for (const mapping of affectedMappings) {
    // Check if protocol status exists
    const existing = await db
      .select()
      .from(protocolStatus)
      .where(eq(protocolStatus.protocolId, mapping.protocolId))
      .limit(1);

    if (existing.length === 0) {
      // Create protocol status record
      await db.insert(protocolStatus).values({
        protocolId: mapping.protocolId,
        protocolName: mapping.protocolName,
        currentStatus: 'flagged',
        lastUpdated: new Date(),
        lastReviewed: new Date(),
        nextReviewDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        pendingChanges: 1,
        flagReason: `New guideline published by ${guideline.organization} in ${guideline.category} category`,
        priority: 'high',
      });
    } else {
      // Update existing protocol status
      await db
        .update(protocolStatus)
        .set({
          currentStatus: 'flagged',
          pendingChanges: (existing[0].pendingChanges || 0) + 1,
          flagReason: `Guideline updated by ${guideline.organization} in ${guideline.category} category`,
          priority: 'high',
          updatedAt: new Date(),
        })
        .where(eq(protocolStatus.id, existing[0].id));
    }

    flaggedCount++;
  }

  return flaggedCount;
}

/**
 * Calculate document hash for change detection
 */
export function calculateDocumentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Get protocols needing review
 */
export async function getProtocolsNeedingReview(): Promise<
  Array<{
    protocolId: string;
    protocolName: string;
    currentStatus: string;
    pendingChanges: number;
    flagReason: string;
    priority: string;
  }>
> {
  const db = await getDb();
  if (!db) return [];
  const flagged = await db
    .select()
    .from(protocolStatus)
    .where(eq(protocolStatus.currentStatus, 'flagged'));

  return flaggedProtocols.map((p) => ({
    protocolId: p.protocolId,
    protocolName: p.protocolName,
    currentStatus: p.currentStatus,
    pendingChanges: p.pendingChanges || 0,
    flagReason: p.flagReason || '',
    priority: p.priority,
  }));
}
