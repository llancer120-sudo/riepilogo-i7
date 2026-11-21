// App "Meccanica 2": funziona offline. Prima la rete (così gli esercizi nuovi arrivano da soli),
// la copia salvata solo se la rete manca. I progressi NON passano di qui: restano nel telefono.
const VERSIONE = 'meccanica-2-202611210827';
const BASE = ['./', 'index.html', 'manifest.webmanifest', '../meccanica/esercizi.js', '../meccanica/app.js', '../meccanica/stile.css',
  '../meccanica/icon-192.png', '../meccanica/icon-512.png', '../meccanica/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSIONE).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((k) => Promise.all(k.filter((n) => n.startsWith('meccanica-2-') && n !== VERSIONE).map((n) => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const chiave = url.origin + url.pathname; // senza ?v=... così la copia offline si ritrova
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copia = res.clone(); caches.open(VERSIONE).then((c) => c.put(chiave, copia)); }
      return res;
    }).catch(() => caches.match(chiave).then((hit) => hit || caches.match(new URL('index.html', self.registration.scope).href)))
  );
});
