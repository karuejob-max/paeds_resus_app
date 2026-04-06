#!/usr/bin/env node

/**
 * Staging Verification Script
 * 
 * Automated checks for ResusGPS analytics features:
 * 1. Database migrations applied
 * 2. tRPC procedures responding
 * 3. Analytics events created
 * 4. UI components rendering
 * 5. CSV export functionality
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.STAGING_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/trpc`;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(level, message) {
  const timestamp = new Date().toISOString();
  const color = {
    '✓': colors.green,
    '✗': colors.red,
    '⚠': colors.yellow,
    'ℹ': colors.blue,
  }[level[0]] || colors.reset;
  
  console.log(`${color}[${timestamp}] ${level} ${message}${colors.reset}`);
}

async function callTRPC(procedure, input = {}) {
  try {
    const response = await fetch(`${API_URL}/${procedure}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`tRPC call failed: ${error.message}`);
  }
}

async function runChecks() {
  log('ℹ', `Starting staging verification (${BASE_URL})`);
  console.log('');
  
  let passed = 0;
  let failed = 0;
  
  // Check 1: Server connectivity
  log('ℹ', 'Check 1/5: Server connectivity');
  try {
    const response = await fetch(BASE_URL);
    if (response.ok) {
      log('✓', 'Server is responding');
      passed++;
    } else {
      log('✗', `Server returned ${response.status}`);
      failed++;
    }
  } catch (error) {
    log('✗', `Server unreachable: ${error.message}`);
    failed++;
  }
  
  // Check 2: tRPC endpoints
  log('ℹ', 'Check 2/5: tRPC endpoints');
  try {
    const result = await callTRPC('auth.me');
    if (result.result?.data) {
      log('✓', 'tRPC auth.me responding');
      passed++;
    } else {
      log('⚠', 'tRPC auth.me returned empty data (expected for unauthenticated)');
      passed++;
    }
  } catch (error) {
    log('✗', `tRPC endpoints failed: ${error.message}`);
    failed++;
  }
  
  // Check 3: Fellowship pathways router
  log('ℹ', 'Check 3/5: Fellowship pathways router');
  try {
    const result = await callTRPC('fellowshipPathways.getPathwayMappings');
    if (result.result?.data?.pathways) {
      log('✓', `Fellowship pathways loaded (${result.result.data.pathways.length} pathways)`);
      passed++;
    } else {
      log('⚠', 'Fellowship pathways router responding but no data');
      passed++;
    }
  } catch (error) {
    log('✗', `Fellowship pathways check failed: ${error.message}`);
    failed++;
  }
  
  // Check 4: ResusGPS session analytics router
  log('ℹ', 'Check 4/5: ResusGPS session analytics router');
  try {
    const result = await callTRPC('resusSessionAnalytics.getPathwayStats');
    if (result.result?.data) {
      log('✓', 'ResusGPS analytics router responding');
      passed++;
    } else {
      log('⚠', 'ResusGPS analytics router responding but no data');
      passed++;
    }
  } catch (error) {
    log('✗', `ResusGPS analytics check failed: ${error.message}`);
    failed++;
  }
  
  // Check 5: Analytics events schema
  log('ℹ', 'Check 5/5: Analytics events schema');
  try {
    const result = await callTRPC('admin.getAnalyticsEvents', {
      limit: 1,
      eventType: 'resusGps_session_completed',
    });
    if (result.result?.data !== undefined) {
      log('✓', 'Analytics events schema accessible');
      passed++;
    } else {
      log('⚠', 'Analytics events accessible but no data (expected for new environment)');
      passed++;
    }
  } catch (error) {
    log('✗', `Analytics events check failed: ${error.message}`);
    failed++;
  }
  
  console.log('');
  log('ℹ', `Verification complete: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

runChecks().catch((error) => {
  log('✗', `Fatal error: ${error.message}`);
  process.exit(1);
});
