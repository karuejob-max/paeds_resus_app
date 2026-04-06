#!/usr/bin/env node

/**
 * E2E Test: ResusGPS Session → Analytics → UI Flow
 * 
 * Tests the complete pipeline:
 * 1. Simulate ResusGPS session completion
 * 2. Verify recordSession tRPC call
 * 3. Check analytics event created
 * 4. Verify FellowshipProgressCard can query updated progress
 * 5. Verify ConditionHeatmap can query facility patterns
 * 
 * Run: node scripts/test-resus-e2e.mjs
 */

import fetch from 'node-fetch';
import { randomUUID } from 'crypto';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/trpc`;

// Test user credentials (must exist in DB)
const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-' + randomUUID();
const TEST_INSTITUTION_ID = process.env.TEST_INSTITUTION_ID || 'test-inst-' + randomUUID();

let testsPassed = 0;
let testsFailed = 0;

async function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '✓',
    error: '✗',
    warn: '⚠',
    debug: '→',
  }[level] || '•';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

async function test(name, fn) {
  try {
    await log(`Testing: ${name}`, 'debug');
    await fn();
    testsPassed++;
    await log(`PASS: ${name}`);
  } catch (error) {
    testsFailed++;
    await log(`FAIL: ${name}`, 'error');
    console.error(`  Error: ${error.message}`);
  }
}

async function callTRPC(procedure, input) {
  const response = await fetch(`${API_URL}/${procedure}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`tRPC Error: ${JSON.stringify(data.error)}`);
  }

  return data.result?.data;
}

async function runTests() {
  await log('Starting ResusGPS Analytics E2E Tests');
  await log(`Base URL: ${BASE_URL}`);
  await log(`Test User ID: ${TEST_USER_ID}`);
  await log(`Test Institution ID: ${TEST_INSTITUTION_ID}`);
  console.log('');

  // Test 1: Record a ResusGPS session
  await test('Record ResusGPS session', async () => {
    const sessionId = `session-${randomUUID()}`;
    const result = await callTRPC('resusSessionAnalytics.recordSession', {
      pathway: 'septic_shock_protocol',
      durationSeconds: 420,
      interactionsCount: 12,
      patientAge: 5,
      patientWeight: 18,
      sessionId,
      notes: 'E2E test session',
    });

    if (!result?.success) {
      throw new Error('Session recording failed');
    }
  });

  // Test 2: Record multiple sessions for different conditions
  await test('Record sessions for multiple conditions', async () => {
    const conditions = [
      { pathway: 'cardiac_arrest_protocol', condition: 'cardiac_arrest' },
      { pathway: 'airway_emergency_protocol', condition: 'airway_emergency' },
    ];

    for (const { pathway, condition } of conditions) {
      const sessionId = `session-${condition}-${randomUUID()}`;
      const result = await callTRPC('resusSessionAnalytics.recordSession', {
        pathway,
        durationSeconds: 300 + Math.random() * 300,
        interactionsCount: 8 + Math.floor(Math.random() * 8),
        patientAge: 3 + Math.floor(Math.random() * 15),
        patientWeight: 12 + Math.random() * 30,
        sessionId,
        notes: `E2E test for ${condition}`,
      });

      if (!result?.success) {
        throw new Error(`Failed to record ${condition} session`);
      }
    }
  });

  // Test 3: Query user progress (FellowshipProgressCard)
  await test('Query user fellowship progress', async () => {
    const result = await callTRPC('fellowshipPathways.getUserProgress', {});

    if (!result?.conditions || !Array.isArray(result.conditions)) {
      throw new Error('Invalid progress response');
    }

    if (result.totalConditions !== 27) {
      throw new Error(`Expected 27 conditions, got ${result.totalConditions}`);
    }

    await log(`  User has ${result.completedConditions} completed conditions`, 'debug');
    await log(`  User has ${result.inProgressConditions} in-progress conditions`, 'debug');
  });

  // Test 4: Query institution heatmap (ConditionHeatmap)
  await test('Query institution condition heatmap', async () => {
    const result = await callTRPC('fellowshipPathways.getInstitutionHeatmap', {
      institutionId: TEST_INSTITUTION_ID,
      daysBack: 30,
    });

    if (!result?.conditions || !Array.isArray(result.conditions)) {
      throw new Error('Invalid heatmap response');
    }

    await log(`  Facility has ${result.conditions.length} conditions tracked`, 'debug');

    const withSessions = result.conditions.filter(c => c.totalSessions > 0);
    await log(`  ${withSessions.length} conditions have sessions`, 'debug');

    if (result.gaps && result.gaps.length > 0) {
      await log(`  ${result.gaps.length} training gaps identified`, 'debug');
    }
  });

  // Test 5: Validate pathway-condition mapping
  await test('Validate pathway-condition mapping', async () => {
    const result = await callTRPC('fellowshipPathways.getPathwayMapping', {
      pathway: 'septic_shock_protocol',
    });

    if (!result?.conditions || !Array.isArray(result.conditions)) {
      throw new Error('Invalid pathway mapping response');
    }

    if (result.conditions.length === 0) {
      throw new Error('No conditions mapped to septic_shock_protocol');
    }

    await log(`  ${result.conditions.length} conditions mapped to septic_shock_protocol`, 'debug');
  });

  // Test 6: Validate session depth scoring
  await test('Validate session depth scoring', async () => {
    const sessionId = `session-depth-${randomUUID()}`;
    const result = await callTRPC('resusSessionAnalytics.recordSession', {
      pathway: 'meningitis_protocol',
      durationSeconds: 600, // Long session = higher depth
      interactionsCount: 15, // Many interactions = higher depth
      patientAge: 8,
      patientWeight: 25,
      sessionId,
      notes: 'High-depth test session',
    });

    if (!result?.depthScore) {
      throw new Error('Depth score not calculated');
    }

    if (result.depthScore < 0 || result.depthScore > 3) {
      throw new Error(`Invalid depth score: ${result.depthScore}`);
    }

    await log(`  Depth score calculated: ${result.depthScore.toFixed(2)}`, 'debug');
  });

  // Test 7: Verify analytics event creation
  await test('Verify analytics event creation', async () => {
    const result = await callTRPC('adminStats.getAnalyticsEvents', {
      limit: 10,
      eventType: 'resusGps_session_completed',
    });

    if (!result?.events || !Array.isArray(result.events)) {
      throw new Error('Invalid analytics events response');
    }

    const recentEvent = result.events[0];
    if (!recentEvent) {
      throw new Error('No recent analytics events found');
    }

    await log(`  Latest event: ${recentEvent.eventType}`, 'debug');
    await log(`  Event timestamp: ${recentEvent.timestamp}`, 'debug');
  });

  // Test 8: Test CSV export data structure
  await test('Test CSV export data structure', async () => {
    const result = await callTRPC('fellowshipPathways.getInstitutionHeatmap', {
      institutionId: TEST_INSTITUTION_ID,
      daysBack: 30,
    });

    // Simulate CSV generation
    const csvHeaders = [
      'Condition',
      'Total Sessions',
      'Unique Providers',
      'Last Practiced',
      'Days Since',
      'Trend',
    ];

    const csvRows = result.conditions.map(c => [
      c.name,
      c.totalSessions,
      c.uniqueProviders,
      c.lastPracticed,
      c.daysSinceLast,
      c.trend,
    ]);

    if (csvRows.length === 0) {
      throw new Error('No rows to export');
    }

    await log(`  CSV would have ${csvRows.length} rows`, 'debug');
  });

  console.log('');
  await log(`Tests Complete: ${testsPassed} passed, ${testsFailed} failed`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
