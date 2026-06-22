// API Route untuk Otakudesu - Forward requests ke external API
const EXTERNAL_API_URL = 'https://api-otakudesu-zeta.vercel.app';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    
    // Build the full path from slug array
    const path = slug ? '/' + slug.join('/') : '';
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // Build complete URL
    const url = `${EXTERNAL_API_URL}${path}${queryString ? '?' + queryString : ''}`;
    
    console.log(`[Otakudesu Route] Proxying to: ${url}`);
    
    // Forward request to external API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Next.js Proxy',
        'Accept': 'application/json',
      },
      cache: 'no-store', // Don't cache for fresh data
    });
    
    // Get response data
    const data = await response.json();
    
    // Return with appropriate status
    return Response.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5 min cache
      },
    });
  } catch (error) {
    console.error('[Otakudesu Route Error]', error);
    
    return Response.json(
      {
        status: 'error',
        message: error.message || 'Failed to fetch from Otakudesu API',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function HEAD(request, { params }) {
  return GET(request, params);
}
