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
        const { title, author, rating, username } = req.body;

        const reviewResult = await reviewsController.create(req); // Assume this returns something or throws
        const user = await Users.findOne({ username: username });
        if (!user) {
            return res.status(404).send('User not found');
        }

        let book = await Books.findOne({ title: title, author: author });
        if (!book) {
            book = await booksController.create(req);
        }
        
        const ratingResult = await ratingsController.create({book_id: book.book_id, user_id: user.user_id, rating});
        res.json({ success: true, book, reviewResult, ratingResult });
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


module.exports = router;