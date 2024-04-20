var bodyParser = require("body-parser");
var User = require('../models/users');
var path = require('path');


/**
 * Code to create and save users into mongoDB
 */
exports.create = async function(req, res) {
    try {
        // Find the current highest user_id
        const lastUser = await User.findOne().sort({ user_id: -1 }).exec();

        // Set the next user_id
        const nextUserId = lastUser ? lastUser.user_id + 1 : 1;

        // Extract user data from the request body
        const userData = req.body;

        // Create a new User object with the extracted data and new user_id
        const user = new User({
            email: userData.email,
            username: userData.username,
            password: userData.password,
            user_id: nextUserId  // Assign the calculated user_id
        });

        // Save the User to the database
        const savedUser = await user.save();
        console.log('User saved successfully:', savedUser);
        res.send({ message: 'User saved successfully', user: savedUser });

    } catch (error) {
        // Log and respond with error
        console.error('Error in creating user:', error);
        res.status(500).send({ message: 'Error saving user' });
    }
};