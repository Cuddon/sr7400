/*
 URL controllers
*/

// Import core library modules
var fs = require("fs");

// App modules
var help = require('./help');           // API help
var logger = require('./logger');
var settings = require('./settings/settings');

// SR7400 specific modules
var sr7400 = require('./device/sr7400');       // SR7400 driver
var macro = require('./device/macro');         // Macro module
var macros = require('./device/macros.json');
var volume = require('./device/volume');       // Volume module for setting volume to a specific value
var mute = require('./device/mute');           // Mute module for toggling audio mute
var mappings = require('./device/mappings.json');       // e.g. DSS -> TBOX

// Valid commands
var valid_command_mappings = Object.keys(mappings.command_mappings);
var valid_status_mappings = Object.keys(mappings.status_mappings);
var valid_macros = Object.keys(macros);


function default_controller(request, response, args){
  var err = new Error("Invalid request. See /api/config/help or /api/config/protocol for help: " + request.url);
  error_response(500, err, response);
}

function set_volume_controller(request, response, args){
  // Set to specific volume command (not supported by the receiver so use the workaround)
  var requested_volume = parseInt(args[1], 10);

  volume.setTo(requested_volume)       // Promise
    .then(function(result){
      // Volume command completed OK
      response.writeHead(200, {'Content-Type': 'text/plain'});
      response.write("ACK");
      response.end();
      // Save the result to the log
      logger.info('**** SR7400 Command successful ****', {'request' : request.url, 'result' : result});
    })
    .fail(function(err){
      // Error processing the volume command
      response.writeHead(200, {'Content-Type': 'text/plain'});
      response.write(err);
      response.end();
      // Save the result to the log
      logger.warn('**** SR7400 Command unsuccessful ****', {'request' : request.url, 'result' : err});
    })
    .done();
}

function toggle_mute_controller(request, response, args){
  // Toggle Audio Mute
  mute.toggle()       // Promise
    .then(function(result){
      // Volume command completed OK
      response.writeHead(200, {'Content-Type': 'text/plain'});
      response.write("ACK");
      response.end();
      // Save the result to the log
      logger.info('++ SR7400 Command successful ++', {'request' : request.url, 'result' : result});
    })
    .fail(function(err){
      // Error processing the volume command
      response.writeHead(200, {'Content-Type': 'text/plain'});
      response.write(err);
      response.end();
      // Save the result to the log
      logger.warn('-- SR7400 Command unsuccessful --', {'request' : request.url, 'result' : err});
    })
    .done();
}

function macro_controller(request, response, args){
  // On server/pre-defined macro
  var requested_macro = args[1].toUpperCase();  // interim until we make all commands lower case

  if (valid_macros.indexOf(requested_macro) >= 0) {
    // Valid macro so run it (Note: macro is a Promise)
    var command_list = macros[requested_macro].commands;
    macro.run(command_list)
      .then(function(result){
        // All macro commands completed OK
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.write("ACK");
        response.end();
        // Save the result to the log
        logger.info('++ SR7400 Command successful ++', {'request' : request.url, 'result' : result});
      })
      .fail(function(err){
        // One or more macros commands had an error
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.write(err);
        response.end();
        // Save the result to the log
        logger.warn('-- SR7400 Command unsuccessful --' , {'request' : request.url, 'result' : err} );
      })
      .done();
  } else {
    // The macro does not exist in the protocol
    var err = "Error - macro not found in the SR7400 protocol: " + request.url;
    error_response(500, err, response);
    // Save the result to the log
    logger.warn('-- SR7400 Command unsuccessful --' , {'request' : request.url, 'result' : err} );
  }

}

function command_controller(request, response, args){
  /*
   Standard SR7400/SR8400 command (in the protocol)
   */
  var requested_command = args[1].toUpperCase();  // interim until we make all commands lower case

  // Send the command to the SR7400 and wait for a response
  // Apply any command mappings e.g. SELECT_INPUT_TBOX -> SELECT_INPUT_DSS
  if (valid_command_mappings.indexOf(requested_command) >= 0) {
    // A mapping exists so apply it
    requested_command = mappings.command_mappings[requested_command];
  }

  // Now send the command to the SR7400 (Uses promises)
  sr7400.p_send(requested_command)
    .then(function(result){
      // Valid response from the SR7400
      // Ensure it is a sting (esp for volume levels etc)
      result = result.toString();

      // Apply any mappings to the response // e.g. DSS -> TBOX
      if (valid_status_mappings.indexOf(result) >= 0) {
        result = mappings.status_mappings[result];
      }
      response.writeHead(200, {'Content-Type': 'text/plain'});
      response.write(result);
      response.end();

      // Save the result to the log
      logger.info('++ SR7400 Command successful ++', {'request' : request.url, 'result' : result});
    })
    .fail(function(err){
      error_response(500, err, response);
      // Save the result to the log
      logger.warn('-- SR7400 Command unsuccessful --' , {'request' : request.url, 'result' : err} );
    })
    .done();
}

function config_controller(request, response, args) {
  // Request to provide configuration information (assume json response)
  var configitem = {};

  switch(args[1].toLowerCase()) {
    case 'settings':
      configitem = settings;
      break;
    case 'protocol':
      configitem = sr7400.protocol;
      break;
    case 'macros':
      configitem = macros;
      break;
    case 'mappings':
      configitem = mappings;
      break;
    case 'help':
      configitem = help;
      break;
    default:
      configitem = {"error" : "Unknown configuration item requested", "request" : request.url};
      logger.warn(configitem.error , {'request' : request.url} );
  }
  response.writeHead(200, {'Content-Type': 'application/json'});
  response.write(JSON.stringify(configitem));
  response.end();
  logger.info({request : request.url, response : 'ok'});
}

function logs_controller(request, response, args) {
  // Request to provide configuration information (assume json response)
  var item = args[1].toLowerCase();
  var log_data;

  if (['request','requests','error','errors'].indexOf(item) >= 0) {
    item = item.replace(/s$/, "");       // remove trailing 's' if it exists
    fs.readFile('./log/'+item+'.log', 'utf8', function (err, data) {
      if (err) {
        error_response(500, err, response);
      } else {
        // Convert data to an array of objects
        data = data.toString().replace(/\r?\n/g, ', ');   // replace /n with a comma
        data = data.replace(/,\s*$/, "");       // remove trailing comma
        data = '[' + data + ']';        // Add brackets to make it an array of objects
        try {
          log_data = JSON.parse(data);
          response.writeHead(200, {'Content-Type': 'application/json'});
          response.write(JSON.stringify(log_data));
          response.end();
          logger.info({request : request.url, response : 'ok'});
        } catch(err){
          error_response(500, err, response);
        }
      }
    });
  } else {
    log_data = {"error" : "Unknown log type requested (should be 'request' or 'error'): ", "request" : request.url};
    logger.warn(item.error , {'request' : request.url} );
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.write(JSON.stringify(log_data));
    response.end();
  }
}

function web_page_controller(request, response, args){
  // Serve up the web page
  var resource = args[1];
  if (!resource) {
    resource = 'index.html';
  }
  var file = './www/' + resource;
  var ext = resource.substr(resource.lastIndexOf('.') + 1);
  var content_type;
  switch (ext) {
    case 'js' :
      content_type = 'text/javascript';
      break;
    case 'css' :
      content_type = 'text/css';
      break;
    case 'html' :
      content_type = 'text/html';
      break;
    case 'ico' :
      content_type = 'image/x-icon';
      break;
    case 'jpg' :
    case 'jpeg' :
      content_type = 'image/jpeg';
      break;
    default :
      content_type = 'text/plain';
  }

  fs.readFile(file, function (err, data) {
    if (err) {
      error_response(500, err, response);
    } else {
      response.writeHead(200, {"Content-Type": content_type});
      response.end(data);
      logger.info({request : request.url, response : 'ok'});
    }
  });
}

function error_response(code, err, response) {
  // Return an HTTP error response
  logger.warn(err , {'request' : response.url} );
  response.writeHead(code, {"Content-Type": "text/plain"});
  response.end(err + "\n");
}


module.exports.default_controller = default_controller;
module.exports.set_volume_controller = set_volume_controller;
module.exports.toggle_mute_controller = toggle_mute_controller;
module.exports.macro_controller = macro_controller;
module.exports.command_controller = command_controller;
module.exports.config_controller = config_controller;
//module.exports.favicon_controller = favicon_controller;
module.exports.logs_controller = logs_controller;
//module.exports.homepage_controller = homepage_controller;
//module.exports.image_controller = image_controller;
module.exports.web_page_controller = web_page_controller;


