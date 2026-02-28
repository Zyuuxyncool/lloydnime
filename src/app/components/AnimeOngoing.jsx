import React from 'react'
import AnimeCard from './AnimeCard'

const AnimeOngoing = ({ api }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 my-12 mx-4 md:mx-24 gap-4 md:gap-6">
      {api.map((anime, index) => (
        <AnimeCard
          key={`${anime.animeId || anime.slug || 'ongoing'}-${index}`}
          title={anime.title}
          image={anime.poster}
          slug={anime.animeId || anime.slug}
          type={anime.type}
          episode={anime.episodes}
          statusOrDay={anime.releaseDay}
          priority={index < 6}
        />
      ))}
    </div>
  )
}

export default AnimeOngoing