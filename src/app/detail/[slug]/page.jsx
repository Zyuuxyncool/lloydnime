export const dynamic = 'force-dynamic'

import ResponsiveBreadcrumb from '@/app/components/ResponsiveBreadcrumb';
import Navigation from '@/app/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';

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

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const endpoints = [
      `${apiUrl}/animasu/detail/${safeSlug}`,
      `${apiUrl}/animasu/detail/${safeSlug.toLowerCase()}`,
    ];

    for (const endpoint of endpoints) {
      const response = await fetch(endpoint, { next: { revalidate: 3600 } });
      if (!response.ok) {
        continue;
      }

      const result = await response.json();
      const animeData = result?.data?.detail || result?.data || result?.detail || result;

      if (animeData) {
        return animeData;
      }
    }

    throw new Error('Gagal mengambil data anime utama (API baru)');
  } catch (error) {
    console.error("Gagal mengambil detail anime:", error);
    return null;
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
  const totalEpisodes = toDisplayText(pickFirst(anime.totalEpisodes, anime.episodesCount, anime.episodeTotal, Array.isArray(anime.episodes) ? anime.episodes.length : null));
  const source = toDisplayText(pickFirst(anime.source, anime.sourceType));

  const rawGenres = pickFirst(anime.genreList, anime.genres, anime.genre, []);
  const genres = (Array.isArray(rawGenres) ? rawGenres : []).map((genre) => ({
    genreId: genre?.genreId || genre?.slug || genre?.id,
    title: genre?.title || genre?.name || genre?.genre || genre,
    name: genre?.name || genre?.title || genre?.genre || genre,
  }));

  const rawEpisodesSource = pickFirst(anime.episodeList, anime.episodes, anime.episode_list, anime.episode, anime.latestEpisodes, []);
  const rawEpisodes = Array.isArray(rawEpisodesSource)
    ? rawEpisodesSource
    : (rawEpisodesSource?.episodeList || rawEpisodesSource?.list || rawEpisodesSource?.episodes || []);

  const episodeList = (Array.isArray(rawEpisodes) ? rawEpisodes : []).map((episode, index) => {
    const watchSlug =
      episode?.episodeId ||
      episode?.slug ||
      episode?.episodeSlug ||
      episode?.id ||
      (typeof episode?.link === 'string' && episode.link.split('/').filter(Boolean).pop()) ||
      (typeof episode?.href === 'string' && episode.href.split('/').filter(Boolean).pop()) ||
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
              <Link
                href={firstEpisodeSlug ? `/watch/${firstEpisodeSlug}?${queryString}` : '#'}
                className="bg-pink-600 text-white px-6 py-2 rounded-full flex items-center space-x-2 hover:bg-pink-700 transition"
              >
                Watch Now
              </Link>

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
          ) : anime.episodes && typeof anime.episodes === 'number' ? (
            <div className="bg-neutral-800 rounded-lg p-6 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-white">Total Episodes</p>
                <p className="text-neutral-400">{anime.episodes} episodes available</p>
              </div>
              <Link
                href={`/watch/${slug}?${queryString}`}
                className="bg-pink-600 text-white px-6 py-3 rounded-full hover:bg-pink-700 transition"
              >
                Watch Now
              </Link>
            </div>
          ) : (
            <div className="col-span-full text-center text-neutral-400 py-8">
              <p>{'No episodes available for this anime yet.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}