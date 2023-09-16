var bodyParser = require("body-parser");
var User = require('../models/users');
var path = require('path');


/**
 * Code to create and save comments into mongoDB
 */
exports.create = function(req, res) {
    // Extract user data from the request body
    var userData = req.body;

    // Create a new Comment object with the extracted data
    let user = new User({
        email: userData.email,
        username: userData.username,
        password: userData.password,
    });

    // Save the comment to the database
    user.save()
        .then((savedUser) => {
            // Comment saved successfully
            console.log('User saved successfully:', savedUser);
        })
        .catch((error) => {
            // Error occurred while saving the comment
            console.error('Error saving user:', error);
        });
}