export const dynamic = 'force-dynamic'

import React from 'react';
import Navigation from '../components/Navigation';
import AnimeListClient from '../components/AnimeListClient';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';

// Fungsi fetch ini hanya berjalan di server
async function getInitialAnime(letter, page) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/anime?letter=${letter}&page=${page}`, { 
            cache: 'no-store' // Data anime list sebaiknya jangan di-cache terlalu lama
        }); 
        
        if (!response.ok) {
            throw new Error(`Gagal mengambil data: ${response.status}`);
        }
        
                const result = await response.json();
                const data = result?.data || result;
                const groupedList = Array.isArray(data?.list) ? data.list : null;

                let list = [];
                if (groupedList) {
                    const group = groupedList.find((item) => String(item?.startWith || '').toUpperCase() === String(letter).toUpperCase());
                    list = group?.animeList || [];
                } else {
                    list = data?.animeList || data?.animes || result?.animeList || result?.animes || [];
                }

                return list.map((anime) => ({
                    ...anime,
                    slug: anime?.animeId || anime?.slug || anime?.anime_id,
                    poster: anime?.poster || anime?.image || anime?.thumbnail || 'https://placehold.co/400x600/171717/ef4444?text=No+Image',
                }));
        
    } catch (error) {
        console.error("Gagal mengambil data anime:", error);
        return []; // Kembalikan array kosong jika gagal
    }
}

// Ini tetap Server Component
const Page = async () => {
    
    // Kita akan mengambil data awal (halaman 1) di sini
    const initialLetter = 'A';
    const initialAnimeData = await getInitialAnime(initialLetter, 1); 
    
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