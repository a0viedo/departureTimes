'use strict';
var request = require('request');
var parser = require('xml2js').Parser();
var endpoints = require('./endpoints');
var async = require('async');
var logger = require('./logger');

var agenciesLeft;
module.exports = function(db, callback) {
    function getAgencyRoutes(agencies, agency, cb) {
        function parseRouteConfig(route, routeConfig, routeConfigCallback) {
            function eachStop(stop, stopCb) {
                stop = stop.$;

                stop.loc = {
                    type: 'Point',
                    coordinates: [+stop.lon, +stop.lat]
                };
                stop.agency = agency.$.tag;
                stop.route = route.$.tag;
                delete stop.lon;
                delete stop.lat;
                db.collection('stops').insert(stop, function(err) {
                    if (err) {
                        return logger.error(err);
                    }
                    stopCb(err);
                });
            }
            if (!routeConfig.body.route) {
                //logger.error('empty return');
                //logger.error(routeConfig.body.route);
                console.log(routeConfig);
                return;
            }
            async.each(routeConfig.body.route[0].stop, eachStop, function() {
                routeConfigCallback();
            });
        }

        function getAgencyRoutesResponse(err, response, body) {
            if (err || response.statusCode !== 200) {
                logger.error(err);
                return cb(err);
            }
            parser.parseString(body, parseAgencyRoutes);
        }

        function parseAgencyRoutes(err, routes) {
            if (err) {
                logger.error(err);
                return cb(err);
            }

            function eachRoute(route, routeCallback) {
                endpoints.getRouteConfig.qs.a = agency.$.tag;
                endpoints.getRouteConfig.qs.r = route.$.tag;
                request(endpoints.getRouteConfig, function(err, response, body) {
                    if (err || response.statusCode !== 200) {
                        console.log(err);
                        return cb(err);
                    }
                    parser.parseString(body, function(err, result) {
                        if (err) {
                            logger.error(err);
                            return routeCallback(err);
                        }
                        parseRouteConfig(route, result, routeCallback);
                    });
                });
            }

            async.each(routes.body.route, eachRoute, function(err) {
                if (err) {
                    return cb(err);
                }
                cb();
                agenciesLeft--;
                logger.info('Agencies left:' + agenciesLeft);
            });
        }
        endpoints.getAgencyRoutes.qs.a = agency.$.tag;
        request(endpoints.getAgencyRoutes, getAgencyRoutesResponse);
    }

    function parseAgenciesResult(err, agencies) {
        if (err) {
            logger.error(err);
            return callback(err);
        }

        agenciesLeft = agencies.body.agency.length;
        logger.info('There\'s a total of agencies:' + agencies.body.agency.length);

        function agenciesEach(agency, cb) {
            getAgencyRoutes(agencies, agency, cb);
        }
        async.each(agencies.body.agency, agenciesEach, function(err) {
            if (err) {
                logger.error(err);
                return callback(err);
            }
            logger.info('Finished inserting stop data from all agencies.');
            callback();
        });
    }
    request(endpoints.getAgencies, function(err, response, body) {
        if (err || response.statusCode !== 200) {
            logger.error(err);
            return callback(err);
        }
        parser.parseString(body, parseAgenciesResult);
    });
};