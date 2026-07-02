export const dynamic = 'force-dynamic'

import ResponsiveBreadcrumb from '@/app/components/ResponsiveBreadcrumb';
import Navigation from '@/app/components/Navigation';
import Image from 'next/image';
import Link from 'next/link';
import { normalizeEpisodeItem } from '@/app/libs/otakudesu-normalize';
import { redirect } from 'next/navigation';
import { getAnimeDetailBySlug } from '@/app/libs/anime-db';

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
    payload?.details ||
    payload?.detail ||
    payload?.anime ||
    payload?.data?.details ||
    payload?.data?.detail ||
    result?.details ||
    result?.detail ||
    result?.anime ||
    null;

  const payloadEpisodeList =
    payload?.details?.episodeList ||
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

function isThinDetailPayload(anime = {}) {
  if (!anime || typeof anime !== 'object') return true;

  const synopsisParagraphs = Array.isArray(anime?.synopsis?.paragraphs)
    ? anime.synopsis.paragraphs
    : [];
  const genreCount = Array.isArray(anime?.genreList) ? anime.genreList.length : 0;
  const episodeCount = Array.isArray(anime?.episodeList) ? anime.episodeList.length : 0;
  const hasCoreMeta = Boolean(anime?.status || anime?.score || anime?.studios || anime?.producers || anime?.aired);

  return !hasCoreMeta && synopsisParagraphs.length === 0 && genreCount === 0 && episodeCount === 0;
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

    return await getAnimeDetailBySlug(safeSlug);
  } catch (error) {
    console.error("Gagal mengambil detail anime dari database:", error);
    return null;
  }
}

export default async function DetailAnimePage({ params: paramsPromise }) {
  const params = await paramsPromise;
  const { slug } = params; // Ini adalah slug yang "bersih", cth: "one-punch-man-s3"

  const anime = await getDetailAnime(slug);

  // Ensure fallback routes like /detail/jikan-xxxxx are canonicalized to Otakudesu slug.
  if (anime?.canonicalSlug && anime.canonicalSlug !== slug) {
    redirect(`/detail/${anime.canonicalSlug}`);
  }

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
  const genres = (Array.isArray(rawGenres) ? rawGenres : []).map((genre) => {
    const genreLabel = typeof genre === 'string'
      ? genre
      : pickFirst(genre?.title, genre?.name, genre?.genre, genre?.slug, genre?.label);
    const normalizedLabel = typeof genreLabel === 'string'
      ? genreLabel.trim()
      : (typeof genreLabel === 'number' ? String(genreLabel) : '');

    return {
      genreId: genre?.genreId || genre?.slug || genre?.id,
      title: normalizedLabel || 'Genre',
      name: normalizedLabel || 'Genre',
    };
  });

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

  const rawRecommended = pickFirst(
    anime.recommendedAnimeList,
    anime.recommendAnimeList,
    anime.recommendations,
    anime.relatedAnimeList,
    anime.relatedAnime,
    []
  );
  const recommendedAnimeList = (Array.isArray(rawRecommended) ? rawRecommended : [])
    .map((item) => ({
      slug: item?.slug || item?.animeId || item?.anime_id || item?.id || null,
      title: item?.title || item?.name || item?.judul || 'Anime',
      poster: item?.poster || item?.image || item?.thumbnail || 'https://placehold.co/200x300/171717/ef4444?text=No+Image',
    }))
    .filter((item) => Boolean(item.slug));

  // Normalize episodes using shared utility to ensure consistent `eps`, `title`, and `watchSlug`.
  let episodeList = (Array.isArray(rawEpisodes) ? rawEpisodes : []).map((episode, index) =>
    normalizeEpisodeItem(episode, index)
  ).filter((episode) => Boolean(episode.watchSlug));

  // Sort episodes ascending by numeric episode number so Ep 1 appears first
  episodeList.sort((a, b) => {
    const na = Number(String(a.eps).match(/(\d+)/)?.[1] || 0);
    const nb = Number(String(b.eps).match(/(\d+)/)?.[1] || 0);
    return na - nb;
  });

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
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-800/70 p-5 shadow-xl sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-400">Daftar Episode</p>
            <h2 className="text-2xl font-bold text-white">Episodes</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Pilih episode yang ingin ditonton dari daftar yang lebih rapi di bawah ini.
            </p>
          </div>
          <div className="rounded-full bg-pink-600/10 px-3 py-1 text-sm font-medium text-pink-300">
            {episodeList.length > 0 ? `${episodeList.length} episode tersedia` : 'Belum tersedia'}
          </div>
        </div>
        <div className="space-y-4">
          {episodeList && Array.isArray(episodeList) && episodeList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {episodeList.map((episode, index) => (
                <Link
                  key={`${episode.watchSlug}-${index}`}
                  href={`/watch/${episode.watchSlug}?${queryString}`}
                  className="group rounded-2xl border border-neutral-700 bg-neutral-800 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-pink-500/50 hover:bg-neutral-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-600/20 text-sm font-bold text-pink-400">
                        Ep {episode.eps}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white transition group-hover:text-pink-300">
                          {episode.title}
                        </h3>
                        <p className="mt-1 text-xs text-neutral-400">
                          {episode.date !== 'Unknown' ? episode.date : (duration !== 'N/A' ? duration : 'Tersedia')}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-neutral-700 px-2.5 py-1 text-[11px] font-medium text-neutral-300">
                      Watch
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-800/70 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                  className="rounded-full bg-neutral-700 px-6 py-3 text-neutral-300 cursor-not-allowed"
                >
                  Episode belum tersedia
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bagian Recommended Anime */}
      {recommendedAnimeList.length > 0 && (
        <div className="relative z-10 container mx-auto px-4 md:px-8 py-8 border-t border-neutral-700">
          <h2 className="text-2xl font-bold mb-6">Recommended Anime</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recommendedAnimeList.map((recAnime, index) => (
              <Link
                key={`${recAnime.slug || recAnime.title || 'recommended'}-${index}`}
                href={`/detail/${recAnime.slug}`}
                className="group relative rounded-lg overflow-hidden hover:scale-105 transition-transform duration-300"
              >
                <Image
                  src={recAnime.poster || 'https://placehold.co/200x300/171717/ef4444?text=No+Image'}
                  alt={recAnime.title}
                  width={200}
                  height={300}
                  className="w-full h-auto object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors rounded-lg flex items-end p-3">
                  <h3 className="text-sm font-semibold text-white line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {recAnime.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}