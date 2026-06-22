"use client";

import React, { useEffect, useState } from 'react';
import AnimeCard from '@/app/components/AnimeCard';

const DAYS = [
  { key: 'minggu', label: 'Minggu' },
  { key: 'senin', label: 'Senin' },
  { key: 'selasa', label: 'Selasa' },
  { key: 'rabu', label: 'Rabu' },
  { key: 'kamis', label: 'Kamis' },
  { key: "jum'at", label: "Jum'at" },
  { key: 'sabtu', label: 'Sabtu' },
  { key: 'random', label: 'Random' }
];

function getCurrentDay() {
  const dayIndex = new Date().getDay();
  const dayMap = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', "jum'at", 'sabtu'];
  return dayMap[dayIndex];
}

export default function ScheduleClient({ schedule = {} }) {
  const [activeDay, setActiveDay] = useState('senin');

  useEffect(() => {
    setActiveDay(getCurrentDay());
  }, []);

  const currentAnimes = schedule[activeDay] || [];

  return (
    <>
      <div className="mb-8 overflow-x-auto">
        <div className="flex space-x-2 min-w-max pb-2">
          {DAYS.map((day) => (
            <button
              key={day.key}
              onClick={() => setActiveDay(day.key)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap ${
                activeDay === day.key
                  ? 'bg-pink-600 text-white shadow-lg'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {currentAnimes.length > 0 ? (
        <>
          <div className="mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-pink-500">
              {DAYS.find((d) => d.key === activeDay)?.label}
              <span className="text-neutral-400 text-base ml-2">({currentAnimes.length} anime)</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {currentAnimes.map((anime, index) => (
              <AnimeCard
                key={`${anime.slug || 'schedule'}-${index}`}
                title={anime.title}
                image={anime.poster}
                slug={anime.slug}
                type={anime.type}
                episode={anime.episode}
                statusOrDay={anime.status_or_day}
                priority={index < 10}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <p className="text-neutral-400 text-lg">Tidak ada anime untuk hari ini</p>
          </div>
        </div>
      )}
    </>
  );
}