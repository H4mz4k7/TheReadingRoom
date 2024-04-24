var bodyParser = require("body-parser");
var Rating = require('../models/ratings');
var path = require('path');



exports.create = function(req, res) {
    var userData = req;
    let rating = new Rating ({
        user_id : userData.user_id,
        book_id : userData.book_id,
        rating : userData.rating
    })

    rating.save()
        .then((savedRating) => {
            console.log('rating saved successfully:', savedRating);

        })
        .catch((error) => {
            console.error('Error saving rating:', error);
        });
}