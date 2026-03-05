import AnimeCard from '@/app/components/AnimeCard';
import SearchInput from '@/app/components/SearchInput';
import Navigation from '@/app/components/Navigation';
import BreadcrumbNavigation from '@/app/components/BreadcrumbNavigation';

async function searchFallback(keyword) {
  try {
    const response = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(keyword)}&limit=20`,
      { next: { revalidate: 1800 } }
    );

    if (!response.ok) return [];

    const result = await response.json();
    const list = Array.isArray(result?.data) ? result.data : [];

    const processed = list.map((item) => {
      // Use MAL ID as slug for Jikan results
      const malId = item?.mal_id;
      const title = item?.title || item?.title_english || 'Unknown';

      console.log('[Jikan Fallback] Title:', title, '→ MAL ID:', malId);

      return {
        title,
        slug: malId ? `jikan-${malId}` : null, // Prefix with 'jikan-' to identify Jikan sources
        poster: item?.images?.webp?.large_image_url || item?.images?.jpg?.image_url,
        episode: item?.episodes || '?',
        type: item?.type || 'TV',
      };
    }).filter((anime) => Boolean(anime.title && anime.poster && anime.slug));

    return processed;
  } catch {
    return [];
  }
}

async function searchAnime(slug) {
  if (!slug) return [];

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
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
          // Otakudesu API v3 uses animeId as slug
          const slug = anime?.animeId || anime?.slug || anime?.anime_id || anime?.id;
          
          return {
            ...anime,
            slug: slug,
            poster: anime?.poster || anime?.image || anime?.thumbnail,
            episode: anime?.episode || anime?.episodes || anime?.latestEpisode,
          };
        });

        if (animes.length > 0) break;
      } catch (err) {
        continue;
      }
    }

    if (animes.length === 0) {
      animes = await searchFallback(keyword);
    }

    return animes;
  } catch (error) {
    console.error("Error saat pencarian:", error);
    return await searchFallback(decodeURIComponent(slug));
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