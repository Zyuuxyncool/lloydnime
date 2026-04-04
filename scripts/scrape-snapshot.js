#!/usr/bin/env node

/**
 * Script untuk scrape Otakudesu data dan simpan snapshot ke JSON
 * Run oleh GitHub Actions setiap 5 menit
 */

const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'https://api-otakudesu-zeta.vercel.app';
const SNAPSHOTS_DIR = path.join(process.cwd(), 'public', 'api-snapshots');

// Buat directory kalau belum ada
if (!fs.existsSync(SNAPSHOTS_DIR)) {
  fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

const ENDPOINTS = [
  { path: '/otakudesu/home', name: 'home' },
  { path: '/otakudesu/schedule', name: 'schedule' },
  { path: '/otakudesu/anime', name: 'anime' },
  { path: '/otakudesu/genre', name: 'genre' },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchEndpoint(endpoint) {
  const url = `${API_URL}${endpoint.path}`;
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] Fetching: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (GitHub Actions)',
      },
      timeout: 15000,
    });

    if (!response.ok) {
      console.error(`  ❌ Status ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Simpan snapshot
    const filename = path.join(SNAPSHOTS_DIR, `${endpoint.name}.json`);
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));

    console.log(`  ✅ Saved to ${endpoint.name}.json`);
    return data;
  } catch (error) {
    console.error(`  ❌ Error:`, error.message);
    return null;
  }
}

async function main() {
  console.log(`\n🚀 Starting snapshot job at ${new Date().toISOString()}`);
  console.log(`API URL: ${API_URL}`);
  console.log(`Snapshots dir: ${SNAPSHOTS_DIR}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const endpoint of ENDPOINTS) {
    const result = await fetchEndpoint(endpoint);
    if (result) {
      successCount++;
    } else {
      failCount++;
    }
    // Wait 1 second antara requests
    await sleep(1000);
  }

  console.log(`\n📊 Summary: ${successCount} success, ${failCount} failed`);
  console.log(`✨ Job completed at ${new Date().toISOString()}\n`);

  process.exit(failCount > 2 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
