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

var fs = require("fs");
var sanitize = require("sanitize-filename");

Array.prototype.flatMap = function(lambda) { 
  return Array.prototype.concat.apply([], this.map(lambda)); 
};

module.exports = function(req, res) {
  var id = req.params.id;

  console.log('received new activity with id = ' + id);
  console.log(req.body);
    
  var lines = req.body.split(/[\r\n]+/g);
  var header = lines.splice(0, 1)[0].split(';');
  var eventInfo = lines.splice(0, 1)[0].split(';');
  
  var category = null;
  var categories = [];
  lines.forEach(function(line, idx) {
    if (line.length === 0) {
      return;
    }
    var tokens = line.split(';');
    if (tokens.length === 4) {
      category = {
        name: tokens[0],
        distance: +tokens[1],
        ascent: +tokens[2],
        controls: +tokens[3],
        runners: []
      };
      categories.push(category);
      
    } else {
      var runner = {
        rank: tokens[0],
        name: tokens[1],
        firstName: tokens[2],
        yearOfBirth: tokens[3],
        sex: tokens[4],
        zip: tokens[6],
        city: tokens[7],
        club: tokens[8],
        nation: tokens[9],
        runTime: tokens[12],
        startTime: tokens[13],
        finishTime: tokens[14],
        splits: []
      };
      for (var i = 15; i < tokens.length; i += 2) {
        runner.splits.push({
          code: tokens[i],
          time: tokens[i + 1]
        });
      }
      category.runners.push(runner);
    }
  });
    
  var result = 'Kategorie;Laenge;Steigung;PoAnz;Rang;Name;Jahrgang;Ort;Club;Zeit;SiNr;SolvNr;Startzeit;Zielzeit;Zwischenzeiten\n';
  categories.forEach(function(category) {
    var mapped = category.runners.map(function(runner) {
      return category.name + ';' + category.distance / 1000 + ';' + category.ascent + ';' + category.controls + ';'
           + runner.rank + ';' + (runner.firstName + ' ' + runner.name) + ';' + runner.yearOfBirth + ';' + runner.city + ';'
           + runner.club + ';' + runner.runTime + ';' + runner.startTime + ';' + runner.finishTime + ';'
           + runner.splits.map(function(split) { return split.code + ';' + split.time }).join(';');
    });
      
    result += mapped.join('\n') + '\n';      
  });

  var file = sanitize(id);
    
  fs.writeFile('data/' + file + '.csv', result, 'utf8', function(err) {
    if (err) {
      console.log('failed to write file ' + file + '.csv; error = ' + err);
      res.statusCode = 500;
      res.json(err);
    } else {
      res.json({ message: 'upload successful!' });
    }
  });
  
};
