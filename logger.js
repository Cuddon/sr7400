/*
  Logging
*/

// Winston logging library
var winston = require('winston');
require('winston-mongo').Mongo;

// Settings
var logfile = './request.log';
var exceptionsfile = './exceptions.log';

// Set up logger and save locations
var logger = new (winston.Logger)({
  transports: [
    new winston.transports.Console()
    new winston.transports.File({filename: logfile})
    //new winston.transports.MongoDB({ db: 'db', level: 'info'})
  ]
  exceptionHandlers: [
    new winston.transports.File({ filename: exceptionsfile })
  ]
});

function getlogs(level) {
  var levels = ['error', 'warn', 'info'];

  var logs = [];
  
  return logs;
}
