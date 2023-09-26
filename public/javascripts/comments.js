import {appendToTable, isOnline, makeRowsClickable} from "./utility.js";

let socket = io();
let db;

$(document).ready(function () {


    let room_number = null;

    let chatName = $("#chatName").text();
    let $chat_input = $("#chat_input");



    //handling turning off ability to comment when offline
    window.addEventListener('offline', function () {
        $("#sendMsg").prop('disabled', true);
        $chat_input.prop('disabled', true);
        $chat_input.attr("placeholder", "Please connect to the internet to use chat features!");
    });

    window.addEventListener('online', function () {

        chatDisplayOnline(chatName, $chat_input)
    });

    isOnline(
        function (){
            $("#sendMsg").prop('disabled', true);
            $chat_input.prop('disabled', true);
            $chat_input.attr("placeholder", "Please connect to the internet to use chat features!");
        },
        function (){
            chatDisplayOnline(chatName, $chat_input)
        }
    )


    //extract variables from url to find specific review for page
    const urlParams = new URLSearchParams(window.location.search);

    const title = urlParams.get("title");
    const author = urlParams.get("author");
    const username = urlParams.get("username");

    const getSingleReviewPromise = new Promise(function (resolve, reject) {
        $.ajax({
            url: '/getSingleReview',
            type: 'GET',
            data: { title: title, author: author, username: username },
            success: function (data) {
                room_number = data.room_number; // assign correct room_number from review to variable
                resolve();
            },
            error: function (xhr, status, error) {
                reject(error);
            }
        });
    });


    //after review has been found and room_number has been assigned this section of code is called
    getSingleReviewPromise
        .then(function () {



            const request = indexedDB.open('commentsDatabase', 1);


            request.onupgradeneeded = function(event) {
                // Get the reference to the database
                db = event.target.result;


                const commentsStore = db.createObjectStore('commentsStore', { keyPath: 'id', autoIncrement: true });


                commentsStore.createIndex('username', 'username', { unique: false });
                commentsStore.createIndex('time', 'time', { unique: false });
                commentsStore.createIndex('comment_string', 'comment_string', { unique: false });
                commentsStore.createIndex('room_number', 'room_number', { unique: false });

            };


            request.onsuccess = function(event) {
                // Get the reference to the database
                db = event.target.result;

                //on success of opening the indexedb, check whether user is online or offline and call the correct method of displaying comments
                isOnline(
                    function () {
                        console.log("offline");
                        showCommentsOffline(room_number)
                    },
                    function () {
                        console.log("online");
                        showCommentsOnline(room_number)
                            .catch(function (error){
                                console.log(error)
                            })
                    }
                );

            }

            request.onerror = function(event) {
                // Log any errors that occur during the request
                console.error('IndexedDB error:', event.target.error);
            };



            //live chat features

            socket.emit('create or join', room_number, chatName);

            socket.on('joined', function (room, userId) {
                console.log("joined room")
            });

            // called when a message is received
            socket.on('chat', function (room, userId, chatText) {
                const dateTime = new Date();
                const formattedDateTime = dateTime.toLocaleString();
                writeOnHistory(formattedDateTime + ' | ' + userId + ': ' + chatText);
            });


            //post comment to dbs when button is clicked or enter is pressed

            $("#sendMsg").click(function () {
                postComment(chatName, room_number)
            });

            $chat_input.keypress(function (event) {
                // Check if the Enter key was pressed
                if (event.which === 13) {
                    event.preventDefault();
                    postComment(chatName, room_number)
                }
            });


        })
        .catch(function (error) {
            console.error('Error fetching data from MongoDB:', error);
        });
});


/**
 * post the comment to indexeddb and mongoDB
 * @param chatName username
 * @param room_number room_number of the review currently being viewed
 */
function postComment(chatName, room_number){

    //create an object for the comment
    let commentObject = {
        username : chatName,
        room_number : room_number,
        comment_string : $("#chat_input").val(),
        time : new Date()
    }


    const transaction = db.transaction('commentsStore', 'readwrite');
    const commentsStore = transaction.objectStore('commentsStore');


    //add comment to indexeddb
    const request = commentsStore.add(commentObject);


    request.onsuccess = function (event){
        //add comment to mongoDB
        $.ajax({
            url: '/comments',
            type: 'POST',
            data: JSON.stringify(commentObject),
            contentType: 'application/json',
            success: function () {
                console.log('Message sent successfully!');

            },
            error: function (xhr, status, error) {
                console.error('Error sending message:', error);

            }
        });
    }

    //emit the chat for other sessions to receive (live chat)
    socket.emit('chat', room_number, chatName, commentObject.comment_string);

    request.onerror = function (event) {
        console.error('Error adding item to IndexedDB:', event.target.error);
    };
}


/**
 * showing comments if the user is connected to the internet, as well as updating the local indexeddb
 * @param room_number room_number of the review currently being viewed
 */
async function showCommentsOnline(room_number) {

    //retrieve all the comments in the db correlating to the room number
    try {
        const data = await $.ajax({
            url: '/comments',
            type: 'GET',
            data: { room_number: room_number },
        });

        //sort in chronological order
        data.sort((a, b) => new Date(a.time) - new Date(b.time));

        const transaction = db.transaction('commentsStore', 'readwrite');
        const commentsStore = transaction.objectStore('commentsStore');

        const cursorRequest = commentsStore.openCursor();


        await new Promise((resolve, reject) => {
            cursorRequest.onsuccess = function (event) {
                const cursor = event.target.result;

                //delete all comments correlating to the room_number from indexeddb
                if (cursor) {
                    if (cursor.value.room_number === room_number) {
                        const deleteRequest = commentsStore.delete(cursor.primaryKey);
                        deleteRequest.onsuccess = function () {
                            console.log("Deleted");
                            cursor.continue();
                        };
                        deleteRequest.onerror = function (event) {
                            reject(new Error('Error deleting entry: ' + event.target.error));
                        };
                    } else {
                        cursor.continue();
                    }
                } else {
                    resolve(); // after all comments with specific room_number have been deleted, resolve promise
                }
            };

            cursorRequest.onerror = function (event) {
                reject(new Error('Error deleting entries:', event.target.error));
            };
        });


        //iterate through data retrieved from mongoDB
        for (const item of data) {
            const { username, time, comment_string } = item;

            await new Promise((resolve, reject) => {
                //add latest comments (from mongoDB) to indexeddb
                const request = commentsStore.add(item);
                console.log("Added");

                request.onsuccess = resolve;
                request.onerror = function (event) {
                    reject(new Error('Error adding item to IndexedDB:', event.target.error));
                };
            });


            //display comment on page
            const dateTime = new Date(time);

            const formattedDateTime = dateTime.toLocaleString();

            writeOnHistory(formattedDateTime + ' | ' + username + ': ' + comment_string);
        }
    } catch (error) {
        console.error('Error fetching data from MongoDB:', error);
    }
}


/**
 * showing comments if the user is not connected to the internet
 * @param room_number room_number of the review currently being viewed
 */
function showCommentsOffline(room_number){


    //retrieve comment with specific room_number from indexeddb
    const transaction = db.transaction('commentsStore', 'readonly');
    const commentsStore = transaction.objectStore('commentsStore');

    const cursorRequest = commentsStore.openCursor();

    cursorRequest.onsuccess = function(event) {
        const cursor = event.target.result;

        if (cursor) {
            if (cursor.value.room_number === room_number){
                const { time ,comment_string, username } = cursor.value;

                //display comment on page
                const dateTime = new Date(time);
                const formattedDateTime = dateTime.toLocaleString();
                writeOnHistory(formattedDateTime + ' | ' + username + ': ' + comment_string);

            }

            cursor.continue();
        }
    };

    cursorRequest.onerror = function(event) {
        console.error('Error retrieving data from IndexedDB:', event.target.error);
    };

}


/**
 * display comment in comment history section
 * @param text message to display
 */
function writeOnHistory(text) {
    let $history = $('#history');
    $history.val($history.val() + text + '\n');
    $("#chat_input").val('');
}

/**
 * allows user to chat if they are logged in
 * @param chatName username (if logged in)
 * @param $chat_input element with id "chat_input"
 */
function chatDisplayOnline(chatName,$chat_input){
    if (!chatName){

        $("#sendMsg").prop('disabled', true);
        $chat_input.prop('disabled', true);
        $chat_input.attr("placeholder", "Please log in to use chat features!");
    }
    else{
        $("#sendMsg").prop('disabled', false);
        $chat_input.prop('disabled', false);
        $chat_input.val("");
        $chat_input.attr("placeholder", "Type your message");
    }
}
