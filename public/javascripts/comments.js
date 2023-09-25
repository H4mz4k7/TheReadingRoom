import {appendToTable, isOnline, makeRowsClickable} from "./utility.js";

let socket = io();
let db;

$(document).ready(function () {

    let room_number = null;

    let chatName = $("#chatName").text();
    let $chat_input = $("#chat_input");



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
                room_number = data.room_number;
                resolve(); // Resolve the Promise when the request is successful
            },
            error: function (xhr, status, error) {
                reject(error); // Reject the Promise if there is an error
            }
        });
    });


    getSingleReviewPromise
        .then(function () {


            const request = indexedDB.open('commentsDatabase', 1);


            request.onupgradeneeded = function(event) {
                // Get the reference to the database
                db = event.target.result;


                const commentsStore = db.createObjectStore('commentsStore', { keyPath: 'id', autoIncrement: true });

                // Define the structure of the object store

                commentsStore.createIndex('username', 'username', { unique: false });
                commentsStore.createIndex('time', 'time', { unique: false });
                commentsStore.createIndex('comment_string', 'comment_string', { unique: false });
                commentsStore.createIndex('room_number', 'room_number', { unique: false });

            };


            request.onsuccess = function(event) {
                // Get the reference to the database
                db = event.target.result;

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








function postComment(chatName, room_number){
    let commentObject = {
        username : chatName,
        room_number : room_number,
        comment_string : $("#chat_input").val(),
        time : new Date()
    }


    const transaction = db.transaction('commentsStore', 'readwrite');
    const commentsStore = transaction.objectStore('commentsStore');


    const request = commentsStore.add(commentObject);


    request.onsuccess = function (event){
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

    socket.emit('chat', room_number, chatName, commentObject.comment_string);

    request.onerror = function (event) {
        console.error('Error adding item to IndexedDB:', event.target.error);
    };
}



async function showCommentsOnline(room_number) {
    try {
        const data = await $.ajax({
            url: '/comments',
            type: 'GET',
            data: { room_number: room_number },
        });

        data.sort((a, b) => new Date(a.time) - new Date(b.time));

        const transaction = db.transaction('commentsStore', 'readwrite');
        const commentsStore = transaction.objectStore('commentsStore');

        const cursorRequest = commentsStore.openCursor();

        await new Promise((resolve, reject) => {
            cursorRequest.onsuccess = function (event) {
                const cursor = event.target.result;

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
                    resolve();
                }
            };

            cursorRequest.onerror = function (event) {
                reject(new Error('Error deleting entries:', event.target.error));
            };
        });

        for (const item of data) {
            const { username, time, comment_string } = item;

            await new Promise((resolve, reject) => {
                const request = commentsStore.add(item);
                console.log("Added");

                request.onsuccess = resolve;
                request.onerror = function (event) {
                    reject(new Error('Error adding item to IndexedDB:', event.target.error));
                };
            });

            // Create a Date object from the string
            const dateTime = new Date(time);

            // Format the Date object as a string (e.g., "September 19, 2023 13:14:56")
            const formattedDateTime = dateTime.toLocaleString();

            writeOnHistory(formattedDateTime + ' | ' + username + ': ' + comment_string);
        }
    } catch (error) {
        console.error('Error fetching data from MongoDB:', error);
    }
}


function showCommentsOffline(room_number){


    const transaction = db.transaction('commentsStore', 'readonly');
    const commentsStore = transaction.objectStore('commentsStore');

    // Open a cursor to iterate over the data in the object store
    const cursorRequest = commentsStore.openCursor();

    cursorRequest.onsuccess = function(event) {
        const cursor = event.target.result;

        if (cursor) {
            if (cursor.value.room_number === room_number){
                const { time ,comment_string, username } = cursor.value;

                console.log(time)
                const dateTime = new Date(time);

                // Format the Date object as a string (e.g., "September 19, 2023 13:14:56")
                const formattedDateTime = dateTime.toLocaleString();
                writeOnHistory(formattedDateTime + ' | ' + username + ': ' + comment_string);

            }

            // Move to the next cursor item
            cursor.continue();
        }
    };

    cursorRequest.onerror = function(event) {
        console.error('Error retrieving data from IndexedDB:', event.target.error);
    };

}



function writeOnHistory(text) {
    let $history = $('#history');
    $history.val($history.val() + text + '\n');
    $("#chat_input").val('');
}


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
