// App "Riepilogo i7": funziona anche senza rete, mostrando gli ultimi dati scaricati.
// Prima la rete (così pagina e dati arrivano sempre freschi), la copia salvata solo se la rete manca.
const VERSIONE = 'riepilogo-i7-v1';
const BASE = ['./', 'index.html', 'motore.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
const D3 = 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSIONE).then((c) => c.addAll(BASE.concat(D3))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((k) => Promise.all(k.filter((n) => n !== VERSIONE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.href === D3) { // libreria dei grafici: non cambia mai
    e.respondWith(caches.match(D3).then((hit) => hit || fetch(req)));
    return;
  }
  if (url.origin !== location.origin) return;
  const chiave = url.origin + url.pathname; // senza ?t=... così la copia offline si ritrova
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copia = res.clone(); caches.open(VERSIONE).then((c) => c.put(chiave, copia)); }
      return res;
    }).catch(() => caches.match(chiave).then((hit) => hit || caches.match('index.html')))
  );
});
