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

module.exports = function(req, res) {
  var id = req.params.id;
  var file = sanitize(id);
  
  res.set('Access-Control-Allow-Origin', '*');
  
  var path = 'data/' + file + '.json';
    
  fs.readFile(path, { encoding: 'UTF8' }, function(err, data) {
    if (err) {
      res.status(404);
      res.json({ message: 'event ' + id + ' does not exist!' });
    } else {
      res.set('Content-Type', 'text/plain;charset=utf8');
      res.send(data);
    }
  });  
};
