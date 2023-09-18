var express = require('express');
var router = express.Router();
var users = require('../controllers/users')
var reviews = require('../controllers/reviews')
const crypto = require('crypto');
const User = require('../models/users')
const e = require("express");
const session = require("express-session");

const secretKey = crypto.randomBytes(32).toString('hex');
let isAuthenticated = false;
let wantToPost = false;

router.use(session({
  secret: secretKey, // Secret key for session data encryption
  resave: false,
  saveUninitialized: false
}));


/* GET home page. */
router.get('/', function(req, res, next) {

    if (req.session.username ){
        res.render('index', {isAuthenticated : isAuthenticated, username : req.session.username});
    }
    else{
        res.render('index', {isAuthenticated})
    }

});

router.get('/login', function(req, res, next) {
    if (!isAuthenticated){
        res.render('login', );
    } else {
        res.redirect('/');
    }

});


router.get('/view_review', function(req, res, next) {
    if (req.session.username ){
        res.render('view-review', {isAuthenticated : isAuthenticated, username : req.session.username});
    }
    else{
        res.render('view-review', {isAuthenticated})
    }

});

router.get('/create_review', function(req, res, next) {
    if (isAuthenticated){
        res.render('create-review', {username : req.session.username});
    } else {
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

          isAuthenticated = true;

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

router.post('/register', (req,res)=>{
    res.redirect('/login');
})



module.exports = router;
