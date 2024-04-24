var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var BooksSchema = new Schema(
    {
        book_id: { type: Number, required: true, index: true },
        title: {type: String, required: true},
        author: {type: String, required: true},
    }
);

var Books = mongoose.model('Books', BooksSchema);

module.exports = Books;