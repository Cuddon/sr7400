/**
 * Created by Andrew on 27/03/2015.
 */

var environment = require('./env.json');

var settings;
if (environment.mode === 'prod') {
  settings = require('./settings-prod.json');
} else {
  settings = require('./settings-dev.json');
}

module.exports = settings;
