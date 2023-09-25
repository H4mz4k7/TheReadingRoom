import {isOnline } from './utility.js';

let db;


$(document).ready(function () {

    const request = indexedDB.open('reviewsDatabase', 1);


    request.onsuccess = function(event) {
        // Get the reference to the database
        db = event.target.result;
    };

    request.onerror = function(event) {
        // Handle errors
        console.error('IndexedDB error:', event.target.error);
    };




    let room_number = (Math.round(Math.random() * 10000))

    let rating = null;

    const $alert = $("#alert");
    $alert.hide();


    $(".star").click(function () {
        $(".star").css("color", "black");
        rating = $(this).data("rating");



        for (let i = 1; i < rating + 1; i++){
            $("#star" + i).css("color", "#f0ad4e")
        }


    });



    $("#createReview").submit(function (event) {

        event.preventDefault();

        // Disable the button to prevent multiple clicks
        const $postBtn = $("#postBtn");
        $postBtn.prop('disabled', true);


        let title = $("#title").val();
        let author = $("#author").val();
        let review = $("#review").val();
        let username = $("#username").text();





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


            isOnline(
                function () {
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

                                window.location.href = `/view_review?title=${title}&author=${author}&rating=${rating}&username=${username}`;



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



