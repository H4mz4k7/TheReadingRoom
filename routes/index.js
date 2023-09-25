var express = require('express');
var router = express.Router();
var users = require('../controllers/users')
var reviews = require('../controllers/reviews')
const crypto = require('crypto');
const User = require('../models/users')
const Review = require('../models/reviews')
const e = require("express");
var comments = require('../controllers/comments')
const Comment = require('../models/comments');
const session = require("express-session");
const bcrypt = require('bcrypt');
const axios = require('axios');

const googleAPIKey = 'AIzaSyBjIIFRyXPIXYCYnZi9U8bA1hWNb0dUhQ0';

const secretKey = crypto.randomBytes(32).toString('hex');
let wantToPost = false;



router.use(session({
  secret: secretKey, // Secret key for session data encryption
  resave: false,
  saveUninitialized: false
}));


/* GET home page. */
router.get('/', function(req, res, next) {


    console.log("want to post INDEX: " + wantToPost)

    if (req.session.username ){
        res.render('index', {isAuthenticated : true, username : req.session.username});
    }
    else{
        res.render('index', {isAuthenticated : false})
    }

});

router.get('/login', function(req, res, next) {

    console.log("want to post LOGIN: " + wantToPost)
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


router.get('/offline', function(req, res, next) {

    if (req.session.username ){
        res.render('offline', {isAuthenticated : true, username : req.session.username});
    }
    else{
        res.render('offline', {isAuthenticated : false})
    }
});



router.post('/users', function (req, res) {
    // Assuming you want to hash the password before saving it

    console.log("want to post REGISTER(POST): " + wantToPost)

    const password  = req.body.password;

    // Modify the password value (e.g., hash it using bcrypt)
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            res.status(500).json({ message: 'Internal server error' });
        } else {
            // Update the password in the req.body object with the hashed value
            req.body.password = hash;

            // Now you can proceed to create the user or save the user data
            users.create(req, res);
        }
    });
});

router.post('/create_review', function (req,res){
    reviews.create(req,res);
    if (wantToPost === true){
        wantToPost = false;
    }
    res.status(200).send('Review saved successfully');
})





router.post('/login', (req, res) => {
  const { email, password } = req.body;



    console.log("want to post LOGIN(POST): " + wantToPost)
  // Validate and authenticate user here (e.g., check credentials against a database)
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
        // Refresh the current page

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
        // Make a request to the Google Books API to search for the book by title and author
        const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
            params: {
                q: `intitle:${title}+inauthor:${author}`,
                key: googleAPIKey
            },
        });

        // Check if there are any search results
        if (response.data.items && response.data.items.length > 0) {
            const book = response.data.items[0].volumeInfo;


            // Check if a thumbnail image is available
            const imageUrl = book.imageLinks ? book.imageLinks.thumbnail : null;

            // Check if an abstract/description is available
            const abstract = book.description || 'No description available';

            res.json({ imageUrl: imageUrl, abstract: abstract });
        } else {
            res.json({ error: 'Book not found' });
        }
    } catch (error) {
        console.error('Error fetching book image and description from Google Books API:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});





module.exports = router;
