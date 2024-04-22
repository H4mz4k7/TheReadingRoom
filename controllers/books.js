var bodyParser = require("body-parser");
var Book = require('../models/books');
var path = require('path');


/**
 * Code to create and save users into mongoDB
 */
exports.create = async function(req, res, callback) {
    try {
        // Find the current highest book_id
        const lastBook = await Book.findOne().sort({ book_id: -1 }).exec();

        // Set the next book_id
        const nextBookId = lastBook ? lastBook.book_id + 1 : 1;

        // Extract user data from the request body
        const userData = req.cls;

        // Create a new Book object with the extracted data and new book_id
        const book = new Book({
            title : userData.title,
            author : userData.author,
            book_id: nextBookId  // Assign the calculated book_id
        });

        // Save the Book to the database
        const savedBook = await book.save();
        console.log('Book saved successfully:', savedBook);

        if (callback) callback(savedBook);

        
        res.send({ message: 'Book saved successfully', book: savedBook });

    } catch (error) {
        // Log and respond with error
        console.error('Error in creating book:', error);
        res.status(500).send({ message: 'Error saving book' });
    }
};