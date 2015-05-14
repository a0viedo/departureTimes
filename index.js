'use strict';
var MongoClient = require('mongodb').MongoClient;
var logger = require('./logger');

var insertStops = require('./lib/insertStops');

var url = 'mongodb://localhost:27017/departureTimesTest';

MongoClient.connect(url, function(err, db) {
    if (err) {
        logger.error(err);
        throw err;
    }
    insertStops(db, function(err) {
        //ready to serve everything;
        if (err) {
            logger.error(err);
            db.close();
            process.exit(1);
        }
        logger.info('All the stop data was inserted correctly.');

    });
});

//var agenciesFinished = 0;

// Connection URL 

// // Use connect method to connect to the Server 
// MongoClient.connect(url, function(err, db) {
//     console.log("Connected correctly to server");

//     fs.readFile(__dirname + '/muniN.xml', function(err, data) {
//         parser.parseString(data, function(err, result) {
//             console.dir(result.body.route[0].stop.forEach(function(elem) {
//                 console.log(elem.$);
//                 var stop = elem.$;

//                 stop.loc = {
//                     type: "Point",
//                     coordinates: [+stop.lon, +stop.lat]
//                 };
//                 db.collection('stops').insert(stop);
//             }));
//             db.close();
//         });
//     });

// });


// for each agency, for each route and for each stop
// insert a document in stops collection with GeoJson formatted data