// app/page.js

import AnimeCompleted from "@/app/components/AnimeCompleted";
import AnimeOngoing from "@/app/components/AnimeOngoing";
import Header from "@/app/components/Header";
import HeroSection from "@/app/components/HeroSection";
import React from 'react';
import Navbar from "./components/Navbar"; 
import { AuthUserSession } from "./libs/auth-libs"; 

function ApiWarningMessage({ sectionTitle }) {
  return (
    <div className="mx-4 md:mx-24 my-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 text-yellow-100">
      <p className="font-semibold">Data {sectionTitle} sedang bermasalah.</p>
      <p className="text-sm text-yellow-200/90 mt-1">
        Silakan refresh beberapa saat lagi. Sistem sedang mencoba sumber data cadangan.
      </p>
    </div>
  );
}
function AnimeListSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 my-12 mx-4 md:mx-24 gap-4 md:gap-6">
      {Array.from({ length: 10 }).map((_, idx) => (
        <div key={idx} className="animate-pulse">
          <div className="aspect-[2/3] w-full rounded-lg bg-neutral-800" />
          <div className="mt-2 h-4 rounded bg-neutral-800" />
          <div className="mt-2 h-3 w-2/3 rounded bg-neutral-800" />
        </div>
      ))}
    </div>
  );
}
// -----------------------------------------------------------------


// --- FETCHANIME HOME ENDPOINT ---
// Fetch dari /anime/home untuk mengambil ongoing dan completed data
async function fetchAnimeHome(baseUrl, desiredLimit = 10) {
  try {
    const response = await fetch(`${baseUrl}/anime/home`, { cache: 'no-store' });

    if (!response.ok) {
      console.error(`Gagal fetch /anime/home: Status ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      console.error(`Respons /anime/home bukan JSON`);
      return null;
    }

    const result = await response.json();
    const data = result?.data || {};

    // Parse ongoing anime
    const ongoingList = (data?.ongoing?.animeList || []).map((anime) => ({
      ...anime,
      slug: anime?.animeId || anime?.slug || anime?.anime_id,
      poster: anime?.poster || anime?.image || anime?.thumbnail,
      episodes: anime?.episodes || anime?.episode || anime?.latestEpisode,
      releaseDay: anime?.releaseDay || anime?.release_day || anime?.status_or_day || anime?.status,
    })).filter(anime => anime.title && anime.slug).slice(0, desiredLimit);

    // Parse completed anime
    const completedList = (data?.completed?.animeList || []).map((anime) => ({
      ...anime,
      slug: anime?.animeId || anime?.slug || anime?.anime_id,
      poster: anime?.poster || anime?.image || anime?.thumbnail,
      episodes: anime?.episodes || anime?.episode || anime?.latestEpisode,
      releaseDay: anime?.releaseDay || anime?.release_day || anime?.status_or_day || anime?.status,
    })).filter(anime => anime.title && anime.slug).slice(0, desiredLimit);

    return {
      ongoing: ongoingList,
      completed: completedList,
    };
  } catch (error) {
    console.error("Error fetching from /anime/home:", error);
    return null;
  }
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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-otakudesu-zeta.vercel.app';
  const user = await AuthUserSession();

  let animeOngoing = [];
  let animeComplete = [];
  let ongoingFetchFailed = false;
  let completedFetchFailed = false;

  // Fetch dari /anime/home endpoint
  try {
    const homeResult = await fetchAnimeHome(apiUrl, 10);

    if (homeResult && homeResult.ongoing && homeResult.completed) {
      animeOngoing = homeResult.ongoing;
      animeComplete = homeResult.completed;
      
      ongoingFetchFailed = animeOngoing.length === 0;
      completedFetchFailed = animeComplete.length === 0;
    } else {
      console.error("Fetch /anime/home gagal atau mengembalikan null");
      ongoingFetchFailed = true;
      completedFetchFailed = true;
    }
    
  } catch (error) {
    console.error("Error saat fetch /anime/home:", error);
    ongoingFetchFailed = true;
    completedFetchFailed = true;
  }

  // Fallback ke Jikan jika gagal
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