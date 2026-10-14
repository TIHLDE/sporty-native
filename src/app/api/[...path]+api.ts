// I utvikling: sender alle /api-forespørsler videre til Sporty v3, som er backend for både appen
// og nettsiden. Telefonen når bare Expo-dev-serveren (ofte via tunnel), ikke v3 på Macen, så
// forespørslene går hit og videre til SPORTY_API_URL. I ferdige builds peker EXPO_PUBLIC_API_URL
// rett på v3, og denne ruten brukes ikke.

const TARGET = (process.env.SPORTY_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');

/** Headere appen sender som v3 trenger: innlogging, «Bytt bruker», filtype og Range for video. */
const REQUEST_HEADERS = ['authorization', 'content-type', 'x-act-as', 'range', 'accept'];

/** Headere i svaret som må med tilbake, bl.a. for nedlasting, bilder og video. */
const RESPONSE_HEADERS = [
  'content-type',
  'content-length',
  'content-disposition',
  'content-range',
  'accept-ranges',
  'cache-control',
];

async function proxy(request: Request) {
  const url = new URL(request.url);
  const headers = new Headers();
  for (const name of REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  let response: Response;
  try {
    response = await fetch(`${TARGET}${url.pathname}${url.search}`, {
      method: request.method,
      headers,
      // Rå bytes, så også opplastinger (multipart) sendes uendret.
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
    });
  } catch {
    return Response.json(
      { error: `Får ikke kontakt med Sporty-serveren på ${TARGET}. Kjører den (bun run dev i Sporty v3)?` },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers();
  for (const name of RESPONSE_HEADERS) {
    const value = response.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  return new Response(response.body, { status: response.status, headers: responseHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
