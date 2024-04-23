import {appendToTable, isOnline, sendRequest} from "./utility.js";

let socket = io();
let db;

$(document).ready(function () {
    let room_number = null;
    let chatName = $("#chatName").text();
    let $chat_input = $("#chat_input");

    window.addEventListener('offline', () => disableChat());
    window.addEventListener('online', () => enableChat());

    function disableChat() {
        $("#sendMsg").prop('disabled', true);
        $chat_input.prop('disabled', true);
        $chat_input.attr("placeholder", "Please connect to the internet to use chat features!");
    }

    function enableChat() {
        chatDisplayOnline(chatName, $chat_input);
    }

    isOnline(disableChat, enableChat);

    fetchReviewAndSetupDB();

    function fetchReviewAndSetupDB() {
        const urlParams = new URLSearchParams(window.location.search);
        const title = urlParams.get("title");
        const author = urlParams.get("author");
        const username = urlParams.get("username");
    
        sendRequest('/getSingleReview', { title, author, username }, 'GET', data => {
            room_number = data.room_number;
            setupIndexedDB();
        });
    }

    function setupIndexedDB() {
        const request = indexedDB.open('commentsDatabase', 1);

        request.onupgradeneeded = event => {
            let db = event.target.result;
            const commentsStore = db.createObjectStore('commentsStore', { keyPath: 'id', autoIncrement: true });
            commentsStore.createIndex('username', 'username', { unique: false });
            commentsStore.createIndex('time', 'time', { unique: false });
            commentsStore.createIndex('comment_string', 'comment_string', { unique: false });
            commentsStore.createIndex('room_number', 'room_number', { unique: false });
        };

        request.onsuccess = event => {
            db = event.target.result;
            isOnline(
                () => showCommentsOffline(room_number),
                () => showCommentsOnline(room_number).catch(console.error)
            );
            initChatFeatures(db, room_number);
        };

        request.onerror = event => {
            console.error('IndexedDB error:', event.target.error);
        };
    }

    function initChatFeatures(db, room_number) {
        socket.emit('create or join', room_number, chatName);
        socket.on('joined', (room, userId) => console.log("joined room"));
        socket.on('chat', (room, userId, chatText) => {
            const dateTime = new Date().toLocaleString();
            writeOnHistory(`${dateTime} | ${userId}: ${chatText}`);
        });

        $("#sendMsg").click(() => postComment(chatName, room_number));
        $chat_input.keypress(event => {
            if (event.which === 13) {
                event.preventDefault();
                postComment(chatName, room_number);
            }
        });
    }
});


/**
 * post the comment to indexeddb and mongoDB
 * @param chatName username
 * @param room_number room_number of the review currently being viewed
 */
function postComment(chatName, room_number) {
    let commentObject = {
        username: chatName,
        room_number: room_number,
        comment_string: $("#chat_input").val(),
        time: new Date()
    };

    const transaction = db.transaction('commentsStore', 'readwrite');
    const commentsStore = transaction.objectStore('commentsStore');

    const request = commentsStore.add(commentObject);

    request.onsuccess = function() {
        sendRequest('/comments', commentObject, 'POST', () => {
            console.log('Message sent successfully!');
        }, true);
    };

    request.onerror = function(event) {
        console.error('Error adding item to IndexedDB:', event.target.error);
    };

    socket.emit('chat', room_number, chatName, commentObject.comment_string);
}


/**
 * Shows comments if the user is connected to the internet and updates the local IndexedDB
 * @param room_number The room number of the review currently being viewed
 */
async function showCommentsOnline(room_number) {
    sendRequest('/comments', { room_number: room_number }, 'GET', async function(data) {
        data.sort((a, b) => new Date(a.time) - new Date(b.time));

        const transaction = db.transaction('commentsStore', 'readwrite');
        const commentsStore = transaction.objectStore('commentsStore');

        await clearRoomComments(commentsStore, room_number);

        for (const item of data) {
            const { username, time, comment_string } = item;
            await addComment(commentsStore, item);
            const dateTime = new Date(time);
            const formattedDateTime = dateTime.toLocaleString();
            writeOnHistory(`${formattedDateTime} | ${username}: ${comment_string}`);
        }
    });
}

/**
 * Clears all comments associated with a room number in IndexedDB
 * @param commentsStore The IndexedDB object store
 * @param room_number The room number
 */
async function clearRoomComments(commentsStore, room_number) {
    const cursorRequest = commentsStore.openCursor();
    return new Promise((resolve, reject) => {
        cursorRequest.onsuccess = function(event) {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.value.room_number === room_number) {
                    const deleteRequest = commentsStore.delete(cursor.primaryKey);
                    deleteRequest.onsuccess = () => cursor.continue();
                    deleteRequest.onerror = (event) => reject(new Error('Error deleting entry: ' + event.target.error));
                } else {
                    cursor.continue();
                }
            } else {
                resolve(); 
            }
        };

        cursorRequest.onerror = (event) => reject(new Error('Error deleting entries:', event.target.error));
    });
}

/**
 * Adds a comment to the IndexedDB store
 * @param commentsStore The IndexedDB object store
 * @param item The comment data
 */
async function addComment(commentsStore, item) {
    return new Promise((resolve, reject) => {
        const request = commentsStore.add(item);
        request.onsuccess = resolve;
        request.onerror = (event) => reject(new Error('Error adding item to IndexedDB:', event.target.error));
    });
}



/**
 * showing comments if the user is not connected to the internet
 * @param room_number room_number of the review currently being viewed
 */
function showCommentsOffline(room_number) {
    const transaction = db.transaction('commentsStore', 'readonly');
    const commentsStore = transaction.objectStore('commentsStore');
    const cursorRequest = commentsStore.openCursor();

    cursorRequest.onsuccess = function(event) {
        const cursor = event.target.result;

        if (cursor) {
            if (cursor.value.room_number === room_number) {
                const { time, comment_string, username } = cursor.value;
                const dateTime = new Date(time);
                const formattedDateTime = dateTime.toLocaleString();
                writeOnHistory(`${formattedDateTime} | ${username}: ${comment_string}`);
            }
            cursor.continue();
        }
    };

    cursorRequest.onerror = function(event) {
        console.error('Error retrieving data from IndexedDB:', event.target.error);
    };
}

/**
 * Display comment in comment history section
 * @param text The message to display
 */
function writeOnHistory(text) {
    let $history = $('#history');
    $history.val($history.val() + text + '\n');
    $("#chat_input").val('');
}

/**
 * Allows user to chat if they are logged in
 * @param chatName The username (if logged in)
 * @param $chat_input Element with id "chat_input"
 */
function chatDisplayOnline(chatName, $chat_input) {
    if (!chatName) {
        $("#sendMsg").prop('disabled', true);
        $chat_input.prop('disabled', true);
        $chat_input.attr("placeholder", "Please log in to use chat features!");
    } else {
        $("#sendMsg").prop('disabled', false);
        $chat_input.prop('disabled', false);
        $chat_input.val("");
        $chat_input.attr("placeholder", "Type your message");
    }
}