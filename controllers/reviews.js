var bodyParser = require("body-parser");
var Review = require('../models/reviews');
var path = require('path');


/**
 * Code to create and save comments into mongoDB
 */
exports.create = function(req, res) {
    // Extract user data from the request body
    var userData = req.body;

    // Create a new Comment object with the extracted data
    let review = new Review({
        title: userData.title,
        author: userData.author,
        rating: userData.rating,
        review: userData.review,
        username: userData.username
    });

    // Save the comment to the database
    review.save()
        .then((savedReview) => {
            // Comment saved successfully
            console.log('User saved successfully:', savedReview);
        })
        .catch((error) => {
            // Error occurred while saving the comment
            console.error('Error saving review:', error);
        });
}