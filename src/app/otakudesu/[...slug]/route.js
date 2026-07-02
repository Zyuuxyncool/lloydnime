// API Route untuk Otakudesu - Forward requests ke external API
const EXTERNAL_API_URL = (process.env.OTAKUDESU_API_URL || 'http://165.22.52.169:3001/otakudesu/').replace(/\/+$/, '');

async function proxyOtakudesuRequest(request, { params }) {
  try {
    const { slug } = await params;

    // Build the full path from slug array
    const path = slug ? '/' + slug.join('/') : '';

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    // Build complete URL
    const url = `${EXTERNAL_API_URL}${path}${queryString ? '?' + queryString : ''}`;

    console.log(`[Otakudesu Route] Proxying ${request.method} to: ${url}`);

    const headers = {
      'User-Agent': 'Next.js Proxy',
      'Accept': 'application/json',
    };

    let body;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.text();
      if (body) {
        headers['Content-Type'] = request.headers.get('content-type') || 'application/json';
      }
    }

    // Forward request to external API
    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: 'no-store', // Don't cache for fresh data
    });

    const contentType = response.headers.get('content-type') || '';
    const responseText = await response.text();
    let data;

    if (contentType.includes('application/json')) {
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }
    } else {
      data = responseText;
    }

    if (typeof data === 'string') {
      return new Response(data, {
        status: response.status,
        headers: {
          'Content-Type': contentType || 'text/plain; charset=utf-8',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5 min cache
        },
      });
    }

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

export async function GET(request, { params }) {
  return proxyOtakudesuRequest(request, { params });
}

export async function POST(request, { params }) {
  return proxyOtakudesuRequest(request, { params });
}

export async function HEAD(request, { params }) {
  return proxyOtakudesuRequest(request, { params });
}
