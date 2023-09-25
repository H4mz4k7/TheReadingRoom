import {appendToTable, makeRowsClickable, isOnline, syncReview} from './utility.js';


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


$(document).ready(function () {





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

        isOnline(
            function () {
                console.log("offline");
                showReviewsOffline();
            },
            function () {
                console.log("online");

                syncReview(showReviewsOnline);


            }
        );

    }

    request.onerror = function(event) {
        // Log any errors that occur during the request
        console.error('IndexedDB error:', event.target.error);
    };




    $("#findBook").click(function() {
        $("html, body").animate({
            scrollTop: $("#listSection").offset().top
        }, 50); // 1000 milliseconds for smooth scrolling, adjust as needed
    });

});



function showReviewsOnline() {
    $.ajax({
        url: '/getReviews',
        type: 'GET',
        success: function (data) {

            const transaction = db.transaction('reviewsStore', 'readwrite');
            const reviewsStore = transaction.objectStore('reviewsStore')
            reviewsStore.clear()

            data.forEach(function(item) {

                const { title, author, rating, username} = item;


                const request = reviewsStore.add(item);
                appendToTable(title, author, rating, username);


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


