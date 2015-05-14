var express = require('express');
var router = express.Router();

var mongoUtils = require('../lib/mongoUtils.js');
var db = mongoUtils.getDB();

router.get('/stop', function(req, res, next) {
    var filter = {};
    var cursor = db.collection('stops').find(filter).stream({
        transform: function(doc) {
            return JSON.stringify(doc);
        }
    });

    filter[req.query.stopId && 'stopId'] = req.query.stopId;
    filter[req.query.route && 'route'] = req.query.route;
    filter[req.query.agency && 'agency'] = req.query.agency;

    res.set('Content-Type', 'application/json');

    cursorToJSONTransform(cursor, res);
});

router.get('/closest', function(req, res, next) {
    var err;
    var limit = +req.query.limit || 1;
    if (!Number(req.query.lat) || !Number(req.query.lon)) {
        err = new Error('Invalid latitude or longitude.');
        err.status = 400;
        return next(err);
    }

    var cursor = mongoUtils.findNear('stops', 'loc', +req.query.lon, +req.query.lat)
        .limit(limit)
        .stream({
            transform: function(doc) {
                return JSON.stringify(doc);
            }
        });

    cursorToJSONTransform(cursor, res);
});

function cursorToJSONTransform(cursor, target) {
    var first = true;
    target.write('[');
    cursor.on('data', function(data) {
        var prefix = first ? '' : ',';
        target.write(prefix + data);
        first = false;
    });
    cursor.on('end', function() {
        target.end(']');
    });
}

// function findNear(collection, property, lon, lat) {
//     var filter = {};
//     filter[property] = {
//             $near: {
//                 $geometry: {
//                     type: 'Point',
//                     coordinates: [lon, lat]
//                 }
//             }
//         };
//     return collection.find(filter);
// }

module.exports = router;