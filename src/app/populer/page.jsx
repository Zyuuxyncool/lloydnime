import React from 'react';
import Header from '@/app/components/Header';
import AnimeCard from '@/app/components/AnimeCard';
import PaginationControls from '../components/Pagination';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import { getOtakudesuApiUrl } from '@/app/libs/otakudesu-api';

const ANIME_PER_PAGE = 15;

async function getPopularAnime(page = 1) {
  try {
    const apiUrl = getOtakudesuApiUrl();
    const response = await fetch(`${apiUrl}/otakudesu/home`, {
      next: { revalidate: 300 },
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`API popular gagal: ${response.status}`);
    }

    const result = await response.json();
    const data = result?.data || result;
    const rawAnimes = data?.animeList || data?.animes || result?.animeList || result?.animes || [];
    const paginationRaw = result?.pagination || data?.pagination || {};

    const normalizedAnimes = rawAnimes
      .map((anime) => {
        return {
          ...anime,
          slug: anime?.animeId || anime?.slug || anime?.anime_id,
          poster: anime?.poster || anime?.image || anime?.thumbnail,
          episode: anime?.episode || anime?.episodes || anime?.latestEpisode || anime?.latest_episode,
          status_or_day: anime?.status_or_day || anime?.status || anime?.releaseDay || anime?.release_day,
        };
      })
      .filter((anime) => Boolean(anime.slug));

    const pagination = {
      hasNextPage: paginationRaw?.hasNextPage ?? (normalizedAnimes.length === ANIME_PER_PAGE),
      hasPrevPage: paginationRaw?.hasPrevPage ?? page > 1,
      currentPage: paginationRaw?.currentPage || page,
      totalPages: paginationRaw?.totalPages || page + (normalizedAnimes.length === ANIME_PER_PAGE ? 1 : 0),
    };
    
    return {
      animes: normalizedAnimes,
      pagination: pagination
    };
  } catch (error) {
    console.error("❌ Error fetching popular anime:", error);
    return { animes: [], pagination: { hasNextPage: false, hasPrevPage: false, errorMessage: error.message || 'Gagal mengambil data anime populer' } };
  }
}

/**
 * Halaman Populer (Server Component)
 * searchParams akan otomatis diisi oleh Next.js (cth: { page: '1' })
 */
export default async function PopulerPage({ searchParams }) {

  // Ambil nomor halaman dari URL, default ke 1 jika tidak ada
  const currentPage = parseInt(searchParams.page) || 1;

  // Panggil API untuk mendapatkan data halaman saat ini
  const { animes: popularAnime, pagination } = await getPopularAnime(currentPage);

  const hasNextPage = pagination?.hasNextPage || false;

  const breadcrumbs = [
    { title: 'Populer', href: '/populer' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <BreadcrumbNavigation crumbs={breadcrumbs} />
      <Header title={`Anime Populer #${currentPage}`} />
      {popularAnime.length > 0 ? (
        <>
          {/* Grid untuk menampilkan anime */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 my-8 gap-4 md:gap-6">
            {popularAnime.map((anime, index) => (
              <AnimeCard
                key={`${anime.slug || 'popular'}-${index}`}
                title={anime.title}
                image={anime.poster}
                slug={anime.slug}
                // Berdasarkan JSON Anda:
                type={anime.type} // cth: "24 Episode"
                episode={anime.episode}
                statusOrDay={anime.status_or_day} // cth: "Selesai ✓"
                priority={index < 10} // Optimasi loading 10 gambar pertama
              />
            ))}
          </div>

          {/* Kontrol Paginasi */}
          <PaginationControls
            currentPage={currentPage}
            hasNextPage={hasNextPage}
            hasPrevPage={pagination?.hasPrevPage || false}
            totalPages={pagination?.totalPages || 1}
            baseUrl="/populer"
          />
        </>
      ) : (
        <div className="flex justify-center items-center min-h-[50vh]">
          <p className="text-neutral-400">
            {pagination?.errorMessage 
              ? `Error: ${pagination.errorMessage}` 
              : currentPage > 1 
                ? "Gagal memuat halaman ini atau halaman tidak ada." 
                : "Gagal memuat anime populer."}
          </p>
        </div>
      )}
    </div>
  );
}