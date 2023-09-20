    $(document).ready(function () {

    const urlParams = new URLSearchParams(window.location.search);

    const title = urlParams.get("title");
    const author = urlParams.get("author");
    const rating = parseInt(urlParams.get("rating"));
    const username = urlParams.get("username");

    $("#titleAuthor").text(`${title} - ${author}`);
    $("#username").text(`Review by: ${username}`)


    for (let i = 1; i < rating + 1; i++){


        $("#star" + i).css("color", "#f0ad4e")
    }


    showReview();

    getBookInfo(title,author);






    function showReview() {
        $.ajax({
            url: '/getSingleReview',
            type: 'GET',
            data: {title : title, author : author, username : username},
            success: function (data) {

                const  review = data.review;
                $('#review').text(review)

            },
            error: function (xhr, status, error) {
                console.error('Error fetching data from MongoDB:', error);
            }
        })
    }

        function getBookInfo(title, author) {
            $.ajax({
                url: '/getBookInfo', // Server-side route to retrieve book image
                type: 'GET',
                data: { title: title, author: author },
                success: function (data) {
                    // Display the book image on the client side
                    const $img = $('#img');
                    const $abstract = $('#abstract')


                    $img.attr('src', data.imageUrl);
                    $abstract.text(data.abstract);

                    if ($abstract.height() < 250){
                        $img.height(250);
                    }
                    else{
                        $img.height($abstract.height());
                    }





                },
                error: function (xhr, status, error) {
                    console.error('Error fetching book image:', error);
                }
            });
        }

});