// app/page.js

import AnimeCompleted from "@/app/components/AnimeCompleted";
import AnimeOngoing from "@/app/components/AnimeOngoing";
import Header from "@/app/components/Header";
import HeroSection from "@/app/components/HeroSection";
import React from 'react';
import Navbar from "./components/Navbar"; 
import { AuthUserSession } from "./libs/auth-libs"; 
import { getHomeAnimeSections } from './libs/anime-db';
import { extractHomeSections } from './libs/otakudesu-normalize';
import { fetchOtakudesuWithFallback } from './libs/otakudesu-snapshot-helper';

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


async function fetchAnimeHome(desiredLimit = 10) {
  try {
    const dbResult = await getHomeAnimeSections(desiredLimit);
    if (dbResult && ((Array.isArray(dbResult.ongoing) && dbResult.ongoing.length > 0) || (Array.isArray(dbResult.completed) && dbResult.completed.length > 0))) {
      return dbResult;
    }

    console.warn("Home DB result empty; falling back to Otakudesu API.");
    const fallbackResponse = await fetchOtakudesuWithFallback('home');
    if (fallbackResponse?.data) {
      return extractHomeSections(fallbackResponse.data);
    }

    return dbResult;
  } catch (error) {
    console.error("Error fetching home anime from database:", error);
    return null;
  }
}


// Komponen Home Anda (sudah async)
const Home = async () => {
  const user = await AuthUserSession();
  const todayLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date());

  let animeOngoing = [];
  let animeComplete = [];
  let ongoingFetchFailed = false;
  let completedFetchFailed = false;

  try {
    const homeResult = await fetchAnimeHome(10);

    if (homeResult && homeResult.ongoing && homeResult.completed) {
      animeOngoing = homeResult.ongoing;
      animeComplete = homeResult.completed;
      
      ongoingFetchFailed = animeOngoing.length === 0;
      completedFetchFailed = animeComplete.length === 0;
    } else {
      console.error("Fetch /otakudesu/home gagal atau mengembalikan null");
      ongoingFetchFailed = true;
      completedFetchFailed = true;
    }
    
  } catch (error) {
    console.error("Error saat fetch /otakudesu/home:", error);
    ongoingFetchFailed = true;
    completedFetchFailed = true;
  }


  return (
    <>
      <Navbar user={user} />
      <HeroSection />

      <div className="mx-4 md:mx-24 mt-8 mb-2 text-sm md:text-base text-neutral-400">
        Hari ini, {todayLabel}
      </div>
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