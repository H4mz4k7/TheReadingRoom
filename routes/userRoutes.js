const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/users');
const usersController = require('../controllers/users')
const { isAuthenticated, sessionMiddleware, handlePostState } = require('./commonMiddleware');

router.use(sessionMiddleware);
router.use(handlePostState);



router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
      const user = await User.findOne({ email });
      if (!user) {
          throw new Error('Invalid email or password');
      }
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
          throw new Error('Invalid email or password');
      }
      req.session.username = user.username;
      
      if (req.wantToPost) {
        req.setWantToPost(false);
        res.redirect('/create_review');
        } else {
            res.redirect('/')
        }

  } catch (error) {
      res.render('login', { error: error.message });
  }
});

// User signout
router.get('/signout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/');
    });
});

// User registration and creation
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

            usersController.create(req, res);
        }
    });
});

router.post('/register', (req, res) => {
    res.redirect('/login');
});

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


module.exports = router;
