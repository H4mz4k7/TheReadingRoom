let cache= null;
let dataCacheName = 'cacheData';
let cacheName = 'cache';
let filesToCache = [
    '/',
    '/create_review',
    '/profile',
    '/view_review',
    '/offline',
    '/javascripts/baguetteBox.min.js',
    '/javascripts/bootstrap.min.js',
    '/javascripts/comments.js',
    '/javascripts/createReview.js',
    '/javascripts/indexList.js',
    '/javascripts/profile.js',
    '/javascripts/theme.js',
    '/javascripts/vanilla-zoom.js',
    '/javascripts/viewReview.js',
    '/javascripts/utility.js',
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

    if (event.request.url.startsWith('http://localhost:3000/socket.io/')) {
        return;
    }

    if (event.request.url.startsWith('https://dns.google.com/resolve?')) {
        return;
    }




    event.respondWith(
        fetch(event.request)
            .then(function (response) {
                // Check if response is valid (status 200)
                if (response.status === 200) {
                    // Clone the response as it can only be consumed once
                    const responseClone = response.clone();

                    // Store the response in the cache for GET requests
                    if (event.request.method === 'GET') {
                        caches.open('cache')
                            .then(function (cache) {
                                cache.put(event.request, responseClone);
                            });
                    }
                }

                // Return the response
                return response;
            })
            .catch(function () {
                // Serve the request from the cache if available
                return caches.open('cache')
                    .then(function (cache) {
                        if (event.request.url.includes('/login')) {
                            // Respond with the offline page for /login
                            return cache.match('/offline');
                        }
                        else{
                            return cache.match(event.request)
                                .then(function (cachedResponse) {
                                    if (cachedResponse) {
                                        return cachedResponse;
                                    } else {
                                        return cache.match('/offline')
                                    }
                                });
                        }

                    });
            })
    );

});




self.addEventListener('sync', function(event) {
    if (event.tag === 'sync-reviews') {
        console.log("syncing reviews")
        event.waitUntil(syncReviews());
    }
});

function syncReviews() {
    const request = indexedDB.open('reviewsDatabase', 1);

    return new Promise(function(resolve, reject) {
        request.onsuccess = function(event) {
            const db = event.target.result;
            //look at sightings added while offline
            const transaction = db.transaction('reviewsStore', 'readwrite');
            const reviewsStore = transaction.objectStore('reviewsStore')
            const cursorRequest = reviewsStore.openCursor();

            const syncRequests = [];

            cursorRequest.onsuccess = function(event) {
                const cursor = event.target.result;

                if (cursor) {
                    const value = cursor.value;

                    if (value.status === 'offline') {
                        const syncRequest = pushReviewsToDB(value.title, value.author, value.username, value.rating, value.review, value.room_number)
                        syncRequests.push(syncRequest);

                    }

                    cursor.continue();
                } else {

                    Promise.all(syncRequests)
                        .then(function() {
                            resolve();
                        })
                        .catch(function(error) {
                            reject(error);
                        });
                }
            };

            cursorRequest.onerror = function(event) {
                console.error('Cursor request error:', event.target.error);
                reject(event.target.error);
            };
        };

        request.onerror = function(event) {
            console.error('IndexedDB open request error:', event.target.error);
            reject(event.target.error);
        };
    });
}


function pushReviewsToDB(title, author, username, rating, review, room_number) {
    return new Promise(function(resolve, reject) {

        fetch('/create_review', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: title, author: author, username: username, rating: rating, review: review, room_number: room_number })
        })
            .then(function(response) {
                if (response.ok) {
                    console.log('Value added to MongoDB');
                    resolve();
                } else {
                    throw new Error('Error adding value to MongoDB');
                }
            })
            .catch(function(error) {
                console.error('Error adding value to MongoDB:', error);
                reject(error);
            });
    });
}

