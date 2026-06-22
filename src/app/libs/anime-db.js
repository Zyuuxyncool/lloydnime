import prisma from '@/app/libs/prisma';

const NO_IMAGE_URL = 'https://placehold.co/400x600/171717/ef4444?text=No+Image';
const DEFAULT_PAGE_SIZE = 20;

function toSafeString(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function normalizeMaybeEmpty(value) {
  const text = toSafeString(value).trim();
  if (!text || text.toLowerCase() === 'none') return null;
  return text;
}

function pickFirst(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
}

function getPoster(row) {
  return pickFirst(row?.poster_url, row?.metadata?.poster, row?.metadata?.image, NO_IMAGE_URL);
}

export function normalizeAnimeRow(row = {}) {
  const metadata = row?.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  const title = pickFirst(row?.title, metadata?.title, row?.anime_id, 'Tanpa Judul');
  const slug = pickFirst(row?.anime_id, row?.batch_id, row?.id);

  return {
    id: row?.id ? String(row.id) : null,
    animeId: pickFirst(row?.anime_id, metadata?.animeId, slug),
    batchId: row?.batch_id || metadata?.batchId || null,
    slug: slug ? String(slug) : null,
    title: String(title),
    japanese: pickFirst(row?.japanese_title, metadata?.japanese, metadata?.japaneseTitle, null),
    poster: getPoster(row),
    image: getPoster(row),
    thumbnail: getPoster(row),
    type: pickFirst(row?.type, metadata?.type, null),
    status: pickFirst(row?.status, null),
    status_or_day: pickFirst(row?.release_day, row?.status, row?.last_release_date, null),
    episode: pickFirst(row?.episodes, metadata?.episodes, null),
    episodes: pickFirst(row?.episodes, metadata?.episodes, null),
    duration: pickFirst(row?.duration, metadata?.duration, null),
    aired: pickFirst(row?.aired, metadata?.aired, null),
    score: pickFirst(row?.score, metadata?.score, null),
    studios: pickFirst(row?.studios, metadata?.studios, null),
    producers: pickFirst(row?.producers, metadata?.producers, null),
    season: pickFirst(row?.season, metadata?.season, null),
    synopsis: pickFirst(row?.synopsis, metadata?.synopsis, null),
    releaseDay: pickFirst(row?.release_day, row?.releaseDay, row?.status, row?.last_release_date, null),
    release_day: normalizeMaybeEmpty(row?.release_day),
    latest_release_date: normalizeMaybeEmpty(row?.latest_release_date),
    last_release_date: normalizeMaybeEmpty(row?.last_release_date),
    metadata,
  };
}

function normalizeEpisodeRow(row = {}) {
  const episodeTitle = pickFirst(row?.title, row?.episode_title, row?.episodeId, 'Episode');
  return {
    id: row?.id ? String(row.id) : null,
    episodeId: pickFirst(row?.episode_id, row?.episodeId, row?.slug, row?.id),
    slug: pickFirst(row?.episode_id, row?.episodeId, row?.slug, row?.id) ? String(pickFirst(row?.episode_id, row?.episodeId, row?.slug, row?.id)) : null,
    title: String(episodeTitle),
    eps: pickFirst(row?.title, row?.episode_no, row?.episode, null),
    releaseTime: pickFirst(row?.release_time, null),
    defaultStreamingUrl: pickFirst(row?.default_streaming_url, null),
    hasPrevEpisode: Boolean(row?.has_prev_episode),
    hasNextEpisode: Boolean(row?.has_next_episode),
    prevEpisodeSourceId: pickFirst(row?.prev_episode_source_id, null),
    nextEpisodeSourceId: pickFirst(row?.next_episode_source_id, null),
    credit: pickFirst(row?.credit, null),
    encoder: pickFirst(row?.encoder, null),
    duration: pickFirst(row?.duration, null),
    type: pickFirst(row?.type, null),
    infoPayload: row?.info_payload && typeof row.info_payload === 'object' ? row.info_payload : null,
    episodeUrl: pickFirst(row?.episode_url, null),
    animeId: pickFirst(row?.anime_id, null) ? String(row.anime_id) : null,
    sourceKey: pickFirst(row?.source_key, null),
  };
}

function normalizeGenreRow(row = {}) {
  return {
    id: row?.id ? String(row.id) : null,
    genreId: pickFirst(row?.genre_id, row?.slug, row?.name, row?.id),
    name: pickFirst(row?.name, row?.slug, row?.genre_id, 'Genre'),
    slug: pickFirst(row?.slug, row?.genre_id, row?.name, row?.id) ? String(pickFirst(row?.slug, row?.genre_id, row?.name, row?.id)) : null,
    image: pickFirst(row?.sample_poster, row?.poster_url, row?.image, NO_IMAGE_URL),
    total: Number(row?.total || row?.anime_count || 0),
  };
}

function makePagination(totalItems, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  return {
    currentPage,
    totalPages,
    hasPrev: currentPage > 1,
    hasNext: currentPage < totalPages,
    totalItems,
    pageSize,
  };
}

const MONTH_MAP = {
  jan: 0,
  januari: 0,
  feb: 1,
  februari: 1,
  mar: 2,
  maret: 2,
  apr: 3,
  april: 3,
  mei: 4,
  may: 4,
  jun: 5,
  juni: 5,
  jul: 6,
  juli: 6,
  agu: 7,
  ags: 7,
  agustus: 7,
  aug: 7,
  sep: 8,
  sept: 8,
  september: 8,
  okt: 9,
  oktober: 9,
  nov: 10,
  november: 10,
  des: 11,
  desember: 11,
  dec: 11,
  december: 11,
};

function parseReleaseDateScore(value) {
  const text = normalizeMaybeEmpty(value);
  if (!text) return Number.NEGATIVE_INFINITY;

  const match = text.match(/(\d{1,2})\s+([A-Za-z]+)/);
  if (!match) return Number.NEGATIVE_INFINITY;

  const day = Number(match[1]);
  const monthKey = match[2].toLowerCase();
  const month = MONTH_MAP[monthKey];
  if (Number.isNaN(day) || month === undefined) return Number.NEGATIVE_INFINITY;

  return month * 100 + day;
}

function parseLatestReleaseScore(value) {
  const text = normalizeMaybeEmpty(value);
  if (!text) return Number.NEGATIVE_INFINITY;

  const iso = Date.parse(text);
  if (!Number.isNaN(iso)) return iso;

  return parseReleaseDateScore(text);
}

function parseEpisodeNumber(value) {
  const text = normalizeMaybeEmpty(value);
  if (!text) return Number.NEGATIVE_INFINITY;

  const match = text.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return Number.NEGATIVE_INFINITY;

  const number = Number(match[1].replace(',', '.'));
  return Number.isFinite(number) ? number : Number.NEGATIVE_INFINITY;
}

function getJakartaNowParts() {
  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const weekdayFormatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
  });
  const isoDate = dateFormatter.format(now); // YYYY-MM-DD
  const [year, month, day] = isoDate.split('-');
  const dateScore = parseReleaseDateScore(`${Number(day)} ${monthNameFromNumeric(month)}`);

  return {
    isoDate,
    dateScore,
    weekday: weekdayFormatter.format(now).toLowerCase(),
  };
}

function getDatePartInJakarta(value) {
  if (!value) return null;
  const ms = Date.parse(String(value));
  if (Number.isNaN(ms)) return null;
  const d = new Date(ms);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function monthNameFromNumeric(monthValue) {
  const monthMap = {
    '01': 'Jan',
    '02': 'Feb',
    '03': 'Mar',
    '04': 'Apr',
    '05': 'Mei',
    '06': 'Jun',
    '07': 'Jul',
    '08': 'Agu',
    '09': 'Sep',
    '10': 'Okt',
    '11': 'Nov',
    '12': 'Des',
  };

  return monthMap[monthValue] || '';
}

function getOngoingPriorityScore(row, nowParts) {
  const latestReleaseText = row.latest_release_date || row.latestReleaseDate || row.last_release_date || row.release_day || row.releaseDay;
  const latestScore = parseLatestReleaseScore(latestReleaseText);
  const releaseDay = String(row.releaseDay || row.release_day || row.status_or_day || row.status || '').trim().toLowerCase();
  const episodeScore = parseEpisodeNumber(row.episodes || row.episode);

  if (!Number.isFinite(latestScore)) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = -Math.abs(latestScore - nowParts.dateScore);

  if (latestScore === nowParts.dateScore) {
    score += 100000;
  }

  if (releaseDay && releaseDay === nowParts.weekday) {
    score += 10000;
  }

  if (Number.isFinite(episodeScore)) {
    score += episodeScore / 100;
  }

  return score;
}

export function filterAnimeByLetter(animes = [], letter = 'A') {
  const selected = String(letter || 'A').trim().toUpperCase();
  if (!selected || selected === 'ALL') return animes;
  return animes.filter((anime) => {
    const title = String(anime?.title || '').trim();
    if (!title) return false;
    const first = title[0]?.toUpperCase() || '';
    return first === selected;
  });
}

export async function getAllAnimeList() {
  const rows = await prisma.$queryRaw`
    SELECT id, source_key, anime_id, batch_id, title, japanese_title, poster_url, anime_url, status, score, episodes, duration, aired, studios, producers, type, release_day, latest_release_date, last_release_date, season, synopsis, metadata, created_at, updated_at
    FROM animes
    ORDER BY title ASC
  `;

  return rows.map(normalizeAnimeRow);
}

export async function getHomeAnimeSections(limit = 10) {
  const nowParts = getJakartaNowParts();
  const [ongoingRows, completedRows] = await Promise.all([
    prisma.$queryRaw`
      SELECT id, source_key, anime_id, batch_id, title, japanese_title, poster_url, anime_url, status, score, episodes, duration, aired, studios, producers, type, release_day, latest_release_date, last_release_date, season, synopsis, metadata, created_at, updated_at
      FROM animes
      WHERE status = 'Ongoing'
      ORDER BY id DESC
    `,
    prisma.$queryRaw`
      SELECT id, source_key, anime_id, batch_id, title, japanese_title, poster_url, anime_url, status, score, episodes, duration, aired, studios, producers, type, release_day, latest_release_date, last_release_date, season, synopsis, metadata, created_at, updated_at
      FROM animes
      WHERE status = 'Completed'
      ORDER BY id DESC
    `,
  ]);

  const sortedOngoingRows = ongoingRows
    .map(normalizeAnimeRow)
    .map((r) => {
      const latestRaw = r.latest_release_date || r.last_release_date || r.latestReleaseDate || r.release_day || r.releaseDay || null;
      const latestMs = Number.isFinite(Date.parse(String(latestRaw))) ? Date.parse(String(latestRaw)) : null;
      const latestDatePart = getDatePartInJakarta(latestRaw);
      const latestScore = parseReleaseDateScore(latestRaw);
      const episodeNum = Number.isFinite(parseEpisodeNumber(r.episodes || r.episode)) ? parseEpisodeNumber(r.episodes || r.episode) : null;
      return { ...r, __latestMs: latestMs, __latestDatePart: latestDatePart, __latestScore: latestScore, __episodeNum: episodeNum };
    })
    .reduce((acc, r) => {
      // bucket today vs others using date score (day+month) to avoid year issues
      if (Number.isFinite(r.__latestScore) && r.__latestScore === nowParts.dateScore) {
        acc.today.push(r);
      } else {
        acc.others.push(r);
      }
      return acc;
    }, { today: [], others: [] });

  

  // sort today's releases: episode number desc, then latest timestamp desc, then title
  const todaySorted = sortedOngoingRows.today.sort((a, b) => {
    const aEp = Number.isFinite(a.__episodeNum) ? a.__episodeNum : Number.NEGATIVE_INFINITY;
    const bEp = Number.isFinite(b.__episodeNum) ? b.__episodeNum : Number.NEGATIVE_INFINITY;
    if (bEp !== aEp) return bEp - aEp;
    const aMs = a.__latestMs || Number.NEGATIVE_INFINITY;
    const bMs = b.__latestMs || Number.NEGATIVE_INFINITY;
    if (bMs !== aMs) return bMs - aMs;
    return String(a.title || '').localeCompare(String(b.title || ''));
  });

  // sort others: prefer past dates (<= today) ordered by date desc, then episode desc
  const othersSorted = sortedOngoingRows.others.sort((a, b) => {
    const aIsPast = Number.isFinite(a.__latestScore) && a.__latestScore <= nowParts.dateScore;
    const bIsPast = Number.isFinite(b.__latestScore) && b.__latestScore <= nowParts.dateScore;
    if (aIsPast !== bIsPast) return aIsPast ? -1 : 1; // past first

    if (aIsPast && bIsPast) {
      if (b.__latestScore !== a.__latestScore) return b.__latestScore - a.__latestScore;
    }

    // tie-breaker: episode number desc
    const aEp = Number.isFinite(a.__episodeNum) ? a.__episodeNum : Number.NEGATIVE_INFINITY;
    const bEp = Number.isFinite(b.__episodeNum) ? b.__episodeNum : Number.NEGATIVE_INFINITY;
    if (bEp !== aEp) return bEp - aEp;

    // finally by title
    return String(a.title || '').localeCompare(String(b.title || ''));
  });

  const finalOngoing = [...todaySorted, ...othersSorted].slice(0, limit);

  // remove internal fields
  const cleaned = finalOngoing.map(({ __latestMs, __latestDatePart, __episodeNum, ...rest }) => rest);
  return {
    ongoing: cleaned,
    completed: (() => {
      const normalized = completedRows.map(normalizeAnimeRow).map((r) => {
        const cand = r.last_release_date || r.latest_release_date || r.release_day || r.releaseDay || null;
        const datePart = getDatePartInJakarta(cand); // YYYY-MM-DD in Jakarta tz
        let year = null;
        let month = null;
        let day = null;
        if (datePart) {
          const [y, m, d] = datePart.split('-');
          year = Number(y);
          month = Number(m);
          day = Number(d);
        }
        const ms = Number.isFinite(Date.parse(String(cand))) ? Date.parse(String(cand)) : null;
        return { ...r, __datePart: datePart, __year: year, __month: month, __day: day, __ms: ms };
      });

      const currentYear = Number(nowParts.isoDate.split('-')[0]);
      const inThisYear = normalized.filter((r) => Number.isFinite(r.__year) && r.__year === currentYear);

      if (inThisYear.length > 0) {
        const currentMonth = Number(nowParts.isoDate.split('-')[1]);
        const months = Array.from(new Set(inThisYear.map((r) => r.__month).filter(Boolean))).sort((a,b) => a - b);
        // prefer the most recent past month (< currentMonth); if none, pick earliest available month (future)
        let chosenMonth = null;
        const pastMonths = months.filter((m) => m < currentMonth);
        if (pastMonths.length > 0) {
          chosenMonth = Math.max(...pastMonths);
        } else {
          chosenMonth = months.length > 0 ? months[0] : null;
        }
        const chosen = inThisYear.filter((r) => r.__month === chosenMonth);
        // sort by ms desc, then day desc, then title
        chosen.sort((a, b) => {
          const aMs = a.__ms || Number.NEGATIVE_INFINITY;
          const bMs = b.__ms || Number.NEGATIVE_INFINITY;
          if (bMs !== aMs) return bMs - aMs;
          const aDay = Number.isFinite(a.__day) ? a.__day : Number.NEGATIVE_INFINITY;
          const bDay = Number.isFinite(b.__day) ? b.__day : Number.NEGATIVE_INFINITY;
          if (bDay !== aDay) return bDay - aDay;
          return String(a.title || '').localeCompare(String(b.title || ''));
        });

        return chosen.slice(0, limit).map(({ __datePart, __year, __month, __day, __ms, ...rest }) => rest);
      }

      // fallback: previous behavior (prefer last_release_date ISO then textual score)
      const pickDateValue = (item) => {
        const cand = item.last_release_date || item.latest_release_date || item.release_day || item.releaseDay;
        const ms = Number.isFinite(Date.parse(String(cand))) ? Date.parse(String(cand)) : null;
        if (ms) return ms;
        const score = parseReleaseDateScore(cand);
        return Number.isFinite(score) ? score * 1000 : Number.NEGATIVE_INFINITY;
      };

      const fallback = normalized
        .sort((left, right) => {
          const rv = pickDateValue(right);
          const lv = pickDateValue(left);
          if (rv !== lv) return rv - lv;
          return String(left.title || '').localeCompare(String(right.title || ''));
        })
        .slice(0, limit)
        .map(({ __datePart, __year, __month, __day, __ms, ...rest }) => rest);

      return fallback;
    })(),
  };
}

export async function getAnimeByStatus(status, page = 1, pageSize = 20) {
  const currentPage = Math.max(Number(page) || 1, 1);
  const offset = (currentPage - 1) * pageSize;
  const safeStatus = String(status || '').trim();

  const [countRows, animeRows] = await Promise.all([
    prisma.$queryRaw`
      SELECT COUNT(*) AS total
      FROM animes
      WHERE status = ${safeStatus}
    `,
    prisma.$queryRaw`
      SELECT id, source_key, anime_id, batch_id, title, japanese_title, poster_url, anime_url, status, score, episodes, duration, aired, studios, producers, type, release_day, latest_release_date, last_release_date, season, synopsis, metadata, created_at, updated_at
      FROM animes
      WHERE status = ${safeStatus}
      ORDER BY title ASC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `,
  ]);

  const totalItems = Number(countRows?.[0]?.total || 0);
  return {
    animes: animeRows.map(normalizeAnimeRow),
    pagination: makePagination(totalItems, currentPage, pageSize),
  };
}

export async function getPopularAnimePage(page = 1, pageSize = 15) {
  const currentPage = Math.max(Number(page) || 1, 1);
  const offset = (currentPage - 1) * pageSize;

  const [countRows, animeRows] = await Promise.all([
    prisma.$queryRaw`
      SELECT COUNT(*) AS total
      FROM animes
    `,
    prisma.$queryRaw`
      SELECT id, source_key, anime_id, batch_id, title, japanese_title, poster_url, anime_url, status, score, episodes, duration, aired, studios, producers, type, release_day, latest_release_date, last_release_date, season, synopsis, metadata, created_at, updated_at
      FROM animes
      ORDER BY CAST(NULLIF(score, '') AS DECIMAL(10, 2)) DESC, updated_at DESC, id DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `,
  ]);

  const totalItems = Number(countRows?.[0]?.total || 0);
  return {
    animes: animeRows.map(normalizeAnimeRow),
    pagination: makePagination(totalItems, currentPage, pageSize),
  };
}

export async function getGenresWithCounts() {
  const rows = await prisma.$queryRaw`
    SELECT
      g.id,
      g.source_key,
      g.genre_id,
      g.name,
      g.slug,
      g.external_url,
      g.created_at,
      g.updated_at,
      COUNT(m.anime_id) AS total,
      MIN(a.poster_url) AS sample_poster
    FROM anime_genres g
    LEFT JOIN anime_genre_map m ON m.genre_id = g.id
    LEFT JOIN animes a ON a.id = m.anime_id
    GROUP BY g.id, g.source_key, g.genre_id, g.name, g.slug, g.external_url, g.created_at, g.updated_at
    ORDER BY g.name ASC
  `;

  return rows.map(normalizeGenreRow);
}

export async function getAnimeByGenreSlug(slug, page = 1, pageSize = 20) {
  const currentPage = Math.max(Number(page) || 1, 1);
  const offset = (currentPage - 1) * pageSize;

  const [countRows, animeRows] = await Promise.all([
    prisma.$queryRaw`
      SELECT COUNT(*) AS total
      FROM animes a
      JOIN anime_genre_map m ON m.anime_id = a.id
      JOIN anime_genres g ON g.id = m.genre_id
      WHERE g.slug = ${slug}
    `,
    prisma.$queryRaw`
      SELECT a.id, a.source_key, a.anime_id, a.batch_id, a.title, a.japanese_title, a.poster_url, a.anime_url, a.status, a.score, a.episodes, a.duration, a.aired, a.studios, a.producers, a.type, a.release_day, a.latest_release_date, a.last_release_date, a.season, a.synopsis, a.metadata, a.created_at, a.updated_at
      FROM animes a
      JOIN anime_genre_map m ON m.anime_id = a.id
      JOIN anime_genres g ON g.id = m.genre_id
      WHERE g.slug = ${slug}
      ORDER BY a.title ASC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `,
  ]);

  const totalItems = Number(countRows?.[0]?.total || 0);
  const pagination = makePagination(totalItems, currentPage, pageSize);

  return {
    animes: animeRows.map(normalizeAnimeRow),
    pagination,
  };
}

export async function searchAnimeByKeyword(keyword, limit = 24) {
  const query = `%${String(keyword || '').trim()}%`;
  if (query === '%%') return [];

  const rows = await prisma.$queryRaw`
    SELECT id, source_key, anime_id, batch_id, title, japanese_title, poster_url, anime_url, status, score, episodes, duration, aired, studios, producers, type, release_day, latest_release_date, last_release_date, season, synopsis, metadata, created_at, updated_at
    FROM animes
    WHERE title LIKE ${query} OR japanese_title LIKE ${query}
    ORDER BY title ASC
    LIMIT ${limit}
  `;

  return rows.map(normalizeAnimeRow);
}

export async function getAnimeDetailBySlug(slug) {
  const rows = await prisma.$queryRaw`
    SELECT id, source_key, anime_id, batch_id, title, japanese_title, poster_url, anime_url, status, score, episodes, duration, aired, studios, producers, type, release_day, latest_release_date, last_release_date, season, synopsis, metadata, created_at, updated_at
    FROM animes
    WHERE anime_id = ${slug} OR batch_id = ${slug}
    ORDER BY updated_at DESC, id DESC
    LIMIT 1
  `;

  const anime = rows[0] ? normalizeAnimeRow(rows[0]) : null;
  if (!anime?.id) return null;

  const animeId = Number(rows[0].id);
  const [genreRows, episodeRows, batchRows, recommendationRows] = await Promise.all([
    prisma.$queryRaw`
      SELECT g.id, g.source_key, g.genre_id, g.name, g.slug, g.external_url, g.created_at, g.updated_at
      FROM anime_genre_map m
      JOIN anime_genres g ON g.id = m.genre_id
      WHERE m.anime_id = ${animeId}
      ORDER BY g.name ASC
    `,
    prisma.$queryRaw`
      SELECT id, source_key, episode_id, anime_id, title, release_time, default_streaming_url, has_prev_episode, has_next_episode, prev_episode_source_id, next_episode_source_id, credit, encoder, duration, type, info_payload, episode_url, created_at, updated_at
      FROM anime_episodes
      WHERE anime_id = ${animeId}
      ORDER BY id DESC
    `,
    prisma.$queryRaw`
      SELECT id, source_key, batch_id, anime_id, title, japanese_title, poster_url, type, score, episodes, duration, studios, producers, aired, credit, download_payload, batch_url, created_at, updated_at
      FROM anime_batches
      WHERE anime_id = ${animeId}
      ORDER BY id DESC
      LIMIT 1
    `,
    prisma.$queryRaw`
      SELECT r.anime_id, r.recommended_anime_id, r.position, a.id, a.source_key, a.anime_id, a.batch_id, a.title, a.japanese_title, a.poster_url, a.anime_url, a.status, a.score, a.episodes, a.duration, a.aired, a.studios, a.producers, a.type, a.release_day, a.latest_release_date, a.last_release_date, a.season, a.synopsis, a.metadata, a.created_at, a.updated_at
      FROM anime_recommendations r
      JOIN animes a ON a.id = r.recommended_anime_id
      WHERE r.anime_id = ${animeId}
      ORDER BY r.position ASC, a.title ASC
      LIMIT 12
    `,
  ]);

  const infoPayload = rows[0]?.metadata || {};
  const genres = genreRows.map((row) => ({
    id: row?.id ? String(row.id) : null,
    genreId: row?.genre_id,
    name: row?.name,
    slug: row?.slug,
    otakudesuUrl: row?.external_url || null,
  }));

  const episodeList = episodeRows.map((row) => ({
    id: row?.id ? String(row.id) : null,
    title: pickFirst(row?.title, row?.episode_id, 'Episode'),
    episodeId: pickFirst(row?.episode_id, row?.id),
    otakudesuUrl: row?.episode_url || null,
    watchSlug: pickFirst(row?.episode_id, row?.id),
    releaseTime: row?.release_time || null,
    defaultStreamingUrl: row?.default_streaming_url || null,
    hasPrevEpisode: Boolean(row?.has_prev_episode),
    hasNextEpisode: Boolean(row?.has_next_episode),
    prevEpisodeSourceId: row?.prev_episode_source_id || null,
    nextEpisodeSourceId: row?.next_episode_source_id || null,
    credit: row?.credit || null,
    encoder: row?.encoder || null,
    duration: row?.duration || null,
    type: row?.type || null,
    infoPayload: row?.info_payload && typeof row.info_payload === 'object' ? row.info_payload : null,
  }));

  const batch = batchRows[0]
    ? {
        id: String(batchRows[0].id),
        batchId: batchRows[0].batch_id,
        title: batchRows[0].title,
        slug: batchRows[0].batch_id,
        poster: batchRows[0].poster_url || NO_IMAGE_URL,
        type: batchRows[0].type || null,
        score: batchRows[0].score || null,
        episodes: batchRows[0].episodes || null,
        duration: batchRows[0].duration || null,
        studios: batchRows[0].studios || null,
        producers: batchRows[0].producers || null,
        aired: batchRows[0].aired || null,
        credit: batchRows[0].credit || null,
        downloadPayload: batchRows[0].download_payload || null,
        batchUrl: batchRows[0].batch_url || null,
      }
    : null;

  const recommendedAnimeList = recommendationRows.map(normalizeAnimeRow).filter((row) => Boolean(row.slug));

  return {
    ...anime,
    japaneseTitle: anime.japanese,
    genres,
    genreList: genres,
    episodeList,
    recommendedAnimeList,
    batch,
    info: infoPayload,
    rawInfoPayload: infoPayload,
  };
}

export async function getScheduleMap() {
  const rows = await prisma.$queryRaw`
    SELECT id, source_key, anime_id, batch_id, title, japanese_title, poster_url, anime_url, status, score, episodes, duration, aired, studios, producers, type, release_day, latest_release_date, last_release_date, season, synopsis, metadata, created_at, updated_at
    FROM animes
    WHERE status = 'Ongoing'
    ORDER BY release_day ASC, title ASC
  `;

  const schedule = {
    minggu: [],
    senin: [],
    selasa: [],
    rabu: [],
    kamis: [],
    "jum'at": [],
    sabtu: [],
    random: [],
  };

  for (const row of rows) {
    const anime = normalizeAnimeRow(row);
    const key = String(row?.release_day || 'random').trim().toLowerCase();
    const normalizedKey = key === 'jumat' ? "jum'at" : key;
    const bucket = schedule[normalizedKey] ? normalizedKey : 'random';
    schedule[bucket].push(anime);
  }

  return schedule;
}

export async function getEpisodePageData(episodeSlug) {
  const rows = await prisma.$queryRaw`
    SELECT id, source_key, episode_id, anime_id, title, release_time, default_streaming_url, has_prev_episode, has_next_episode, prev_episode_source_id, next_episode_source_id, credit, encoder, duration, type, info_payload, episode_url, created_at, updated_at
    FROM anime_episodes
    WHERE episode_id = ${episodeSlug}
    ORDER BY id DESC
    LIMIT 1
  `;

  const episodeRow = rows[0];
  if (!episodeRow) return null;

  const animeRows = await prisma.$queryRaw`
    SELECT id, source_key, anime_id, batch_id, title, japanese_title, poster_url, anime_url, status, score, episodes, duration, aired, studios, producers, type, release_day, latest_release_date, last_release_date, season, synopsis, metadata, created_at, updated_at
    FROM animes
    WHERE id = ${Number(episodeRow.anime_id)}
    LIMIT 1
  `;

  const anime = animeRows[0] ? normalizeAnimeRow(animeRows[0]) : null;
  const episode = normalizeEpisodeRow(episodeRow);

  const [genreRows, episodeRows, groupRows, downloadGroupRows] = await Promise.all([
    anime?.id
      ? prisma.$queryRaw`
          SELECT g.id, g.source_key, g.genre_id, g.name, g.slug, g.external_url, g.created_at, g.updated_at
          FROM anime_genre_map m
          JOIN anime_genres g ON g.id = m.genre_id
          WHERE m.anime_id = ${Number(animeRows[0].id)}
          ORDER BY g.name ASC
        `
      : Promise.resolve([]),
    anime?.id
      ? prisma.$queryRaw`
          SELECT id, source_key, episode_id, anime_id, title, release_time, default_streaming_url, has_prev_episode, has_next_episode, prev_episode_source_id, next_episode_source_id, credit, encoder, duration, type, info_payload, episode_url, created_at, updated_at
          FROM anime_episodes
          WHERE anime_id = ${Number(animeRows[0].id)}
          ORDER BY id DESC
        `
      : Promise.resolve([]),
    prisma.$queryRaw`
      SELECT id, episode_id, group_title, created_at, updated_at
      FROM anime_episode_server_groups
      WHERE episode_id = ${Number(episodeRow.id)}
      ORDER BY id ASC
    `,
    prisma.$queryRaw`
      SELECT id, source_key, entity_type, entity_id, group_title, position, created_at
      FROM anime_download_groups
      WHERE entity_type = 'episode' AND entity_id = ${Number(episodeRow.id)}
      ORDER BY id ASC
    `,
  ]);

  const serverGroups = [];
  for (const group of groupRows) {
    const servers = await prisma.$queryRaw`
      SELECT id, server_group_id, title, server_id, server_payload, position, created_at
      FROM anime_episode_servers
      WHERE server_group_id = ${Number(group.id)}
      ORDER BY position ASC, id ASC
    `;

    serverGroups.push({
      id: String(group.id),
      title: group.group_title,
      serverList: servers.map((server) => {
        const payload = server?.server_payload && typeof server.server_payload === 'object' ? server.server_payload : null;
        const directUrl = pickFirst(payload?.url, payload?.href, payload?.streamUrl, payload?.link, null);
        return {
          id: String(server.id),
          title: server.title,
          serverId: server.server_id,
          href: directUrl,
          url: directUrl || episode.defaultStreamingUrl || episode.episodeUrl,
          serverPayload: payload,
          position: Number(server.position || 0),
        };
      }),
    });
  }

  const downloadGroups = [];
  for (const group of downloadGroupRows) {
    const links = await prisma.$queryRaw`
      SELECT id, download_group_id, quality_title, title, size, url, position, created_at
      FROM anime_download_links
      WHERE download_group_id = ${Number(group.id)}
      ORDER BY position ASC, id ASC
    `;

    downloadGroups.push({
      id: String(group.id),
      title: group.group_title,
      links: links.map((link) => ({
        id: String(link.id),
        title: link.title,
        qualityTitle: link.quality_title,
        size: link.size,
        url: link.url,
        position: Number(link.position || 0),
      })),
    });
  }

  return {
    anime,
    episode,
    genres: genreRows.map((row) => ({
      id: row?.id ? String(row.id) : null,
      genreId: row?.genre_id,
      name: row?.name,
      slug: row?.slug,
      otakudesuUrl: row?.external_url || null,
    })),
    episodeList: episodeRows.map(normalizeEpisodeRow),
    serverGroups,
    downloadGroups,
    currentStreamUrl: episode.defaultStreamingUrl || null,
    watchSlug: episode.slug,
  };
}
