export const dynamic = 'force-dynamic'

import React from 'react';
import Navigation from '../components/Navigation';
import AnimeListClient from '../components/AnimeListClient';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import { getAllAnimeList } from '@/app/libs/anime-db';

// Fungsi fetch ini hanya berjalan di server
async function getInitialAnime(letter) {
    try {
        const list = await getAllAnimeList();
        return list.filter((anime) => String(anime?.title || '').trim().toUpperCase().startsWith(String(letter || 'A').toUpperCase()));
        
    } catch (error) {
        console.error("Gagal mengambil data anime dari database:", error);
        return []; // Kembalikan array kosong jika gagal
    }
}

// Ini tetap Server Component
const Page = async () => {
    
    // Kita akan mengambil data awal (halaman 1) di sini
    const initialLetter = 'A';
    const initialAnimeData = await getInitialAnime(initialLetter); 
    
    const breadcrumbs = [
        { title: 'Anime List', href: '/animelist' }
    ];

    return (
        <div className="min-h-screen text-white p-4 md:p-8">
            <BreadcrumbNavigation crumbs={breadcrumbs} />
            <h1 className="text-3xl font-bold mb-8 text-center text-pink-500">
                Daftar Semua Anime A - Z
            </h1>
            
            {/* Kita teruskan data awal (initialData) ke komponen klien.
              Komponen klien akan menangani sisanya (termasuk fetch halaman 2, 3, ...)
            */}
            <AnimeListClient 
              initialData={initialAnimeData} 
              initialLetter={initialLetter} 
            />
        </div>
    );
}

export default Page;