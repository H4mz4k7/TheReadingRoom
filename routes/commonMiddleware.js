const session = require("express-session");
const crypto = require('crypto');

const secretKey = crypto.randomBytes(32).toString('hex');

let wantToPost = false;

//user session
exports.sessionMiddleware = session({
  secret: secretKey,
  resave: false,
  saveUninitialized: false
});

//checks whether user is logged in
exports.isAuthenticated = (req, res, next) => {
  if (!req.session.username) {
    res.redirect('/login');
  } else {
    next();
  }
};

//manipulat wantToPost variable
exports.handlePostState = (req, res, next) => {
    req.wantToPost = wantToPost;
    req.setWantToPost = (value) => { wantToPost = value; };
    next();
};

