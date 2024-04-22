import {appendToTable, makeRowsClickable, isOnline, syncReview} from './utility.js';


//register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(function(registration) {
            console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(function(error) {
            console.error('Service Worker registration failed:', error);
        });
}

let db;
let dbUser;
let ratingDB;

$(document).ready(function () {

    let user = $("#username").text() || null;


    const ratingDBRequest = indexedDB.open('ratingsDatabase', 1);
    ratingDBRequest.onupgradeneeded = function(event) {
        let db = event.target.result;
        if (!db.objectStoreNames.contains('ratingsStore')) {
            const ratingsStore = db.createObjectStore('ratingsStore', { keyPath: 'id', autoIncrement: true });
            ratingsStore.createIndex('user_id', 'user_id', { unique: false });
            ratingsStore.createIndex('title', 'title', { unique: false });
            ratingsStore.createIndex('author', 'author', { unique: false });
            ratingsStore.createIndex('rating', 'rating', { unique: false });
        }
    };
    ratingDBRequest.onsuccess = function(event) {
        ratingDB = event.target.result;
    };
    ratingDBRequest.onerror = function(event) {
        console.error('Error opening ratingsDatabase:', event.target.error);
    };
    
    


    const requestUser = indexedDB.open('UserDatabase', 1);

    requestUser.onupgradeneeded = function(event) {
        dbUser = event.target.result;
        if (!dbUser.objectStoreNames.contains('users')) {
            const store = dbUser.createObjectStore('users', { keyPath: 'user_id' });
            store.createIndex('username', 'username', { unique: true });
            store.createIndex('email', 'email', { unique: true });

        }
    };

    requestUser.onsuccess = function(event) {
        dbUser = event.target.result;
    };

    requestUser.onerror = function(event) {
        console.error('IndexedDB error:', event.target.error);
    };
    
    

    //create indexeddb for reviews
    const request = indexedDB.open('reviewsDatabase', 1);


    request.onupgradeneeded = function(event) {
        // Get the reference to the database
        db = event.target.result;


        const reviewsStore = db.createObjectStore('reviewsStore', { keyPath: 'id', autoIncrement: true });

        // Define the structure of the object store

        reviewsStore.createIndex('status', 'status', { unique: false });
        reviewsStore.createIndex('title', 'title', { unique: false });
        reviewsStore.createIndex('author', 'author', { unique: false });
        reviewsStore.createIndex('rating', 'rating', { unique: false });
        reviewsStore.createIndex('review', 'review', { unique: false });
        reviewsStore.createIndex('username', 'username', { unique: false });
        reviewsStore.createIndex('room_number', 'room_number', { unique: true });

    };


    request.onsuccess = function(event) {
        // Get the reference to the database
        db = event.target.result;

        //if user is online show latest updated version of reviews from mongoDB and sync offline added reviews to mongoDB
        //if offline then show stored indexeddb version of reviews
        isOnline(
            function () {
                console.log("offline");
                showReviewsOffline();
            },
            function () {
                console.log("online");

                syncReview(showReviewsOnline);
                syncRatingsWithServer()


            }
        );

    }

    request.onerror = function(event) {
        // Log any errors that occur during the request
        console.error('IndexedDB error:', event.target.error);
    };


    isOnline(
        function () {
            console.log("offline");
        },
        function () {
            console.log("online");
            if (user){
                checkUserByUsername(user, (exists, userData) => {
                    if (exists) {
                        console.log('User exists with data:', userData);
                    } else {
                        console.log('User does not exist');
                        addUserToIDB(user, dbUser)
                    }
                });
            }
        }
    );


    $("#findBook").click(function() {
        $("html, body").animate({
            scrollTop: $("#listSection").offset().top
        }, 50); // 1000 milliseconds for smooth scrolling, adjust as needed
    });

});


/**
 * retrieve all reviews from mongoDB and display in table, add review to indexeddb
 */
function showReviewsOnline() {
    $.ajax({
        url: '/getReviews',
        type: 'GET',
        success: function (data) {

            const transaction = db.transaction('reviewsStore', 'readwrite');
            const reviewsStore = transaction.objectStore('reviewsStore')
            reviewsStore.clear() //delete

            data.forEach(function(item) {

                const { title, author, rating, username} = item;


                const request = reviewsStore.add(item); // add to indexeddb
                appendToTable(title, author, rating, username); //add to table


                request.onerror = function(event) {
                    console.error('Error adding item to IndexedDB:', event.target.error);
                };

            });

            makeRowsClickable();

        },
        error: function (xhr, status, error) {
            console.error('Error fetching data from MongoDB:', error);

        }
    })
}

/**
 * retrieve all reviews from indexeddb and display in table
 */
function showReviewsOffline(){


    const transaction = db.transaction('reviewsStore', 'readonly');
    const reviewsStore = transaction.objectStore('reviewsStore');

    // Open a cursor to iterate over the data in the object store
    const cursorRequest = reviewsStore.openCursor();

    cursorRequest.onsuccess = function(event) {
        const cursor = event.target.result;

        if (cursor) {
            const { title ,author, rating, username } = cursor.value;

            appendToTable(title,author,rating,username);

            // Move to the next cursor item
            cursor.continue();
        }

        makeRowsClickable();
    };

    cursorRequest.onerror = function(event) {
        console.error('Error retrieving data from IndexedDB:', event.target.error);
    };

}


function checkUserByUsername(username, callback) {
    const transaction = dbUser.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const index = store.index('username');
    const request = index.get(username);

    request.onsuccess = function() {
        if (request.result) {
            console.log('User found:', request.result);
            callback(true, request.result); // User found, return true and the user data
        } else {
            console.log('User not found');
            callback(false, null); // User not found, return false
        }
    };

    request.onerror = function(event) {
        console.error('Error searching for user:', event.target.error);
        callback(false, null); // Error occurred, return false
    };
}


function syncRatingsWithServer() {
    // Start the transaction and get the object store
    const transaction = ratingDB.transaction('ratingsStore', 'readwrite');
    const store = transaction.objectStore('ratingsStore');
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = () => {
        const ratings = getAllRequest.result;
        if (ratings.length > 0) {
            console.log("Syncing ratings with server...", ratings);
            // Post the ratings to the server
            $.ajax({
                url: '/ratings', 
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(ratings),
                success: function(response) {
                    if (response.errors && response.errors.length > 0) {
                        console.error("Some ratings failed to sync:", response.errors);
                    } else {
                        console.log("Ratings synced successfully:", response.results);
                        // Delete each synced rating from IndexedDB
                    }
                },
                error: function(xhr, status, error) {
                    console.error("Failed to sync ratings:", error);
                }
            });
        } else {
            console.log("No ratings to sync.");
        }
    };

    getAllRequest.onerror = () => {
        console.error("Failed to retrieve ratings:", getAllRequest.error);
    };
}


/**
 * Add user data to IndexedDB.
 * @param {string} user - The username to fetch and store.
 * @param {IDBDatabase} db - The IndexedDB database instance.
 */
function addUserToIDB(user, db) {
    sendRequest('/user', { username: user }, 'GET', userData => {
        const userObject = {
            email: userData.email,
            username: user,
            user_id: userData.user_id
        };
        const transaction = db.transaction('users', 'readwrite');
        const usersStore = transaction.objectStore('users');
        const request = usersStore.add(userObject);

        request.onsuccess = () => console.log("User saved to IndexedDB");
        request.onerror = event => console.error('Error adding item to IndexedDB:', event.target.error);
    });
}