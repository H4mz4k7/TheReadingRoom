let cache= null;
let dataCacheName = 'cacheData';
let cacheName = 'cache';
let filesToCache = [
    '/',
    '/create_review',
    '/profile',
    '/view_review',
    '/javascripts/baguetteBox.min.js',
    '/javascripts/bootstrap.min.js',
    '/javascripts/comments.js',
    '/javascripts/createReview.js',
    '/javascripts/indexList.js',
    '/javascripts/profile.js',
    '/javascripts/theme.js',
    '/javascripts/vanilla-zoom.js',
    '/javascripts/viewReview.js',
    '/stylesheets/baguetteBox.min.css',
    '/stylesheets/bootstrap.min.css',
    '/stylesheets/bs-theme-overrides.css',
    '/stylesheets/createReview.css',
    '/stylesheets/vanilla-zoom.min.css'
];


/**
 * install necessary caches
 */
self.addEventListener('install', function (e) {
    console.log('[ServiceWorker] Install');
    e.waitUntil(
        caches.open(cacheName).then(function (cacheX) {
            console.log('[ServiceWorker] Caching app shell');
            cache= cacheX;
            return cache.addAll(filesToCache).catch(function(error) {
                console.error('Failed to add one or more requests to the cache:', error);
            });
        })
    );
});


/**
 * activation of service worker: it removes all cashed files if necessary
 */
self.addEventListener('activate', function (e) {
    console.log('[ServiceWorker] Activate');
    e.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                if (key !== cacheName && key !== dataCacheName) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});



/**
 * returned cache page if user is offline
 */
self.addEventListener('fetch', function(event) {
    // Skip caching for POST requests
    if (event.request.method === 'POST') {
        return;
    }

    // Check if the request URL starts with 'http' or 'https'
    if (!event.request.url.startsWith('http')) {
        // Skip the request
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(function(response) {
                // Check if response is valid (status 200)
                if (response.status === 200) {
                    // Clone the response as it can only be consumed once
                    const responseClone = response.clone();

                    // Store the response in the cache for GET requests
                    if (event.request.method === 'GET') {
                        caches.open('cache')
                            .then(function(cache) {
                                cache.put(event.request, responseClone);
                            });
                    }
                }

                // Return the response
                return response;
            })
            .catch(function() {
                // Serve the request from the cache if available
                return caches.open('cache')
                    .then(function(cache) {
                        return cache.match(event.request)
                            .then(function(cachedResponse) {
                                if (cachedResponse) {
                                    return cachedResponse;
                                } else {
                                    return cache.match('/offline')
                                }
                            });
                    });
            })
    );
});