const express = require('express')
const router = express.Router()

//Helper for authorization
//const authorized = require('./authCheck')

const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost/artificialTest')

const Schema = mongoose.Schema
const personSchema = new Schema({
    name      : String,
    message      : String
})
const dialog = mongoose.model('dialog', personSchema)


// POST Create a new user (only available to logged-in users)
router.post('/saving',function (req, res, next) {
    aDialog = new dialog(
        {
            name : req.body.name,
            message : req.body.message
        }
    )
    aDialog.save(function (err) {
        if (err) {
            res.send(err)
        }
        //send back the new person
        else {
            res.send(aDialog)
        }
    })
})

//GET Fetch all users
router.get('/db', function (req, res, next) {
    dialog.find({}, function (err, results) {
        res.json(results)
    })

})

/*
 //GET Fetch single user, match /users/db/Frank
 router.get('/db/:_id', function (req, res, next) {
 people.find({_id: req.param('_id')}, function (err, results) {
 res.json(results);
 });
 });
 */

router.get('/db/:name', function (req, res, next) {
    findByName(req.params.name)
        .then(function (status) {
            res.json(status)
        })
        .catch(function (status) {
            res.json(status)

        })
})

//PUT Update the specified user's name
router.put('/db/:_id', function (req, res, next) {
    dialog.findByIdAndUpdate(req.params._id, req.body, {'upsert': 'true'}, function (err, result) {
        if (err) {
            res.json({message: 'Error updating'})
        }
        else {
            console.log('updated')
            res.json({message: 'success'})
        }

    })

})


//DELETE Delete the specified user
router.delete('/db/:_id', function (req, res, next) {
    dialog.findByIdAndRemove(req.params._id, function (err, result) {
        if (err) {
            res.json({message: 'Error deleting'})
        }
        else {
            res.json({message: 'success'})
        }
    })
})


let findByName = function (checkName) {
    return new Promise(function (resolve, reject) {
        dialog.find({name: checkName}, function (err, results) {
            console.log(results, results.length)
            if (results.length > 0) {
                resolve({found: results})
            }
            else {
                reject({found: false})
            }
//    return ( (results.length  > 0) ? results : false)
        })
    })
}

module.exports = router

//TODO Route to log out (req.logout())