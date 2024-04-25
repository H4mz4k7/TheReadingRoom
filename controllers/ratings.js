var bodyParser = require("body-parser");
var Rating = require('../models/ratings');
var path = require('path');



exports.create = async function(req, res) {
    try{
        var userData = req;

        let rating = new Rating({
            user_id: userData.user_id,
            book_id: userData.book_id,
            rating: userData.rating
        });

        const savedRating = await rating.save();
        console.log('Rating saved successfully:');

        return savedRating;
    }
    catch {
        console.error('Error in creating rating:', error);
        res.status(500).send({ message: 'Error saving rating' });
    }
    
};


