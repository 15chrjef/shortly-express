var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcryptjs');
// var cookieParser = require('cookie-parser');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();
var hour = 3600000;
// app.use(cookieParser());
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: true}));


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

var currentSession = new session();


app.get('/', util.authenticate,
function(req, res) {
  res.render('index');
});

app.get('/create', util.authenticate, 
function(req, res) {
  res.render('index');
});

app.get('/links', util.authenticate,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
});

app.post('/links', util.authenticate,
function(req, res) {
  console.log('step one');
  var uri = req.body.url;
  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

app.get('/login', 
  function(req, res) {
    res.render('login');
  });

app.get('/signup', 
  function(req, res) {
    res.render('signup');
  });
/************************************************************/
// Write your authentication routes here
/************************************************************/

app.post('/login',
  function(req, res) {
    var username = req.body.username;
    var password = req.body.password; 

    new User({
      username: req.body.username})
        .fetch()
        .then(function(user) {
          if(!user){
            res.redirect('/login')
          } else {
            var salt = user.salt;
            bcrypt.hash(req.body.password, salt, function(err, hash) {
            if (err) {
              throw new Error (err);
              return err;
            }
            return hash;
            }).then(function(hashed) {
            if ( user && (user.password !== hashed)) {
              res.redirect(404, '/login');
              console.log('incorrect pw');
              return;
            }
            if (!user) {
              console.log('user not user');
              res.redirect(404, '/login');
              return;
            }
            util.createSession(req, res, req.body.username);
            // console.log( '****************', req.session);
            res.redirect(200, '/');
          });
        };
  });

app.post('/signup',
  function(req, res) {
    new User({
      'username': req.body.username
    }).fetch()
      .then(function(user) {
        if (!user) {
          var salt = bcrypt.genSaltSync(5, 16);
          bcrypt.hash(req.body.password, salt, function(err, hash) {
            if (!err) {
              Users.create({
                username: req.body.username,
                password: hash,
                salt: salt
              }).then(function() {
                util.createSession(req, res, user);
                res.redirect(202, '/');
              });
            }
          });
        }
      });
    // Users.create({
    //   username: req.body.username,
    //   password: req.body.password,
    // }).then(function(newUser) {
    //   // res.status(200);
    //   // res.setHeader('Location', '/');
    //   // res.send();
    //   req.session.user = req.body.username;
    //   res.session.cookie.username = req.body.username;
    //   // console.log( '****************', req.session);
    //   res.redirect(200, '/');

    // });
  });


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
