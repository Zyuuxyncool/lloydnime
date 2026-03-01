export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      return Response.json({ genres: [], error: 'API URL not configured' }, { status: 500 });
    }

    const response = await fetch(`${apiUrl}/genre`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      return Response.json({ genres: [], error: `API returned ${response.status}` }, { status: 200 });
    }

    const result = await response.json();
    const data = result?.data || result;
    const genres = data?.genreList || data?.genres || result?.genres || [];

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
