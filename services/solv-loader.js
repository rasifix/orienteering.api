var request = require('request');
var iconv = require('iconv');
var reformatTime = require('./time').reformatTime;
var parseTime = require('./time').parseTime;

module.exports = function(id, callback) {
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
    if (response.statusCode === 404 || body.substring(0, 14) === '<!DOCTYPE html') {
      response.statusCode = 404;
      response.json({
        statusCode: 404,
        message: 'event with id ' + id + ' does not exist'
      });
      return;
    }
    
    // hack to fix invalid encoding from SOLV server
    var buffer = new Buffer(body, 'binary');
    var conv = new iconv.Iconv('windows-1252', 'utf8');
    var converted = conv.convert(body).toString();
    
    // convert CSV to JSON
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
          controls: parseInt(tokens[3]),
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

      if ((tokens.length - 12) < category.controls * 2) {
        // some crappy SOLV data...
        console.log('fix crappy data from SOLV - not enough tokens on line for runner ' + runner.fullName);
        for (var i = tokens.length; i < category.controls * 2 + 12; i++) {
          if (i % 2 === 0) {
            tokens[i] = category.runners.length === 0 ? '???' : category.runners[0].splits[(i - 12) / 2].code;
          } else {
            tokens[i] = '-';
          }
        }
      }
      
      for (var i = 12; i < tokens.length - 1; i += 2) {
        var time = reformatTime(tokens[i + 1]);
        if (runner.splits.length > 0 && parseTime(time)) {
          var prev = parseTime(runner.splits[runner.splits.length - 1]);
          if (time === prev || tokens[i + 1] === '0.00' || parseTime(tokens[i + 1]) > 180 * 60) {
            // normalize valid manual punches
            time = 's';
          }
        }
        runner.splits.push({ code: tokens[i], time: time });
      }
      
      category.runners.push(runner);
    });
    
    callback(result);
  });
}