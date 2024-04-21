var bodyParser = require("body-parser");
var Rating = require('../models/ratings');
var path = require('path');


/**
 * Code to create and save ratings into mongoDB
 */
exports.create = function(req, res) {
    // Extract user data from the request body
    var userData = req;

    // Create a new rating object with the extracted data
    let rating = new Rating ({
        user_id : userData.user_id,
        book_id : userData.book_id,
        rating : userData.rating
    })

    // Save the rating to the database
    rating.save()
        .then((savedRating) => {
            // rating saved successfully
            console.log('rating saved successfully:', savedRating);

        })
        .catch((error) => {
            // Error occurred while saving the rating
            console.error('Error saving rating:', error);
        });
}