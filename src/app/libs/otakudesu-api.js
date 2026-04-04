const DEFAULT_OTAKUDESU_API_URL = 'https://otaku-cache-worker.andreasnation970.workers.dev';

export function getOtakudesuApiUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || DEFAULT_OTAKUDESU_API_URL).replace(/\/+$/, '');
}