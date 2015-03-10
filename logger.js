/*
  Logging
*/

// Winston logging library
var winston = require('winston');
//require('winston-mongo').Mongo;

// Settings
var requestlog = ""./request.log";
var errorlog = "./error.log";
var exceptionsfile = "./exceptions.log";

// Set up logger and save locations
var logger = new (winston.Logger)({
  transports: [
    new winston.transports.Console({
      colorize: true
    }),
    
    new winston.transports.File({
      name: "request-log-file",
      filename: requestlog,
      timestamp: true,
      json: true,
      maxsize: 1000000,
      maxFiles: 1
    },
    
    new winston.transports.File({
      name: "error-log-file",
      filename: errorlog,
      level: 'error',
      timestamp: true,
      json: true,
      maxsize: 1000000,
      maxFiles: 1,
      handleExceptions: true
    })
    //new winston.transports.MongoDB({ db: 'db', level: 'info'})
  ]
});

function getlogs(level) {
  var levels = ['error', 'warn', 'info'];

  var logs = [];
  
  return logs;
}


// Tests
logger.info('Hello distributed logs. This is FYI only');
logger.warn('This is a warning');
logger.error('This is an error with some data', , {some: 'data''});


// Find items logged between today and yesterday.
var options = {
    from: new Date - 24 * 60 * 60 * 1000,
    until: new Date,
    limit: 10,
    start: 0,
    order: 'desc',
    fields: ['message']
  };

  winston.query(options, function (err, results) {
    if (err) {
      throw err;
    }
    console.log(results);
  });
