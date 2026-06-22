import AnimeCard from '@/app/components/AnimeCard';
import SearchInput from '@/app/components/SearchInput';
import Navigation from '@/app/components/Navigation';
import BreadcrumbNavigation from '@/app/components/BreadcrumbNavigation';
import { searchAnimeByKeyword } from '@/app/libs/anime-db';

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

async function resolveFallbackSlug() {
  return null;
}

async function searchFallback() {
  return [];
}

async function searchAnime(slug) {
  if (!slug) return [];

  try {
    const keyword = decodeURIComponent(slug);
    return await searchAnimeByKeyword(keyword, 24);
  } catch (error) {
    console.error("Error saat pencarian dari database:", error);
    return [];
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