var express = require('express');
var router = express.Router();
var users = require('../controllers/users')


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', );
});

router.get('/login', function(req, res, next) {
  res.render('login', );
});

router.get('/create_review', function(req, res, next) {
  res.render('create-review', );
});

router.post('/users', function (req,res){
  users.create(req,res);
})


app.post('/userLogin', (req, res) => {
  const { username, password } = req.body;

  // Validate and authenticate user here (e.g., check credentials against a database)

  if (authenticated) {
    // Start a session and store user data (e.g., username) in the session
    req.session.username = username;
    res.redirect('/profile'); // Redirect to a secured profile page
  } else {
    res.render('login', { error: 'Invalid username or password' });
  }
});


module.exports = router;
