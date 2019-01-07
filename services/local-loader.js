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
var request = require('request');
var reformatTime = require('./time').reformatTime;
var parseTime = require('./time').parseTime;

module.exports = function(id, callback) {
  request({
    url: 'http://localhost:3000/api/events/' + id
  }, function(error, response, body) {
    if (response.statusCode === 404) {
      var customResponse = {
        statusMessage: 404,
        message: 'a competition with this ' + id + 'does not exist'
      };
      callback(customResponse);
      return;
    }
    
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