$(document).ready(function () {

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
        // Disable the button to prevent multiple clicks
        const $postBtn = $("#postBtn");
        $postBtn.prop('disabled', true);


        let title = $("#title").val();
        let author = $("#author").val();
        let review = $("#review").val();
        let username = $("#username").text();



        if (!title || !author || !rating || !review || !username){

            event.preventDefault();
            $alert.show()
            $alert.text("Please fill out all fields.");
            $postBtn.prop('disabled', false);
        }
        else{
            console.log("not correct")
            $.ajax({
                url: '/create_review',
                type: 'POST',
                data: JSON.stringify({
                    title : title,
                    author : author,
                    rating : rating,
                    review : review,
                    username : username,
                    room_number : room_number
                }),
                contentType: 'application/json',
                success: function () {
                    console.log('Review saved successfully!');


                    // You can redirect or display a success message here
                    // Re-enable the button after success (if needed)
                    window.location.href = `/view_review?title=${title}&author=${author}&rating=${rating}&username=${username}`;


                },
                error: function (xhr, status, error) {
                    console.error('Error saving review:', error);
                    // Handle the error and provide feedback to the user
                    event.preventDefault()
                    // Re-enable the button after error (if needed)
                    $("#postBtn").prop('disabled', false);
                }
            });
        }

    });

});