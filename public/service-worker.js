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


self.addEventListener('install', e => {
    console.log('[ServiceWorker] Install');
    e.waitUntil(
        caches.open(cacheName).then(cache => {
            console.log('[ServiceWorker] Caching app shell');
            return cache.addAll(filesToCache).catch(error => {
                console.error('Failed to add one or more requests to the cache:', error);
            });
        })
    );
});

self.addEventListener('activate', e => {
    console.log('[ServiceWorker] Activate');
    e.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if (key !== cacheName && key !== dataCacheName) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http') || event.request.url.startsWith('http://localhost:3000/socket.io/') || event.request.url.startsWith('https://dns.google.com/resolve?')) {
        return;
    }

    const handleOfflineRequest = async () => {
        const response = await caches.match(event.request);
        return response || caches.match('/offline');
    };

    event.respondWith(
        fetch(event.request).then(response => {
            if (response && response.status === 200) {
                const responseClone = response.clone();
                caches.open(cacheName).then(cache => {
                    cache.put(event.request, responseClone);
                });
            }
            return response;
        }).catch(handleOfflineRequest)
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











