/*
  Set volume to a specific db level or %
  Returns a promise to the result (ACK or NAK)
  Uses promises to run the commands sequentially in series
  
  TTDs:
    More accurate volume setting using single DB changes as well as 5db changes
*/

// Std library modules
var Q = require('q');

// App modules
var sr7400 = require('./sr7400');
var macro = require('./macro');

function setTo(requestedvolume) {
  /*
    Set the SR7400 to a specific volume level (in dB)
    e.g. set_volume_to_-25
    Command not supported by the SR7400 so convert to number of volume up/down commands

    1. Get the current volume (dB)
    1. Check the requested volume (dB)
    3. Calculate the number of up/down/ by 5db increments required
    4. Process the volume/up down commands
    
    Use promises to run the steps in waterfall/series
  */

  // Step 1: Get current volume
  var promised_result = sr7400.p_send("GET_VOLUME_LEVEL")
  .then(function getCurrentVolume (currentvolume) {
    // Response received from the SR7440
    if (currentvolume === 'NAK') {
      // Not Acknowledged response from SR7400
      throw new Error("Error response from SR7400: NAK");
    } else if (currentvolume === "MIN") {
      // Assume -65dB
      currentvolume = -65;
    } else if (currentvolume === "MAX") {
      // Assume 0dB
      currentvolume = 0;
    } else if (isNaN(parseInt(currentvolume, 10))) {
      // some other text that could not be converted to an integer
      throw new Error("Error parsing response from SR7400. Integer expected: " + currentvolume);
    } else {
      // Valid volume level received
      currentvolume = parseInt(currentvolume, 10);
    }
    return currentvolume;
  })

  // Step 2: Check the requested volume
  .then(function checkRequestedVolume(currentvolume){
    // Check the requested volume and convert to an integer if required 
    switch(typeof requestedvolume) {
      case 'number' :
      case 'string' :
        requestedvolume = parseInt(requestedvolume, 10);
        if (requestedvolume <-65 || requestedvolume > 0) {
          throw new Error("Error Invalid requested volume dB level: " + requestedvolume);
        } else if (isNaN(parseInt(requestedvolume, 10))) {
          // ParseInt return NaN error
          throw new Error("Error parsing requsted volume. Integer expected: " + requestedvolume);
        }
        break;
      default:
        throw new Error("Error parsing requsted volume. Integer expected: " + requestedvolume);
    }
    return [currentvolume, requestedvolume];
  })
    
  // Step 3:  Calculate the number of 5db volume up/down increments required
  .spread(function calculateVolumeIncrements(currentvolume, requestedvolume) {
    // Determine the number of 5dBup/down increments
    var increments = Math.floor(Math.abs(currentvolume - requestedvolume)/5);
    if (currentvolume > requestedvolume) {
      increments = increments * -1;
    }
    return increments;
  })

  // Step 4: Process the volume/up down commands
  .then(function changeVolume(increments) {
    var commands = [];
    if (increments < 0) {
        // Turn volume down
        for (var i = 1; i <= Math.abs.increments; i++) {
            commands.push("TURN_VOLUME_DOWN_5DB");
            commands.push("WAIT:10");            
        }
    } else {
        // turn volume up
        for (var i = 1; i <= increments; i++) {
            commands.push("TURN_VOLUME_UP_5DB");
            commands.push("WAIT:10");            
        }
    }
    return macro.run(commands);
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
exports.setTo = setTo;


// Tests

/*
var requeststring = 'set_volume_to_-20';
if (requeststring.substr(0,14) == 'set_volume_to_') {
  var volume = parseInt(requeststring.substring(14), 10);
  setTo(volume)       // Promise
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
}

*/
