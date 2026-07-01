/**
 * Otakudesu Snapshot Helper
 * Fetches data from GitHub snapshots or falls back to live API
 */

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/Zyuuxyncool/lloydnime/main/public/api-snapshots';
const LIVE_API_URL = (process.env.OTAKUDESU_API_URL || 'http://152.42.181.126/otakudesu').replace(/\/+$/, '');
const LOCAL_API_URL = '/otakudesu'; // Use local proxy

/**
 * Fetch data from a specific Otakudesu endpoint
 * @param {string} endpoint - The endpoint (e.g., 'home', 'schedule', 'anime/attack-on-titan-sub-indo')
 * @param {object} options - Additional options
 * @returns {Promise<{data: any, source: string}>}
 */
export async function fetchOtakudesuEndpoint(endpoint, options = {}) {
  const { useLocal = true, useSnapshot = true, useLocal: preferLocal = true } = options;

  try {
    // Priority 1: Try local proxy API first (if enabled)
    if (useLocal) {
      try {
        console.log(`[Snapshot Helper] Trying local proxy: ${LOCAL_API_URL}/${endpoint}`);
        const response = await fetch(`${LOCAL_API_URL}/${endpoint}`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`[Snapshot Helper] ✓ Got data from local proxy`);
          return { data, source: 'local-proxy' };
        }
      } catch (error) {
        console.warn(`[Snapshot Helper] Local proxy failed: ${error.message}`);
      }
    }

    // Priority 2: Try GitHub snapshot (if enabled)
    if (useSnapshot) {
      try {
        const snapshotPath = endpoint === 'home' ? 'home.json' : 
                            endpoint === 'schedule' ? 'schedule.json' :
                            endpoint.startsWith('anime/') ? 'anime.json' : 
                            endpoint.startsWith('genre/') ? 'genre.json' :
                            null;

        if (snapshotPath) {
          console.log(`[Snapshot Helper] Trying GitHub snapshot: ${GITHUB_RAW_URL}/${snapshotPath}`);
          const response = await fetch(`${GITHUB_RAW_URL}/${snapshotPath}`, {
            cache: 'force-cache', // Cache GitHub snapshots aggressively
            signal: AbortSignal.timeout(5000),
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`[Snapshot Helper] ✓ Got data from GitHub snapshot`);
            return { data, source: 'github-snapshot' };
          }
        }
      } catch (error) {
        console.warn(`[Snapshot Helper] GitHub snapshot failed: ${error.message}`);
      }
    }

    // Priority 3: Fall back to live API
    try {
      console.log(`[Snapshot Helper] Falling back to live API: ${LIVE_API_URL}/${endpoint}`);
      const response = await fetch(`${LIVE_API_URL}/${endpoint}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[Snapshot Helper] ✓ Got data from live API`);
        return { data, source: 'live-api' };
      }

      throw new Error(`API returned status ${response.status}`);
    } catch (error) {
      console.error(`[Snapshot Helper] Live API failed: ${error.message}`);
      throw error;
    }
  } catch (error) {
    console.error(`[Snapshot Helper] All sources failed:`, error);
    throw new Error(`Failed to fetch ${endpoint} from any source: ${error.message}`);
  }
}

/**
 * Fetch with fallback strategy
 */
export async function fetchOtakudesuWithFallback(endpoint) {
  try {
    return await fetchOtakudesuEndpoint(endpoint, {
      useLocal: true,
      useSnapshot: true,
    });
  } catch (error) {
    console.error(`[Snapshot Helper] Final fallback failed for ${endpoint}:`, error);
    return {
      data: null,
      source: 'failed',
      error: error.message,
    };
  }
}
