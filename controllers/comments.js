var bodyParser = require("body-parser");
var Comment = require('../models/comments');
var path = require('path');


exports.create = function(req, res) {
    var userData = req.body;

    let comment = new Comment({
        room_number: userData.room_number,
        comment_string: userData.comment_string,
        username: userData.username,
        time: userData.time
    });

    comment.save()
        .then((savedComment) => {
            console.log('Comment saved successfully:', savedComment);
        })
        .catch((error) => {
            console.error('Error saving comment:', error);
        });
}
