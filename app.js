var express = require('express');
var request = require('request');
var compress = require('compression');

var app = express();

app.get('/api/events', require('./routes/events'));

app.get('/api/events/solv/:id', require('./routes/solv/event'));

app.get('/api/events/solv/:id/categories', require('./routes/solv/categories'));

app.get('/api/events/solv/:id/categories/:categoryId', require('./routes/solv/category'));

app.get('/api/events/solv/:id/courses', require('./routes/solv/courses'));

app.get('/api/events/solv/:id/courses/:courseId', require('./routes/solv/course'));

app.get('/api/events/solv/:id/legs', require('./routes/solv/legs'));

app.get('/api/events/solv/:id/legs/:legId', require('./routes/solv/leg'));

app.get('/api/events/solv/:id/controls', require('./routes/solv/controls'));

app.get('/api/events/solv/:id/controls/:controlId', require('./routes/solv/control'));

app.get('/api/events/solv/:id/runners', require('./routes/solv/runners'));

app.get('/api/events/solv/:id/starttime', require('./routes/solv/starttime'));

// fallback route -> send to entry point
app.get('/*', function(req, res) {
  res.redirect('/api/events');
});

app.use(compress());
app.use(function(err, req, res, next) {
  res.status(500);
  res.render('error', { error: err });
});

module.exports = app;