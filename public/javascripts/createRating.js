import { sendRequest } from './utility.js';
let rating = null;

$(document).ready(function () {
    const $alert = $("#alert").hide();

    // Event handling for selecting star ratings
    $(".star").click(function () {
        const selectedRating = $(this).data("rating");
        rating = selectedRating; // Update the global rating variable
        updateStars(selectedRating);
    });

    // Form submission handling
    $("#createRating").submit(function (event) {
        event.preventDefault();
        const $postBtn = $("#postBtn").prop('disabled', true);

        const title = $("#title").val();
        const author = $("#author").val();
        const username = $("#username").text();

        // Validate form data
        if (!title || !author || !rating || !username) {
            $alert.text("Please fill out all fields.").show();
            $postBtn.prop('disabled', false);
        } else {
            const ratingData = {
                title, 
                author, 
                username, 
                rating
            };
            postRating(ratingData);
        }
    });
});

function updateStars(selectedRating) {
    $(".star").css("color", "black"); // Reset all stars
    for (let i = 1; i <= selectedRating; i++) {
        $("#star" + i).css("color", "#f0ad4e");
    }
}

function postRating(data) {
    sendRequest('/add-book', data, 'POST', () => {
        console.log('rating saved successfully!');
        window.location.href = '/profile';
    }, true); 
}



