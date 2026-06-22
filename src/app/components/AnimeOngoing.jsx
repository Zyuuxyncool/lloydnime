import React from 'react'
import AnimeCard from './AnimeCard'

function cleanLabel(value) {
  const text = String(value || '').trim();
  if (!text || text.toLowerCase() === 'none') return '';
  return text;
}

const AnimeOngoing = ({ api }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 my-12 mx-4 md:mx-24 gap-4 md:gap-6">
      {api.map((anime, index) => (
        (() => {
          const latestReleaseDate = cleanLabel(anime.latestReleaseDate || anime.latest_release_date);
          const releaseDay = cleanLabel(anime.releaseDay || anime.release_day || anime.status_or_day);

          return (
            <AnimeCard
              key={`${anime.animeId || anime.slug || 'ongoing'}-${index}`}
              title={anime.title}
              image={anime.poster}
              slug={anime.animeId || anime.slug}
              episode={anime.episodes}
              releaseDate={latestReleaseDate}
              releaseDay={releaseDay}
              variant="ongoing"
              priority={index < 6}
            />
          );
        })()
      ))}
    </div>
  )
}

export default AnimeOngoing