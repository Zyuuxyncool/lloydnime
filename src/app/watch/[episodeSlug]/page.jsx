"use client";

// 1. Impor 'useSearchParams'
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon, PlayCircleIcon } from '@heroicons/react/24/solid';
import ResponsiveBreadcrumb from '@/app/components/ResponsiveBreadcrumb';


// Komponen Skeleton (Tidak Berubah)
function WatchPageSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white animate-pulse" suppressHydrationWarning>
      <div className="container mx-auto px-4 py-8">
        <div className="aspect-video bg-slate-800 rounded-lg mb-4 shadow-lg"></div>
        <div className="bg-slate-900/50 p-4 rounded-lg mb-4">
          <div className="h-7 w-48 bg-slate-700 rounded mb-3"></div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="h-9 w-28 bg-slate-700 rounded-md"></div>
            ))}
          </div>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-lg mb-8">
          <div className="h-8 w-3/4 bg-slate-700 rounded mb-2"></div>
          <div className="flex justify-between items-center">
            <div className="h-5 w-44 bg-slate-700 rounded"></div>
            <div className="flex space-x-2">
              <div className="h-10 w-10 bg-slate-700 rounded-full"></div>
              <div className="h-10 w-10 bg-slate-700 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Komponen ErrorDisplay (Tidak Berubah)
function ErrorDisplay({ message, animeSlug }) {
  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col justify-center items-center text-center px-4" suppressHydrationWarning>
      <h1 className="text-2xl font-bold mb-4 text-red-500">Terjadi Kesalahan</h1>
      <p className="text-neutral-400 mb-8">{message}</p>
      <Link href="/" className="bg-pink-600 text-white px-6 py-2 rounded-full hover:bg-pink-700 transition">
        Kembali ke Beranda
      </Link>
    </div>
  );
}

// 2. Buat Komponen Konten terpisah untuk menggunakan useSearchParams
function WatchPageContent({ params, episodeSlug }) {
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();

  // State (Tidak berubah)
  const [episodeTitle, setEpisodeTitle] = useState(null);
  const [servers, setServers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStreamUrl, setCurrentStreamUrl] = useState(null);
  const [activeIdentifier, setActiveIdentifier] = useState(null);
  const [isSwitchingServer, setIsSwitchingServer] = useState(false);
  const [isValidPrev, setIsValidPrev] = useState(false);
  const [isValidNext, setIsValidNext] = useState(false);
  const [animeInfo, setAnimeInfo] = useState(null);
  const [episodeList, setEpisodeList] = useState([]);
  const [showEpisodeList, setShowEpisodeList] = useState(false);

  // State untuk tracking waktu menonton
  const [watchStartTime, setWatchStartTime] = useState(null);
  const [accumulatedMinutes, setAccumulatedMinutes] = useState(0);
  const [showLevelUpNotif, setShowLevelUpNotif] = useState(false);
  const [newLevel, setNewLevel] = useState(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const normalizeUrl = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;

    try {
      const base = new URL(apiUrl);

      if (rawUrl.startsWith('/')) {
        return `${base.origin}${rawUrl}`;
      }

      return `${apiUrl}/${rawUrl}`;
    } catch {
      return rawUrl;
    }
  };

  // useEffect untuk Fetch Data (HANYA FETCH 1)
  useEffect(() => {
    if (!episodeSlug) {
      setError("Slug episode tidak valid.");
      setIsLoading(false);
      return;
    }

    async function fetchEpisodeData() {
      setIsLoading(true);
      setError(null);
      setCurrentStreamUrl(null);
      setServers([]);
      setEpisodeTitle(null);
      // setAnimeInfo(null); // Kita tidak reset di sini lagi
      setIsValidPrev(false);
      setIsValidNext(false);

      try {
        // --- HANYA FETCH 1: Ambil Data Episode (Streams) ---
        const episodeResponse = await fetch(`${apiUrl}/animasu/episode/${episodeSlug}`);
        
        // Log the request untuk debugging
        console.log(`Fetching episode from: ${apiUrl}/animasu/episode/${episodeSlug}`);
        console.log(`Response status: ${episodeResponse.status}`);
        
        if (!episodeResponse.ok) {
          throw new Error(`Gagal mengambil data episode. Status: ${episodeResponse.status}. URL yang diakses: ${apiUrl}/animasu/episode/${episodeSlug}`);
        }
        const episodeData = await episodeResponse.json();
        
        console.log("Episode Data:", episodeData);

        // Sesuaikan dengan struktur response Sanka
        const episodeContent = episodeData.data || episodeData;
        
        // Extract servers - Sanka API returns 'server' (singular) field with list of servers
        let serversList = [];
        
        // Check multiple possible field names for servers
        if (Array.isArray(episodeContent.server)) {
          // 'server' field with array of servers
          serversList = episodeContent.server;
        } else if (episodeContent.server && typeof episodeContent.server === 'object') {
          // 'server' is a single object, wrap it in array
          serversList = [episodeContent.server];
        } else if (Array.isArray(episodeContent.streams)) {
          serversList = episodeContent.streams;
        } else if (Array.isArray(episodeContent.servers)) {
          serversList = episodeContent.servers;
        } else if (episodeContent.defaultStreamingUrl) {
          // Fallback: use defaultStreamingUrl as single server
          serversList = [{
            name: 'Default Server',
            url: episodeContent.defaultStreamingUrl
          }];
        }
        
        // IMPORTANT: Flatten nested qualities structure if needed
        const flattenedServers = [];
        if (serversList.length > 0 && serversList[0].qualities) {
          // Server has nested structure with qualities
          serversList.forEach(server => {
            if (Array.isArray(server.qualities)) {
              server.qualities.forEach(quality => {
                const resolution = quality.title; // "360p", "480p", "720p"
                if (Array.isArray(quality.serverList)) {
                  quality.serverList.forEach(srv => {
                    flattenedServers.push({
                      resolution,
                      title: srv.title,
                      serverId: srv.serverId,
                      href: srv.href,
                      // Prefer direct href/url/link from API
                      url: normalizeUrl(srv.href || srv.url || srv.link) || (srv.serverId ? `${apiUrl}/server/${srv.serverId}` : null)
                    });
                  });
                }
              });
            }
          });
          serversList = flattenedServers;
        }

        serversList = serversList.map((server) => ({
          ...server,
          url: normalizeUrl(server?.url || server?.href || server?.link) || (server?.serverId ? `${apiUrl}/server/${server.serverId}` : null),
        }));
        
        console.log("Flattened servers:", serversList);
        
        if (!serversList || serversList.length === 0) {
          console.warn("Tidak ada server yang ditemukan. Response structure:", {
            title: episodeContent.title,
            defaultStreamingUrl: episodeContent.defaultStreamingUrl,
            server: episodeContent.server,
            streams: episodeContent.streams,
            servers: episodeContent.servers,
            keys: Object.keys(episodeContent)
          });
          throw new Error(`Episode ini belum memiliki server streaming. Response keys: ${Object.keys(episodeContent).join(', ')}`);
        }

        setEpisodeTitle(episodeContent.title);
        setServers(serversList);

        // Set default stream URL - prefer defaultStreamingUrl if available
        const defaultServer = serversList[0];
        let defaultStreamUrl = episodeContent.defaultStreamingUrl;
        
        if (!defaultStreamUrl && defaultServer) {
          defaultStreamUrl = defaultServer.url || defaultServer.link || defaultServer.streamUrl || defaultServer.href;
        }

        defaultStreamUrl = normalizeUrl(defaultStreamUrl);
        
        if (defaultStreamUrl) {
          // Jika URL adalah API endpoint, jangan set langsung (user harus klik dulu)
          if (!defaultStreamUrl.includes('/server/')) {
            setCurrentStreamUrl(defaultStreamUrl);
            setActiveIdentifier(defaultStreamUrl);
          }
        } else {
          setCurrentStreamUrl(null);
        }

        // --- LOGIKA BARU: Baca data riwayat dari URL atau Session Storage ---
        const slugFromUrl = searchParams.get('slug');
        const titleFromUrl = searchParams.get('title');
        const imageFromUrl = searchParams.get('image');
        let cachedInfo = null;

        if (slugFromUrl && titleFromUrl && imageFromUrl) {
          // KASUS 1: Datang dari Halaman Detail (URL Punya Params)
          const info = {
            slug: slugFromUrl,
            title: titleFromUrl,
            image: imageFromUrl
          };
          setAnimeInfo(info);
          cachedInfo = info;
          // SIMPAN ke sessionStorage untuk episode berikutnya
          sessionStorage.setItem('lastWatchedAnimeInfo', JSON.stringify(info));
        } else {
          // KASUS 2: Pindah dari Ep 1 -> Ep 2 (URL Polosan)
          // Coba AMBIL DARI sessionStorage
          const storedInfo = sessionStorage.getItem('lastWatchedAnimeInfo');
          if (storedInfo) {
            cachedInfo = JSON.parse(storedInfo);
            setAnimeInfo(cachedInfo);
            console.log("Anime info restored from sessionStorage:", cachedInfo);
          } else {
            // Jika tidak ada di cache (misal: user langsung ke URL nonton)
            console.warn("Data riwayat (slug, title, image) tidak ditemukan di query params ATAU session storage.");
          }
        }
        // --- AKHIR LOGIKA BARU ---

        // --- Fetch Anime Details untuk mendapatkan Episode List ---
        const currentAnimeSlug = slugFromUrl || cachedInfo?.slug;
        console.log("=== FETCH ANIME DETAILS ===");
        console.log("currentAnimeSlug:", currentAnimeSlug);
        console.log("slugFromUrl:", slugFromUrl);
        console.log("cachedInfo:", cachedInfo);
        console.log("episodeSlug:", episodeSlug);
        
        // Fallback: extract anime slug dari episodeSlug (misal: "hmode-episode-1" -> "hmode")
        let animeSlugToFetch = currentAnimeSlug;
        if (!animeSlugToFetch && episodeSlug) {
          // Extract base slug dari episode slug (before "-episode-")
          const match = episodeSlug.match(/^(.+?)-episode-\d+$/);
          if (match) {
            animeSlugToFetch = match[1];
            console.log("Anime slug extracted from episodeSlug:", animeSlugToFetch);
          }
        }
        
        if (animeSlugToFetch) {
          try {
            const animeUrl = `${apiUrl}/animasu/detail/${animeSlugToFetch}`;
            console.log("Fetching from URL:", animeUrl);
            const animeResponse = await fetch(animeUrl);
            console.log("Anime response status:", animeResponse.status);
            
            if (animeResponse.ok) {
              const animeData = await animeResponse.json();
              console.log("Anime response data received");
              
              const animeDetail = animeData.data || animeData.detail || animeData;
              console.log("Anime detail extracted");
              
              const episodes = animeDetail.episodeList || animeDetail.episodes || [];
              console.log("Episodes found:", episodes.length);
              console.log("Episodes sample:", episodes.slice(0, 3));
              
              if (episodes.length > 0) {
                setEpisodeList(episodes);
                console.log("✅ Episode list updated with", episodes.length, "episodes");
              } else {
                console.warn("⚠️ Episodes array is empty. Response keys:", Object.keys(animeDetail));
              }
            } else {
              console.error("❌ Anime response error:", animeResponse.status);
            }
          } catch (err) {
            console.error("❌ Error fetching anime details:", err.message);
          }
        } else {
          console.warn("⚠️ No anime slug to fetch");
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchEpisodeData();
  }, [episodeSlug, apiUrl, searchParams]); // 'searchParams' tetap di sini


  // --- useEffect Simpan Riwayat ---
  // (Tidak berubah, ini akan bekerja setelah 'animeInfo' di-set)
  useEffect(() => {
    if (animeInfo && animeInfo.slug && animeInfo.title && animeInfo.image && sessionStatus !== 'loading' && session) {
      
      const saveHistory = async () => {
        try {
          await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              animeId: animeInfo.slug,
              episodeId: episodeSlug,
              title: animeInfo.title,
              image: animeInfo.image,
            }),
          });
          console.log(`Riwayat disimpan (${episodeSlug}). Cek database Anda.`);
        } catch (err) {
          console.error("Gagal menyimpan riwayat:", err);
        }
      };
      
      saveHistory();
    }
  }, [animeInfo, session, sessionStatus, episodeSlug]);

  // --- useEffect untuk Tracking Waktu Menonton ---
  useEffect(() => {
    // Hanya track jika user sudah login dan sedang menonton
    if (!session || !episodeSlug || !currentStreamUrl) {
      return;
    }

    // Set waktu mulai menonton
    const startTime = Date.now();
    setWatchStartTime(startTime);
    setAccumulatedMinutes(0);
    let localAccumulatedMinutes = 0;

    // Timer: setiap 2 menit, kirim progress ke server
    const trackingInterval = setInterval(async () => {
      const minutesWatched = 2; // 2 menit per interval

      try {
        const response = await fetch('/api/watch-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            episodeId: episodeSlug,
            watchDuration: minutesWatched,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          localAccumulatedMinutes += minutesWatched;
          setAccumulatedMinutes(localAccumulatedMinutes);
          
          // Tampilkan notifikasi jika naik level
          if (data.leveledUp) {
            setNewLevel(data.level);
            setShowLevelUpNotif(true);
            setTimeout(() => setShowLevelUpNotif(false), 5000); // Hilang setelah 5 detik
          }
          
          console.log(`Progress tersimpan: +${minutesWatched} menit. Total: ${data.totalWatchMinutes} menit, Level: ${data.level}`);
        }
      } catch (err) {
        console.error("Gagal menyimpan progress:", err);
      }
    }, 2 * 60 * 1000); // 2 menit = 120,000 ms

    // Cleanup: hentikan timer saat component unmount atau pindah episode
    return () => {
      clearInterval(trackingInterval);
      
      // Simpan sisa waktu yang belum tersimpan (jika ada)
      const timeElapsed = Date.now() - startTime;
      const remainingMinutes = Math.floor(timeElapsed / 60000) - localAccumulatedMinutes;
      
      if (remainingMinutes > 0) {
        // Send final update (fire and forget)
        fetch('/api/watch-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            episodeId: episodeSlug,
            watchDuration: remainingMinutes,
          }),
        }).catch(err => console.error("Gagal menyimpan progress akhir:", err));
      }
    };
  }, [session, episodeSlug, currentStreamUrl]);


  // --- Sisa kode tidak berubah ---

  // Fungsi Handle Klik Server
  const handleServerClick = (server) => {
    const serverUrl = normalizeUrl(server.url || server.link || server.href);
    console.log("Selected server:", server);
    console.log("Server URL:", serverUrl);
    
    setIsSwitchingServer(true);
    setActiveIdentifier(serverUrl);
    
    // Jika URL adalah API endpoint (mengandung /server/), fetch streaming URL terlebih dahulu
    if (serverUrl && serverUrl.includes('/server/')) {
      fetch(serverUrl)
        .then(res => res.json())
        .then(data => {
          console.log("Server data:", data);
          // Extract actual streaming URL dari response
          const streamUrl = data.data?.url || data.url || serverUrl;
          console.log("Stream URL extracted:", streamUrl);
          setCurrentStreamUrl(streamUrl);
          setIsSwitchingServer(false);
        })
        .catch(err => {
          console.error("Error fetching stream:", err);
          setCurrentStreamUrl(serverUrl); // Fallback to original URL
          setIsSwitchingServer(false);
        });
    } else {
      // Direct URL, use as-is
      setCurrentStreamUrl(serverUrl);
      setTimeout(() => {
        setIsSwitchingServer(false);
      }, 300);
    }
  };

  // Logika Membuat Slug Next/Prev
  const { prevSlug, nextSlug } = useMemo(() => {
    if (!episodeSlug) return { prevSlug: null, nextSlug: null };
    const match = episodeSlug.match(/-episode-(\d+)$/);
    if (!match) return { prevSlug: null, nextSlug: null };
    const baseSlug = episodeSlug.substring(0, match.index);
    const currentEpisodeNumber = parseInt(match[1], 10);
    const nextSlug = `${baseSlug}-episode-${currentEpisodeNumber + 1}`;
    const prevSlug = currentEpisodeNumber > 1 ? `${baseSlug}-episode-${currentEpisodeNumber - 1}` : null;
    return { prevSlug, nextSlug };
  }, [episodeSlug]);

  // useEffect untuk Memverifikasi Keberadaan Episode Next/Prev
  useEffect(() => {
    const checkEpisodeExistence = async () => {
      if (prevSlug) {
        try {
          const response = await fetch(`${apiUrl}/animasu/episode/${prevSlug}`, { method: 'HEAD' });
          setIsValidPrev(response.ok);
        } catch (error) {
          console.error("Error checking prevSlug:", error);
          setIsValidPrev(false);
        }
      } else {
        setIsValidPrev(false);
      }
      if (nextSlug) {
        try {
          const response = await fetch(`${apiUrl}/animasu/episode/${nextSlug}`, { method: 'HEAD' });
          setIsValidNext(response.ok);
        } catch (error) {
          console.error("Error checking nextSlug:", error);
          setIsValidNext(false);
        }
      } else {
        setIsValidNext(false);
      }
    };
    if (prevSlug || nextSlug) checkEpisodeExistence();
  }, [prevSlug, nextSlug, apiUrl]);


  if (isLoading) {
    return <WatchPageSkeleton />;
  }
  if (error) {
    return <ErrorDisplay message={`${error} (Debug: Check console untuk detail lebih lanjut)`} animeSlug={null} />;
  }
  if (!servers || servers.length === 0) {
    return <ErrorDisplay message={`Data episode tidak ditemukan atau tidak ada server tersedia untuk episode: ${episodeSlug}`} animeSlug={null} />;
  }

  // --- RETURN JSX ---
  // Breadcrumb: Home > Nama Anime > Episode Title
  const breadcrumbs = animeInfo?.slug ? [
    { title: animeInfo.title, href: `/detail/${animeInfo.slug}` },
    { title: episodeTitle || 'Loading...', href: `/watch/${episodeSlug}` }
  ] : [
    { title: episodeTitle || 'Loading...', href: `/watch/${episodeSlug}` }
  ];

  return (
    <div className="min-h-screen bg-black text-white" suppressHydrationWarning>
      {/* Notifikasi Level Up */}
      {showLevelUpNotif && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-yellow-400 via-purple-600 to-pink-600 text-white px-6 py-4 rounded-lg shadow-2xl animate-bounce">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎉</span>
            <div>
              <p className="font-bold text-lg flex items-center gap-2">
                <span>Level Up!</span>
                {newLevel >= 13 && <span className="text-2xl">👑</span>}
                {newLevel >= 10 && newLevel < 13 && <span className="text-2xl">⭐</span>}
                {newLevel >= 7 && newLevel < 10 && <span className="text-2xl">💎</span>}
                {newLevel >= 5 && newLevel < 7 && <span className="text-2xl">🎓</span>}
              </p>
              <p className="text-sm">Sekarang kamu Level {newLevel}</p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <ResponsiveBreadcrumb crumbs={breadcrumbs} />

        {/* Player (Tidak berubah) */}
        <div className="aspect-video bg-neutral-800 rounded-lg overflow-hidden mb-4 shadow-lg">
          {isSwitchingServer && (
            <div className="w-full h-full flex flex-col justify-center items-center text-center p-4 bg-neutral-900">
              <PlayCircleIcon className="h-16 w-16 text-pink-500 mb-4 animate-pulse" />
              <h2 className="text-xl font-bold animate-pulse">Memuat Server...</h2>
            </div>
          )}
          {!isSwitchingServer && currentStreamUrl && (
            <iframe
              src={currentStreamUrl}
              allowFullScreen
              className="w-full h-full border-0"
              key={currentStreamUrl}
            ></iframe>
          )}
          {!isSwitchingServer && !currentStreamUrl && (
            <div className="w-full h-full flex flex-col justify-center items-center text-center p-4 bg-neutral-900">
              <PlayCircleIcon className="h-16 w-16 text-pink-500 mb-4" />
              <h2 className="text-xl font-bold">Server Tidak Tersedia</h2>
              <p className="text-neutral-400">Silakan pilih server lain di bawah.</p>
            </div>
          )}
        </div>

        {/* Server List (Tidak berubah) */}
        <div className="bg-neutral-900 p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold mb-3">Pilih Server</h2>
          <div className='w-full h-full p-4 bg-neutral-800 rounded-lg shadow-xl'>
            <div className='mb-4 p-3 bg-neutral-700 rounded-md border border-yellow-500/50 flex items-start'>
              <p className='text-sm text-neutral-200 font-medium'>
                Server error? Coba beralih ke server lain di bawah ini.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 p-2 border-t border-neutral-700 pt-4">
              {servers && servers.length > 0 ? (
                servers.map((server, index) => {
                  // Extract URL - try multiple possible property names
                  const serverUrl = server.url || server.link || server.streamUrl || server.playUrl;
                  
                  // Extract resolution dengan lebih comprehensive
                  let serverResolution = null;
                  
                  // Priority: resolution property (dari flattened structure) > quality > name > label > subtitle
                  if (server.resolution) {
                    serverResolution = String(server.resolution);
                  } else if (server.quality) {
                    serverResolution = String(server.quality);
                  } else if (server.name && typeof server.name === 'string') {
                    serverResolution = server.name;
                  } else if (server.label && typeof server.label === 'string') {
                    serverResolution = server.label;
                  } else if (server.title && typeof server.title === 'string' && server.title.length < 50) {
                    serverResolution = server.title;
                  } else if (server.subtitle && typeof server.subtitle === 'string') {
                    serverResolution = server.subtitle;
                  }

                  // Format display name tanpa duplikasi teks
                  const resolutionText = String(serverResolution || '').trim();
                  const serverName = String(server.title || server.name || `Server ${index + 1}`).trim();

                  let displayName = serverName;
                  if (resolutionText && !serverName.toLowerCase().includes(resolutionText.toLowerCase())) {
                    displayName = `${resolutionText} [${serverName}]`;
                  }
                  
                  return (
                    <button
                      key={serverUrl || index}
                      type="button"
                      onClick={() => handleServerClick(server)}
                      disabled={isSwitchingServer || !serverUrl}
                      title={`Resolution: ${displayName}, URL: ${serverUrl || 'N/A'}`}
                      className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${activeIdentifier === serverUrl
                          ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30 ring-2 ring-pink-400'
                          : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600 hover:text-white'
                        }`}
                    >
                      {displayName}
                    </button>
                  );
                })
              ) : (
                <p className="text-neutral-400 text-sm">Tidak ada server tersedia</p>
              )}
            </div>
          </div>
        </div>

        {/* Episode List Section */}
        {episodeList && episodeList.length > 0 ? (
          <div className="bg-neutral-900 p-4 rounded-lg mb-4">
            <button
              onClick={() => setShowEpisodeList(!showEpisodeList)}
              className="w-full flex items-center justify-between bg-neutral-800 p-3 rounded-lg hover:bg-neutral-700 transition mb-3 cursor-pointer group"
            >
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                </svg>
                Daftar Episode ({episodeList.length})
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-pink-400 group-hover:text-pink-300 transition text-sm font-medium">
                  {showEpisodeList ? 'Tutup' : 'Buka'}
                </span>
                <svg 
                  className={`w-5 h-5 text-pink-400 transition-transform ${showEpisodeList ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </button>
            
            {showEpisodeList && (
              <div className="bg-neutral-800 p-4 rounded-lg max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {episodeList.map((ep, index) => {
                    const epId = ep.episodeId || ep.slug || ep.id;
                    const epNum = ep.eps || (index + 1);
                    const isCurrentEpisode = epId === episodeSlug;
                    
                    return (
                      <Link
                        key={epId || index}
                        href={`/watch/${epId}?slug=${animeInfo?.slug || ''}&title=${animeInfo?.title || ''}&image=${animeInfo?.image || ''}`}
                        className={`p-3 rounded-lg text-center transition-all text-sm font-semibold flex items-center justify-center min-h-12 ${
                          isCurrentEpisode
                            ? 'bg-pink-600 text-white ring-2 ring-pink-400 shadow-lg'
                            : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600 hover:text-white'
                        }`}
                        title={ep.title || `Episode ${epNum}`}
                      >
                        Ep {epNum}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-neutral-900 p-4 rounded-lg mb-4">
            <div className="bg-neutral-800 p-3 rounded-lg border border-yellow-500/50">
              <p className="text-sm text-neutral-400">
                ℹ️ Episode list belum termuat. Buka Console (F12) untuk debug info.
              </p>
            </div>
          </div>
        )}

        {/* Detail Episode & Navigasi */}
        <div className="bg-neutral-900 p-4 rounded-lg mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 truncate">{episodeTitle || 'Memuat judul...'}</h1>
          <div className="flex justify-between items-center">
            <span className="text-sm text-pink-400">Animasu API</span>
            <div className="flex space-x-2">
              
              {/* --- PERBAIKAN LINK: Hapus searchParams.toString() --- */}
              {/* Kita tidak perlu lagi meneruskan query params secara manual */}
              
              {isValidPrev && (
                <Link href={`/watch/${prevSlug}`} className="bg-neutral-700 p-2 rounded-full hover:bg-pink-600 transition">
                  <ChevronLeftIcon className="h-6 w-6" />
                </Link>
              )}
              {isValidNext && (
                <Link href={`/watch/${nextSlug}`} className="bg-neutral-700 p-2 rounded-full hover:bg-pink-600 transition">
                <ChevronRightIcon className="h-6 w-6" />
              </Link>
            )}
            </div>
          </div>
        </div>

      </div>
    </div >
  );
}

// Bungkus ekspor default dengan Suspense (Tidak berubah)
export default function WatchPage({ params }) {
  const resolvedParams = React.use ? React.use(params) : params;
  const episodeSlugArray = resolvedParams?.episodeSlug;
  const episodeSlug = Array.isArray(episodeSlugArray) ? episodeSlugArray[episodeSlugArray.length - 1] : episodeSlugArray || null;

  return (
    <React.Suspense fallback={<WatchPageSkeleton />}>
      <WatchPageContent params={params} episodeSlug={episodeSlug} />
    </React.Suspense>
  );
}