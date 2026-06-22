import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const AnimeCard = ({
  title,
  image,
  slug,
  episode,
  statusOrDay,
  type,
  releaseDate,
  releaseDay,
  variant = 'default',
  priority = false,
}) => {
  const detailHref = slug ? `/detail/${slug}` : '#';
  const safeImage = image || 'https://placehold.co/400x600/27272a/ffffff?text=No+Image';
  const statusText = typeof statusOrDay === 'string' ? statusOrDay.replace('✓', '').trim() : '';
  const isDisabled = !slug;
  const ongoingDateText = typeof releaseDate === 'string' ? releaseDate.trim() : '';
  const ongoingDayText = typeof releaseDay === 'string' ? releaseDay.trim() : '';
  const isOngoing = variant === 'ongoing';

  return (
    <Link
      href={detailHref}
      aria-disabled={isDisabled}
      className={`group will-change-transform ${isDisabled ? 'pointer-events-none opacity-80' : ''}`}
      tabIndex={isDisabled ? -1 : undefined}
    >
      <div className="flex flex-col h-full">
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-neutral-800">
          <Image
            src={safeImage}
            alt={title}
            fill
            priority={priority}
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105 bg-neutral-700"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

          {isOngoing ? (
            <>
              {episode && (
                <div className="absolute left-2 top-2 z-10 rounded-sm bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white shadow-md">
                  {typeof episode === 'string' ? episode : `Episode ${episode}`}
                </div>
              )}

              {ongoingDateText && (
                <div className="absolute left-2 top-8 z-10 rounded-sm bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white shadow-md">
                  {ongoingDateText}
                </div>
              )}

              {ongoingDayText && (
                <div className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-sm bg-blue-600/90 px-2 py-0.5 text-[11px] font-semibold text-white shadow-md">
                  <span className="text-[10px]">★</span>
                  <span>{ongoingDayText}</span>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 z-10 p-2">
                <h3 className="line-clamp-2 text-sm font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {title}
                </h3>
              </div>
            </>
          ) : (
            <>
              {type && (
                <div className="absolute top-2 right-2 z-10 rounded-md bg-pink-600/80 px-2 py-1 text-xs font-bold text-white">
                  <span>{type}</span>
                </div>
              )}

              {episode && (
                <div className="absolute bottom-2 left-2 z-10 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
                  {typeof episode === 'string' ? episode : `Episode ${episode}`}
                </div>
              )}
            </>
          )}
        </div>

        {isOngoing ? null : (
          <div className="mt-2 px-1">
            <h3 className="font-semibold text-sm text-white line-clamp-2 group-hover:text-pink-400 transition-colors">
              {title}
            </h3>

            {statusText && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-400">
                <span>{statusText}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

export default AnimeCard;