/*
 Service discovery using Zeroconf/Bonjour/Avahi

 Note on Linux requires:
   sudo apt-get install libavahi-compat-libdnssd-dev
 On other platforms Apple's mDNSResponder is recommended. See https://github.com/agnat/node_mdns
*/

var MODE = 'dev';   // or 'prod'

// Import core library modules

// Import dependencies
var mdns = require('mdns');

// Import App modules
var logger = require('./logger');
// Load settings
var settings;
if (MODE === 'prod') {
  settings = require('./settings.json');
} else {
  settings = require('./settings-dev.json');
}

// Current date/time
var d = new Date();
var now = d.toDateString() + ' ' + d.toTimeString();

var text_record = {
  url     : settings.api.url,
  version : settings.api.version,
  json    : false,
  text    : true,
  author  : "Andrew Cuddon",
  started : now
};

var options = {
    name : settings.description,
    txtRecord : text_record
};

var port = settings.httpserver.port;
var service_type = mdns.tcp('http');     // http service over tcp (_http._tcp)

function createAdvertisement(servicetype, port, options) {
  try {
    var adv = mdns.createAdvertisement(servicetype, port, options);
    adv.on('error', handleError);
    adv.start();
  } catch (error) {
    handleError(error);
  }
}

function handleError(error) {
  /*
      Automatically restart the advertisement when an unknown error occurs.
      This may occur when the system's mdns daemon is currently down.
      All other errors, like bad parameters, ctrl-c. are treated as fatal.
  */
  if (error.errorCode === mdns.kDNSServiceErr_Unknown) {
    logger.warn(error);
    setTimeout(createAdvertisement(service_type, port, options), 10000);
  } else {
    throw error;
  }
}

function advertise() {
  createAdvertisement(service_type, port, options);
}

// Expose key functions and variables to other modules
exports.advertise = advertise;
exports.createAdvertisement = createAdvertisement;


// Test
//createAdvertisement(service_type, port, options);
// or
//advertise();
