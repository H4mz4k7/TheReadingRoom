$(document).ready(function () {



    showReviews();


    function showReviews() {
        $.ajax({
            url: '/getReviews',
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



    function makeRowsClickable(){
        const $clickableRows = $("table tbody tr");


        // Add a click event listener to each clickable row
        $clickableRows.each(function () {
            const $row = $(this);

            $row.on("click", function () {
                const title = $row.find("td:eq(0)").text(); // Adjust the index based on your table structure
                const author = $row.find("td:eq(1)").text();
                const rating = $row.find("td:eq(2)").text();
                const username = $row.find("td:eq(3)").text();


                window.location.href = `/view_review?title=${title}&author=${author}&rating=${rating}&username=${username}`;
            });
        });
    }





    function appendToTable(title, author, rating, username){

        const $tableBody = $('table tbody');

        const $newRow = $('<tr>');

        const $titleCell = $('<td>').text(title);
        $newRow.append($titleCell);

        const $authorCell = $('<td>').text(author);
        $newRow.append($authorCell);

        const $ratingCell = $('<td>').text(rating);
        $newRow.append($ratingCell);

        const $postedByCell = $('<td>').text(username);
        $newRow.append($postedByCell);




        $tableBody.append($newRow);

    }


});