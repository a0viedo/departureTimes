module.exports = {
    getAgencies: {
        url: 'http://webservices.nextbus.com/service/publicXMLFeed',
        qs: {
            command: 'agencyList'
        },
        method: 'GET'
    },

    getAgencyRoutes: {
        url: 'http://webservices.nextbus.com/service/publicXMLFeed',
        qs: {
            command: 'routeList'
        },
        method: 'GET'
    },
    getRouteConfig: {
        url: 'http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=sf-muni&r=N',
        qs: {
            command: 'routeConfig'
        },
        method: 'GET'
    }
};
