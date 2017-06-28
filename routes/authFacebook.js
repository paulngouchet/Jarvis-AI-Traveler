/**
 * Created by paulngouchet on 6/23/17.
 */

// config/auth.js


// config/passport.js

// load all the things we need
let LocalStrategy    = require('passport-local').Strategy;
let FacebookStrategy = require('passport-facebook').Strategy;
const passport = require('passport')

const facebookConfig = require('../config/facebook')

const express = require('express')
const router = express.Router()

// load up the user model
let User  = require('../models/UserFacebook');

// load the auth variables
let configAuth = require('./auth');


    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // code for login (use('local-login', new LocalStategy))
    // code for signup (use('local-signup', new LocalStategy))

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({

            // pull in our app id and secret from our auth.js file
            clientID        : facebookConfig.clientID,
            clientSecret    : facebookConfig.clientSecret,
            callbackURL     : facebookConfig.callbackURL,
            profileFields: facebookConfig.profileFields

        },

        // facebook will send back the token and profile
        function(token, refreshToken, profile, done) {

            // asynchronous
            process.nextTick(function() {

                // find the user in the database based on their facebook id
                User.findOne({ 'facebook.id' : profile.id }, function(err, user) {

                    // if there is an error, stop everything and return that
                    // ie an error connecting to the database
                    if (err)
                        return done(err);

                    // if the user is found, then log them in
                    if (user) {
                        return done(null, user); // user found, return that user
                    } else {
                        // if there is no user found with that facebook id, create them
                        var newUser            = new User();

                        // set all of the facebook information in our user model
                        newUser.facebook.id    = profile.id; // set the users facebook id
                        newUser.facebook.token = token; // we will save the token that facebook provides to the user
                        newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                        newUser.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first

                        // save our user to the database
                        newUser.save(function(err) {
                            if (err)
                                throw err;

                            // if successful, return the new user
                            return done(null, newUser);
                        });
                    }

                });
            });

        }));





    // route for home page
    router.get('/', function(req, res) {
        //res.render('index.ejs'); // load the index.ejs file

    });

    // route for login form
    // route for processing the login form
    // route for signup form
    // route for processing the signup form

    // route for showing the profile page
   // router.get('/profile', isLoggedIn, function(req, res) {
       // res.render('profile.ejs', {
           // user : req.user // get the user out of session and pass to template
        //});
    //});

    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    router.get('/facebook', passport.authenticate('facebook', { scope : 'email' }));

    // handle the callback after facebook has authenticated the user
    router.get('/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : '/authenticated',   //profile
            failureRedirect : '/'
        }));

    // route for logging out
    router.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });



// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}



module.exports = router









