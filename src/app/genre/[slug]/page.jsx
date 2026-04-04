import React from 'react';
import Navigation from '@/app/components/Navigation';
import ResponsiveBreadcrumb from '@/app/components/ResponsiveBreadcrumb';
import Header from '@/app/components/Header';
import AnimeCard from '@/app/components/AnimeCard';
import PaginationControls from '@/app/components/Pagination';
import Link from 'next/link';
import { getOtakudesuApiUrl } from '@/app/libs/otakudesu-api';

async function getAnimeByGenre(slug, page = 1) {
  try {
    const apiUrl = getOtakudesuApiUrl();
    const urls = [
      `${apiUrl}/otakudesu/genre/${slug}?page=${page}`,
    ];

    let result = null;
    let response = null;

    for (const url of urls) {
      console.log('Fetching anime for genre:', url);
      response = await fetch(url, {
        cache: 'no-store'
      });

      console.log('Genre anime response status:', response.status);
      if (!response.ok) continue;

      result = await response.json();
      break;
    }

    if (!result) {
      throw new Error('Gagal mengambil data anime');
    }

    console.log('Genre anime data structure:', Object.keys(result));
    
    const rawAnimes = result?.data?.animeList || result?.data?.animes || result?.animeList || result?.animes || [];
    const animes = rawAnimes.map((anime) => {
      return {
        ...anime,
        slug: anime?.animeId || anime?.slug || anime?.anime_id,
        poster: anime?.poster || anime?.image || anime?.thumbnail,
        episode: anime?.episode || anime?.episodes || anime?.latestEpisode,
        status_or_day: anime?.status_or_day || anime?.status || anime?.releaseDay || anime?.release_day,
      };
    }).filter((anime) => Boolean(anime.slug));

    if (animes.length === 0) {
      // Fallback: use search endpoint and filter by genreId
      try {
        const searchResponse = await fetch(`${apiUrl}/search/${encodeURIComponent(slug)}`, {
          cache: 'no-store'
        });

        if (searchResponse.ok) {
          const searchResult = await searchResponse.json();
          const searchList =
            searchResult?.data?.animeList ||
            searchResult?.data?.animes ||
            searchResult?.animeList ||
            searchResult?.animes ||
            [];

          const filtered = searchList
            .filter((anime) => Array.isArray(anime?.genreList) && anime.genreList.some((g) => g?.genreId === slug))
            .map((anime) => ({
              ...anime,
              slug: anime?.animeId || anime?.slug || anime?.anime_id,
              poster: anime?.poster || anime?.image || anime?.thumbnail,
              episode: anime?.episode || anime?.episodes || anime?.latestEpisode,
              status_or_day: anime?.status_or_day || anime?.status || anime?.releaseDay || anime?.release_day,
            }))
            .filter((anime) => Boolean(anime.slug));

          if (filtered.length > 0) {
            return {
              animes: filtered,
              pagination: {
                hasNext: false,
                hasPrev: false,
                currentPage: 1,
                totalPages: 1
              }
            };
          }
        }
      } catch (fallbackError) {
        console.error('Error fetching genre fallback:', fallbackError);
      }
    }

    const pagination = result?.pagination || result?.data?.pagination || { hasNextPage: false, hasPrevPage: false };
    
    console.log(`Found ${animes.length} animes for genre ${slug}`);
    
    return {
      animes: animes,
      pagination: {
        hasNext: pagination.hasNextPage || false,
        hasPrev: pagination.hasPrevPage || false,
        currentPage: pagination.currentPage || page,
        totalPages: pagination.totalPages || 1
      }
    };
  } catch (error) {
    console.error("Error fetching anime by genre:", error);
    return { animes: [], pagination: { hasNext: false, hasPrev: false } };
  }
}

async function getGenres() {
  try {
    const apiUrl = getOtakudesuApiUrl();
    const response = await fetch(`${apiUrl}/genre`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return [];
    }
    
    const result = await response.json();
    
    const data = result?.data || result;
    const genres = data?.genreList || data?.genres || result?.genres || [];
    
    // Map to the format expected by the UI
    return genres.map(genre => ({
      slug: genre.genreId || genre.slug || genre.genre || genre.name,
      name: genre.title || genre.name || genre.genreId
    }));
  } catch (error) {
    console.error('Error fetching genres:', error);
    return [];
  }
}

export default async function GenrePage({ params: paramsPromise, searchParams }) {
  const params = await paramsPromise;
  const { slug } = params;
  const currentPage = parseInt(searchParams.page) || 1;

  const [result, allGenres] = await Promise.all([
    getAnimeByGenre(slug, currentPage),
    getGenres()
  ]);

  const animes = result.animes || [];
  const hasNextPage = result.pagination?.hasNext || false;
  const totalPages = result.pagination?.totalPages || 1;

  // Find genre name from slug
  const currentGenre = allGenres.find(g => g.slug === slug);
  const genreName = currentGenre?.name || slug;

  const breadcrumbs = [
    { title: 'Genres', href: '/genres' },
    { title: genreName, href: `/genre/${slug}` }
  ];

  return (
    <div className="min-h-screen bg-neutral-900 text-white" suppressHydrationWarning>
      <div className="container mx-auto px-4 py-8">
        <ResponsiveBreadcrumb crumbs={breadcrumbs} />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <Header title={`Genre: ${genreName}`} />
          <Link
            href="/genres"
            className="inline-flex items-center text-pink-400 hover:text-pink-500 transition-colors text-sm sm:text-base"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 19l-7-7m0 0l7-7m-7 7h18" 
              />
            </svg>
            Kembali ke Genres
          </Link>
        </div>

        {animes.length > 0 ? (
          <>
            <p className="text-neutral-400 mb-6">
              Halaman {currentPage} dari {totalPages} - Menampilkan {animes.length} anime
            </p>

            {/* Anime Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 my-8 gap-4 md:gap-6">
              {animes.map((anime, index) => (
                <AnimeCard
                  key={`${anime.slug || 'genre'}-${index}`}
                  title={anime.title}
                  image={anime.poster}
                  slug={anime.slug}
                  type={anime.type}
                  episode={anime.episode}
                  statusOrDay={anime.status_or_day}
                  priority={index < 10}
                />
              ))}
            </div>

            {/* Pagination */}
            <PaginationControls
              currentPage={currentPage}
              hasNextPage={hasNextPage}
              totalPages={totalPages}
            />
          </>
        ) : (
          <div className="flex flex-col justify-center items-center min-h-[50vh]">
            <p className="text-neutral-400 text-lg mb-4">
              {currentPage > 1 
                ? "Tidak ada anime di halaman ini." 
                : "Belum ada anime untuk genre ini."}
            </p>
            {currentPage > 1 && (
              <Link
                href={`/genre/${slug}`}
                className="bg-pink-600 text-white px-6 py-2 rounded-full hover:bg-pink-700 transition"
              >
                Kembali ke Halaman 1
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
