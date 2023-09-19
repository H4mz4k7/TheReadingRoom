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

const secretKey = crypto.randomBytes(32).toString('hex');
let wantToPost = false;

router.use(session({
  secret: secretKey, // Secret key for session data encryption
  resave: false,
  saveUninitialized: false
}));


/* GET home page. */
router.get('/', function(req, res, next) {

    if (req.session.username ){
        res.render('index', {isAuthenticated : true, username : req.session.username});
    }
    else{
        res.render('index', {isAuthenticated : false})
    }

});

router.get('/login', function(req, res, next) {


    if (!req.session.username ){
        res.render('login',);
    } else{
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

router.post('/users', function (req,res){
  users.create(req,res);
})

router.post('/create_review', function (req,res){
    reviews.create(req,res);
})





router.post('/login', (req, res) => {
  const { email, password } = req.body;



  // Validate and authenticate user here (e.g., check credentials against a database)
  User.findOne({email : email, password : password})
      .then((data) => {
        if(data){

          req.session.username = data.username;


          if (wantToPost){
              res.redirect('/create_review')
              wantToPost = false;
          } else {
              res.redirect('/'); // Redirect to a secured profile page
          }

        } else{
          res.render('login', { error: "Invalid email or password" });
        }
      })
      .catch((error) => {
        console.error('Error', error);
        res.render('login', { error: "An error occurred during authentication" });
      })

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

     console.log(room_number);
     console.log(typeof room_number);

     Comment.find({room_number : room_number})
         .then((data) => {

             res.json(data);

        })
         .catch((error) => {
             console.error('Error: ', error);
         });
})






module.exports = router;
