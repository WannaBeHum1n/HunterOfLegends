const express = require('express');
const router = express.Router();
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const axios = require("axios");
const fetch = require('node-fetch');
const { URL } = require('url');
const api_key = process.env.API;
//bring models
let User = require('../models/user');

//register form
router.get('/register', (req, res) => {
	res.render('register');
});
//regisetr process
//Add submit Post route
router.post('/register', [	
	check('username').not().isEmpty().withMessage('username is required!'),
	check('gender').not().isEmpty().withMessage('Please select your gender'),
	check('email').not().isEmpty().withMessage('Email is required!'),
	check('email').not().isEmpty().withMessage('Email is required!'),
	check('email').isEmail().withMessage('Email is not valid'),
	check('password').not().isEmpty().withMessage('password is required'),
	check('password2')
	.custom((value,{req, loc, path}) => {
            if (value !== req.body.password) {
                // trow error if passwords do not match
                throw new Error("Passwords don't match");
            } else {
                return value;
            }
        })
	.withMessage('passwords do not match')
	], function (req, res, error) {

	const errors = validationResult(req);
	console.log(req.body);



	if (!errors.isEmpty()) {
		console.log(errors);
		res.render('register', {
			errors:errors.errors
		});
	} else {
		let newUser = new User({
     		username:req.body.username,
    		email:req.body.email,
      		password:req.body.password,
      		gender:req.body.gender,
      		lolaccount: "nein",
      		profileIconId: 0,
      		summonerLevel: 0,
      		lolid: "nein",
      		lastgame: "nein",
      		lastprey: "nein",
      		lastgameChecked: false,
      		score: 0,
	});
	bcrypt.genSalt(10, (err, salt) => {
		bcrypt.hash(String(newUser.password), salt, (err, hash) => {
			if (err) {
				console.log(err);
			}
			newUser.password = hash;
			newUser.save((err) => {
				if (err) {
					let posErr = err.message.split(' index: ')[1].split('_1')[0];
					if ((err.name === 'MongoError' && err.code === 11000) && posErr === "username") {
        				console.log("hi booooooooooy");
        				res.render('register', {
							duplic:"This username is already used"
						});
      				} else if ((err.name === 'MongoError' && err.code === 11000) &&  posErr === "email") {
        				console.log("hi pls");
        				console.log(err);
        				res.render('register', {
							duplic:"This email is already used"
						});
      				} else {
      					console.log(err);
      				}
				} else {
					req.flash('success', 'You are now registred, please log in');
					res.redirect('/users/login');
				}
			});
		});
	});
	}
});
// Login Form
router.get('/login', function(req, res){
  res.render('login');
});
// Login Process
router.post('/login', function(req, res, next){
  if (req.lastgameChecked) {
  	console.log(req.lastgameChecked);
  	console.log(req.user.lastprey);
  	console.log("redirected to on");
  	passport.authenticate('local', {
    	successRedirect: "/on",
    	failureRedirect: '/users/login',
    	failureFlash: true
 	})(req, res, next);
  } else{
  	console.log("redirected to live");
  	passport.authenticate('local', {
    	successRedirect: "/users/live",
    	failureRedirect: '/users/login',
    	failureFlash: true
 	})(req, res, next);
  }
});
router.get('/logout', (req, res) => {
	req.logout();
	req.flash('succcess', 'you are logged out');
	res.redirect('/users/login');
});
//Add league account
router.get('/pickAcc', function(req, res){
  res.render('lolacc1');
});
//submit account
router.post('/pickAcc', ensureAuthenticated, (req, res) => {
//league global vars 
	let lolacc;
	let prodIcId;
	let sumLvl;
	let leagueID;
	const region = "euw1";
	let username = String(req.body.lolacc);
	let uri = "https://"+region+".api.riotgames.com/lol/summoner/v4/summoners/by-name/"+username+"?api_key="+api_key;
	let url = encodeURI(uri);
	axios.get(url)
		.then(function(response){
			let data1 = response.data;
			lolacc = data1.name;
			prodIcId = data1.profileIconId;
			sumLvl = data1.summonerLevel;
			leagueID = data1.id;
			let user ={};
			user._id = req.user._id;
			user.username = req.user.username;
			user.email = req.user.email;
			user.password = req.user.password;
			user.gender = req.user.gender;
			user.lolaccount = req.body.lolacc;
			user.profileIconId = prodIcId;
			user.summonerLevel = sumLvl;
			user.lolid = leagueID;
			let query = {_id:req.user._id};
			User.updateOne(query, user, function(err){
				if(err){
					console.log(err);
					return;
				} else {
					req.flash('success', 'Please confirm is this your account?');
					res.redirect('/users/confirmAcc');
    			}
  			});		
		});	
});
router.get('/confirmAcc', ensureAuthenticated, ensureAuthenticated2, function(req, res){
	let imgId = req.user.profileIconId;
	let imgUrl = '"http://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/'+imgId+'.jpg"';
	res.render('lolacc2', {
		imgLoad: imgUrl,
		user: req.user.lolaccount,
		lvl: req.user.summonerLevel,
	});
});
router.get('/prey', ensureAuthenticated, ensureAuthenticated2, checkLive, (req, res) => {
	console.log('no fking idea bro');
});
router.get('/results', ensureAuthenticated, ensureAuthenticated2, calcScore, (req, res) => {
	console.log('no fking idea bro');
});
async function checkLive(req, res) {
	let enemyTeam = [];
	let userTeam;
	let lastGameId;
	let scoryy = req.user.score;
	let useracc = req.user.lolaccount;
	let username = req.user.lolid;
	const region = "euw1";
	let data3 = await fetch(new URL("https://"+region+".api.riotgames.com/lol/spectator/v4/active-games/by-summoner/"+username+"?api_key="+api_key));
	let main3 = await data3.json();
	if ("status" in main3) {
		console.log(main3);
		req.flash('success', `Your are not in a game`);
		req.session.save(function () {
  			const region = "euw1";
			let imgId = req.user.profileIconId;
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
	} else {
		axios.get("https://"+region+".api.riotgames.com/lol/spectator/v4/active-games/by-summoner/"+username+"?api_key="+api_key)
			.then(function(response){
				let data2 = response.data;
				lastGameId = data2.gameId;
				for (let i = 0; i < 10; i++) {
					if ((data2.participants[i].summonerName) == useracc) {
						userTeam = data2.participants[i].teamId;
					}
				}
				for (let i = 0; i < 10; i++) {
					if (data2.participants[i].teamId != userTeam) {
						enemyTeam.push(data2.participants[i])
					}
				}
				console.log(enemyTeam);
				const rand = enemyTeam[Math.floor(Math.random() * enemyTeam.length)].summonerName;
				const region = "euw1";
				let imgId = req.user.profileIconId;
				let imgUrl = '"http://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/'+imgId+'.jpg"';
				let hellboy = req.user.lolaccount;
				req.flash('success', `Your prey is ${rand}`);
				let user ={};
				user._id = req.user._id;
				user.username = req.user.username;
				user.email = req.user.email;
				user.password = req.user.password;
				user.gender = req.user.gender;
				user.lolaccount = req.user.lolaccount;
				user.profileIconId = req.user.profileIconId;
				user.summonerLevel = req.user.summonerLevel;
				user.lolid = req.user.lolid;
				user.lastgame = lastGameId;
				user.lastprey = rand;
				user.lastgameChecked = req.user.lastgameChecked;
				user.score = req.user.score;
				let query = {_id:req.user._id};
				User.updateOne(query, user, function(err){
					if(err){
						console.log(err);
						return;
					} else {
						let puta = "confirm prey";
						res.render('index2', {
							imgLoad: imgUrl,
							user: hellboy,
							know: puta,
							direction: "live",
							watchu: scoryy,
						});	
	    			}	
	    		});	
			});
	}
}
//live
router.get('/live', ensureAuthenticated, ensureAuthenticated2, function(req, res){
	if (req.user.lastprey != "nein") {
		const region = "euw1";
		let imgId = req.user.profileIconId;
		let imgUrl = '"http://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/'+imgId+'.jpg"';
		res.render('live', {
			target:req.user.lastprey,
			imgLoad: imgUrl
		});
	} else {
		res.redirect('/on');
	}
});
// Access Control
function ensureAuthenticated(req, res, next) {
  if(req.isAuthenticated()){
    return next();
  } else {
    req.flash('danger', 'Please login');
    res.redirect('/users/login');
  }
}
async function calcScore(req, res) {
	const region = "euw1";
	const matchId = req.user.lastgame;
	let actualUser = req.user.lolaccount;
	let hisPrey = req.user.lastprey;
	let actUserPartId;
	let pureKills = [];
	let pureAssists = [];
	let nonPureAssists = [];
	let scoryy = req.user.score;
	let actPreyPartId;
	let main4 = await fetch(new URL("https://"+region+".api.riotgames.com/lol/match/v4/matches/"+matchId+"?api_key="+api_key));
			let data4 = await main4.json();
			if ("status" in data4) {
				console.log('hi');
				req.flash('success', `Your game is not over yet!`);
				req.session.save(function () {
  					const region = "euw1";
					let imgId = req.user.profileIconId;
					let imgUrl = '"http://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/'+imgId+'.jpg"'; 
					res.render('live', {
						target:req.user.lastprey,
						imgLoad: imgUrl
					});
				});
			} else {
				let allParticipants = data4.participantIdentities;
				for (let i = 0; i < 10; i++) {
					if ((allParticipants[i].player.summonerName) == hisPrey) {
						actPreyPartId = allParticipants[i].participantId;
						console.log("this is prey:" + actPreyPartId);
					} else if ((allParticipants[i].player.summonerName) == actualUser) {
						actUserPartId = allParticipants[i].participantId;
						console.log("this is killer:" + actUserPartId);
					}
				}
				axios.get("https://"+region+".api.riotgames.com/lol/match/v4/timelines/by-match/"+matchId+"?api_key="+api_key)
					.then(function(response) {
						let totalScore = 0;
						let data5 = response.data;
						for (let i = 0; i < data5.frames.length - 1; i++) {
							let target = data5.frames[i];
							for (let j = 0; j < target.events.length - 1; j++) {
								let target2 = target.events[j];
								if (target2.type == "CHAMPION_KILL" && target2.killerId == actUserPartId && target2.victimId == actPreyPartId) {
									pureKills.push(target2)
								} else if (target2.type == "CHAMPION_KILL" && target2.victimId == actPreyPartId) {
									for (let v = 0; v < target2.assistingParticipantIds.length - 1; v++) {
										if (target2.assistingParticipantIds[v] == actUserPartId && target2.assistingParticipantIds.length == 1) {
											pureAssists.push(target2);
										} else if (target2.assistingParticipantIds[v] == actUserPartId && target2.assistingParticipantIds.length != 1) {
											nonPureAssists.push(target2);
										}
									}
								}
							}
						}
						console.log(pureKills);
						console.log(pureAssists);
						console.log(nonPureAssists);
						totalScore += (pureKills.length * 2);
						totalScore += (pureAssists.length * 1);
						totalScore += (nonPureAssists.length * 0.5);
						console.log("this is final score: " + totalScore);
						const region = "euw1";
						let imgId = req.user.profileIconId;
						let scoryy = req.user.score;
						let imgUrl = '"http://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/'+imgId+'.jpg"';
						let figarou = req.user.lolaccount; 
						let user ={};
						user._id = req.user._id;
						user.username = req.user.username;
						user.email = req.user.email;
						user.password = req.user.password;
						user.gender = req.user.gender;
						user.lolaccount = req.user.lolaccount;
						user.profileIconId = req.user.profileIconId;
						user.summonerLevel = req.user.summonerLevel;
						user.lolid = req.user.lolid;
						user.lastgame = req.user.lastgame;
						user.lastprey = req.user.lastprey;
						user.lastgameChecked = true;
						user.score = totalScore + req.user.score;
						let query = {_id:req.user._id};
						User.updateOne(query, user, function(err){
							if(err){
								console.log(err);
								return;
							} else {
								res.redirect('/on');
	    					}
						});
					});	
			}	
}
function ensureAuthenticated2(req, res, next) {
  if(req.user.lolaccount != "nein"){
    return next();
  } else {
    req.flash('danger', 'Please choose your account!');
    res.redirect('/users/pickAcc');
  }
}
module.exports = router;