var express = require('express');
var router = express.Router();
var users = require('../controllers/users')


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Adding a New Sighting' });
});


router.post('/users', function (req,res){
  users.create(req,res);
})


module.exports = router;
