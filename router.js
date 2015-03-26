/*
 URL Router
 Originally based on https://github.com/chbrown/regex-router
*/

// Function class
function Router(default_controller) {
  this.routes = [];   // List of routes and their controllers
  this.nroutes = 0;   // Number of routes
  this.default = default_controller || function(){};
}

Router.prototype.add = function(regex, controller) {
  /*
    Add a route and its controller/handler
    regex: RegExp to match a URL
    controller: function(req, res, data)
  */
  var route = {
    regex: regex,
    controller: controller
  };

  this.routes.push(route);
  this.nroutes++;
};

Router.prototype.handle_url = function(req, res) {
  /*
    Route a url
    Looks up the controller and execute it
  */
  // URL request to match
  var url = req.url;

  // Look up routes and search for a regex match
  for (var i = 0; i < this.nroutes; i++) {
    var route = this.routes[i];
    var match = url.match(route.regex);
    if (match) {
      // Return and execute the matched controller and exit the for loop
      return route.controller(req, res, match);
    }
  }
  // No route match so return and execute the default controller
  return this.default(req, res);
};


module.exports = Router;

// tests

/*
// Default controller
function default_controller(req, res) {
  console.warn('No matching route: ', req.url, res);
}
// Create an instance of Router class
var router = new Router(default_controller);

function mycontroller(req, res, data) {
  console.log('My Controller: ', req.url, res, data[1]);
}

function rootcontroller(req, res) {
  console.log('Home Page Controller: ', req.url, res);
}

router.add(/^\/api\/command\/([a-zA-Z0-9_]+)$/, mycontroller);
router.add(/^\/$/, rootcontroller);

var req = {
  url: '/api/command/Get_POWER_STATUS',
  method: 'GET',
  httpVersion: '1.1'
};
var res = {};
router.handle_url(req, res);
router.handle_url({url : '/'}, res);
router.handle_url({url : '/blah'}, res);

*/
