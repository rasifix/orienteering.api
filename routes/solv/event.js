var request = require('request');
var parse = require('csv-parse');
var iconv = require('iconv');
var reformatTime = require('../../services/time.js').reformatTime;

module.exports = function(req, res) {
  var id = req.params.id;
  request({
    url: 'http://o-l.ch/cgi-bin/results', 
    encoding: 'binary',
    qs: {
      type: 'rang',
      rl_id: id,
      kind: 'all',
      zwizt: 1,
      csv: 1
    }
  }, function(error, response, body) {
    // interpret unknown event - SOLV does not properly do that for us...
    if (res.statusCode === 404 || body.substring(0, 14) === '<!DOCTYPE html') {
      res.statusCode = 404;
      res.json({
        statusCode: 404,
        message: 'event with id ' + id + ' does not exist'
      });
      return;
    }
    
    // a hack to fix invalid encoding from SOLV
    body = new Buffer(body, 'binary');
    var conv = new iconv.Iconv('windows-1252', 'utf8');
    body = conv.convert(body).toString();
    
    var categories = { };
    var result = {
      categories: []
    };
    
    var lines = body.split('\n');
    var header = lines.splice(0, 1)[0].split(';');
    
    lines.forEach(function(line, idx) {
      var tokens = line.split(';');
      if (tokens.length < 11) {
        return;
      }
      
      var name = tokens[0];
      var category = categories[name];
      if (!category) {
        category = {
          name: name,
          distance: Math.round(parseFloat(tokens[1]) * 1000),
          ascent: tokens[2],
          controls: tokens[3],
          runners: []
        };
        categories[name] = category;
        result.categories.push(category);
      }
      
      var runner = {
        id: idx,
        fullName: tokens[5],
        yearOfBirth: tokens[6],
        city: tokens[7],
        club: tokens[8],
        time: reformatTime(tokens[9]),
        startTime: tokens[10],
        splits: []
      };
      
      for (var i = 12; i < tokens.length - 1; i += 2) {
        runner.splits.push([ tokens[i], reformatTime(tokens[i + 1]) ]);
      }
      
      category.runners.push(runner);
    });
    
    res.set('Access-Control-Allow-Origin', '*');
    res.json(result);
  });
};
