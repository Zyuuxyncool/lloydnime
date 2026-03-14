import AnimeCard from '@/app/components/AnimeCard';
import SearchInput from '@/app/components/SearchInput';
import Navigation from '@/app/components/Navigation';
import BreadcrumbNavigation from '@/app/components/BreadcrumbNavigation';

function parseAnimeSlugFromHref(href = '') {
  const raw = String(href || '').trim();
  if (!raw) return '';

  const clean = raw.split(/[?#]/)[0];
  const match = clean.match(/\/anime\/anime\/([^/]+)/i);
  if (match?.[1]) return match[1].trim();

  const lastSegment = clean.split('/').filter(Boolean).pop() || '';
  return lastSegment.trim();
}

function normalizeTitleForMatch(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/season\s*(\d+)/gi, 's$1')
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(sub|indo|subtitle|indonesia|tv|movie|special|ona|ova)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreFallbackCandidate(item, candidate) {
  const titles = [
    item?.title,
    item?.title_english,
    item?.title_japanese,
  ].filter(Boolean);

  const candidateTitle = normalizeTitleForMatch(candidate?.title || '');
  const candidateSlug = normalizeTitleForMatch(candidate?.animeId || candidate?.slug || '');
  if (!candidateTitle && !candidateSlug) return 0;

  let score = 0;
  for (const title of titles) {
    const normalizedTitle = normalizeTitleForMatch(title);
    if (!normalizedTitle) continue;
    if (candidateTitle === normalizedTitle || candidateSlug === normalizedTitle) score += 100;
    if (candidateTitle.includes(normalizedTitle)) score += 25;
    if (normalizedTitle.includes(candidateTitle)) score += 15;

    for (const token of normalizedTitle.split(' ').filter(Boolean)) {
      if (candidateTitle.includes(token)) score += 4;
      if (candidateSlug.includes(token)) score += 3;
    }
  }

  return score;
}

async function resolveFallbackSlug(apiUrl, item) {
  const queries = [item?.title, item?.title_english, item?.title_japanese].filter(Boolean);
  if (!apiUrl || queries.length === 0) return null;

  const candidateMap = new Map();

  for (const query of queries) {
    try {
      const response = await fetch(`${apiUrl}/anime/search/${encodeURIComponent(query)}`, {
        next: { revalidate: 1800 }
      });

      if (!response.ok) continue;

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.toLowerCase().includes('application/json')) continue;

      const result = await response.json();
      const data = result?.data || result;
      const rawAnimes = data?.animeList || data?.animes || result?.animes || result?.animeList || [];

      for (const anime of rawAnimes) {
        const parsedFromHref = parseAnimeSlugFromHref(anime?.href || anime?.url || anime?.otakudesuUrl || '');
        const candidateSlug = anime?.animeId || anime?.slug || anime?.anime_id || parsedFromHref || anime?.id;
        if (!candidateSlug) continue;

        if (!candidateMap.has(candidateSlug)) {
          candidateMap.set(candidateSlug, {
            ...anime,
            animeId: candidateSlug,
          });
        }
      }
    } catch {
      continue;
    }
  }

  const ranked = [...candidateMap.values()]
    .map((candidate) => ({
      candidate,
      score: scoreFallbackCandidate(item, candidate),
    }))
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.score >= 12 ? ranked[0].candidate : null;
}

async function searchFallback(keyword, apiUrl) {
  try {
    const response = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(keyword)}&limit=20`,
      { next: { revalidate: 1800 } }
    );

    if (!response.ok) return [];

    const result = await response.json();
    const list = Array.isArray(result?.data) ? result.data : [];

    const processed = await Promise.all(
      list.map(async (item) => {
        const title = item?.title || item?.title_english || 'Unknown';
        const fallbackPoster = item?.images?.webp?.large_image_url || item?.images?.jpg?.image_url;
        const resolved = await resolveFallbackSlug(apiUrl, item);

        return {
          title: resolved?.title || title,
          slug: resolved?.animeId || resolved?.slug || null,
          poster: resolved?.poster || resolved?.image || resolved?.thumbnail || fallbackPoster,
          episode: resolved?.episode || resolved?.episodes || item?.episodes || '?',
          type: resolved?.type || item?.type || 'TV',
        };
      })
    );

    return processed.filter((anime) => Boolean(anime.title && anime.poster));
  } catch {
    return [];
  }
}

async function searchAnime(slug) {
  if (!slug) return [];

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-otakudesu-zeta.vercel.app';
    const keyword = decodeURIComponent(slug);
    const encodedKeyword = encodeURIComponent(keyword);
    
    const endpoints = [
      `${apiUrl}/anime/search/${encodedKeyword}`
    ];

    let animes = [];

    for (const searchUrl of endpoints) {
      try {
        const response = await fetch(searchUrl, {
          next: { revalidate: 600 }
        });

        if (!response.ok) {
          if (response.status >= 500) {
            console.error(`API error for "${keyword}": Status ${response.status}`);
          }
          continue;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.toLowerCase().includes('application/json')) {
          continue;
        }

        const result = await response.json();
        const data = result?.data || result;
        const rawAnimes = data?.animeList || data?.animes || result?.animes || result?.animeList || [];

        animes = rawAnimes.map((anime) => {
          // Prefer Otakudesu slug from href/animeId to avoid fallback to jikan-* URL.
          const parsedFromHref = parseAnimeSlugFromHref(anime?.href || anime?.url || anime?.otakudesuUrl || '');
          const normalizedSlug = anime?.animeId || anime?.slug || anime?.anime_id || parsedFromHref || anime?.id;
          
          return {
            ...anime,
            slug: normalizedSlug,
            poster: anime?.poster || anime?.image || anime?.thumbnail,
            episode: anime?.episode || anime?.episodes || anime?.latestEpisode,
          };
        }).filter((anime) => Boolean(anime?.slug));

        if (animes.length > 0) break;
      } catch (err) {
        continue;
      }
    }

    if (animes.length === 0) {
      animes = await searchFallback(keyword, apiUrl);
    }

    return animes;
  } catch (error) {
    console.error("Error saat pencarian:", error);
    return await searchFallback(decodeURIComponent(slug), process.env.NEXT_PUBLIC_API_URL || 'https://api-otakudesu-zeta.vercel.app');
  }
}

export default async function SearchPage({ params: ParamsPromise }) {
  const params = await ParamsPromise;
  const { slug } = params;
  const keyword = decodeURIComponent(slug);
  const searchResults = await searchAnime(slug);

  const breadcrumbs = [
    { title: 'Search', href: '/search' },
    { title: keyword, href: `/search/${slug}` }
  ];

  return (
    <div className="min-h-screen bg-neutral-900 text-white pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Navigation />
          <SearchInput />
          <h1 className="text-3xl md:text-4xl font-bold">
            {'Hasil Pencarian untuk: '}
            <span className="text-pink-500">{keyword}</span>
          </h1>
        </div>
        {searchResults && searchResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {searchResults.map((anime, index) => (
              <AnimeCard
                key={`${anime.slug || anime.title || 'search'}-${index}`}
                slug={anime.slug}
                type={anime.type}
                title={anime.title}
                image={anime.poster}
                episode={anime.episode}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-neutral-400">
              {'Yah, tidak ketemu...'}
            </h2>
          </div>
        )}
      </div>
    </div>
  );
}