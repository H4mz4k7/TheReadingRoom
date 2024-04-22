import {isOnline } from './utility.js';


let db, ratingDB, dbUser;

// Initialize all databases
function initializeDatabases() {
    const userDBRequest = indexedDB.open('UserDatabase', 1);

    userDBRequest.onsuccess = function(event) {
        dbUser = event.target.result;
    };
    userDBRequest.onerror = function(event) {
        console.error("Error opening userDatabase:", event.target.error);
    };

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

    const reviewsDBRequest = indexedDB.open('reviewsDatabase', 1);
    reviewsDBRequest.onsuccess = function(event) {
        db = event.target.result;
    };
    reviewsDBRequest.onerror = function(event) {
        console.error('Error opening reviewsDatabase:', event.target.error);
    };
}



$(document).ready(function () {


    initializeDatabases();



    //assign random number to room_number
    let room_number = (Math.round(Math.random() * 10000))

    let rating = null;

    const $alert = $("#alert");
    $alert.hide();



    //styling for selecting number of stars
    $(".star").click(function () {
        $(".star").css("color", "black");
        rating = $(this).data("rating");



        for (let i = 1; i < rating + 1; i++){
            $("#star" + i).css("color", "#f0ad4e")
        }


    });


    //on form submit
    $("#createReview").submit(function (event) {

        event.preventDefault();

        // Disable the button to prevent multiple clicks
        const $postBtn = $("#postBtn");
        $postBtn.prop('disabled', true);


        //extract review data from form
        let title = $("#title").val();
        let author = $("#author").val();
        let review = $("#review").val();
        let username = $("#username").text();





        //if data has not all been entered, return alert
        if (!title || !author || !rating || !review || !username){


            $alert.show()
            $alert.text("Please fill out all fields.");
            $postBtn.prop('disabled', false);
        }
        else{


            let reviewObject = {
                title : title,
                author : author,
                rating : rating,
                review : review,
                username : username,
                room_number : room_number
            }


            //check if user is online or offline, if online then add to indexeddb with status value 'online' and add to mongoDB.
            //if offline then add to indexeddb only, with status value 'offline'
            isOnline(
                function () {
                    addRatingIDB(username, title, author, rating)

                    console.log("offline adding");

                    const transaction = db.transaction('reviewsStore', 'readwrite');
                    const reviewsStore = transaction.objectStore('reviewsStore');

                    reviewObject['status'] = "offline"
                    const request = reviewsStore.add(reviewObject);

                    request.onsuccess = function (event){
                        window.location.href = '/' 
                    }

                    request.onerror = function (event) {
                        console.error('Error adding item to IndexedDB:', event.target.error);
                    };

                },
                function () {
                    console.log("online adding");

                    const transaction = db.transaction('reviewsStore', 'readwrite');
                    const reviewsStore = transaction.objectStore('reviewsStore');


                    reviewObject['status'] = "online"
                    const request = reviewsStore.add(reviewObject);


                    request.onsuccess = function (event){
                        $.ajax({
                            url: '/create_review',
                            type: 'POST',
                            data: JSON.stringify(reviewObject),
                            contentType: 'application/json',
                            success: function () {
                                console.log('Review saved successfully!');

                                window.location.href = `/view_review?title=${title}&author=${author}&rating=${rating}&username=${username}`; //redirect to view the page posted



                            },
                            error: function (xhr, status, error) {
                                console.error('Error saving review:', error);
                                $("#postBtn").prop('disabled', false);

                                window.location.href = `/`;


                            }
                        });
                    }

                    request.onerror = function (event) {
                        console.error('Error adding item to IndexedDB:', event.target.error);
                    };

                }
            );


        }



    });


});


function addRatingIDB(username, title, author, rating) {
    if (!ratingDB) {
        console.log("Rating database is not initialized.");
        return;
    }

    try {
        getUserIDByUsername(username, function(error, userID) {
            if (error) {
                console.error("Error fetching user ID:", error);
            } else {
                let ratingObject = {
                    user_id: userID,
                    title: title,
                    author: author,
                    rating: rating
                };
                const transaction = ratingDB.transaction('ratingsStore', 'readwrite');
                const ratingsStore = transaction.objectStore('ratingsStore');
                const addRequest = ratingsStore.add(ratingObject);
                addRequest.onsuccess = () => {
                    console.log("Rating added to IndexedDB successfully");
                };
                addRequest.onerror = (event) => {
                    console.error("Failed to add rating:", event.target.error);
                };
            }
        });
    } catch (error) {
        console.error("Transaction failed:", error);
    }
}


function getUserIDByUsername(username, callback) {
    const transaction = dbUser.transaction(['users'], 'readonly');
    const store = transaction.objectStore('users');
    const index = store.index('username');

    const request = index.get(username);

    request.onsuccess = function() {
        if (request.result) {
            console.log('User found:', request.result);
            callback(null, request.result.user_id); // Return user_id via callback
        } else {
            console.log('User not found');
            callback('User not found', null);
        }
    };

    request.onerror = function(event) {
        console.error('Error fetching user:', event.target.error);
        callback(event.target.error, null);
    };
}



