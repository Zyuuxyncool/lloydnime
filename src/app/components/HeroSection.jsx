import React from 'react'
import SearchInput from './SearchInput'
import Link from 'next/link'
import Image from 'next/image'

const HeroSection = () => {

  return (
    <div className="flex items-center justify-center bg-[#1A1A29] p-4">
      <div className="w-full max-w-5xl bg-[#252736] lg:h-[500px] rounded-2xl overflow-hidden 
    grid grid-cols-1 lg:grid-cols-2 
    shadow-2xl shadow-black/40 border border-neutral-800/30">

        {/* Konten Teks (Sekarang `lg:order-1`) */}
        <div className="p-6 lg:p-12 flex flex-col justify-center relative 
      bg-gradient-to-b from-[#2E2F40] to-[#1A1A29] 
      order-2 lg:order-1">

          <h1 className="text-2xl lg:text-4xl font-bold text-white mb-3 lg:mb-4 relative z-20">
            LloydNime
          </h1>
          <p className="text-neutral-400 mb-4 lg:mb-6 text-sm lg:text-base relative z-20">
            LloydNime adalah situs anime gratis tanpa iklan untuk menonton anime gratis
          </p>
          <SearchInput />
          <div className="text-xs text-neutral-400 mb-4 lg:mb-6 relative z-20 line-clamp-2 lg:line-clamp-none">
            Top search: Demon Slayer: Kimetsu no Y..., Demon Slayer: Kimetsu no Y...,
            One Piece, Demon Slayer: Mt. Natagum..., Sakamoto Days Part 2,
            The Fragrant Flower Blooms... Kaiji No. 8 Season 2,
            Demon Slayer: Kimetsu no Y... Demon Slayer: The Hashira... To Be Hero X
          </div>

          {/* Wrapper Tombol Aksi */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 relative z-20 w-full">
            <Link
              href="/animelist"
              className="bg-pink-500 hover:bg-pink-600 transition-colors duration-200 text-white px-6 py-2 lg:py-3 rounded-full flex items-center justify-center text-sm lg:text-base font-medium flex-1 sm:flex-none"
            >
              Database Anime A - Z
            </Link>

            <a
              href="https://saweria.co/lloyd1112"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-500 hover:bg-amber-600 transition-colors duration-200 text-neutral-950 px-6 py-2 lg:py-3 rounded-full flex items-center justify-center text-sm lg:text-base font-bold flex-1 sm:flex-none space-x-2"
            >
              <span>😸</span>
              <span>Donate Admin</span>
            </a>
          </div>
        </div>

        {/* Gambar (Sekarang `lg:order-2`) */}
        <div className="relative h-[300px] lg:h-auto order-1 lg:order-2">
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#2E2F40] to-transparent z-10"></div>
          <Image
            width={500}
            height={500}
            src="/images/goku.gif"
            alt="Anime Character"
            className="absolute inset-0 w-full h-full object-cover"
            priority={true}
          />
        </div>
      </div>
    </div>
  )
}

export default HeroSection