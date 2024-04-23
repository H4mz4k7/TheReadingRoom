let cache= null;
let dataCacheName = 'cacheData';
let cacheName = 'cache';
let filesToCache = [
    '/',
    '/create_review',
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
        caches.open(cacheName).then(async function (cacheX) {
            console.log('[ServiceWorker] Caching app shell');
            cache= cacheX;
            try {
                return await cache.addAll(filesToCache);
            } catch (error) {
                console.error('Failed to add one or more requests to the cache:', error);
            }
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
 * caches page if online, returns cached page if user is offline and cache page is available. If cached page is not available then display offline page
 */
self.addEventListener('fetch', function(event) {

    //filter out urls that are not needed to cache
    if (event.request.method === 'POST') {
        return;
    }

    if (!event.request.url.startsWith('http')) {

        return;
    }

    if (event.request.url.startsWith('http://localhost:3000/socket.io/')) {
        return;
    }

    if (event.request.url.startsWith('https://dns.google.com/resolve?')) {
        return;
    }

    if (event.request.url.includes('/profile')) {
        event.respondWith(
            fetch(event.request).catch(function() {
                // Network request failed, user is probably offline
                return caches.open('cache').then(function(cache) {
                    return cache.match('/offline').then(function(matching) {
                        return matching || Promise.reject('no-match');
                    });
                });
            })
        );
        return;
    }

    if (event.request.url.includes('/login')) {
        event.respondWith(
            fetch(event.request).catch(function() {
                // Network request failed, user is probably offline
                return caches.open('cache').then(function(cache) {
                    return cache.match('/offline').then(function(matching) {
                        return matching || Promise.reject('no-match');
                    });
                });
            })
        );
        return;
    }



    event.respondWith(
        fetch(event.request)
            .then(function (response) { //if online
                // Check if response is valid
                if (response.status === 200) {
                    // Clone the response as it can only be consumed once
                    const responseClone = response.clone();

                    // Store the response in the cache
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
            .catch(function () { //if offline
                // Serve the request from the cache if available
                return caches.open('cache')
                    .then(function (cache) {
                        if (event.request.url.includes('/login')) {
                            return cache.match('/offline'); //need to be online to login so display offline page if offline
                        }
                        else{
                            return cache.match(event.request)
                                .then(function (cachedResponse) {
                                    if (cachedResponse) {
                                        return cachedResponse;
                                    } else {
                                        return cache.match('/offline') //display offline page if no cached page available
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


/**
 * Add any offline added reviews to mongoDB
 */
function syncReviews() {
    const request = indexedDB.open('reviewsDatabase', 1);

    return new Promise(function(resolve, reject) {
        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction('reviewsStore', 'readwrite');
            const reviewsStore = transaction.objectStore('reviewsStore');
            const cursorRequest = reviewsStore.openCursor();
            const syncRequests = [];

            cursorRequest.onsuccess = function(event) {
                const cursor = event.target.result;

                if (cursor) {
                    const value = cursor.value;
                    if (value.status === 'offline') {
                        const syncRequest = pushReviewsToDB(value.title, value.author, value.username, value.rating, value.review, value.room_number);
                        syncRequests.push(syncRequest);
                    }
                    cursor.continue();
                } else {
                    Promise.all(syncRequests).then(() => {
                        self.clients.matchAll().then(clients => {
                            clients.forEach(client => client.postMessage({syncCompleted: true}));
                        });
                        resolve();
                    }).catch(error => reject(error));
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


/**
 * add review to mongoDB
 * @param title
 * @param author
 * @param username
 * @param rating
 * @param review
 * @param room_number
 */
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











