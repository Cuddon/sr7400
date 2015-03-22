/*
  toggle audio mute
  Returns a promise to the result (ACK or NAK)
  Uses promises to run the commands sequentially in series

  TTDs:
    None
*/

// Core library modules

// Dependent modules

// App modules
var sr7400 = require('./sr7400');

function toggle() {
  /*
    Toggle mutes on the SR7400
    Command not supported by the SR7400 so convert to number of volume up/down commands

    1. Get the current mute status (ON/OFF)
    2. Determine which Mute On/Off command is required to toggle mute
    3. Process the appropriate mute command

    Use promises to run the steps in waterfall/series
  */

  // Step 1: Get mute status (ON/OFF)
  var promised_result = sr7400.p_send("GET_AUDIO_MUTE_STATUS")

  // Step 2. Determine which Mute On/Off command is required to toggle mute
  .then(function getMuteStatus(currentmutestatus) {
    // Response received from the SR7440
    var command = "";
    if (currentmutestatus === "NAK") {
      // Not Acknowledged response from SR7400
      throw new Error("Error response from SR7400: NAK");
    } else if (currentmutestatus === "ON") {
      command = "TURN_MUTE_OFF";
    } else if (currentmutestatus === "OFF") {
      command = "TURN_MUTE_ON";
    } else {
        // some other text
        throw new Error("Error parsing response from SR7400. Valid mute status expected: " + currentmutestatus);
    }
    return command;
  })

  // Step 3: Process the appropriate mute command
  .then(function processCommand(command) {
    return sr7400.p_send(command)
  })

  // Final result
  .then(function(result) {
    // onFulfilled handler: successful fulfillment of the above promise chain
    return result;
  });

  return promised_result;
  // Do not terminate with a .catch and .done as the calling routine should complete the promise chain
}

// Expose key functions and variables to other modules
exports.toggle = toggle;


// Test
toggle()
.then(function(result){
  console.log(result);
})
.fail(function(err){
  console.error(err);
})
.finally(function() {
      console.info('...All done!');
})
.done();
