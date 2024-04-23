var express = require('express');
var router = express.Router();
var users = require('../controllers/users')
var reviews = require('../controllers/reviews')
var books = require('../controllers/books')
var ratings = require('../controllers/ratings')
const crypto = require('crypto');
const User = require('../models/users')
const Review = require('../models/reviews')
const e = require("express");
var comments = require('../controllers/comments')
const Comment = require('../models/comments');
const session = require("express-session");
const bcrypt = require('bcrypt');
const axios = require('axios');
const Predictions = require('../models/predictions');
const Ratings = require('../models/ratings')
const Books = require('../models/books')
const googleAPIKey = 'AIzaSyBjIIFRyXPIXYCYnZi9U8bA1hWNb0dUhQ0';

const secretKey = crypto.randomBytes(32).toString('hex');
let wantToPost = false;


//creating a session for logging in
router.use(session({
  secret: secretKey, // Secret key for session data encryption
  resave: false,
  saveUninitialized: false
}));


/* GET home page. */
router.get('/', function(req, res, next) {


    //pass username variable if logged in
    if (req.session.username ){
        res.render('index', {isAuthenticated : true, username : req.session.username});
    }
    else{
        res.render('index', {isAuthenticated : false})
    }

});

router.get('/login', function(req, res, next) {

    if (!req.session.username) {
        res.render('login');
    } else {
        res.redirect('/');
    }

});


router.get('/view_review', function(req, res, next) {


    if (req.session.username ){
        res.render('view-review', {isAuthenticated : true, username : req.session.username});
    }
    else{
        res.render('view-review', {isAuthenticated : false})
    }

});

router.get('/create_review', function(req, res, next) {


    if (req.session.username ){
        res.render('create-review', {username : req.session.username});
    } else{
        wantToPost = true;
        res.redirect('/login');
    }

});

router.get('/profile', function(req, res, next) {
    res.render('profile', {username : req.session.username});

});

router.get('/add-book', function(req, res, next) {
    res.render('add-rating', {username : req.session.username});

});


router.get('/offline', function(req, res, next) {

    if (req.session.username ){
        res.render('offline', {isAuthenticated : true, username : req.session.username});
    }
    else{
        res.render('offline', {isAuthenticated : false})
    }
});



//creating users
router.post('/users', function (req, res) {


    const password  = req.body.password;

    //hash password using bcrypt before storing it in db (security)
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            res.status(500).json({ message: 'Internal server error' });
        } else {
            // Update the password in the req.body object with the hashed value
            req.body.password = hash;

            users.create(req, res);
        }
    });
});



router.post('/create_review', async (req, res) => {
    try {

        const { title, author, rating, username} = req.body;

        reviews.create(req,res);
        if (wantToPost === true){
            wantToPost = false;
        }

        const user = await User.findOne({ username: username });
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        // Find or create the book
        let book = await Books.findOne({ title: title, author: author });
        if (!book) {
            return books.create(req, res, async (createdBook) => { 
                ratings.create({book_id: createdBook.book_id, user_id: user.user_id, rating},res)
            });
        }
        else {
            return ratings.create({book_id: book.book_id, user_id: user.user_id, rating},res)
        }
        
    } catch (error) {
        console.error('Failed to create review:', error);
        res.status(500).send('Server error');
    }
});




router.post('/login', (req, res) => {
  const { email, password } = req.body;



  // Validate and authenticate user. Check if email and password match entry in db
  User.findOne({email : email})
      .then(async (user) => {
          if (!user) {
              return res.render('login', { error: 'Invalid email or password' });
          }

          // Compare the entered password with the stored hash
          const passwordMatch = await bcrypt.compare(password, user.password);

          if (passwordMatch) {
              // Passwords match, set the user's session and redirect
              req.session.username = user.username;

              if (wantToPost) {
                  wantToPost = false;
                  res.redirect('/create_review');
              } else {
                  res.redirect('/'); // Redirect to a secured profile page
              }
          } else {
              res.render('login', { error: 'Invalid email or password' });
          }
      })
      .catch((error) => {
          console.error('Error during login:', error);
          res.render('login', { error: 'An error occurred during authentication' });
      });

});

router.get('/signout', (req, res) => {
    // Clear the user's session to log them out
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }

        res.redirect('/');
    });
});

router.post('/register', (req,res)=>{

    res.redirect('/login');
})



router.get('/getReviews', (req, res) =>{
    Review.find( {})
        .then((data) => {

            res.json(data)

        })
        .catch((error) => {
            console.error('Error:', error);
        });
})

router.get('/getProfileReviews', (req, res) =>{

    const username = req.query.username;

    Review.find( {username : username})
        .then((data) => {

            res.json(data)

        })
        .catch((error) => {
            console.error('Error:', error);
        });
})




router.get('/getSingleReview', (req, res) =>{

    const { username, title, author } = req.query;

    Review.findOne( {title : title, username: username, author : author})
        .then((data) => {

            res.json(data)

        })
        .catch((error) => {
            console.error('Error:', error);
        });
})


router.post('/comments', function (req,res){
    comments.create(req,res);
})

router.get('/comments', function (req,res){

     const room_number = req.query.room_number;



     Comment.find({room_number : room_number})
         .then((data) => {

             res.json(data);

        })
         .catch((error) => {
             console.error('Error: ', error);
         });
})

router.get('/allComments', function (req,res){


    Comment.find({})
        .then((data) => {

            res.json(data);

        })
        .catch((error) => {
            console.error('Error: ', error);
        });
})


router.get('/getUsersAndEmails', function (req, res, next) {

    const { username, email } = req.query;

    User.find({
        $or: [
            { username: username },
            { email: email }
        ]
    })
        .then((data) => {
            res.json(data);
        })
        .catch((error) => {
            console.error('Error:', error);
            res.status(500).json({ message: 'Internal server error' });
        });
});




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


// Route to get top books for a user by username
router.get('/top-books', async (req, res) => {
    try {
        // Retrieve the user based on the username
        const user = await User.findOne({ username: req.query.username });
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        const userId = user.user_id;

        // Count how many entries the user_id has in the ratings database
        const ratingsCount = await Ratings.countDocuments({ user_id: userId });

        // Decide whether to get top books for the user or popular books
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
                    from: "books", // This should match the MongoDB collection name
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

        console.log('No books found matching the query.');
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
                    author: '$book_info.author' // Directly use the author's field
                }
            }
        ]);

        // Enhance books with images from Google Books API
        const booksWithImages = await Promise.all(topBooks.map(book =>
            getBookImage(book.title, book.author)
        ));

        return booksWithImages.filter(book => book !== null); 
    } catch (error) {
        console.error('Error fetching top books for user:', error);
        throw error;  // Rethrow to handle it in the route
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


router.get('/user', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.query.username});
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.json(user)
    } catch (error) {
        console.error('Failed to fetch top books:', error);
        res.status(500).send('Server error');
    }
});


// Assume this route receives ratings and may need to create books
router.post('/ratings', async (req, res) => {
    const rating_data = req.body;
    try {
        let book = await Books.findOne({ title: rating_data.title, author: rating_data.author });

        if (!book) {
            // Create a book if it doesn't exist
            const bookData = {
                title: rating_data.title,
                author: rating_data.author
            };

            // Call the create function directly with constructed book data
            books.create({ body: bookData }, {
                send: (data) => {
                    // handle response
                    console.log(data);
                    // After creating the book, create the rating
                    ratings.create({
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
            ratings.create({
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



router.post('/add-book', async (req, res) => {
    const {title, author, username, rating} = req.body;

    const user = await User.findOne({ username: username });
        if (!user) {
            return res.status(404).send('User not found');
        }
        
        // Find or create the book
        let book = await Books.findOne({ title: title, author: author });
        if (!book) {
            return books.create(req, res, async (createdBook) => { 
                ratings.create({book_id: createdBook.book_id, user_id: user.user_id, rating},res)
            });
        }
        else {
            return ratings.create({book_id: book.book_id, user_id: user.user_id, rating},res)
        }
});





module.exports = router;
