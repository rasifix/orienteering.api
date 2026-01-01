/*
 * Copyright 2015 Simon Raess
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var express = require('express');
var compress = require('compression');
var bodyParser = require('body-parser');
var basicAuth = require('basic-auth');

var solv = require('./services/solv-loader');
var local = require('./services/local-loader');
var picoevents = require('./services/picoevents-loader');

var app = express();
app.use(compress());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  next();
});

// Cache middleware for GET requests - 1 day TTL
var cacheMiddleware = function(req, res, next) {
  if (req.method === 'GET') {
    var oneDayInSeconds = 86400; // 24 * 60 * 60
    res.set('Cache-Control', 'public, max-age=' + oneDayInSeconds);
  }
  next();
};

app.use('/api/events', cacheMiddleware);

app.get('/api/events', require('./routes/events'));

// solv
app.get('/api/events/solv/:id', require('./routes/solv/event')(solv));
app.get('/api/events/solv/:id/categories', require('./routes/solv/categories')(solv));
app.get('/api/events/solv/:id/categories/:categoryId', require('./routes/solv/category')(solv));
app.get('/api/events/solv/:id/courses', require('./routes/solv/courses')(solv));
app.get('/api/events/solv/:id/courses/:courseId', require('./routes/solv/course')(solv));
app.get('/api/events/solv/:id/legs', require('./routes/solv/legs')(solv));
app.get('/api/events/solv/:id/legs/:legId', require('./routes/solv/leg')(solv));
app.get('/api/events/solv/:id/controls', require('./routes/solv/controls')(solv));
app.get('/api/events/solv/:id/controls/:controlId', require('./routes/solv/control')(solv));
app.get('/api/events/solv/:id/runners', require('./routes/solv/runners')(solv));
app.get('/api/events/solv/:id/starttime', require('./routes/solv/starttime')(solv));

// picoevents
app.get('/api/events/picoevents/:id', require('./routes/solv/event')(picoevents.loadLiveEvents));
app.get('/api/events/picoevents/:id/categories', require('./routes/solv/categories')(picoevents.loadLiveEvents));
app.get('/api/events/picoevents/:id/categories/:categoryId', require('./routes/solv/category')(picoevents.loadLiveEvents));
app.get('/api/events/picoevents/:id/courses', require('./routes/solv/courses')(picoevents.loadLiveEvents));
app.get('/api/events/picoevents/:id/courses/:courseId', require('./routes/solv/course')(picoevents.loadLiveEvents));
app.get('/api/events/picoevents/:id/legs', require('./routes/solv/legs')(picoevents.loadLiveEvents));
app.get('/api/events/picoevents/:id/legs/:legId', require('./routes/solv/leg')(picoevents.loadLiveEvents));
app.get('/api/events/picoevents/:id/controls', require('./routes/solv/controls')(picoevents.loadLiveEvents));
app.get('/api/events/picoevents/:id/controls/:controlId', require('./routes/solv/control')(picoevents.loadLiveEvents));
app.get('/api/events/picoevents/:id/runners', require('./routes/solv/runners')(picoevents.loadLiveEvents));
app.get('/api/events/picoevents/:id/starttime', require('./routes/solv/starttime')(picoevents.loadLiveEvents));

// local
app.get('/api/events/local/:id', require('./routes/solv/event')(local));
app.get('/api/events/local/:id/categories', require('./routes/solv/categories')(local));
app.get('/api/events/local/:id/categories/:categoryId', require('./routes/solv/category')(local));
app.get('/api/events/local/:id/courses', require('./routes/solv/courses')(local));
app.get('/api/events/local/:id/courses/:courseId', require('./routes/solv/course')(local));
app.get('/api/events/local/:id/legs', require('./routes/solv/legs')(local));
app.get('/api/events/local/:id/legs/:legId', require('./routes/solv/leg')(local));
app.get('/api/events/local/:id/controls', require('./routes/solv/controls')(local));
app.get('/api/events/local/:id/controls/:controlId', require('./routes/solv/control')(local));
app.get('/api/events/local/:id/runners', require('./routes/solv/runners')(local));
app.get('/api/events/local/:id/starttime', require('./routes/solv/starttime')(local));
app.get('/api/events/local/:id', require('./routes/local/event'));


var auth = function (req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.send(401);
  };

  var user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  };
  
  var args = process.argv.slice(2);
  
  if (user.name === (args[0] || 'fluffy') && user.pass === (args[1] || 'stuffy')) {
    return next();
  } else {
    return unauthorized(res);
  };
};

app.put('/api/events/:id', auth, bodyParser.json({limit: '50mb'}), require('./routes/local/upload'));



// fallback route -> send to entry point
app.get('/*', function(req, res) {
  res.redirect('/api/events');
});

app.use(function(err, req, res, next) {
  res.status(500);
  console.log('got a nasty error');
  console.log(err);
  res.json({ error: err });
});

module.exports = app;