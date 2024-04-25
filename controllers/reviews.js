var bodyParser = require("body-parser");
var Review = require('../models/reviews');
var path = require('path');


exports.create = async function(req, res) {
    try {
        const userData = req.body;

        let review = new Review({
            title: userData.title,
            author: userData.author,
            rating: userData.rating,
            review: userData.review,
            username: userData.username,
            room_number: userData.room_number
        });

        const savedReview = await review.save();
        console.log('Review saved successfully:');

        return savedReview;
    }
    catch {
        console.error('Error in creating review:', error);
        res.status(500).send({ message: 'Error saving review' });
    }
}



