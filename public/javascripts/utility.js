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


function addUserToIDB(user,db){
    console.log("testing this is called")
    $.ajax({
        url: '/user',
        data: {username : user},
        type: 'GET',
        success: function (userData) {

           

            let userObject = {
                email : userData.email,
                username: user,
                user_id: userData.user_id
            }

            
            
            const transaction = db.transaction('users', 'readwrite');
            const usersStore = transaction.objectStore('users');

            const request = usersStore.add(userObject);

            request.onsuccess = function (event){
                console.log("User saved to indexedDB")
            }

            request.onerror = function (event) {
                console.error('Error adding item to IndexedDB:', event.target.error);
            };
        },
        error: function (xhr, status, error) {
            console.error('Error fetching data from MongoDB:', error);
        }
    })
}


function sendRequest(url, data, type, onSuccess) {
    $.ajax({
        url: url,
        data: data,
        type: type,
        dataType: 'json',
        success: onSuccess,
        error: function(xhr, status, error) {
            console.error(`Error fetching data from ${url}:`, error);
        }
    });
}



export { appendToTable, makeRowsClickable, isOnline, syncReview, addUserToIDB, sendRequest };