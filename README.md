# departureTimes
departureTimes is a proof of concept for real-time interaction, in this particular case with the departure times of transports in the area of San Francisco.
The application fetches the data using the [NextBus API](http://www.nextbus.com/xmlFeedDocs/NextBusXMLFeed.pdf) and parses its geolocation information for stops and next departures.

The backend is built on Express.js, Socket.IO and MongoDB.
The frontend uses Bootstrap and the client for Socket.IO.

![image](http://imgur.com/D2GLE0c.png)
## NextBus API
It's important to say that the API exposes endpoints in XML format, so for each request to the API a conversion from XML to JSON is being made.
Also, have in mind that the stops records are multiplied by 2, once representing the inbound direction and another one for outbound transit.

## Geolocation queries

## Routes



## TODO
- Geolocation queries in-memory would be *a lot* faster
- LRU cache layer in front of the querying layer could improve performance significantly.
- Add build system for resource concatenation (only if we are thinking in terms of HTTP 1.1 and not RFC 7540) and minification.
- Add feature for the client to update its geolocation.
- I couldn't get the fetching of the stops data working in OpenShift. I'm not sure why I keep getting `You have requested too much data in the last 20 seconds`. Limit is 4000000 bytes. even after applying some throttling, locally it works just fine.
