/**
 * make the table data clickable
 */
function makeRowsClickable(){
    const $clickableRows = $("table:first tbody tr");



    $clickableRows.each(function () {
        const $row = $(this);

        $row.on("click", function () {
            const title = $row.find("td:eq(0)").text();
            const author = $row.find("td:eq(1)").text();
            const rating = $row.find("td:eq(2)").text();
            const username = $row.find("td:eq(3)").text();


            window.location.href = `/view_review?title=${title}&author=${author}&rating=${rating}&username=${username}`; //redirect page based on the clicked table row
        });
    });
}


/**
 * add review data from mongoDB to table
 * @param title
 * @param author
 * @param rating
 * @param username
 */
function appendToTable(title, author, rating, username = null){

    if (username !== null){
        var $tableBody = $('table:first tbody');
    }
    else{
        $tableBody = $('#read-books tbody');
    }
    

    const $newRow = $('<tr>');

    const $titleCell = $('<td>').text(title);
    $newRow.append($titleCell);

    const $authorCell = $('<td>').text(author);
    $newRow.append($authorCell);

    const $ratingCell = $('<td>').text(rating);
    $newRow.append($ratingCell);

    if (username !== null){
        const $postedByCell = $('<td>').text(username);
        $newRow.append($postedByCell);
    }

    $tableBody.append($newRow);

}


/**
 * check whether the user is connected to the internet or not by sending an HTTP request to a page.
 * If there is a response then online, else offline
 * @param no
 * @param yes
 */
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


/**
 * call the sync function in the service worker to add any offline added reviews to mongoDB
 * @param displayFunc function to display the reviews
 * @param param parameter for the display function (if necessary)
 */
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