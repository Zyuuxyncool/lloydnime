"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { PlayCircleIcon } from '@heroicons/react/24/solid';
import ResponsiveBreadcrumb from '@/app/components/ResponsiveBreadcrumb';

function ErrorDisplay({ message }) {
  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col justify-center items-center text-center px-4" suppressHydrationWarning>
      <h1 className="text-2xl font-bold mb-4 text-red-500">Terjadi Kesalahan</h1>
      <p className="text-neutral-400 mb-8 whitespace-pre-line">{message}</p>
      <Link href="/" className="bg-pink-600 text-white px-6 py-2 rounded-full hover:bg-pink-700 transition">
        Kembali ke Beranda
      </Link>
    </div>
  );
}

function buildEpisodeHref(baseSlug, episodeNumber) {
  if (!baseSlug || !episodeNumber) return null;
  return `${baseSlug}-episode-${episodeNumber}`;
}

export default function WatchPageClient({
  episodeSlug,
  anime,
  episode,
  currentStreamUrl,
  serverGroups,
  downloadGroups,
  episodeList,
}) {
  const { data: session, status: sessionStatus } = useSession();
  const [selectedStreamUrl, setSelectedStreamUrl] = useState(currentStreamUrl || '');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [isSwitchingServer, setIsSwitchingServer] = useState(false);

  const animeInfo = anime ? { slug: anime.slug, title: anime.title, image: anime.poster } : null;

  const flattenedServers = useMemo(() => {
    return (serverGroups || []).flatMap((group) =>
      (group.serverList || []).map((server) => ({
        ...server,
        groupTitle: group.title,
      }))
    );
  }, [serverGroups]);

  useEffect(() => {
    const initial = currentStreamUrl || flattenedServers[0]?.url || '';
    setSelectedStreamUrl(initial);
    setSelectedLabel(flattenedServers[0] ? `${flattenedServers[0].groupTitle} - ${flattenedServers[0].title}` : '');
  }, [currentStreamUrl, flattenedServers]);

  useEffect(() => {
    if (animeInfo && animeInfo.slug && animeInfo.title && animeInfo.image && sessionStatus !== 'loading' && session) {
      fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animeId: animeInfo.slug,
          episodeId: episodeSlug,
          title: animeInfo.title,
          image: animeInfo.image,
        }),
      }).catch(() => {});
    }
  }, [animeInfo, session, sessionStatus, episodeSlug]);

  useEffect(() => {
    if (!session || !episodeSlug || !selectedStreamUrl) return;

    const trackingInterval = setInterval(async () => {
      try {
        await fetch('/api/watch-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ episodeId: episodeSlug, watchDuration: 2 }),
        });
      } catch {
        // ignore progress failures
      }
    }, 2 * 60 * 1000);

    return () => clearInterval(trackingInterval);
  }, [session, episodeSlug, selectedStreamUrl]);

  const currentEpisodeNumber = Number(episode?.title || episode?.eps || 0);
  const prevSlug = episode?.prevEpisodeSourceId || buildEpisodeHref(anime?.slug, currentEpisodeNumber > 1 ? currentEpisodeNumber - 1 : null);
  const nextSlug = episode?.nextEpisodeSourceId || buildEpisodeHref(anime?.slug, currentEpisodeNumber + 1);

  const breadcrumbs = animeInfo?.slug
    ? [
        { title: animeInfo.title, href: `/detail/${animeInfo.slug}` },
        { title: episode?.title || 'Episode', href: `/watch/${episodeSlug}` },
      ]
    : [{ title: episode?.title || 'Episode', href: `/watch/${episodeSlug}` }];

  if (!episode || !anime) {
    return <ErrorDisplay message={`Data episode tidak ditemukan untuk: ${episodeSlug}`} />;
  }

  if (!selectedStreamUrl) {
    return <ErrorDisplay message={`Tidak ada stream URL yang tersedia untuk episode: ${episodeSlug}`} />;
  }

  const episodeQueryString = animeInfo
    ? new URLSearchParams({ slug: animeInfo.slug, title: animeInfo.title, image: animeInfo.image || '' }).toString()
    : '';

  return (
    <div className="min-h-screen bg-black text-white" suppressHydrationWarning>
      <div className="container mx-auto px-4 py-8">
        <ResponsiveBreadcrumb crumbs={breadcrumbs} />

        <div className="aspect-video bg-neutral-800 rounded-lg overflow-hidden mb-4 shadow-lg">
          {isSwitchingServer ? (
            <div className="w-full h-full flex flex-col justify-center items-center text-center p-4 bg-neutral-900">
              <PlayCircleIcon className="h-16 w-16 text-pink-500 mb-4 animate-pulse" />
              <h2 className="text-xl font-bold animate-pulse">Memuat Server...</h2>
            </div>
          ) : (
            <iframe
              src={selectedStreamUrl}
              allowFullScreen
              className="w-full h-full border-0"
              key={selectedStreamUrl}
            />
          )}
        </div>

        <div className="bg-neutral-900 p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold mb-3">Pilih Server</h2>
          {selectedLabel ? <p className="text-sm text-neutral-400 mb-4">Aktif: {selectedLabel}</p> : null}
          <div className="flex flex-col gap-3">
            {serverGroups.map((group) => (
              <div key={group.id} className="w-full rounded-lg border border-neutral-800 p-3">
                <div className="text-sm font-semibold text-pink-400 mb-3">{group.title}</div>
                <div className="flex flex-wrap gap-2">
                  {(group.serverList || []).map((server) => (
                    <button
                      key={server.id}
                      type="button"
                      onClick={() => {
                        if (!server.url) return;
                        setIsSwitchingServer(true);
                        setSelectedStreamUrl(server.url);
                        setSelectedLabel(`${group.title} - ${server.title}`);
                        window.setTimeout(() => setIsSwitchingServer(false), 250);
                      }}
                      className="rounded-full bg-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:bg-pink-600 hover:text-white transition"
                    >
                      {server.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {downloadGroups.length > 0 && (
          <div className="bg-neutral-900 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold mb-3">Download</h2>
            <div className="space-y-3">
              {downloadGroups.map((group) => (
                <div key={group.id} className="rounded-lg border border-neutral-800 p-3">
                  <div className="text-sm font-semibold text-pink-400 mb-2">{group.title}</div>
                  <div className="flex flex-wrap gap-2">
                    {(group.links || []).map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700 transition"
                      >
                        {link.qualityTitle || link.title}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-neutral-900 p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold mb-3">Episode Lain</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {(episodeList || []).slice(0, 24).map((item) => (
              <Link
                key={item.watchSlug}
                href={`/watch/${item.watchSlug}?${episodeQueryString}`}
                className={`rounded-lg px-3 py-2 text-sm text-center transition ${item.watchSlug === episodeSlug ? 'bg-pink-600 text-white' : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'}`}
              >
                Ep {item.title}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          {prevSlug ? (
            <Link href={`/watch/${prevSlug}?${episodeQueryString}`} className="rounded-full bg-neutral-800 px-4 py-2 text-sm hover:bg-neutral-700 transition">
              Episode Sebelumnya
            </Link>
          ) : <span />}
          {nextSlug ? (
            <Link href={`/watch/${nextSlug}?${episodeQueryString}`} className="rounded-full bg-neutral-800 px-4 py-2 text-sm hover:bg-neutral-700 transition">
              Episode Berikutnya
            </Link>
          ) : <span />}
        </div>
      </div>
    </div>
  );
}