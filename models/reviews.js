var mongoose = require('mongoose');

var Schema = mongoose.Schema;


/**
 * reviews schema for mongoDB
 */
var ReviewsSchema = new Schema(
    {
        title: {type: String, required: true},
        author: {type: String, required: true},
        rating: {type: Number, required: true},
        review: {type: String, required: true},
        username: {type: String, required: true},
        room_number: {type: Number, required: true}
    }
);

var Reviews = mongoose.model('Reviews', ReviewsSchema);

module.exports = Reviews;