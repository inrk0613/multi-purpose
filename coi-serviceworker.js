// coi-serviceworker.js
// GitHub Pages のようにヘッダーを触れない環境で
// COOP/COEP を後付けするための Service Worker です。

self.addEventListener('install', (event) => {
  // すぐに新しい SW を有効化
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  event.respondWith((async () => {
    const res = await fetch(req);

    // ブラウザ内部用のレスポンスなどは素通し
    if (res.status === 0) {
      return res;
    }

    const newHeaders = new Headers(res.headers);
    newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
    newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders
    });
  })());
});
