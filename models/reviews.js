var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ReviewsSchema = new Schema(
    {
        title: {type: String, required: true},
        author: {type: String, required: true, max: 100},
        rating: {type: Number, required: true},
        review: {type: String, required: true},
        username: {type: String, required: true}

    }
);

var Reviews = mongoose.model('Reviews', ReviewsSchema);

module.exports = Reviews;