/*
  macro.js

  Run a macro
  Returns a promise to the macros result (ACK or NAK)
  Result will be NAK if any one of the commands returns NAK
  Macros command occur sequentially

  TTDs
    Setting the volume to a specific valid within a macro (see how server.js uses volume.js)

*/

// Q Promises library
var Q = require('q');

// App modules
var sr7400 = require('./sr7400');


function run(macro) {
  /*
    Run a macro and return success (ACK) or failure (NAK) via a promise
    All commands in the macro are run sequentially

    Uses promises (rather than callbacks) to chain the commands and ensure they run sequentially (i.e. in series)
    This enables easier chaining of async commands in series

    macro is a list of commands or wait statements
      e.g. macro = ['TURN_POWER_ON', 'WAIT:5000', 'SET_AUDIO_INPUT_TO_VCR1']
      Notice the colon to separate the Wait command from the wait time value, which is in miliseconds. e.g 1000 = 1 seconds
  */

  // start with an "empty" already-fulfilled promise
  var currentpromise = Q();

  // Run each command in the macro
  // Wait for each command to complete before running the next command
  var promised_result = Q.all(macro.map(function(command) {
    currentpromise = currentpromise.then(function() {
      if (command.substr(0,4).toUpperCase() == 'WAIT') {
        // Wait command
        var delayms = parseInt(command.substr(5), 10);
        if (isNaN(delayms)) {
          // Invalid wait time so raise an error and let it propagate up the the main promise
          throw new Error("Invalid Wait time: " + command);
          // no need to return a promise as execution flow will go straight to the onRejected (.catch) function
        } else {
          // Valid delay so return a promise to the delay
          //console.log("..Waiting " + delayms + " ms");
          return Q.delay(delayms);
        }
      } else {
        // Normal send command
        // Return a promise for the send the SR7400 command
        return sr7400.p_send(command);
      }
    })
    .then(function(result) {
      /*
        onFulfilled handler: Successful fulfillment of a single promised send or delay command
        Send result should be ACK or NAK
        Delay result is a null because there is no return value
      */
      return result;
    });
    return currentpromise;
  }))
  .then(function(results) {
    /*
      .all onFulfilled handler: successful fulfillment of ALL promises
      Results is an array of the send/delay results
      Check if any NAK items in the results array
    */
    if (results.indexOf("NAK") == -1) {
      // All commands successful
      return "ACK";
    } else {
      // At least 1 command resulted in a NAK
      return "NAK";
    }
  });

  return promised_result;
  // Do not .catch or terminate with .done here as we should propagate any errors to the calling routine and terminate where there is no more chaining
}

// Expose key functions and variables to other modules
exports.run = run;


/*

// Simple test

var mymacro = [
  'TURN_POWER_ON',
  'WAIT:5000',                   // Wait 5 seconds to allow time for the amp to start
  'SELECT_INPUT_VCR1'
];

// Recursive function to show that the macro does not block execution of another process
var secs = 0;
var endafter = 10;    // continue for 10 seconds
function go() {
  secs += 0.1;
  console.info("Running... " + secs.toFixed(1) + "s")
  if (secs <= endafter) {
    setTimeout(go, 100);
  }
}
go();

run(mymacro)
.then(function(result){
  console.log(result);
})
.fail(function(err){
  console.error(err);
})
.delay(100).finally(function() {
  console.info('...done!');
})
.done();

*/
