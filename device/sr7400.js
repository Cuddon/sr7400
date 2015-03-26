/*
  sr7400.js
  SR7400 driver: Controls the amplifier by sending TCP commands to teh Global Cache GC-100 when is connected to the amplifeier via a serial port

  Andrew Cuddon
  3 January 2015

    API:
        example:
            var cmd = "GET_POWER_STATUS";
            send(cmd, function(err, resp) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('\n**** SR7400 Command: ' + cmd + ', SR7400 Response: ' + resp + '****');
                }
            });

        command structure: String, ALL_CAPITALS_WITH_UNDERSCORE_BETWEEN_WORDS

        command: 'TURN_POWER_ON'
            returns:
                ACK (\x06) - OK, NAK (\x15) - Error

        status request with fixed response codes: 'GET_POWER_STATUS'
            returns:
                string (e.g. 'OFF')

        status request with variable response: GET_VOLUME_LEVEL
                number (e.g. -32)

    TTDs
        Mappings for commands and statuses: eg VRC1 to Airplay, DSS to TBOX

    Change log
    v 1.0.1
        Added a promise version of the send function. This enables easier chaining of multiple send commands
*/

// Import libraries
var net = require('net');   // TCP network library
var Q = require('q');       // Q promise library

// Import App modules
var protocol = require('./Marantz SR7400 Serial Protocol.json');
var valid_commands = Object.keys(protocol.commands);
var valid_status_responses = Object.keys(protocol.statuscodes);

var settings = require('../settings/settings');

// Constants
var CR = "\x0D";     // Carriage Return (Hex 0D, \r)

function send(command, callback) {
  /*
      Connect to the GC100 via a TCP socket and send the command to the connected serial device
      Return to result to the callback
  */

  // Encode the command to SR7400 protocol
  var encodedcommand = encode(command);
  if (!encodedcommand) {
    var err = 'Command not in SR7400 protocol: ' + command;
    console.log(err);
    // return the error response to the calling request
    return callback(err, "NAK");
  }

  // Connect to the CG-100 and send the code and retrieve the response
  // Create a client socket for the TCP connection
  var client = new net.Socket();

  client.setTimeout(10000);
  client.setEncoding('utf8');     // set data transfer to be text with utf8 encoding

  client.on('connect', function() {
    console.log('\n-------------------------------------------------------------------------------------------\nMarantz SR7400 driver');
    console.log('Connected to GC-100 via TCP at: ' + settings.gc100.ip + ':' + settings.gc100.port_serial_1);

    // send the request immediately when connected to the GC100
    client.write(encodedcommand.code + CR, function() {
      console.log('SR7400 driver: Command sent to SR7400: ' + encodedcommand.code + ' (' + command + ') ' + client.bytesWritten + ' bytes (including trailing CR)');
    });
  });

  client.on('data', function(response) {
    // Data received from the SR7400 (via the CG-100)

    // Ensure we have a string and remove the training carriage return
    response = response.toString().trim();

    // Decode the response in the protocol
    var decodedresponse = decode(response);
    if (!decodedresponse) {
        // No fixed code so try a variable code
      decodedresponse = decodevariableresponse(response);
    }
    console.log('SR7400 driver: Received from the SR7400: ' + response + ' (' + decodedresponse + ') ' + client.bytesRead + ' bytes');

    // End the connection
    client.end();

    // return the decoded response to the calling request
    return callback(null, decodedresponse);
  });

  client.on('timeout', function() {
    // Connection timed out with no response from the Sr7400
    var err = 'Connection to GC-100 timed out';
    console.log(err);
    client.end();
    // return the error response to the calling request
    return callback(err, "NAK");
  });

  client.on('error', function(err) {
    // Connection error occurred
    console.log('Error: ' + err.toString());
    client.destroy();
    // return the error response to the calling request
    return callback(err, "NAK");
  });

  client.on('end', function() {
    console.log('Connection to GC-100 ended');
  });

  client.on('close', function() {
    console.log('Connection to GC-100 closed');
    console.log('-------------------------------------------------------------------------------------------\n');
  });


  // Initiate the connection
  client.connect(settings.gc100.port_serial_1, settings.gc100.ip);
}


function validatecommandtype(commandtype) {
  // Check if the command type is valid against the protocol
  if (protocol.valid_commandtypes.indexOf(commandtype) >= 0) {
    // Valid command type
    return true;
  } else {
    return false;
  }
}

function validatecommand(command) {
  // Check if the command  is valid against the protocol
  if (valid_commands.indexOf(command) >= 0) {
      // Valid command
    return true;
  } else {
    return false;
  }
}

function encode(command) {
  // Look up the protocol and return the encoded command, null if not found in the protocol
  command = command.trim();
  if (!validatecommand(command)) {
    // unknow command so just return it
    return null;
  }
  return {
    code : protocol.commands[command].code,
    expectedresponse : protocol.commands[command].response
  };
}

function decode(response) {
  // decode a response from the Sr7400
  response = response.trim();	// trim the trailing CR
  if (valid_status_responses.indexOf(response) >= 0) {
    // Valid command so return the status code
    return protocol.statuscodes[response].status;
  } else {
    // unknown response code so return null
    return null;
  }
}

function decodevariableresponse(response) {
  var variablecodes = ['@1EA', '@1FA', '@1FC', '@1PA', '@1Q-'];
  if (variablecodes.indexOf(response.substring(0,4)) >= 0) {
    // Volume, Bass, Treble, Tuner Frequency, Tuner Preset
    // Remove the leading 4 digit code code
    return parseInt(response.substring(4),10);
  } else {
    // return it as is
    return response;
  }
}

/*
  Promise versions of the above functions
*/
// Version of 'send' that returns a promise rather than using callbacks
var p_send = Q.denodeify(send);

// To delay a promise fulfillment or rejection use Q.delay(ms) or apromise.delay(ms)


// Expose key functions and variables to other modules
exports.send = send;
exports.p_send = p_send;
exports.protocol = protocol;


// Tests

/*
var cmd1 = "GET_POWER_STATUS";
send(cmd1, function(err, resp) {
  if (err) {
    console.log(err);
  } else {
    console.log('\n**** SR7400 Command: ' + cmd1 + ', SR7400 Response: ' + resp + ' ****\n');
  }
});


var cmd2 = "GET_VOLUME_LEVEL";
send(cmd2, function(err, resp) {
  if (err) {
    console.log(err);
  } else {
    console.log('\n**** SR7400 Command: ' + cmd2 + ', SR7400 Response: ' + resp + ' ****\n');
  }
});

*/
