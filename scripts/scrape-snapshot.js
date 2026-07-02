#!/usr/bin/env node

/**
 * Scrape Otakudesu API data and save as snapshots
 * Used by GitHub Actions workflow
 */

const fs = require('fs');
const path = require('path');

const API_URL = (process.env.API_URL || process.env.OTAKUDESU_API_URL || 'http://165.22.52.169:3001/otakudesu/').replace(/\/+$/, '');
const SNAPSHOTS_DIR = path.join(__dirname, '..', 'public', 'api-snapshots');

// Ensure directory exists
if (!fs.existsSync(SNAPSHOTS_DIR)) {
  fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  console.log(`✓ Created snapshots directory: ${SNAPSHOTS_DIR}`);
}

/**
 * Fetch data from Otakudesu API
 */
async function fetchAPI(endpoint) {
  try {
    const url = `${API_URL}/${endpoint}`;
    console.log(`📡 Fetching: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Otakudesu-Snapshot-Scraper/1.0',
        'Accept': 'application/json',
      },
      timeout: 15000,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error fetching ${endpoint}:`, error.message);
    return null;
  }
}

/**
 * Save data to JSON file
 */
function saveSnapshot(filename, data) {
  if (!data) {
    console.warn(`⚠️  Skipping ${filename} - no data`);
    return false;
  }

  try {
    const filepath = path.join(SNAPSHOTS_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`✓ Saved: ${filename} (${JSON.stringify(data).length} bytes)`);
    return true;
  } catch (error) {
    console.error(`❌ Error saving ${filename}:`, error.message);
    return false;
  }
}

/**
 * Main scraping process
 */
async function main() {
  console.log('\n🚀 Starting Otakudesu snapshot scrape...\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`Save to: ${SNAPSHOTS_DIR}\n`);

  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;

  // Endpoints to scrape
  const endpoints = [
    { endpoint: 'otakudesu/home', filename: 'home.json' },
    { endpoint: 'otakudesu/schedule', filename: 'schedule.json' },
    // Add more endpoints as needed:
    // { endpoint: 'otakudesu/search?q=attack', filename: 'search-example.json' },
  ];

  for (const { endpoint, filename } of endpoints) {
    const data = await fetchAPI(endpoint);
    if (saveSnapshot(filename, data)) {
      successCount++;
    } else {
      failureCount++;
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const duration = (Date.now() - startTime) / 1000;
  console.log(`\n✅ Scrape complete! (${duration.toFixed(2)}s)`);
  console.log(`📊 Results: ${successCount} ✓ saved, ${failureCount} ✗ failed\n`);

  process.exit(failureCount > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
