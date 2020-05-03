const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const config = require("./config/database")
const passport = require('passport');
const axios = require("axios");
const api_key = process.env.API;
const URI = process.env.URI;
mongoose.connect(URI)
let db = mongoose.connection;
mongoose.set('useCreateIndex', true);
//db errors check
db.on('error', () => {
	console.log(error)
});
//connection check
db.once('open', () => {
	console.log('connected to MongoDb');
})
//init app
const app = express();
//view engine
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'pug');

//body-parser middleware
app.use(bodyParser.urlencoded({ extended: false}))
app.use(bodyParser.json())
//express-session middleware
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  saveUninitialized: true,  
  cookie: { secure: false},
  resave: true,
}));
//express-messages middleware 
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});
//passport config
require('./config/passport')(passport);
//passport middleware
app.use(passport.initialize());
app.use(passport.session());
//
app.get('*', (req, res, next) => {
	res.locals.user = req.user || null;
	next();
});


let users = require('./routes/users');
app.use('/users', users);

//home route
app.get('/', function(req, res){
  res.render('index');
});
//on account
app.get('/on', ensureAuthenticated, ensureAuthenticated2, (req, res) => {
    const region = "euw1";
    let imgId = req.user.profileIconId;
    let scoryy = req.user.score;
    let imgUrl = '"http://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/'+imgId+'.jpg"';
    let figarou = req.user.lolaccount; 
    res.render('index2', {
      imgLoad: imgUrl,
		  user: figarou,
		  know: "Get your prey",
		  direction: "prey",
		  watchu: scoryy,
    });
});			
//server start 
app.listen(process.env.PORT, () => {
	console.log("server started on port" +` ${process.env.PORT}`);
});
function ensureAuthenticated2(req, res, next) {
  if(req.user.lolaccount != "nein"){
    return next();            
  } else {
    req.flash('danger', 'Please choose your account!');
    res.redirect('/users/pickAcc');
  }
}
// Access Control
function ensureAuthenticated(req, res, next) {
  if(req.isAuthenticated()){
    return next();
  } else {
    req.flash('danger', 'Please login');
    res.redirect('/users/login');
  }
}

app.use(express.static(path.join(__dirname, '/public')));