/**
 * Created by Andrew on 25/03/2015.
 */

// Function class
function Router() {
  this.routes = [];   // List of routes and their controllers
  this.nroutes = 0;   // Number of routes
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
      return route.controller(req, res, match);
    }
  }
  return this.default(req, res, req.url);
};


module.exports = Router;

// tests

// Create an instance of Router class
var router = new Router();

function mycontroller(req, res, data) {
  console.log('My Controller', req.url, res, data[1]);
}

function rootcontroller(req, res) {
  console.log('Home Page Controller:', req.url, res);
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
