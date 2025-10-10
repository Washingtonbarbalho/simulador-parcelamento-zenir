// Determinar dinamicamente o caminho base
const BASE_URL = self.location.href.replace('service-worker.js', '');
const CACHE_NAME = 'zenir-simulador-v2'; // Versão do cache atualizada

// Lista de arquivos a serem cacheados
const urlsToCache = [
  // Arquivos principais
  '',
  'index.html',
  'manifest.json',
  
  // Estilos
  'css/style.css',

  // Scripts
  'js/main.js',
  'js/firebase-init.js',
  'js/auth.js',
  'js/ui.js',
  'js/simulator.js',
  'js/history.js',
  'js/admin.js',
  'js/utils.js',
  'js/config.js',
  'js/pwa.js',

  // Ícones
  'icon-192x192.png',
  'icon-512x512.png',

  // CDNs (conteúdo externo)
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://pfst.cf2.poecdn.net/base/image/bdf81d0d7ec65548bd0d482efd54aca859795574888538b493ecd3f8cc1c3d04'
];

// Instalação do Service Worker e cache dos recursos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        const cacheUrls = urlsToCache.map(url => {
          if (url.startsWith('http') || url === '') {
            return url;
          }
          return new URL(url, BASE_URL).href;
        });
        return cache.addAll(cacheUrls);
      })
  );
});

// Estratégia de cache: Cache First, then Network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response; // Retorna do cache se encontrado
        }
        
        // Se não estiver no cache, busca na rede
        return fetch(event.request.clone()).then((response) => {
            // Verifica se a resposta é válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
  );
});

// Ativação do Service Worker e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName); // Deleta caches antigos
          }
        })
      );
    })
  );
});
