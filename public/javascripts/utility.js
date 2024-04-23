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
 * Add review data from MongoDB to table.
 * @param {string} title - The title of the book.
 * @param {string} author - The author of the book.
 * @param {string} rating - The rating of the book.
 * @param {string} [username] - The username of the reviewer.
 */
function appendToTable(title, author, rating, username = null) {
    const $tableBody = username ? $('table:first tbody') : $('#read-books tbody');
    const $newRow = $('<tr>').append(
        $('<td>').text(title),
        $('<td>').text(author),
        $('<td>').text(rating),
        username ? $('<td>').text(username) : null
    );

    $tableBody.append($newRow);
}

/**
 * Check whether the user is connected to the internet.
 * @param {Function} offlineCallback - Function to call when offline.
 * @param {Function} onlineCallback - Function to call when online.
 */
function isOnline(offlineCallback, onlineCallback) {
    $.ajax({
        url: "https://dns.google.com/resolve?name=example.com&_=" + Date.now(),
        success: onlineCallback,
        error: offlineCallback
    });
}

/**
 * Call the sync function in the service worker to add any offline added reviews to MongoDB.
 * @param {Function} displayFunc - Function to display the reviews.
 * @param {string} [param] - Parameter for the display function, if necessary.
 */
function sync(tag, displayFunc = null, param = null) {
    navigator.serviceWorker.ready.then(registration => {
        registration.sync.register(tag)
            .then(() => {
                console.log('Sync event registered successfully.');
            })
            .catch(error => console.error('Failed to register sync event:', error));

        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data.syncCompleted) {
                if (displayFunc) {
                    if (param) {
                        displayFunc(param);
                    } else {
                        displayFunc();
                    }
                }
            }
        });
    });
}





/**
 * Sends an AJAX request to a specified URL and handles the response.
 * @param {string} url - The URL to send the request to.
 * @param {object} data - Data to be sent with the request.
 * @param {string} type - The type of HTTP request (GET, POST, etc.).
 * @param {Function} onSuccess - Callback function on success.
 * @param {boolean} useJsonContentType - If true, sets the 'Content-Type' header to 'application/json' and stringifies the 'data' parameter. Use this parameter to indicate whether the data should be sent as JSON.
 */
function sendRequest(url, data, type, onSuccess, useJsonContentType = false) {
    const settings = {
        url: url,
        data: data,
        type: type,
        success: onSuccess,
        error: (xhr, status, error) => console.error(`Error fetching data from ${url}:`, error)
    };

    // Conditionally set the content type to 'application/json'
    if (useJsonContentType) {
        settings.contentType = 'application/json';
        // Ensure the data is a JSON string if we are setting content type to JSON
        if (typeof data === 'object') {
            settings.data = JSON.stringify(data);
        }
    }

    $.ajax(settings);
}


export { appendToTable, makeRowsClickable, isOnline, sync, sendRequest };