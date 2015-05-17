var express = require('express');
var path = require('path');
var httpLogger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var logger = require('./lib/logger.js');
var utils = require('./lib/utils.js');

var insertStops = require('./lib/insertStops.js');

var app;
var mongoUtils = require('./lib/mongoUtils.js');

function startApp() {
    var routes = require('./routes/index');
    var stops = require('./routes/stops');

    app = express();

    var io = require('socket.io')();
    app.io = io;

    io.on('connection', function(socket) {
        logger.info('Client connected.');
        socket.on('getClosestStops', function(data) {
            if (!data.longitude || !data.latitude) {
                return logger.info('[websockets] Received invalid geolocation data.', data);
            }

            logger.info('[websocket] Received \'getClosestStops\' event.');

            utils.getClosestStops(data, data.limit || 5, function(err, stopsList) {
                if (err) {
                    logger.error(err);
                    err.stack = null;
                    socket.emit(err);
                    return;
                }

                socket.stopsList = stopsList;
                socket.emit('closestStops', stopsList);

                setInterval(function() {
                    utils.getStopsDepartures(data, socket.stopsList,
                        function(err, stopsList) {
                            if (err) {
                                logger.error(err);
                                err.stack = null;
                                socket.emit('error', err);
                                return;
                            }

                            socket.emit('closestStopsUpdate', stopsList);
                        });
                }, 10000);
            });
        });

        socket.on('error', function(err) {
            logger.error(err);
        });
    });

    app.engine('.hbs', exphbs({
        defaultLayout: 'main',
        extname: '.hbs'
    }));
    app.set('view engine', '.hbs');

    app.use(httpLogger('dev'));
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
                error: err,
                statusCode: err.status
            });
        });
    }

    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {},
            statusCode: err.status
        });
    });
}

module.exports = {
    initialize: function(callback) {
        require('./lib/mongoUtils.js').connectToServer(function(err, db) {
            if (err) {
                logger.error(err);
                return process.exit(1);
            }

            insertStops(db, function(err) {
                if (err) {
                    logger.error(err);
                    return process.exit(1);
                }

                startApp();
                callback(null, app);
            });
        });
    }
};