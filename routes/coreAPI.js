/**
 * Created by paulngouchet on 6/23/17.
 */

let LocalStrategy    = require('passport-local').Strategy;
let FacebookStrategy = require('passport-facebook').Strategy;
const passport = require('passport')
const apiConfig = require('../config/apiCredentials')
const express = require('express')
const router = express.Router()
// grab the packages we need
let apiai = require('apiai');
let api = apiai(apiConfig.chatbotkey);
let geocoder = require('geocoder');

router.post('/geocoding', function(req, res, next){
    // Geocoding
    let city = req.body.city
    
    geocoder.geocode(city, function ( err, data ) {
        res.send(data.results[0].geometry.location)  // prints a Json Object of latitude and longitude
    });
})
// routes will go here
// Imports the Google Cloud client library
const Translate = require('@google-cloud/translate');
// Your Google Cloud Platform project ID
const projectId = apiConfig.googleProjectId;
// Instantiates a client
const translateClient = Translate({
    projectId: projectId,
    keyFilename: apiConfig.keyFilename
});

router.post('/translate', function (req, res, next) {
    let text = req.body.message
    let target = 'en'
    // Translates some text into English
    translateClient.translate(text, target)
        .then(function(results) {
            const translation = results[0];
            console.log(text);
            console.log(translation);
        res.send(translation )
    })
    .catch(function(err){
        console.error('ERROR:', err);
        res.send(err)
    });
})

router.post('/translate/again', function (req, res, next) {
    let text = req.body.message
    let target = req.body.language
    // Translates some text into the targeted language
    translateClient.translate(text, target)
        .then(function(results){
            const translation = results[0];
            console.log(text);
            console.log(translation);
            res.send(translation )
        })
        .catch(function(err){
            console.error('ERROR:', err);
            res.send(err)
        });
})

router.post('/chatbot', function (req, res, next) {
    let request = api.textRequest(req.body.message, {                // send a new request to API.AI with a new a query and it is sending back a json object of response having all the different data
        sessionId: apiConfig.chatbotSession                                 // necessary to uniquely identify it.
    });

    request.on('response', function (response) {
        console.log(response);            //Extracting only the entire json object will be parsed afterwards
       // res.send(response.result.fulfillment.speech)
        res.send(response)
    });

    request.on('error', function (error) {
        console.log(error);
        res.send(error);
    });

    request.end();
})

module.exports = router ;

