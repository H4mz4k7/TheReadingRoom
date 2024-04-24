var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var RatingsSchema = new Schema(
    {
        user_id: { type: Number, required: true, index: true },
        book_id: { type: Number, required: true, index: true },
        rating: {type: Number, required: true},
    }
);

var Ratings = mongoose.model('Ratings', RatingsSchema);

module.exports = Ratings;