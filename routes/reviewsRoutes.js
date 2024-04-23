const express = require('express');
const router = express.Router();
const { isAuthenticated, sessionMiddleware, handlePostState } = require('./commonMiddleware');
const Users = require('../models/users')
const Reviews = require('../models/reviews')
const Books = require('../models/books')
var reviewsController = require('../controllers/reviews')
var booksController = require('../controllers/books')
var ratingsController = require('../controllers/ratings')


router.use(sessionMiddleware);
router.use(handlePostState);


router.post('/create_review', async (req, res) => {
    try {
        const { title, author, rating, username} = req.body;

        reviewsController.create(req,res);
        if (req.wantToPost){
            req.setWantToPost(false);
        }

        const user = await Users.findOne({ username: username });
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        // Find or create the book
        let book = await Books.findOne({ title: title, author: author });
        if (!book) {
            return booksController.create(req, res, async (createdBook) => { 
                ratingsController.create({book_id: createdBook.book_id, user_id: user.user_id, rating},res)
            });
        }
        else {
            return ratingsController.create({book_id: book.book_id, user_id: user.user_id, rating},res)
        }
        
    } catch (error) {
        console.error('Failed to create review:', error);
        res.status(500).send('Server error');
    }
});

router.get('/getReviews', (req, res) =>{
    Reviews.find( {})
        .then((data) => {
            res.json(data)
        })
        .catch((error) => {
            console.error('Error:', error);
        });
})

router.get('/getProfileReviews', (req, res) =>{
    const username = req.query.username;

    Reviews.find( {username : username})
        .then((data) => {
            res.json(data)
        })
        .catch((error) => {
            console.error('Error:', error);
        });
})

router.get('/getSingleReview', (req, res) =>{
    const { username, title, author } = req.query;

    Reviews.findOne( {title : title, username: username, author : author})
        .then((data) => {
            res.json(data)
        })
        .catch((error) => {
            console.error('Error:', error);
        });
})

router.post('/ratings', async (req, res) => {
    const rating_data = req.body;
    try {
        let book = await Books.findOne({ title: rating_data.title, author: rating_data.author });
        if (!book) {
            const bookData = {
                title: rating_data.title,
                author: rating_data.author
            };
            booksController.create({ body: bookData }, {
                send: (data) => {
                    // handle response
                    console.log(data);
                    // After creating the book, create the rating
                    ratingsController.create({
                        user_id: rating_data.user_id,
                        book_id: data.book.book_id,  // Assuming book ID is returned
                        rating: rating_data.rating
                    }, res);
                },
                status: function(statusCode) {
                    return this;  // Mimic Express' status handling
                }
            });
        } else {
            // Book exists, proceed to create rating
            ratingsController.create({
                user_id: rating_data.user_id,
                book_id: book.book_id,
                rating: rating_data.rating
            }, res);
        }
    } catch (error) {
        console.error('Error processing rating:', error);
        res.status(500).json({ message: "Error processing rating", error: error.toString() });
    }
    
});

module.exports = router;