# departureTimes
departureTimes is a proof of concept for real-time interaction, in this particular case with the departure times of transports in the area of San Francisco.
The application fetches data using the [NextBus API](http://www.nextbus.com/xmlFeedDocs/NextBusXMLFeed.pdf), using its geolocation information for stops and next departures.

It uses MongoDB, Express.js and Socket.IO in the backend.