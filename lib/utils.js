var geolib = require('geolib');
var endpoints = require('./endpoints');
var request = require('request');
var parser = require('xml2js').Parser();
var async = require('async');
var mongoUtils = require('./mongoUtils');
module.exports = {
    getDistance: function(from, to) {
        return geolib.convertUnit('km', geolib.getDistance(from, to), 1);
    },

    getStopNextDepartures: function(agencyTag, routeTag, stopId, callback) {
        endpoints.getStopDepartures.qs.a = agencyTag;
        endpoints.getStopDepartures.qs.s = stopId;
        endpoints.getStopDepartures.qs.r = routeTag;

        request(endpoints.getStopDepartures, function(err, response, body) {
            if (err || response.statusCode !== 200) {
                return callback(err);
            }

            parser.parseString(body, function(err, stopNextDepartures) {
                if (err) {
                    return callback(err);
                }

                callback(null, formatDepartures(stopNextDepartures));
            });
        });
    },

    getClosestStops: function(data, limit, callback) {
        var self = this;
        mongoUtils.findNear('stops', 'loc', data.longitude, data.latitude)
            .limit(limit)
            .toArray(function(err, stopsList) {
                if (err) {
                    return callback(err);
                }

                self.getStopsDepartures(data, stopsList, callback);
            });
    },
    getStopsDepartures: function(coords, stopsList, callback) {
        var self = this;
        async.each(stopsList, function(stop, fn) {
            stop.distance = self.getDistance({
                latitude: stop.loc.coordinates[1],
                longitude: stop.loc.coordinates[0]
            }, coords);

            self.getStopNextDepartures(stop.agency, stop.route, stop.tag, function(err, departures) {
                if (err) {
                    return fn(err || new Error('No predictions where found for stopId:' + stop.stopId));
                }

                if (!departures) {
                    return fn();
                }

                stop.departures = departures;
                fn();
            });
        }, function(err) {
            if (err) {
                return callback(err);
            }

            callback(null, stopsList);
        });
    }
};

function formatDepartures(obj) {
    if (!obj.body.predictions || !obj.body.predictions[0] || !obj.body.predictions[0].direction) {
        return [{
            error: 'No predictions',
            direction: obj.body.predictions[0].$.dirTitleBecauseNoPredictions
        }];
    }

    var direction = obj.body.predictions[0].direction.reduce(function(e) {
        return e;
    });

    return direction.prediction.slice(0, 2).map(function(elem) {
        elem.$.direction = direction.$.title;
        return elem.$;
    });
}