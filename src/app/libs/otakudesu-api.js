const DEFAULT_OTAKUDESU_API_URL = 'https://api-otakudesu-zeta.vercel.app';

export function getOtakudesuApiUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || DEFAULT_OTAKUDESU_API_URL).replace(/\/+$/, '');
}