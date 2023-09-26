var bodyParser = require("body-parser");
var Review = require('../models/reviews');
var path = require('path');


/**
 * Code to create and save reviews into mongoDB
 */
exports.create = function(req, res) {
    // Extract user data from the request body
    var userData = req.body;

    // Create a new Review object with the extracted data
    let review = new Review({
        title: userData.title,
        author: userData.author,
        rating: userData.rating,
        review: userData.review,
        username: userData.username,
        room_number: userData.room_number
    });

    // Save the review to the database
    review.save()
        .then((savedReview) => {
            // review saved successfully
            console.log('Review saved successfully:', savedReview);

        })
        .catch((error) => {
            // Error occurred while saving the review
            console.error('Error saving review:', error);
        });
}