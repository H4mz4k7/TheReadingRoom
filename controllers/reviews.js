var bodyParser = require("body-parser");
var Review = require('../models/reviews');
var path = require('path');


exports.create = function(req, res) {
    var userData = req.body;
    let review = new Review({
        title: userData.title,
        author: userData.author,
        rating: userData.rating,
        review: userData.review,
        username: userData.username,
        room_number: userData.room_number
    });

    review.save()
        .then((savedReview) => {
            console.log('Review saved successfully:', savedReview);

        })
        .catch((error) => {
            console.error('Error saving review:', error);
        });
}