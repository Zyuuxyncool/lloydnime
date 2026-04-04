/**
 * Helper untuk fetch data dari GitHub snapshots atau fallback ke live API
 * Prioritas:
 * 1. GitHub Raw snapshots (5 menit fresh)
 * 2. Fallback ke live API kalau GitHub fails
 */

const GITHUB_REPO = 'Zyuuxyncool/lloydnime';
const GITHUB_BRANCH = 'main';
const SNAPSHOTS_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/public/api-snapshots`;

// Fallback ke live API (kalau GitHub unavailable)
const LIVE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-otakudesu-zeta.vercel.app';

export async function getOtakudesuData(endpoint) {
  const snapshotUrl = `${SNAPSHOTS_BASE}/${endpoint}.json`;
  const liveUrl = `${LIVE_API_URL}/otakudesu/${endpoint}`;

  try {
    // Coba GitHub snapshot dulu (bergaransi 5 menit fresh)
    console.log(`[Snapshot] Trying: ${snapshotUrl}`);
    const snapshotRes = await fetch(snapshotUrl, { cache: 'no-store' });

    if (snapshotRes.ok) {
      const data = await snapshotRes.json();
      console.log(`[Snapshot] ✅ Success`);
      return {
        data,
        source: 'snapshot', // Biar tahu data dari mana
        timestamp: new Date().toISOString(),
      };
    }

    console.log(`[Snapshot] ⚠️ Status ${snapshotRes.status}, fallback ke live API`);
  } catch (error) {
    console.log(`[Snapshot] ⚠️ Error: ${error.message}, fallback ke live API`);
  }

  // Fallback ke live API
  try {
    console.log(`[Live API] Trying: ${liveUrl}`);
    const liveRes = await fetch(liveUrl, { cache: 'no-store' });

    if (liveRes.ok) {
      const data = await liveRes.json();
      console.log(`[Live API] ✅ Success`);
      return {
        data,
        source: 'live', // Data dari live API (bisa delayed kalau upstream 403)
        timestamp: new Date().toISOString(),
      };
    }

    console.log(`[Live API] ❌ Status ${liveRes.status}`);
    throw new Error(`HTTP ${liveRes.status}`);
  } catch (error) {
    console.error(`[Live API] ❌ Fatal error: ${error.message}`);
    return {
      data: null,
      source: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Wrapper untuk endpoint tertentu dengan retry logic
 */
export async function fetchOtakudesuEndpoint(endpoint, options = {}) {
  const { retries = 2, timeout = 10000 } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await Promise.race([
        getOtakudesuData(endpoint),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeout)
        ),
      ]);

      if (result.data || result.source === 'live') {
        return result;
      }
    } catch (error) {
      console.warn(`[Attempt ${attempt}/${retries}] Failed:`, error.message);

      if (attempt < retries) {
        // Wait before retry
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }

  return {
    data: null,
    source: 'error',
    error: 'All attempts failed',
    timestamp: new Date().toISOString(),
  };
}
