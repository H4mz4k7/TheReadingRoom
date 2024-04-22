import {isOnline } from './utility.js';

let db;


$(document).ready(function () {


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
        if (!title || !author || !rating || !username){


            $alert.show()
            $alert.text("Please fill out all fields.");
            $postBtn.prop('disabled', false);
        }
        else{


            let ratingObject = {
                title : title,
                author : author,
                rating : rating,
                username : username,
            }

            $.ajax({
                url: '/add-book',
                type: 'POST',
                data: JSON.stringify(ratingObject),
                contentType: 'application/json',
                success: function () {
                    console.log('Review saved successfully!');

                    window.location.href = '/profile'

                },
                error: function (xhr, status, error) {
                    console.error('Error saving review:', error);
                    $("#postBtn").prop('disabled', false);

                    window.location.href = `/profile`;


                }
            });




        }



    });


});



