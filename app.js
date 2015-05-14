var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var utils = require('./lib/utils.js');

var app;
var mongoUtils = require('./lib/mongoUtils.js');
var db;

function startApp() {
    var routes = require('./routes/index');
    var stops = require('./routes/stops');

    app = express();
    db = mongoUtils.getDB();

    var server = require('http').createServer(app);
    var io = require('socket.io')(server);

    io.on('connection', function(socket) {
        socket.on('getClosestStops', function(data) {
            if (!data.geo) {

            }
            var stopsList = mongoUtils.findNear('stops', 'loc', data.geo.lon, data.geo.lat)
                .toArray();
            stopsList.forEach(function(stop) {
                stop.distance = utils.getDistance({
                    latitude: stop.lat,
                    longitude: stop.lon
                }, {
                    latitude: data.geo.lat,
                    longitude: data.geo.lon
                });
            });
            socket.emit('closestStops', stopsList);
        });
    });

    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');

    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: false
    }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    app.use('/', routes);
    app.use('/stops', stops);

    app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // error handlers

    if (app.get('env') === 'development') {
        app.use(function(err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: err
            });
        });
    }

    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });
}

module.exports = {
    initialize: function(callback) {
        require('./lib/mongoUtils.js').connectToServer(function(err) {
            if (err) {
                logger.error(err);
                return process.exit(1);
            }
            startApp();
            callback(null, app);
        });
    }
};