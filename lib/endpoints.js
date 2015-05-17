var baseURL = 'http://webservices.nextbus.com/service/publicXMLFeed';

module.exports = {
    getAgencies: {
        url: baseURL,
        qs: {
            command: 'agencyList'
        },
        method: 'GET'
    },

    getAgencyRoutes: {
        url: baseURL,
        qs: {
            command: 'routeList'
        },
        method: 'GET'
    },
    getRouteConfig: {
        url: baseURL,
        qs: {
            command: 'routeConfig'
        },
        method: 'GET'
    },

    getStopDepartures: {
        url: baseURL,
        qs: {
            command: 'predictions',
            userShortTitle: 'true'
        },
        method: 'GET'
    }
};
