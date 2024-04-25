import { sendRequest } from './utility.js';
let rating = null;

jQuery(() => {
    const $alert = $("#alert").hide();


    $(".star").on("click", function() {
        const selectedRating = $(this).data("rating");
        rating = selectedRating;
        updateStars(selectedRating);
    });

    
    $("#createRating").on("submit", event => {
        event.preventDefault();
        const $postBtn = $("#postBtn").prop('disabled', true);

        const title = $("#title").val();
        const author = $("#author").val();
        const username = $("#username").text();

        
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

//colour in stars depending on rating clicked
function updateStars(selectedRating) {
    $(".star").css("color", "black"); 
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



