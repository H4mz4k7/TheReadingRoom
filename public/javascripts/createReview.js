$(document).ready(function () {

    let rating = null;

    console.log($("#username").text())

    $(".star").click(function () {
        $(".star").css("color", "black");
        rating = $(this).data("rating");
        console.log(rating);


        for (let i = 1; i < rating + 1; i++){
            $("#star" + i).css("color", "#f0ad4e")
        }


    });



    $("#postBtn").click(function () {
        // Disable the button to prevent multiple clicks
        $(this).prop('disabled', true);


        let title = $("#title").val();
        let author = $("#author").val();
        let review = $("#review").val();
        let username = $("#username").text();


        if (!title || !author || !rating || !review || !username){
            alert("Please fill out all fields.");
            $("#postBtn").prop('disabled', false);
        }
        else{
            $.ajax({
                url: '/create_review',
                type: 'POST',
                data: JSON.stringify({
                    title : title,
                    author : author,
                    rating : rating,
                    review : review,
                    username : username
                }),
                contentType: 'application/json',
                success: function () {
                    console.log('Review saved successfully!');
                    // You can redirect or display a success message here

                    // Re-enable the button after success (if needed)
                    $("#postBtn").prop('disabled', false);
                },
                error: function (xhr, status, error) {
                    console.error('Error saving review:', error);
                    // Handle the error and provide feedback to the user

                    // Re-enable the button after error (if needed)
                    $("#postBtn").prop('disabled', false);
                }
            });
        }

    });

});