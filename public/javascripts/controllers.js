let app = angular.module('aitraveller', ['ngRoute', 'ngCookies'])
// Main controller for the entire app
app.controller('chat', function($scope, $http, $timeout, $window) {
    $scope.languages = ["English", "French" , "Chinese"];    // all the different language that the app can supports for translation
    $scope.selectedName = "English";    // Variable linked to the frontend that allows the user to select the language he wants the conversational ai to answer with.
    $scope.languageKey = {"French": "fr", "English": "en", "Chinese":"zh-CN" } // a dictionary having the language selected as key and the keyword recognized by google translate as value
    $scope.text = "";               // Text entered by the user to interact with the chabot
    $scope.ENGtext = "THERE";          // Translated version of the text into english
    $scope.typeOfPlace = ""            // Variable to record the type of places ( restaurants, airport, night clubs) that the user wants to visit which will be found in the Json Object returned by the API.AI
    $scope.mealType = ""                //Variable to record the type of meals ( breakfast, dinner, lunch) that the user wants to eat which will be found in the Json Object returned by the API.AI
    $scope.city= ""                      // City where the user is travelling to
    $scope.latitude = 0                     // latitude of the city returned by the geocoder api
    $scope.longitude = 0                    // longitude of the city returned by the geocoder api
        
    $scope.logout = function() {           // Logging out of the app
        let openUrl = '/auth/logout/'
        window.location.replace(openUrl)
    }   
    $scope.reloading = function() {         // Reloading the app in case something goes wrong or also to reset the google Map
         $window.location.reload()
    }
    $scope.insert = function() {  // Main function of the app which does all the work in background, getting the user text, translating to english, getting the chatbot response in english, saving both text in the database
                                 // And quering the database, getting the entire conversation and then translating to the language of choice and then displaying on the page
        const translateHuman = {              // Translating to English the text input of the user by calling Google translate API
            method: 'post',
            url: 'http://localhost:3000/smart/translate',
            data: {
                language: "en",
                message: $scope.text
            }
        }

   $http(translateHuman)
         .then(function(response){                   // Getting the english translated version of the user text and saving to the mongo database
               $scope.ENGtext = response.data          // as explained above ENGtext the english version of the user input
               const requestDb = {
                    method: 'post',
                    url: 'http://localhost:3000/api/saving',
                    data: {
                        name: "traveller",
                        message: $scope.ENGtext    //ENGtext
                    }
                }
                $http(requestDb)                    // Calling API.AI with the english translation
                    .then(function(response) {
                        $scope.travellers = response.data
                        const requestBot = {
                            method: 'post',
                            url: 'http://localhost:3000/smart/chatbot',
                            data: {
                                name: "traveller",
                                message: $scope.ENGtext
                            }
                        }
                $http(requestBot)
                      .then(function (response) {                 // The api returns a big json object with all the information related to the query detecting the places, cities and all the information necessary to use Google Places API
                                if(response.data.result.parameters['TypeOfPlaces'] != null )
                                    $scope.typeOfPlace = response.data.result.parameters['TypeOfPlaces'];           //typeOfPlace gets assigned if the user mentioned a place in his query
                                else
                                    $scope.typeOfPlace = ""

                                if(response.data.result.parameters['MealType'] != null)
                                    $scope.mealType = response.data.result.parameters['MealType'];              //mealType gets assigned if the user mentioned type of meal in his query
                                else
                                    $scope.mealType = ""

                                if(response.data.result.parameters['geo-city'] !=  null)
                                    $scope.city= response.data.result.parameters['geo-city'][0];            //city gets assigned if the user mentioned the city he is in in his query
                                else
                                    $scope.city= ""

                                const geocoding = {                                                         // calls the geocoder api with the city variable given by api.ai, geocoder returns the coordinates of the city
                                    method: 'post',
                                    url: 'http://localhost:3000/smart/geocoding',
                                    data: {
                                        city: $scope.city
                                    }
                                }

                                $http(geocoding)
                                    .then(function(response){
                                        $scope.latitude = response.data.lat                         // $scope.latitude and $scope.longitude get assigned based on the response of the geocoder api
                                        $scope.longitude = response.data.lng

                                    })
                            
                                const botDb = {                             // saves only the speech response of the chatbot located in a json object returned by API.AI
                                    method: 'post',
                                    url: 'http://localhost:3000/api/saving',
                                    data: {
                                        name: "chatbot",
                                        message: response.data.result.fulfillment.speech            // speech returned saved in the database
                                    }
                                }


                                $http(botDb)
                                    .then(function(response) {
                                        $http.get('/api/db')                // retrieving all the dialog from the database and saving it in a json object rawRecords
                                            .then(function(response) {
                                                $scope.rawRecords = response.data
                                               $scope.rawRecords.forEach(function(element){             //Looping through each individual documents returned by the database
                                                    const translateHuman = {
                                                        method: 'post',
                                                        url: 'http://localhost:3000/smart/translate/again',
                                                        data: {
                                                            language: $scope.languageKey[$scope.selectedName],     // converting each text in the desire language
                                                            message: element["message"]
                                                        }
                                                    }
                                                    $http(translateHuman)
                                                        .then(function(response){
                                                           //$scope.records.push(response.data)
                                                            element.translate = response.data           // saving the translation in the same json object it was retrieved on
                                                        })
                                                })
                                            })
                                    })
                          })
                    })
            })
    }

})
app.controller('facebook', function($scope, $http) {        // controller of the facebook logging
    $scope.facebookLog = function() {
           let openUrl = '/auth/facebook/'
           window.location.replace(openUrl)
     }
})
app.controller('MapCtrl', function ($scope) {            // controller display google maps on the frontend
   $scope.location= {lat: $scope.latitude, lng: $scope.longitude};  // coordinate of the place to query
   let mapOptions = {
        center: $scope.location ,       // attributes to create a new map
        zoom: 15
    }
    $scope.map = new google.maps.Map(document.getElementById('map'), mapOptions);       // new map created
    $scope.markers = [];
    let infoWindow = new google.maps.InfoWindow();          // new window
    let service = new google.maps.places.PlacesService($scope.map);
    service.nearbySearch({                                  // calls the nearbySearch function will will the places of choice near your location
            location: $scope.location,
            radius: 500,
            type: [$scope.typeOfPlace]
     }, callback);

    function callback(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {            // Function to create markers for every place returned by the function nearbySearch
            for (let i = 0; i < results.length; i++) {
                createMarker(results[i]);
            }
        }
    }

    let createMarker = function (info){                             // Function to create the different markers
        let marker = new google.maps.Marker({
            map: $scope.map,
            position: info.geometry.location
            //title: info.city
        });
        marker.content = '<div class="infoWindowContent">' + info.desc + '</div>';
        google.maps.event.addListener(marker, 'click', function(){
            infoWindow.setContent('<h2>' + marker.title + '</h2>' + marker.content);
            infoWindow.open($scope.map, marker);
        });
        $scope.markers.push(marker);                    // stores all the different in an array markers
    }
    
    $scope.openInfoWindow = function(e, selectedMarker){
        e.preventDefault();
        google.maps.event.trigger(selectedMarker, 'click');         // display the google Map and the markers with it
    }
})

