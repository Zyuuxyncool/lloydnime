import React from 'react';
import Header from '@/app/components/Header';
import AnimeCard from '@/app/components/AnimeCard';
import PaginationControls from '../components/Pagination';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import { getAnimeByStatus } from '@/app/libs/anime-db';

async function getMovieAnime(page = 1) {
  try {
    return await getAnimeByStatus('Completed', page, 20);
  
  } catch (error) {
    console.error("Error fetching completed anime from database:", error);
    // Kembalikan objek default jika error agar halaman tidak crash
    return { animes: [], pagination: { hasNext: false, hasPrev: false, totalPages: 1 } }; 
  }
}

/**
 * Halaman Populer (Server Component)
 */
export default async function MoviePage({ searchParams: searchParamsPromise }) {
  const searchParams = await searchParamsPromise;

  const currentPage = parseInt(searchParams?.page) || 1;

  // MODIFIKASI 2: Panggil API dan dapatkan seluruh objek 'result'
  const result = await getMovieAnime(currentPage);
  
  // MODIFIKASI 3: Ekstrak data dari 'result'
  const movieAnime = result.animes || [];
  const hasNextPage = result.pagination?.hasNext || false;

  const breadcrumbs = [
    { title: 'Movie', href: '/movie' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <BreadcrumbNavigation crumbs={breadcrumbs} />
      {/* Saya ganti 'Populer' menjadi 'Movie' agar sesuai nama file */}
      <Header title={`Anime Movie #${currentPage}`} /> 
      
      {movieAnime.length > 0 ? (
        <>
          {/* Grid untuk menampilkan anime */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 my-8 gap-4 md:gap-6">
            {movieAnime.map((anime, index) => (
              <AnimeCard
                key={`${anime.slug || 'movie'}-${index}`} 
                title={anime.title}
                image={anime.poster}
                slug={anime.slug}
                type={anime.type} // cth: "★ 7.66"
                statusOrDay={anime.episode} // cth: ""
                priority={index < 10}
              />
            ))}
          </div>

          {/* Kontrol Paginasi */}
          <PaginationControls
            currentPage={currentPage}
            hasNextPage={hasNextPage}
            hasPrevPage={result.pagination?.hasPrev || false}
            totalPages={result.pagination?.totalPages || 1}
            baseUrl="/movie"
          />
        </>
      ) : (
        <div className="flex justify-center items-center min-h-[50vh]">
          <p className="text-neutral-400">
            {currentPage > 1 ? "Gagal memuat halaman ini atau halaman tidak ada." : "Gagal memuat anime movie."}
          </p>
        </div>
      )}
    </div>
  );
}