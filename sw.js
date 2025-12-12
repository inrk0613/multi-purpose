/* ClassFlow Service Worker (v1)
   - Cache app shell for offline use
*/
const CACHE = "classflow-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async ()=>{
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Only GET
  if(req.method !== "GET") return;
  event.respondWith((async ()=>{
    const cached = await caches.match(req, {ignoreSearch:true});
    if(cached) return cached;
    try{
      const res = await fetch(req);
      // Cache same-origin basic responses
      const url = new URL(req.url);
      if(url.origin === location.origin && res.ok && res.type === "basic"){
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    }catch{
      // fallback to app shell
      return (await caches.match("./index.html")) || new Response("Offline", {status:200});
    }
  })());
});
