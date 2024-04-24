const express = require('express');
const router = express.Router();
const { isAuthenticated, sessionMiddleware, handlePostState } = require('./commonMiddleware');
const Users = require('../models/users')
const Books = require('../models/books')
const Ratings = require('../models/ratings')
const Predictions = require('../models/predictions')
const axios = require('axios');
var booksController = require('../controllers/books')
var ratingsController = require('../controllers/ratings')
const googleAPIKey = 'AIzaSyBjIIFRyXPIXYCYnZi9U8bA1hWNb0dUhQ0';


router.use(sessionMiddleware);

router.get('/getBookInfo', async (req, res) => {
    const title = req.query.title;
    const author = req.query.author;

    try {
        const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
            params: {
                q: `intitle:${title}+inauthor:${author}`,
                key: googleAPIKey,
            },
        });

        if (response.data.items && response.data.items.length > 0) {
            // Filter items to find the first one with English language
            const englishBook = response.data.items.find(item => item.volumeInfo.language === 'en');

            if (englishBook) {
                const book = englishBook.volumeInfo;

                const imageUrl = book.imageLinks ? book.imageLinks.thumbnail : null;
                const abstract = book.description || 'No description available';

                res.json({ imageUrl: imageUrl, abstract: abstract });
            } else {
                res.json({ error: 'English description not found' });
            }
        } else {
            res.json({ error: 'Book not found' });
        }
    } catch (error) {
        console.error('Error fetching book image and description from Google Books API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/top-books', async (req, res) => {
    try {
        const user = await Users.findOne({ username: req.query.username });
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        const userId = user.user_id;
        const ratingsCount = await Ratings.countDocuments({ user_id: userId });

        if (ratingsCount > 5) {
            const topBooks = await getTopBooksForUser(userId);
            if (topBooks.length >= 5) {
                return res.json(topBooks);
            }
        }

        const popularBooks = await getPopularBooks();
        res.json(popularBooks);

    } catch (error) {
        console.error('Failed to fetch books:', error);
        res.status(500).send('Server error');
    }
});


async function getPopularBooks() {
    try {
        const popularBooks = await Ratings.aggregate([
            {
                $group: {
                    _id: "$book_id",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            },
            {
                $lookup: {
                    from: "books",
                    localField: "_id",
                    foreignField: "book_id",
                    as: "bookDetails"
                }
            },
            {
                $unwind: "$bookDetails"
            },
            {
                $project: {
                    _id: 0,
                    book_id: "$_id",
                    count: 1,
                    title: "$bookDetails.title",
                    author: "$bookDetails.author"
                }
            }
        ]);

        const booksWithImages = await Promise.all(popularBooks.map(book =>
            getBookImage(book.title, book.author)
        ));

        return booksWithImages.filter(book => book !== null); 

    } catch (error) {
        console.error('Error fetching popular books:', error);
        throw new Error('Error fetching popular books');
    }
}

async function getBookImage(title, author) {
    try {
        const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
            params: {
                q: `intitle:"${title}" inauthor:"${author}"`,  
                key: googleAPIKey
            }
        });

        if (response.data.items && response.data.items.length > 0) {
            const item = response.data.items[0];
            const imageLinks = item.volumeInfo.imageLinks;
            return {
                title: item.volumeInfo.title,
                author: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Unknown Author',
                image: imageLinks ? imageLinks.thumbnail : null  
            };
        }
        return {
            title: title,
            author: author,
            image: null  
        };
    } catch (error) {
        console.error('Failed to fetch book details from Google Books API:', error);
        if (error.response && error.response.status == 429) {
            console.log('Rate limit exceeded. Returning title and authors with null image.');
            return {
                title: title,
                author: author,
                image: null
            };
        }
        return null;
    }
}

async function getTopBooksForUser(userId) {
    try {
        const topBooks = await Predictions.aggregate([
            { $match: { user_id: userId } },
            { $sort: { prediction: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'books',
                    localField: 'book_id',
                    foreignField: 'book_id',
                    as: 'book_info'
                }
            },
            { $unwind: '$book_info' },
            {
                $project: {
                    _id: 0,
                    title: '$book_info.title',
                    author: '$book_info.author' 
                }
            }
        ]);

        const booksWithImages = await Promise.all(topBooks.map(book =>
            getBookImage(book.title, book.author)
        ));

        return booksWithImages.filter(book => book !== null); 

    } catch (error) {
        console.error('Error fetching top books for user:', error);
        throw error;  
    }
}


router.get('/read-books', async (req, res) => {
    try {
        const booksWithRatings = await Ratings.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: 'user_id',
                    as: 'user'
                }
            },
            {
                $match: {
                    'user.username': req.query.username
                }
            },
            {
                $lookup: {
                    from: 'books',
                    localField: 'book_id',
                    foreignField: 'book_id',
                    as: 'book'
                }
            },
            {
                $unwind: '$book'
            },
            {
                $project: {
                    _id: 0,
                    title: '$book.title',
                    author: '$book.author', 
                    rating: '$rating'  
                }
            }
        ]);

        if (!booksWithRatings.length) {
            return res.status(404).send('No books found for this user');
        }

        res.json(booksWithRatings);
    } catch (error) {
        console.error('Failed to fetch books and ratings:', error);
        res.status(500).send('Server error');
    }
});

router.post('/add-book', async (req, res) => {
    const {title, author, username, rating} = req.body;

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
});


module.exports = router;
