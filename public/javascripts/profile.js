import {appendToTable, makeRowsClickable, isOnline, syncReview} from './utility.js';

let db;
$(document).ready(function () {




    let user = $("#username").text();

    const request = indexedDB.open('reviewsDatabase', 1);




    request.onsuccess = function(event) {
        // Get the reference to the database
        db = event.target.result;


        //if user is online show latest updated version of reviews from mongoDB and sync offline added reviews to mongoDB
        //if offline then show stored indexeddb version of reviews
        isOnline(
            function () {
                console.log("offline");
                showReviewsOffline(user);
            },
            function () {
                console.log("online");
                syncReview(showReviews,user);

            }
        );

    }

    request.onerror = function(event) {
        // Log any errors that occur during the request
        console.error('IndexedDB error:', event.target.error);
    };



});

/**
 * retrieve users reviews from mongoDB and display in table
 * @param user the user logged in
 */
function showReviews(user) {
    $.ajax({
        url: '/getProfileReviews',
        data: {username : user},
        type: 'GET',
        success: function (data) {

            data.forEach(function(item) {

                const { title, author, rating, username } = item;
                appendToTable(title, author, rating, username);

            });

            makeRowsClickable();

        },
        error: function (xhr, status, error) {
            console.error('Error fetching data from MongoDB:', error);
        }
    })
}


/**
 * retrieve users reviews from indexeddb and display in table
 * @param user the user logged in
 */
function showReviewsOffline(user){


    const transaction = db.transaction('reviewsStore', 'readonly');
    const reviewsStore = transaction.objectStore('reviewsStore');

    // Open a cursor to iterate over the data in the object store
    const cursorRequest = reviewsStore.openCursor();

    cursorRequest.onsuccess = function(event) {
        const cursor = event.target.result;

        if (cursor){
            if (cursor.value.username === user){
                const { title ,author, rating, username } = cursor.value;
                appendToTable(title,author,rating,username);
            }

            cursor.continue();

            makeRowsClickable();
        }

    };

    cursorRequest.onerror = function(event) {
        console.error('Error retrieving data from IndexedDB:', event.target.error);
    };

}