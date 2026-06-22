const PLACEHOLDER_IMAGE = 'https://placehold.co/400x600/171717/ef4444?text=No+Image';

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  return [value];
}

function pickFirst(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return null;
}

function toText(value, fallback = '') {
  if (Array.isArray(value)) {
    return value
      .map((item) => toText(item, ''))
      .filter(Boolean)
      .join(', ');
  }

  if (typeof value === 'object' && value !== null) {
    return toText(
      pickFirst(value.title, value.name, value.label, value.value, value.text),
      fallback
    );
  }

  return value === undefined || value === null || value === '' ? fallback : String(value);
}

function normalizeSlugValue(item) {
  return pickFirst(
    item?.animeId,
    item?.slug,
    item?.anime_id,
    item?.id,
    item?.episodeId,
    item?.episodeID,
    item?.episode_id,
    item?.episodeSlug,
    item?.slugEpisode
  );
}

function normalizePosterValue(item) {
  return pickFirst(item?.poster, item?.image, item?.thumbnail, item?.posterUrl, item?.cover, item?.coverImage);
}

export function normalizeAnimeItem(item = {}) {
  const slug = normalizeSlugValue(item);
  return {
    ...item,
    slug,
    title: toText(pickFirst(item?.title, item?.name, item?.animeTitle, item?.judul), 'Unknown Title'),
    poster: normalizePosterValue(item) || PLACEHOLDER_IMAGE,
    episode: pickFirst(item?.episode, item?.episodes, item?.latestEpisode, item?.latest_episode),
    episodes: pickFirst(item?.episodes, item?.episode, item?.latestEpisode, item?.latest_episode),
    status_or_day: pickFirst(item?.status_or_day, item?.status, item?.releaseDay, item?.release_day),
    releaseDay: pickFirst(item?.releaseDay, item?.release_day, item?.status_or_day, item?.status),
  };
}

export function extractAnimeList(result) {
  const payload = result?.data || result || {};
  const list =
    payload?.animeList ||
    payload?.animes ||
    payload?.list ||
    result?.animeList ||
    result?.animes ||
    result?.list ||
    [];

  return toArray(list).map((item) => normalizeAnimeItem(item));
}

export function extractHomeSections(result) {
  const payload = result?.data || result || {};

  const ongoing = toArray(
    payload?.ongoing?.animeList ||
      payload?.ongoing?.animes ||
      payload?.ongoing?.list ||
      result?.ongoing?.animeList ||
      result?.ongoing?.animes ||
      result?.ongoing?.list ||
      []
  ).map((item) => normalizeAnimeItem(item));

  const completed = toArray(
    payload?.completed?.animeList ||
      payload?.completed?.animes ||
      payload?.completed?.list ||
      result?.completed?.animeList ||
      result?.completed?.animes ||
      result?.completed?.list ||
      []
  ).map((item) => normalizeAnimeItem(item));

  const all = extractAnimeList(result);

  return { ongoing, completed, all };
}

export function extractLetterAnimeList(result, letter) {
  const payload = result?.data || result || {};
  const groupedList = Array.isArray(payload?.list) ? payload.list : [];

  if (groupedList.length > 0) {
    const normalizedLetter = String(letter || '').trim().toUpperCase();
    const group = groupedList.find((item) => {
      const value = String(item?.startWith || item?.letter || item?.key || item?.name || '').trim().toUpperCase();
      return value === normalizedLetter;
    });

    return toArray(group?.animeList || group?.animes || group?.list).map((item) => normalizeAnimeItem(item));
  }

  return extractAnimeList(result);
}

export function extractGenreList(result) {
  const payload = result?.data || result || {};
  const genres = payload?.genreList || payload?.genres || result?.genreList || result?.genres || [];

  return toArray(genres)
    .map((genre) => ({
      slug: pickFirst(genre?.genreId, genre?.slug, genre?.genre, genre?.name),
      name: toText(pickFirst(genre?.title, genre?.name, genre?.genreId), 'Unknown Genre'),
    }))
    .filter((genre) => Boolean(genre.slug && genre.name));
}

export function extractScheduleMap(result) {
  const payload = result?.data || result || {};
  const scheduleSource = payload?.schedule || payload;
  const normalized = {};

  if (Array.isArray(scheduleSource)) {
    scheduleSource.forEach((entry) => {
      const day = String(entry?.day || entry?.name || entry?.title || '').toLowerCase().trim();
      if (!day) return;
      normalized[day] = toArray(entry?.anime_list || entry?.animeList || entry?.animes || entry?.list).map((item) =>
        normalizeAnimeItem(item)
      );
    });
    return normalized;
  }

  if (scheduleSource && typeof scheduleSource === 'object') {
    Object.entries(scheduleSource).forEach(([day, animes]) => {
      normalized[String(day).toLowerCase()] = toArray(animes).map((item) => normalizeAnimeItem(item));
    });
  }

  return normalized;
}

export function normalizeEpisodeItem(episode = {}, index = 0) {
  const watchSlug = pickFirst(
    episode?.episodeId,
    episode?.episodeID,
    episode?.episode_id,
    episode?.slug,
    episode?.slugEpisode,
    episode?.episodeSlug,
    episode?.id
  );

  const episodeNumber = pickFirst(
    episode?.eps,
    episode?.episode,
    episode?.number,
    episode?.episodeNumber,
    episode?.episodeNo,
    episode?.ep,
    episode?.title && /episode\s*(\d+)/i.test(episode.title) ? episode.title.match(/episode\s*(\d+)/i)[1] : null,
    episode?.name && /episode\s*(\d+)/i.test(episode.name) ? episode.name.match(/episode\s*(\d+)/i)[1] : null,
    index + 1
  );

  const title = toText(
    pickFirst(episode?.title, episode?.name, episode?.label, episode?.episodeTitle, `Episode ${episodeNumber}`),
    `Episode ${episodeNumber}`
  );

  const date = toText(
    pickFirst(episode?.date, episode?.releaseDate, episode?.released, episode?.uploadDate, episode?.postedDate, episode?.createdAt),
    'Unknown'
  );

  return {
    ...episode,
    watchSlug,
    eps: episodeNumber,
    title,
    date,
  };
}

export function extractDetailPayload(result) {
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
    payload;

  const episodeList = toArray(
    detail?.episodeList ||
      detail?.episodes ||
      detail?.listEpisode ||
      detail?.episode_list ||
      payload?.episodeList ||
      payload?.episodes ||
      payload?.listEpisode ||
      payload?.episode_list ||
      result?.episodeList ||
      []
  ).map((episode, index) => normalizeEpisodeItem(episode, index));

  const recommendations = toArray(
    detail?.recommendedAnimeList ||
      detail?.recommendAnimeList ||
      detail?.recommendations ||
      detail?.relatedAnimeList ||
      detail?.relatedAnime ||
      payload?.recommendedAnimeList ||
      payload?.recommendAnimeList ||
      payload?.recommendations ||
      payload?.relatedAnimeList ||
      payload?.relatedAnime ||
      result?.recommendedAnimeList ||
      []
  ).map((anime) => normalizeAnimeItem(anime));

  return {
    detail,
    episodeList,
    recommendedAnimeList: recommendations,
  };
}

export function extractStreamUrl(payload) {
  const data = payload?.data || payload || {};
  return pickFirst(
    data?.url,
    data?.streamUrl,
    data?.embedUrl,
    data?.link,
    payload?.url,
    payload?.streamUrl,
    payload?.embedUrl,
    payload?.link
  );
}

export function extractPagination(result, fallbackPage = 1, pageSize = 0, itemCount = 0) {
  const payload = result?.data || result || {};
  const pagination = payload?.pagination || result?.pagination || {};
  const totalPages =
    pagination?.totalPages ||
    pagination?.lastPage ||
    pagination?.pages ||
    (pageSize > 0 ? Math.max(1, Math.ceil(itemCount / pageSize)) : fallbackPage);

  return {
    hasNextPage: pagination?.hasNextPage ?? pagination?.hasNext ?? fallbackPage < totalPages,
    hasPrevPage: pagination?.hasPrevPage ?? pagination?.hasPrev ?? fallbackPage > 1,
    currentPage: pagination?.currentPage || fallbackPage,
    totalPages,
  };
}
