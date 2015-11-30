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

var iconv = require('iconv');
var reformatTime = require('../../services/time').reformatTime;
var parseTime = require('../../services/time').parseTime;

module.exports.get = function(req, res) {
  var id = req.params.id;
  var file = sanitize(id);
  
  res.set('Access-Control-Allow-Origin', '*');
  
  /*fs.readdir('services', function(err, files) {
    res.json(files);
  });*/
  
  fs.readFile('data/' + file + ".json", { encoding: 'UTF8' }, function(err, data) {
    if (err) throw err;
    res.json(JSON.parse(data));
  });
};

module.exports.put = function(req, res) {  
  var id = req.params.id;
  var file = sanitize(id);

  fs.writeFile('data/' + file + '.json', JSON.stringify(req.body), function(err) {
    if (err) {
      res.statusCode = 500;
      res.json(err);
    } else {
      res.json({ message: 'upload successful!' });
    }
  });
}

