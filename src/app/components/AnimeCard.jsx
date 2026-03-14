import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const AnimeCard = ({ title, image, slug, episode, statusOrDay, type, priority = false }) => {
  const detailHref = slug ? `/detail/${slug}` : '#';
  const safeImage = image || 'https://placehold.co/400x600/27272a/ffffff?text=No+Image';
  const statusText = typeof statusOrDay === 'string' ? statusOrDay.replace('✓', '').trim() : '';
  const isDisabled = !slug;

  return (
    <Link
      href={detailHref}
      aria-disabled={isDisabled}
      className={`group will-change-transform ${isDisabled ? 'pointer-events-none opacity-80' : ''}`}
      tabIndex={isDisabled ? -1 : undefined}
    >
      <div className="flex flex-col h-full">

        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg">
          <Image
            src={safeImage} // Poster dari API
            alt={title}
            fill
            priority={priority}
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105 bg-neutral-700"
          />

          {/* <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div> */}

          {/* Badge TYPE baru (pojok kanan atas) */}
          {type && (
            <div className="absolute top-2 right-2 z-10 rounded-md bg-pink-600/80 px-2 py-1 text-xs font-bold text-white">
              <span>{type}</span>
            </div>
          )}

          {/* Badge Episode (pojok kiri bawah) */}
          {episode && (
            <div className="absolute bottom-2 left-2 z-10 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
              {typeof episode === 'string' ? episode.replace('Episode ', 'Eps ') : `Eps ${episode}`}
            </div>
          )}
        </div>

        <div className="mt-2 px-1">
          <h3 className="font-semibold text-sm text-white line-clamp-2 group-hover:text-pink-400 transition-colors">
            {title}
          </h3>

          {/* Teks sub-judul (Hari rilis atau status) */}
          {statusText && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-400">
              <span>{statusText}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default AnimeCard;