var geolib = require('geolib');
module.exports = {
    getDistance: function(from, to) {
        return geolib.converUnit('km', geolib.getDistance(from, to), 1);
    }
};