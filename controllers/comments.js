var bodyParser = require("body-parser");
//var req = require('request');
var Comment = require('../models/comments');
var path = require('path');


/**
 * Code to create and save comments into mongoDB
 */
exports.create = function(req, res) {
    // Extract user data from the request body
    var userData = req.body;

    // Get the current date and time


    // Create a new Comment object with the extracted data
    let comment = new Comment({
        room_number: userData.room_number,
        comment_string: userData.comment_string,
        username: userData.username,
        time: userData.time
    });

    // Save the comment to the database
    comment.save()
        .then((savedComment) => {
            // Comment saved successfully
            console.log('Comment saved successfully:', savedComment);
        })
        .catch((error) => {
            // Error occurred while saving the comment
            console.error('Error saving comment:', error);
        });
}
