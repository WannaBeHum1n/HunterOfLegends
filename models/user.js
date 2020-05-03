const mongoose = require("mongoose");

//User scheme

const userSchema = mongoose.Schema({
	username:{
		type: String,
		trim: true,
		required: true,
		unique: true,
	},
	email:{
		type: String,
		trim: true,
		required: true,
		unique: true,
	},
	password:{
		type: String,
		required: true
	},
	gender:{
		type: String,
		required: true
	},
	lolaccount:{
		type: String,
	},
	profileIconId:{
		type: Number,
	},
	summonerLevel:{
		type: Number,
	},
	lolid:{
		type: String,
	},
	lastgame:{
		type: String,
	},
	lastgameChecked:{
		type: Boolean,
	},
	lastprey:{
		type: String,
	},
	score:{
		type: Number,
	}
});

const User = module.exports = mongoose.model('User', userSchema);