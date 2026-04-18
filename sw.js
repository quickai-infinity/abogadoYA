const CACHE_NAME = 'secureflow-v2';
const ASSETS = [
  './',
  './index.html',
  './app.html',
  './panel-gruero.html',
  './panel-abogado.html',
  './agente-ia.js',
  './manifest.json'
];

// Instalación: Descarga los archivos al teléfono
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

// Activación: Limpia versiones viejas
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
  )));
});

// Estrategia: Carga desde el teléfono primero para velocidad
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});