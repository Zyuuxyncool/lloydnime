export const dynamic = 'force-dynamic'

import ResponsiveBreadcrumb from '@/app/components/ResponsiveBreadcrumb';
import Navigation from '@/app/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';

function parseLastPathSegment(url = '') {
  const raw = String(url || '').trim();
  if (!raw) return '';

  try {
    const normalized = raw.startsWith('http') ? raw : `https://dummy.local${raw.startsWith('/') ? '' : '/'}${raw}`;
    const pathname = new URL(normalized).pathname;
    return pathname.split('/').filter(Boolean).pop() || '';
  } catch {
    return raw.split(/[?#]/)[0].split('/').filter(Boolean).pop() || '';
  }
}

function normalizeDetailPayload(result) {
  const payload = result?.data || result || {};
  const detail =
    payload?.detail ||
    payload?.anime ||
    payload?.data?.detail ||
    result?.detail ||
    result?.anime ||
    null;

  const payloadEpisodeList =
    payload?.episodeList ||
    payload?.episodes ||
    payload?.listEpisode ||
    payload?.episode_list ||
    result?.episodeList ||
    [];

  if (!detail || typeof detail !== 'object') {
    return {
      detail: payload && typeof payload === 'object' ? payload : null,
      episodeList: Array.isArray(payloadEpisodeList) ? payloadEpisodeList : [],
    };
  }

  const detailEpisodeList =
    detail?.episodeList ||
    detail?.episodes ||
    detail?.listEpisode ||
    detail?.episode_list ||
    [];

  const mergedEpisodeList = Array.isArray(detailEpisodeList) && detailEpisodeList.length > 0
    ? detailEpisodeList
    : (Array.isArray(payloadEpisodeList) ? payloadEpisodeList : []);

  return {
    detail: {
      ...detail,
      episodeList: mergedEpisodeList,
    },
    episodeList: mergedEpisodeList,
  };
}

// Fallback fetch menggunakan Jikan API
async function getDetailAnimeFallback(slug) {
  try {
    const searchTerm = slug.replace(/-sub-indo|-batch/gi, '').replace(/-/g, ' ');
    const response = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchTerm)}&limit=1`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) return null;

    const result = await response.json();
    const item = result?.data?.[0];
    if (!item) return null;

    return {
      title: item.title || item.title_english,
      poster: item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url,
      synopsis: item.synopsis,
      type: item.type,
      status: item.status,
      genres: item.genres?.map(g => ({ title: g.name })) || [],
      score: item.score,
      episodes: item.episodes,
      studios: item.studios?.map(s => ({ title: s.name })) || [],
      aired: item.aired?.string,
      episodeList: [],
      batchList: [],
    };
  } catch {
    return null;
  }
}

// Fungsi Fetch Detail Anime
async function getDetailAnime(slug) {
  try {
    if (!slug || slug === 'undefined') {
      console.error('Slug anime tidak valid:', slug);
      return null;
    }

    const safeSlug = slug.toString().split('?')[0].trim();

    if (!safeSlug) {
      console.error('Slug anime kosong setelah normalisasi:', slug);
      return null;
    }

    // Check if this is a Jikan result (prefixed with 'jikan-')
    if (safeSlug.startsWith('jikan-')) {
      const malId = safeSlug.replace('jikan-', '');
      // Fetch directly from Jikan API using MAL ID
      try {
        const response = await fetch(
          `https://api.jikan.moe/v4/anime/${malId}`,
          { next: { revalidate: 3600 } }
        );

        if (response.ok) {
          const result = await response.json();
          const item = result?.data;
          
          if (item) {
            return {
              title: item.title || item.title_english,
              poster: item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url,
              synopsis: item.synopsis,
              type: item.type,
              status: item.status,
              genres: item.genres?.map(g => ({ title: g.name })) || [],
              score: item.score,
              episodes: item.episodes,
              studios: item.studios?.map(s => ({ title: s.name })) || [],
              aired: item.aired?.string,
              episodeList: [],
              batchList: [],
            };
          }
        }
      } catch (err) {
        console.error('Failed to fetch from Jikan with MAL ID:', malId, err);
      }
      return null;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const endpoints = [
      `${apiUrl}/anime?slug=${encodeURIComponent(safeSlug)}`,
      `${apiUrl}/anime?slug=${encodeURIComponent(safeSlug.toLowerCase())}`
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, { next: { revalidate: 3600 } });
        
        if (!response.ok) {
          continue;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.toLowerCase().includes('application/json')) {
          continue;
        }

        const result = await response.json();
        const normalized = normalizeDetailPayload(result);
        const animeData =
          normalized?.detail ||
          result?.data?.list?.[0] ||
          result?.data ||
          result?.detail ||
          result;

        if (
          animeData &&
          (animeData.title || animeData.episodeList || animeData.info?.episodeList || normalized?.episodeList?.length > 0)
        ) {
          return {
            ...animeData,
            episodeList: Array.isArray(animeData.episodeList) && animeData.episodeList.length > 0
              ? animeData.episodeList
              : normalized?.episodeList || [],
          };
        }
      } catch {
        continue;
      }
    }

    // Semua endpoint gagal, coba fallback
    return await getDetailAnimeFallback(safeSlug);
  } catch (error) {
    console.error("Gagal mengambil detail anime:", error);
    return await getDetailAnimeFallback(slug);
  }
}

export default async function DetailAnimePage({ params: paramsPromise }) {
  const params = await paramsPromise;
  const { slug } = params; // Ini adalah slug yang "bersih", cth: "one-punch-man-s3"

  const anime = await getDetailAnime(slug);

  if (!anime) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col justify-center items-center text-center">
        <h1 className="text-2xl font-bold text-red-500">Anime Tidak Ditemukan</h1>
        <p className="text-neutral-400 mt-2">Data untuk anime ini tidak dapat dimuat.</p>
        <Navigation />
      </div>
    );
  }

  const pickFirst = (...values) => {
    for (const value of values) {
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return null;
  };

  const toDisplayText = (value, fallback = 'N/A') => {
    if (Array.isArray(value)) {
      if (value.length === 0) return fallback;
      return value
        .map((item) => {
          if (typeof item === 'string') return item;
          return item?.title || item?.name || item?.label || item?.value || '';
        })
        .filter(Boolean)
        .join(', ') || fallback;
    }

    if (typeof value === 'object' && value !== null) {
      return value?.title || value?.name || value?.label || fallback;
    }

    return value || fallback;
  };

  const title = pickFirst(anime.title, anime.name, anime.judul, slug);
  const posterUrl = pickFirst(anime.poster, anime.image, anime.thumbnail);
  const synopsisText =
    typeof anime.synopsis === 'string'
      ? anime.synopsis
      : pickFirst(
          anime.synopsis?.paragraphs?.join('\n'),
          anime.synopsis?.text,
          anime.description,
          anime.desc,
          'Tidak ada sinopsis tersedia.'
        );

  // --- PERBAIKAN: Ambil info langsung dari root 'anime' (data 'detail') ---
  const duration = toDisplayText(pickFirst(anime.duration, anime.runtime));
  const producer = toDisplayText(pickFirst(anime.producers, anime.producer, anime.producerList));
  const season = toDisplayText(pickFirst(anime.season, anime.type));
  const releaseDate = toDisplayText(pickFirst(anime.aired, anime.releaseDate, anime.release_date));
  const studio = toDisplayText(pickFirst(anime.studios, anime.studio, anime.studioList));
  const japaneseTitle = toDisplayText(pickFirst(anime.japanese, anime.japaneseTitle, anime.titleJapanese));
  const status = toDisplayText(pickFirst(anime.status, anime.state));
  const score = toDisplayText(pickFirst(anime.score, anime.rating, anime.scoreValue));
  const totalEpisodesValue = pickFirst(
    anime.totalEpisodes,
    anime.episodesCount,
    anime.episodeTotal,
    Array.isArray(anime.episodes) ? anime.episodes.length : null
  );
  const totalEpisodes = toDisplayText(totalEpisodesValue);
  const source = toDisplayText(pickFirst(anime.source, anime.sourceType));

  const rawGenres = pickFirst(anime.genreList, anime.genres, anime.genre, []);
  const genres = (Array.isArray(rawGenres) ? rawGenres : []).map((genre) => ({
    genreId: genre?.genreId || genre?.slug || genre?.id,
    title: genre?.title || genre?.name || genre?.genre || genre,
    name: genre?.name || genre?.title || genre?.genre || genre,
  }));

  const rawEpisodesSource = pickFirst(
    anime.episodeList,
    anime.info?.episodeList,
    anime.episodes,
    anime.episode_list,
    anime.episode,
    anime.listEpisode,
    anime.latestEpisodes,
    []
  );
  const rawEpisodes = Array.isArray(rawEpisodesSource)
    ? rawEpisodesSource
    : (rawEpisodesSource?.episodeList || rawEpisodesSource?.list || rawEpisodesSource?.episodes || []);

  const episodeList = (Array.isArray(rawEpisodes) ? rawEpisodes : []).map((episode, index) => {
    const watchSlug =
      episode?.episodeId ||
      episode?.episodeID ||
      episode?.episode_id ||
      episode?.slug ||
      episode?.slugEpisode ||
      episode?.episodeSlug ||
      episode?.id ||
      (typeof episode?.link === 'string' && parseLastPathSegment(episode.link)) ||
      (typeof episode?.href === 'string' && parseLastPathSegment(episode.href)) ||
      (typeof episode?.otakudesuUrl === 'string' && parseLastPathSegment(episode.otakudesuUrl)) ||
      '';

    // Extract episode number from various sources
    const episodeNumber = 
      episode?.eps || 
      episode?.episode || 
      episode?.number || 
      episode?.episodeNumber ||
      episode?.episodeNo ||
      episode?.ep ||
      (episode?.title && /episode\s*(\d+)/i.test(episode.title) ? episode.title.match(/episode\s*(\d+)/i)[1] : null) ||
      (episode?.name && /episode\s*(\d+)/i.test(episode.name) ? episode.name.match(/episode\s*(\d+)/i)[1] : null) ||
      (index + 1); // Fallback to index + 1

    // Extract title with fallbacks
    const episodeTitle = 
      episode?.title || 
      episode?.name || 
      episode?.label ||
      episode?.episodeTitle ||
      `Episode ${episodeNumber}`;

    // Extract date with fallbacks
    const episodeDate = 
      episode?.date || 
      episode?.releaseDate || 
      episode?.released ||
      episode?.uploadDate ||
      episode?.postedDate ||
      episode?.createdAt ||
      'Unknown';

    return {
      ...episode,
      watchSlug,
      eps: episodeNumber,
      title: episodeTitle,
      date: episodeDate,
    };
  }).filter((episode) => Boolean(episode.watchSlug));

  const firstEpisodeSlug = episodeList?.[0]?.watchSlug || '';

  // --- LOGIKA BARU: Siapkan Query Params untuk Halaman Nonton ---
  // Kita akan mengirimkan data ini ke /watch page melalui URL
  const historyQueryParams = new URLSearchParams({
    slug: slug,             // Slug bersih, cth: "one-punch-man-s3"
    title: title,     // Judul anime, cth: "One Punch Man S3"
    image: posterUrl || '',    // URL Poster
  });
  const queryString = historyQueryParams.toString();
  // Hasil: "slug=one-punch-man-s3&title=One+Punch+Man+S3&image=http%3A%2F%2F..."
  // -------------------------------------------------------------

  const breadcrumbs = [
    { title: title, href: `/detail/${slug}` }
  ];

  return (

    <div className="relative min-h-screen bg-neutral-900 text-white">
      <div
        className="absolute inset-0 bg-cover bg-center blur-sm opacity-30"
        style={{ backgroundImage: `url(${posterUrl || ''})` }}
      ></div>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <ResponsiveBreadcrumb crumbs={breadcrumbs} />

        <div className="md:flex mt-8">
          <div className="md:w-1/3 justify-center flex mb-6 md:mb-0 md:pr-8 flex-shrink-0">
            <Image
              src={posterUrl || 'https://placehold.co/400x600/171717/ef4444?text=No+Image'}
              alt={title}
              className="object-cover rounded-lg shadow-xl"
              width={400}
              height={600}
              priority
            />
          </div>
          <div className="md:w-2/3">
            <h1 className="text-4xl font-bold mb-4">{title}</h1>
            <div className="flex items-center space-x-4 mb-4">
              <span className="text-neutral-400">{status} • {duration}</span>
            </div>
            <div className="flex space-x-4 mb-6">

              {/* --- MODIFIKASI: Tambahkan queryString ke tombol "Watch Now" --- */}
              {firstEpisodeSlug ? (
                <Link
                  href={`/watch/${firstEpisodeSlug}?${queryString}`}
                  className="bg-pink-600 text-white px-6 py-2 rounded-full flex items-center space-x-2 hover:bg-pink-700 transition"
                >
                  Watch Now
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="bg-neutral-700 text-neutral-300 px-6 py-2 rounded-full flex items-center space-x-2 cursor-not-allowed"
                >
                  Episode belum tersedia
                </button>
              )}

              {anime.batch && anime.batch.slug && (
                <Link
                  href={`/download/${anime.batch.slug}`}
                  className="bg-blue-600 text-white px-6 py-2 rounded-full flex items-center space-x-2 hover:bg-blue-700 transition"
                >
                  Download Batch
                </Link>
              )}
            </div>
            <div className='flex flex-col mb-4 overflow-hidden'>
              <p className="text-neutral-300">
                {synopsisText}
              </p>
            </div>

            {/* Info Grid (Tidak berubah) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-neutral-400">
              <div>
                <span className="font-semibold text-white block">Japanese</span>
                {japaneseTitle}
              </div>
              <div>
                <span className="font-semibold text-white block">Producer</span>
                {producer}
              </div>
              <div>
                <span className="font-semibold text-white block">Season</span>
                {season}
              </div>
              <div>
                <span className="font-semibold text-white block">Release Date</span>
                {releaseDate}
              </div>
              <div>
                <span className="font-semibold text-white block">Studio</span>
                {studio}
              </div>
              <div>
                <span className="font-semibold text-white block">Status</span>
                {status}
              </div>
              <div>
                <span className="font-semibold text-white block">Score</span>
                {score}
              </div>
              <div>
                <span className="font-semibold text-white block">Total Episode</span>
                {totalEpisodes}
              </div>
              <div>
                <span className="font-semibold text-white block">Source</span>
                {source}
              </div>
            </div>

            {/* Genres */}
            <div className="mt-4">
              <span className="font-semibold text-white block mb-2">Genres</span>
              <div className="flex flex-wrap gap-2">
                {genres && genres.length > 0 ? (
                  genres.map((genre, index) => (
                    <span key={`${genre.genreId || genre.title || 'genre'}-${index}`} className="bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full text-sm">
                      {genre.title || genre.name}
                    </span>
                  ))
                ) : (
                  <span className="text-neutral-400 text-sm">No genres available</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bagian Episode List */}
      <div className="relative z-10 container mx-auto px-4 md:px-8 py-8">
        <h2 className="text-2xl font-bold mb-4">Episodes</h2>
        <div className="space-y-4">
          {episodeList && Array.isArray(episodeList) && episodeList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {episodeList.map((episode, index) => (
                <Link
                  key={`${episode.watchSlug}-${index}`}
                  href={`/watch/${episode.watchSlug}?${queryString}`}
                  className="bg-neutral-800 rounded-lg p-4 flex items-center space-x-4 hover:bg-neutral-700 transition"
                >
                  <div className="w-24 h-12 bg-neutral-700 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-pink-500 font-bold text-sm">
                      Ep {episode.eps}
                    </span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="text-sm font-semibold line-clamp-2">
                      {episode.title}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      {episode.date !== 'Unknown' ? episode.date : (duration !== 'N/A' ? duration : '')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-neutral-800 rounded-lg p-6 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-white">Episode belum tersedia</p>
                {typeof totalEpisodesValue === 'number' && totalEpisodesValue > 0 ? (
                  <p className="text-neutral-400">Total Episodes: {totalEpisodesValue}</p>
                ) : (
                  <p className="text-neutral-400">Belum ada daftar episode untuk anime ini.</p>
                )}
              </div>
              <button
                type="button"
                disabled
                className="bg-neutral-700 text-neutral-300 px-6 py-3 rounded-full cursor-not-allowed"
              >
                Episode belum tersedia
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}