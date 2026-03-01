// app/page.js

import AnimeCompleted from "@/app/components/AnimeCompleted";
import AnimeOngoing from "@/app/components/AnimeOngoing";
import Header from "@/app/components/Header";
import HeroSection from "@/app/components/HeroSection";
import React from 'react';
import Navbar from "./components/Navbar"; 
import { AuthUserSession } from "./libs/auth-libs"; 

// ... (Komponen ApiWarningMessage dan AnimeListSkeleton Anda tidak berubah) ...
function ApiWarningMessage({ sectionTitle }) {
  // ... (tidak berubah)
}
function AnimeListSkeleton() {
  // ... (tidak berubah)
}
// -----------------------------------------------------------------


// --- FUNGSI HELPER BARU ---
// Fungsi ini akan fetch dan filter data secara berulang
// sampai jumlah 'desiredLimit' tercapai atau data habis.
async function fetchAndFilterAnime(baseUrl, endpoint, desiredLimit = 10) {
  const endpointCandidates = Array.isArray(endpoint) ? endpoint : [endpoint];
  let filteredAnimes = []; // Array untuk menampung hasil
  let currentPage = 1;
  let hasNextPage = true;
  const validTypes = ['TV', 'Movie', 'Spesial']; // Tipe yang kita inginkan

  // Kita batasi 5 halaman fetch per section
  // agar server tidak looping selamanya jika ada error
  const maxPagesToFetch = 5; 

  while (
    filteredAnimes.length < desiredLimit && 
    hasNextPage && 
    currentPage <= maxPagesToFetch
  ) {
    try {
      let data = null;
      let activeEndpoint = null;

      for (const candidate of endpointCandidates) {
        const response = await fetch(`${baseUrl}/${candidate}?page=${currentPage}`);

        if (!response.ok) {
          if (response.status >= 500) {
            console.error(`Gagal fetch ${candidate} page ${currentPage}: Status ${response.status}`);
          }
          continue;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.toLowerCase().includes('application/json')) {
          console.error(`Respons ${candidate} bukan JSON (page ${currentPage})`);
          continue;
        }

        data = await response.json();
        activeEndpoint = candidate;
        break;
      }

      if (!data) {
        hasNextPage = false;
        continue;
      }
      const rawList = data?.data?.animeList || data?.data?.animes || data?.animeList || data?.animes || [];

      const animesOnThisPage = rawList.map((anime) => {
        // Otakudesu API v3 uses 'animeId' as the slug
        const slug = anime?.animeId || anime?.slug || anime?.anime_id;

        return {
          ...anime,
          slug: slug,
          poster: anime?.poster || anime?.image || anime?.thumbnail,
          episodes: anime?.episodes || anime?.episode || anime?.latestEpisode,
          releaseDay: anime?.releaseDay || anime?.release_day || anime?.status_or_day || anime?.status,
        };
      });

      // Filter anime di halaman ini dan pastikan ada slug
      const validAnimes = animesOnThisPage.filter(anime => 
        anime.title && anime.slug // Pastikan ada judul DAN slug
      );

      // Tambahkan hasil filter ke array utama
      // Kita gunakan 'push' dan 'slice' di akhir agar lebih efisien
      for (const anime of validAnimes) {
        if (filteredAnimes.length < desiredLimit) {
          filteredAnimes.push(anime);
        } else {
          break; // Hentikan jika 'desiredLimit' sudah tercapai
        }
      }

      // Perbarui status pagination
      hasNextPage = data?.pagination?.hasNextPage || data?.data?.pagination?.hasNextPage || false;
      currentPage++;

    } catch (error) {
      console.error(`Error saat processing ${endpointCandidates.join(', ')} page ${currentPage}:`, error);
      hasNextPage = false; // Hentikan loop jika ada error parsing JSON, dll.
    }
  }

  // Kembalikan array yang sudah terisi dan terpotong
  return filteredAnimes;
}

async function fetchFallbackAnime(section = 'ongoing', desiredLimit = 10) {
  try {
    const fallbackUrl = section === 'ongoing'
      ? 'https://api.jikan.moe/v4/seasons/now?limit=25'
      : 'https://api.jikan.moe/v4/top/anime?limit=25';

    const response = await fetch(fallbackUrl, {
      next: { revalidate: 1800 }
    });

    if (!response.ok) return [];

    const result = await response.json();
    const list = Array.isArray(result?.data) ? result.data : [];

    return list.slice(0, desiredLimit).map((item) => ({
      title: item?.title || item?.title_english || 'Unknown Title',
      slug: null,
      poster: item?.images?.webp?.large_image_url || item?.images?.jpg?.large_image_url || item?.images?.jpg?.image_url,
      episodes: item?.episodes || '?',
      releaseDay: section === 'ongoing' ? 'Ongoing' : 'Popular',
      type: item?.type || 'TV',
    })).filter((anime) => Boolean(anime.title && anime.poster));
  } catch {
    return [];
  }
}
// --- AKHIR FUNGSI HELPER BARU ---


// Komponen Home Anda (sudah async)
const Home = async () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const user = await AuthUserSession();

  let animeOngoing = [];
  let animeComplete = [];
  let ongoingFetchFailed = false;
  let completedFetchFailed = false;

  // MODIFIKASI: Gunakan Promise.allSettled dengan fungsi helper baru
  // Ini akan fetch 'ongoing' dan 'completed' secara paralel,
  // dan masing-masing akan melakukan looping fetch internal jika diperlukan.
  try {
    const [ongoingResult, completedResult] = await Promise.allSettled([
      fetchAndFilterAnime(apiUrl, 'ongoing-anime', 10),
      fetchAndFilterAnime(apiUrl, 'complete-anime', 10)
    ]);

    if (ongoingResult.status === 'fulfilled') {
      animeOngoing = ongoingResult.value;
      // Anggap gagal hanya jika hasil fetch = 0
      if (animeOngoing.length === 0) ongoingFetchFailed = true; 
    } else {
      console.error("Fetch ongoing gagal:", ongoingResult.reason);
      ongoingFetchFailed = true;
    }

    if (completedResult.status === 'fulfilled') {
      animeComplete = completedResult.value;
      // Anggap gagal hanya jika hasil fetch = 0
      if (animeComplete.length === 0) completedFetchFailed = true; 
    } else {
      console.error("Fetch completed gagal:", completedResult.reason);
      completedFetchFailed = true;
    }
    
  } catch (error) {
    console.error("Error global saat fetch di Home:", error);
    ongoingFetchFailed = true;
    completedFetchFailed = true;
  }

  if (animeOngoing.length === 0) {
    animeOngoing = await fetchFallbackAnime('ongoing', 10);
    ongoingFetchFailed = animeOngoing.length === 0;
  }

  if (animeComplete.length === 0) {
    animeComplete = await fetchFallbackAnime('complete', 10);
    completedFetchFailed = animeComplete.length === 0;
  }
  // -----------------------------------------------------------------


  // 4. Render halaman. 
  return (
    <>
      <Navbar user={user} />
      <HeroSection />

      <Header title="Anime OnGoing" />
      {/* Jika fetch 0 item (walau sukses), tampilkan warning.
        Jika fetch gagal (error), tampilkan warning.
      */}
      {ongoingFetchFailed ? (
        <ApiWarningMessage sectionTitle="OnGoing" />
      ) : (
        <AnimeOngoing api={animeOngoing} />
      )}

      <React.Suspense fallback={<AnimeListSkeleton />}>
        <Header title="Anime Completed" />
        {completedFetchFailed ? (
          <ApiWarningMessage sectionTitle="Completed" />
        ) : (
          <AnimeCompleted api={animeComplete} />
        )}
      </React.Suspense>
    </>
  );
}

export default Home;