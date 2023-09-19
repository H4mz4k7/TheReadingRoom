
let socket = io();


$(document).ready(function () {

    let room_number = null;

    let chatName = $("#chatName").text();
    let $chat_input = $("#chat_input");


    if (!chatName){

        $("#sendMsg").prop('disabled', true);
        $chat_input.prop('disabled', true);
        $chat_input.val("Please log in to use chat features!");
    }
    else{
        $("#sendMsg").prop('disabled', false);
        $chat_input.prop('disabled', false);
        $chat_input.val("");
    }

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
                sendChat();
            });

            $chat_input .keypress(function (event) {
                // Check if the Enter key was pressed (key code 13)
                if (event.which === 13) {
                    // Prevent the default behavior of Enter key (e.g., submitting a form)
                    event.preventDefault();

                    // Call the sendChat function
                    sendChat();
                }
            });



            console.log(room_number)
            console.log(typeof room_number)
            displayChatHistory();

            function displayChatHistory(){

                $.ajax({
                    url: '/comments',
                    type: 'GET',
                    data: { room_number : room_number },
                    success: function (data) {

                        data.sort((a, b) => new Date(a.time) - new Date(b.time));


                        data.forEach(function(item) {
                            const {username, time, comment_string} = item;

                            console.log(typeof time);


                            // Create a Date object from the string
                            const dateTime = new Date(time);

                            // Format the Date object as a string (e.g., "September 19, 2023 13:14:56")
                            const formattedDateTime = dateTime.toLocaleString();

                            console.log(formattedDateTime);

                            writeOnHistory(formattedDateTime + ' | ' + username + ': ' + comment_string);
                        })

                    },
                    error: function (xhr, status, error) {
                        console.error('Error fetching data from MongoDB:', error);
                    }
                });

            }
            function sendChat() {

                let chatText = $chat_input.val();

                if (chatText.trim().length !== 0) {
                    $.ajax({
                        url: '/comments',
                        type: 'POST',
                        data: JSON.stringify({comment_string: chatText, room_number: room_number, username: chatName}),
                        contentType: 'application/json',
                        success: function () {
                            console.log('Message sent successfully!');

                        },
                        error: function (xhr, status, error) {
                            console.error('Error sending message:', error);

                        }
                    });

                    socket.emit('chat', room_number, chatName, chatText);

                }
            }
        })
        .catch(function (error) {
            console.error('Error fetching data from MongoDB:', error);
        });


    function writeOnHistory(text) {
        let $history = $('#history');
        $history.val($history.val() + text + '\n');
        $chat_input.val('');
    }

});