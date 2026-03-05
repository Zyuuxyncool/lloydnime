import React from 'react';
import Navigation from '@/app/components/Navigation';
import ResponsiveBreadcrumb from '@/app/components/ResponsiveBreadcrumb';
import Header from '@/app/components/Header';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

async function getGenres() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-otakudesu-zeta.vercel.app';
    const genreUrl = `${apiUrl}/anime/genre`;

    const response = await fetch(genreUrl, {
      cache: 'no-store'
    });

    if (!response.ok) {
      return [];
    }

    const result = await response.json();

    const data = result?.data || result;
    const genres = data?.genreList || data?.genres || result?.genres || [];
    
    // Map to the format expected by the UI (with slug and name)
    const mappedGenres = genres.map(genre => ({
      slug: genre.genreId || genre.slug || genre.genre || genre.name,
      name: genre.title || genre.name || genre.genreId
    }));

    return mappedGenres;
  } catch (error) {
    console.error("Error fetching genres:", error);
    return [];
  }
}

async function getSampleAnimeForGenre(slug) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-otakudesu-zeta.vercel.app';
    const response = await fetch(`${apiUrl}/anime/genre/${slug}?page=1`, {
      next: { revalidate: 86400 }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    const data = result?.data || result;
    const animeList = data?.animeList || data?.animes || result?.animeList || result?.animes || [];
    return animeList?.[0]?.poster || animeList?.[0]?.image || animeList?.[0]?.thumbnail || null;
  } catch (error) {
    return null;
  }
}

export default async function GenresPage() {
  const genres = await getGenres();

  // Fetch sample images for all genres
  const allGenres = await Promise.all(
    genres.map(async (genre) => {
      const image = await getSampleAnimeForGenre(genre.slug);
      return { ...genre, image };
    })
  );

  const breadcrumbs = [
    { title: 'Genres', href: '/genres' }
  ];

  return (
    <div className="min-h-screen bg-neutral-900 text-white" suppressHydrationWarning>
      <div className="container mx-auto px-4 py-8">
        <Navigation />
        <ResponsiveBreadcrumb crumbs={breadcrumbs} />
        <Header title="Daftar Genre Anime" />

        {allGenres.length > 0 ? (
          <>
            <p className="text-neutral-400 mb-6">
              Total {allGenres.length} genre tersedia
            </p>

            {/* Genre Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {allGenres.map((genre) => (
                <Link
                  key={genre.slug}
                  href={`/genre/${genre.slug}`}
                  className="group relative bg-neutral-800 rounded-lg overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-pink-600/30 h-32 md:h-40"
                >
                  {/* Background Image */}
                  {genre.image ? (
                    <>
                      <Image
                        src={genre.image}
                        alt={genre.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30 group-hover:from-pink-900/90 group-hover:via-pink-800/60 transition-all duration-300"></div>
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900 group-hover:from-pink-700 group-hover:to-pink-900 transition-all duration-300"></div>
                  )}

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full p-4">
                    <h3 className="text-sm md:text-base font-bold text-white text-center drop-shadow-lg">
                      {genre.name}
                    </h3>
                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-5 w-5 text-white mx-auto drop-shadow-lg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M9 5l7 7-7 7" 
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center min-h-[50vh]">
            <p className="text-neutral-400">Gagal memuat data genre.</p>
          </div>
        )}
      </div>
    </div>
  );
}
