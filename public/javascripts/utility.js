

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



function isOnline(no, yes) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        if (yes instanceof Function) {
            yes();
        }
    }
    xhr.onerror = function () {
        if (no instanceof Function) {
            no();
        }
    }
    xhr.open("GET", "https://dns.google.com/resolve?name=example.com&_=" + Date.now(), true);
    xhr.send();
}


function syncReview(displayFunc, param) {
    navigator.serviceWorker.ready
        .then(function (registration) {
            return registration.sync.register('sync-reviews');
        })
        .then(function () {
            console.log('Sync event registered successfully.');
            if (displayFunc && param) {
                return displayFunc(param);
            }
            if (displayFunc){
                return displayFunc();
            }
        })
        .catch(function (error) {
            console.error('Failed to register sync event:', error);
        });
}





export { appendToTable, makeRowsClickable, isOnline, syncReview };