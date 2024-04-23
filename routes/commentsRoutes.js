const express = require('express');
const router = express.Router();
const { isAuthenticated, sessionMiddleware } = require('./commonMiddleware');
const Comments = require('../models/comments')
var commentsController = require('../controllers/comments')


router.use(sessionMiddleware);


router.post('/comments', function (req,res){
    commentsController.create(req,res);
})

router.get('/comments', function (req,res){
     const room_number = req.query.room_number;

     Comments.find({room_number : room_number})
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

module.exports = router;
