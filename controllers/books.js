var bodyParser = require("body-parser");
var Book = require('../models/books');
var path = require('path');



exports.create = async function(req, res, callback) {
    try {
        const lastBook = await Book.findOne().sort({ book_id: -1 }).exec(); // Find the current highest book_id
        const nextBookId = lastBook ? lastBook.book_id + 1 : 1;
        const userData = req.body;

        const book = new Book({
            title : userData.title,
            author : userData.author,
            book_id: nextBookId  
        });

        const savedBook = await book.save();
        console.log('Book saved successfully:', savedBook);

        if (callback) callback(savedBook);

        
        res.send({ message: 'Book saved successfully', book: savedBook });

    } catch (error) {
        console.error('Error in creating book:', error);
        res.status(500).send({ message: 'Error saving book' });
    }
};