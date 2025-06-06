// TP Entire File (+ edits) from Google OAuth Tutorial https://coderdinesh.hashnode.dev/how-to-implement-google-login-in-the-mern-based-applications

const configs = require("../configs/config.js");
const User = require("../models/User");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// Serialize and Deserialize User for session management
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// passport.deserializeUser((id, done) => {
//     User.findById(id, (err, user) => {
//         done(err, user);
//     });
// });

passport.deserializeUser((id, done) => {
    User.findById(id)
        .then((user) => done(null, user)) // Pass the user to the next middleware
        .catch((err) => done(err, null)); // Handle errors
});

// Use GoogleStrategy for OAuth 2.0 authentication
passport.use(
    new GoogleStrategy(
        {
            clientID: configs.googleAuthClientId,
            clientSecret: configs.googleAuthClientSecret,
            callbackURL: configs.googleAuthServerCallbackURL, // Update with your callback URL
        },
        async (accessToken, refreshToken, profile, done) => {
            // TODO: still need to edit function
            try {
                const user = await User.findOneAndUpdate(
                    { googleId: profile.id },
                    { username: profile.displayName, email: profile.emails[0].value },
                    { upsert: true, new: true }
                );
                // let user = await User.findOne({ googleId: profile.id });
                // if (!user) {
                //     // if not, create a new user
                //     user = new User({
                //         email: profile.emails[0].value,
                //         username: profile.displayName,
                //         googleId: profile.id,
                //         profilePicture: profile.photos[0].value,
                //     });
                //     await user.save();
                // }
                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);
