import { getGenresWithCounts } from '@/app/libs/anime-db';

export async function GET() {
  try {
    const genres = await getGenresWithCounts();

    return Response.json({
      genres,
      total: genres.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json(
      {
        genres: [],
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  }
}
