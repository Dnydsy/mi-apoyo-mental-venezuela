// Define el nombre de la caché y los archivos a precachear
const CACHE_NAME = 'mi-apoyo-mental-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
    // Asegúrate de incluir todos los iconos que referencies en tu manifest.json
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png',
    '/icons/apple-touch-icon.png',
    '/icons/favicon-32x32.png',
    '/icons/favicon-16x16.png'
];

// Evento 'install': Se activa cuando el Service Worker se instala por primera vez
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Cacheando archivos estáticos');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Service Worker: Error durante la instalación:', error);
            })
    );
});

// Evento 'fetch': Intercepta las solicitudes de red
self.addEventListener('fetch', (event) => {
    // Para las solicitudes de Firebase (Firestore, Auth, etc.) y la API de Gemini,
    // siempre ir a la red para asegurar los datos más recientes.
    if (event.request.url.includes('firebase') || event.request.url.includes('googleapis.com')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Para otros recursos, intenta primero la caché, luego la red
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Si el recurso está en caché, devolverlo
                if (response) {
                    return response;
                }
                // Si no está en caché, ir a la red
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Clonar la respuesta para poder almacenarla en caché y devolverla
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        return networkResponse;
                    })
                    .catch(() => {
                        // Fallback para cuando la red no está disponible y el recurso no está en caché
                        console.warn('Service Worker: Fallo en la solicitud de red y no hay caché para', event.request.url);
                        // Puedes devolver una página offline o un recurso de fallback aquí
                        // Por simplicidad, se devuelve un error.
                        return new Response('Offline Content Not Available', { status: 503, statusText: 'Service Unavailable' });
                    });
            })
    );
});

// Evento 'activate': Se activa cuando el Service Worker se ha activado y los nuevos recursos están listos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Eliminando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
