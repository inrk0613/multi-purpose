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

  // 外部リソースやページ遷移以外の不要なリクエストはスルー可能ですが
  // 基本的には全リクエストに対してヘッダーを書き換えます
  if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') {
    return;
  }

  event.respondWith((async () => {
    // fetchしてレスポンスを取得
    const res = await fetch(req).catch(() => null);

    if (!res || res.status === 0) {
      return res;
    }

    // ヘッダーをコピーしてセキュリティヘッダーを付与
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
