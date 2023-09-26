var mongoose = require('mongoose');

var Schema = mongoose.Schema;


/**
 * comment schema for mongoDB
 */
var CommentsSchema = new Schema(
    {
        room_number: {type: Number, required: true},
        username: {type: String, required: true, max: 100},
        time: {type: Date, required: true},
        comment_string: {type: String, required: true},

    }
);

var Comment = mongoose.model('Comment', CommentsSchema);

module.exports = Comment;