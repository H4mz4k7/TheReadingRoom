const express = require('express');
const router = express.Router();
const { isAuthenticated, sessionMiddleware, handlePostState } = require('./commonMiddleware');

router.use(sessionMiddleware);
router.use(handlePostState);



router.get('/', function(req, res) {
    if (req.session.username) {
        res.render('index', { isAuthenticated: true, username: req.session.username });
    } else {
        res.render('index', { isAuthenticated: false });
    }
});

router.get('/login', function(req, res) {
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
    if (req.session.username) {
        res.render('create-review', { username: req.session.username });
    } else {
        req.setWantToPost(true);
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

module.exports = router;
