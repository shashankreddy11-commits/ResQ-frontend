const CACHE_PREFIX = "drer-";
const SHELL_CACHE = "drer-shell-v3";
const PAGE_CACHE = "drer-pages-v3";
const API_CACHE = "drer-api-v3";
const ASSET_CACHE = "drer-assets-v1";
const OFFLINE_PAGE = "/offline.html";
const CORE_ROUTES = ["/", "/sos", "/safety-guide", "/dos-donts", "/ai-assistant", "/live-situation", "/shelters"];
const MAX_PAGES = 30;
const MAX_API_ENTRIES = 80;
const MAX_ASSETS = 300;
const MAX_MAP_TILES = 250;
const PUBLIC_JSON_HOSTS = new Set([
  "api.open-meteo.com",
  "geocoding-api.open-meteo.com",
  "api.rainviewer.com",
]);

function isPrivateApiPath(pathname) {
  return /\/api\/(?:auth|tracking|incidents\/mine)(?:\/|$)/i.test(pathname);
}

function isJsonResponse(response) {
  return /(?:application|text)\/(?:[\w.+-]*\+)?json/i.test(response.headers.get("content-type") || "");
}

function isMapTile(url) {
  return url.hostname === "server.arcgisonline.com"
    || url.hostname === "tile.openstreetmap.org"
    || url.hostname.endsWith(".tile.openstreetmap.org")
    || url.hostname.endsWith(".rainviewer.com");
}

async function trimCache(cache, maximumEntries) {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - maximumEntries)).map((key) => cache.delete(key)));
}

async function cacheNextAssets(htmlResponse, pageCache) {
  try {
    const html = await htmlResponse.clone().text();
    const assets = new Set(
      [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+\.(?:js|css)(?:\?[^"]*)?)"/g)]
        .map((match) => match[1]),
    );

    await Promise.all([...assets].map(async (path) => {
      const request = new Request(new URL(path, self.location.origin), { credentials: "same-origin" });
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(ASSET_CACHE);
          await cache.put(request, response.clone());
          await trimCache(cache, MAX_ASSETS);
        }
      } catch {
        // The page remains useful if an optional route chunk cannot be warmed.
      }
    }));
    await trimCache(pageCache, MAX_PAGES);
  } catch {
    // A page response should still be cached even if its optional chunks cannot be inspected.
  }
}

async function cachePage(request, response) {
  if (!response.ok || !/text\/html/i.test(response.headers.get("content-type") || "")) return response;
  try {
    const cache = await caches.open(PAGE_CACHE);
    const key = new Request(request.url, { credentials: "same-origin" });
    await cache.put(key, response.clone());
    await cacheNextAssets(response, cache);
  } catch (error) {
    console.warn("[DRER offline] Could not save page:", error);
  }
  return response;
}

async function warmRoute(path) {
  const request = new Request(new URL(path, self.location.origin), {
    credentials: "same-origin",
    headers: { Accept: "text/html" },
  });
  try {
    const response = await fetch(request);
    await cachePage(request, response);
  } catch {
    // Core routes are warmed again on a future visit if installation is offline.
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL_CACHE);
    await Promise.allSettled([
      shell.add(OFFLINE_PAGE),
      shell.add("/manifest.json"),
      shell.add("/favicon.svg"),
      shell.add("/resq.html"),
    ]);
    await self.skipWaiting();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "WARM_CORE_ROUTES") {
    event.waitUntil(Promise.all(CORE_ROUTES.map(warmRoute)));
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith(CACHE_PREFIX)
        && ![SHELL_CACHE, PAGE_CACHE, API_CACHE, ASSET_CACHE].includes(key))
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  const isApi = url.pathname.startsWith("/api/");
  const hasAuthorization = request.headers.has("authorization");
  const isPublicJsonFeed = !sameOrigin && PUBLIC_JSON_HOSTS.has(url.hostname);

  if ((isApi && !hasAuthorization && !isPrivateApiPath(url.pathname)) || isPublicJsonFeed) {
    event.respondWith((async () => {
      const cache = await caches.open(API_CACHE);
      const cached = await cache.match(request, { ignoreVary: true });
      const update = fetch(request).then(async (response) => {
        if (response.ok && isJsonResponse(response)) {
          try {
            await cache.put(request, response.clone());
            await trimCache(cache, MAX_API_ENTRIES);
          } catch (error) {
            console.warn("[DRER offline] Could not save API response:", error);
          }
        }
        return response;
      });

      if (cached) {
        event.waitUntil(update.catch(() => undefined));
        return cached;
      }

      try {
        return await update;
      } catch {
        return Response.json(
          { message: "This information is not available offline. Reconnect and try again." },
          { status: 503, headers: { "Cache-Control": "no-store" } },
        );
      }
    })());
    return;
  }

  if (request.mode === "navigate" && sameOrigin) {
    event.respondWith((async () => {
      try {
        return await cachePage(request, await fetch(request));
      } catch {
        const pages = await caches.open(PAGE_CACHE);
        const key = new Request(request.url, { credentials: "same-origin" });
        const cached = await pages.match(key, { ignoreSearch: true });
        if (cached) return cached;
        const shell = await caches.open(SHELL_CACHE);
        return await shell.match(key, { ignoreSearch: true })
          || await shell.match(OFFLINE_PAGE)
          || Response.error();
      }
    })());
    return;
  }

  if (sameOrigin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith((async () => {
      const cache = await caches.open(ASSET_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
        await trimCache(cache, MAX_ASSETS);
      }
      return response;
    })());
    return;
  }

  if (isMapTile(url) && request.destination === "image") {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      const cached = await cache.match(request);
      if (cached) {
        event.waitUntil(fetch(request).then((response) => cache.put(request, response)).catch(() => undefined));
        return cached;
      }
      try {
        const response = await fetch(request);
        if (response.ok || response.type === "opaque") {
          try {
            await cache.put(request, response.clone());
            await trimCache(cache, MAX_MAP_TILES + 3);
          } catch {
            // Browser storage may reject opaque or quota-exceeding map tiles.
          }
        }
        return response;
      } catch {
        return Response.error();
      }
    })());
    return;
  }

  if (sameOrigin && (request.destination === "script" || request.destination === "style"
    || request.destination === "font" || request.destination === "image" || url.pathname === "/manifest.json")) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
        await trimCache(cache, MAX_ASSETS);
      }
      return response;
    })());
  }
});
