/*
  server.js

  Marantz SR7400/SR8400 web service

  The MIT License (MIT)

  Copyright (c) 2015 Andrew Cuddon

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.

*/

/* jshint node: true */
"use strict";

// Import core library modules
var http = require('http');

// Import dependencies

// Import App modules
var settings = require('./settings/settings');
var logger = require('./logger');
var Router = require('./router');
var controllers = require('./controllers');
var zeroconf = require('./zeroconf');   // Bonjour, Avahi, Zeroconf advertising


// Set up the url router
var router = new Router(controllers.default_controller);
// Add the routes (ORDER is important)
router.add(/^\/api\/command\/toggle_mute\/?$/, controllers.toggle_mute_controller);
router.add(/^\/api\/command\/set_volume_to_([\d-+]+)\/?$/, controllers.set_volume_controller);
router.add(/^\/api\/command\/([a-zA-Z0-9_]+)\/?$/, controllers.command_controller);
router.add(/^\/api\/macro\/([a-zA-Z0-9_]+)\/?$/, controllers.macro_controller);
router.add(/^\/api\/config\/([a-zA-Z0-9_]+)\/?$/, controllers.config_controller);
router.add(/^\/api\/logs?\/([a-zA-Z]+)\/?$/, controllers.logs_controller);
//router.add(/^\/$/, controllers.homepage_controller);
//router.add(/^\/favicon.ico\/?$/, controllers.favicon_controller);
//router.add(/^\/www\/([a-zA-Z0-9_\-\.]+)\/?$/, controllers.image_controller);
router.add(/^\/([a-zA-Z0-9_\-\.]*)\/?$/, controllers.web_page_controller);

// Create and start the HTTP server for receiving command requests
var server = http.createServer();
server.listen(settings.httpserver.port, settings.httpserver.ip, 511, function() {
  // Now that the server has started listening for HTTP requests, start Zeroconf/Bonjour/Avahi advertising
  zeroconf.advertise();
  logger.info('HTTP server running at http://' + settings.httpserver.ip + ":" + settings.httpserver.port);
});
logger.info("---------------------- Marantz SR7400/SR8400 Web Service---------------------- ");

// Listen for HTTP requests
server.on('request', requestHandler);

server.on('close', function (request, response) {
  // Do nothing at this stage
});


function requestHandler(request, response) {
  /*
    request = {
      httpVersion: '1.1',
      headers:
        {
          host: 'localhost:8080',
          connection: 'keep-alive',
          'cache-control': 'max-age=0',
          'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) ...',
          accept: 'application/xml,application/xhtml+xml ...',
          'accept-encoding': 'gzip,deflate,sdch',
          'accept-language': 'en-US,en;q=0.8',
          'accept-charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.3'
         },
      url: '/',
      method: 'GET',
      ...
    }
  */

  // Confirm a GET request, otherwise return an error
  if (request.method !== 'GET' ) {
    var err = "Invalid http method: " + request.method;
    logger.warn(err , {'request' : response.url} );
    response.writeHead(500, {"Content-Type": "text/plain"});
    response.end(err + "\n");
    return;
  }

  // Route the url request
  router.handle_url(request, response);
}

