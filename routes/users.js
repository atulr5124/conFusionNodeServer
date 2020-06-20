var express = require('express');
const bodyParser = require('body-parser');
var User = require('../models/user');

var router = express.Router();
router.use(bodyParser.json());

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

// Signing up the user
router.post('/signup', (req, res, next) => {
  User.findOne({ username: req.body.username })
    .then((user) => {
      if (user != null) {
        var err = new Error('User ' + req.body.username + ' already exists!');
        err.status = 403;
        next(err);
      } else {
        return User.create({
          username: req.body.username,
          password: req.body.password
        });
      }
    })
    .then((user) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json({ status: 'Registeration Successful!', user: user });
    }, (err) => next(err))
    .catch((err) => next(err));
});

// Login the user
router.post('/login', (req, res, next) => {
  if (!req.session.user) {
    var authHeader = req.headers.authorization;
    if (!authHeader) {
      var err = new Error('You are not authenticated!');
      res.setHeader('WWW-Authenticate', 'Basic');
      err.status = 401;
      next(err);
      return;
    }

    var auth = new Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
    var username = auth[0];
    var password = auth[1];

    User.findOne({ username: username })
      .then((user) => {
        if (user === null) {
          var err = new Error('Cannot find an account with username ' + username);
          err.status = 403;
          next(err);
        } else if (user.password !== password) {
          var err = new Error('Invalid password!');
          err.status = 403;
          next(err);
        } else if (user.username === username && user.password === password) {
          // res.cookie('user', 'admin', { signed: true });
          req.session.user = 'authenticated';
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/plain');
          res.end('You are logged in!'); 
        }
      })
      .catch((err) => next(err));
  } else {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('You are already logged in!');
  }
});

router.get('/logout', (req, res) => {
  if(req.session) {
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  } else {
    var err = new Error('You are not logged in!');
    err.status = 403;
    next(err);
  }
});

module.exports = router;
