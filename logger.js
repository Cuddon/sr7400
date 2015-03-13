/*
  Logging

  Optionally log to a file and/or MongoDB
*/

// Winston logging library
var winston = require('winston');

// Settings
var settings = require('./settings');

// Create a new logger instance
var logger = new (winston.Logger)({
  transports: [
    new winston.transports.Console({
      colorize: true
    })
  ]
});

if (settings.logging.logtofile) {
  logger.add(winston.transports.File, {
    name: "request-log",
    filename: settings.logging.requestlog,
    timestamp: true,
    json: true,
    maxsize: 1000000,
    maxFiles: 1
  });
  logger.add(winston.transports.File, {
    name: "error-log",
    filename: settings.logging.errorlog,
    level: 'error',
    timestamp: true,
    json: true,
    maxsize: settings.logging.maxfilesize,
    maxFiles: 1,
    handleExceptions: settings.logging.handleExceptions
  });
};

if (settings.logging.logtomongo) {
  require('winston-mongo').Mongo;
  // Create MongoDB instance and cap size at 100mb
  new winston.transports.MongoDB({
    host: settings.logging.mongoip,
    username : settings.logging.mongousername,
    password : settings.logging.mongopassword,
    db: settings.name,
    collection: 'log',
    level: 'info',
    capped : true,
    cappedsize : settings.logging.maxdbsize
  });
}

// Expose to other modules. Use like this:
//  var logger = require('./logger');
//  logger.info("Hello world, Winston logger")
module.exports = logger;

/*
// Tests
logger.info('Hello distributed logs. This is FYI only');
logger.warn('This is a warning');
logger.error('This is an error with some data', {data: 'Some data'});

// Find items logged between today and yesterday.
var options = {
    from: new Date - 24 * 60 * 60 * 1000,
    until: new Date,
    limit: 10,
    start: 0
  };

// Wait a bit for the above to be saved and then query the logs
console.log("\nQuery the logger...");
setTimeout(function() {
  logger.query(options, function (err, results) {
    if (err) {
      throw err;
    }
    console.log(results);
  });
}, 1000)

*/
