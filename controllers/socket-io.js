/**
 *
 * Controller code for live chat
 */
exports.init = function(io) {
    io.sockets.on('connection', function (socket) {
        console.log("try");
        try {
            /**
             * create or joins a room
             */
            socket.on('create or join', function (room, userId) {
                // Join the specified room
                socket.join(room);

                // Emit a 'joined' event to all clients in the room, passing the room and userId as data
                io.sockets.to(room).emit('joined', room, userId);
            });

            // Listen for a 'chat' event
            socket.on('chat', function (room, userId, chatText) {
                // Emit a 'chat' event to all clients in the room, passing the room, userId, and chatText as data
                io.sockets.to(room).emit('chat', room, userId, chatText);
            });

            // Listen for a 'disconnect' event
            socket.on('disconnect', function(){
                console.log('someone disconnected');
            });
        } catch (e) {
            // Handle any errors that occur within the 'try' block
        }
    });
}
