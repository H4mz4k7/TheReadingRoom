var bodyParser = require("body-parser");
var User = require('../models/users');
var path = require('path');


exports.create = async function(req, res) {
    try {
        const lastUser = await User.findOne().sort({ user_id: -1 }).exec();
        const nextUserId = lastUser ? lastUser.user_id + 1 : 1;
        const userData = req.body;

        const user = new User({
            email: userData.email,
            username: userData.username,
            password: userData.password,
            user_id: nextUserId  
        });

        const savedUser = await user.save();
        res.send({ message: 'User saved successfully', user: savedUser });

    } catch (error) {r
        console.error('Error in creating user:', error);
        res.status(500).send({ message: 'Error saving user' });
    }
};