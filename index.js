var app = require('app');

var server = app.listen(3000, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('orienteering API server listening at http://%s:%s', host, port);
});
