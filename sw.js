'use strict';

const SHELL_CACHE = 'pokemath-shell-v1';
const SPRITE_CACHE = 'pokemath-sprites-v1';

const CORE_SHELL_URLS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './css/tokens.css',
  './css/layout.css',
  './css/components.css',
  './css/animations.css',
  './js/main.js',
  './js/core/adaptive.js',
  './js/core/audio.js',
  './js/core/hintEngine.js',
  './js/core/mathEngine.js',
  './js/core/state.js',
  './js/data/items.js',
  './js/data/pokemon.js',
  './js/data/routes.js',
  './js/ui/rotomPane.js',
  './js/ui/shell.js',
  './js/ui/vfx.js',
  './js/games/battleMode.js',
  './js/games/berryLabMode.js',
  './js/games/campPokedex.js',
  './js/games/catchMode.js',
  './js/games/evolutionForge.js',
];

function isSpriteHost(hostname) {
  return (
    hostname === 'raw.githubusercontent.com' ||
    hostname === 'pokeapi.co' ||
    hostname.endsWith('.pokeapi.co')
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(SHELL_CACHE);
        await Promise.allSettled(
          CORE_SHELL_URLS.map(async (relativeUrl) => {
            try {
              const resolvedUrl = new URL(relativeUrl, self.location.href).href;
              const response = await fetch(new Request(resolvedUrl, { cache: 'reload' }));
              if (response && response.ok) {
                await cache.put(resolvedUrl, response.clone());
              }
            } catch (_err) {
              // Tolerate missing/unreachable items so install succeeds during partial builds or offline
            }
          })
        );
      } catch (_err) {
        // Never reject install due to storage restrictions
      } finally {
        await self.skipWaiting();
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys
            .filter((key) => key !== SHELL_CACHE && key !== SPRITE_CACHE)
            .map((key) => caches.delete(key))
        );
      } catch (_err) {
        // Ignore cleanup errors and claim clients
      } finally {
        await self.clients.claim();
      }
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function handleShellRequest(request) {
  try {
    const cache = await caches.open(SHELL_CACHE);

    try {
      const networkResponse = await fetch(request);
      if (networkResponse && networkResponse.ok) {
        try {
          await cache.put(request, networkResponse.clone());
        } catch (_err) {
          // Ignore cache write quota errors
        }
        return networkResponse;
      }
      if (networkResponse && networkResponse.status < 500) {
        return networkResponse;
      }
    } catch (_err) {
      // Offline or network failure — fall back to SHELL_CACHE
    }

    const cached =
      (await cache.match(request)) ||
      (await cache.match(request, { ignoreSearch: true }));
    if (cached) {
      return cached;
    }

    const acceptHeader = request.headers.get('accept') || '';
    if (request.mode === 'navigate' || acceptHeader.includes('text/html')) {
      const indexFallback =
        (await cache.match(new URL('./index.html', self.location.href).href)) ||
        (await cache.match(new URL('./', self.location.href).href));
      if (indexFallback) {
        return indexFallback;
      }
    }
  } catch (_err) {
    // Fall through to deterministic offline response
  }

  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

async function handleSpriteRequest(event) {
  const { request } = event;

  try {
    const cache = await caches.open(SPRITE_CACHE);
    const cached = await cache.match(request);

    const revalidate = fetch(request)
      .then(async (networkResponse) => {
        if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
          try {
            await cache.put(request, networkResponse.clone());
          } catch (_err) {
            // Ignore sprite cache quota errors
          }
        }
        return networkResponse;
      })
      .catch(() => null);

    if (cached) {
      event.waitUntil(revalidate);
      return cached;
    }

    const networkResponse = await revalidate;
    if (networkResponse) {
      return networkResponse;
    }
  } catch (_err) {
    // Fall through to deterministic offline sprite response
  }

  return new Response('', {
    status: 504,
    statusText: 'Offline Sprite Unavailable',
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  let url;
  try {
    url = new URL(request.url);
  } catch (_err) {
    return;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  if (isSpriteHost(url.hostname)) {
    event.respondWith(handleSpriteRequest(event));
    return;
  }

  if (url.origin === self.location.origin) {
    if (url.href === self.location.href) {
      return;
    }
    event.respondWith(handleShellRequest(request));
  }
});
