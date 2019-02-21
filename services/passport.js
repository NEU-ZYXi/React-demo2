const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const keys = require("../config/keys");
const mongoose = require("mongoose");

const User = mongoose.model("users");

passport.serializeUser((user, done) => {
	// console.log("in serialization step");
	done(null, user.id);
	// console.log("serialized user: " + user.id + "\n");
});

passport.deserializeUser((id, done) => {
	// console.log("in deserialization step\n");
	User.findById(id)
		.then(user => {
			done(null, user);
		});
});

passport.use(
	new GoogleStrategy(
		{
			clientID: keys.googleClientID,
			clientSecret: keys.googleClientSecret,
			callbackURL: "/auth/google/callback",
			proxy: true
		}, 
		async (accessToken, refreshToken, profile, done) => {
			const existingUser = await User.findOne({googleId: profile.id});

			if (existingUser) {
				// console.log("the record is already in\n");
				return done(null, existingUser);
			}

			// console.log("save a new record");
			const user = await new User({googleId: profile.id}).save();
			done(null, user);
		}
	)
);