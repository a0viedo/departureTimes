var MongoClient = require('mongodb').MongoClient;
var logger = require('./logger.js');

var _db;


var mongoURL = (process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://localhost:27017/') + 'departureTimes';
module.exports = {
    connectToServer: function(callback) {
        if (_db) {
            return process.nextTick(callback);
        }
        MongoClient.connect(mongoURL, function(err, db) {
                _db = db;
                logger.info('Connected to ' + mongoURL);
                return callback(err, db);
            });
    },

    getDB: function() {
        if (!_db) {
            throw new Error('not initialized.');
        }
        return _db;
    },
    findNear: function(col, property, lon, lat) {
        var filter = {};
        if (!_db) {
            throw new Error('not initialized.');
        }

        filter[property] = {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [lon, lat]
                }
            }
        };
        return _db.collection(col).find(filter);
    }
};