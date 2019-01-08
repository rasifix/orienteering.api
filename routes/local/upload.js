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
const fs = require("fs");
const sanitize = require("sanitize-filename");

Array.prototype.flatMap = function(lambda) { 
  return Array.prototype.concat.apply([], this.map(lambda)); 
};

module.exports = function(req, res) {
  const id = req.params.id;
  const contentType = req.headers['content-type'];

  console.log('received new activity with id = ' + id);
  console.log('content-type: ' + contentType);
  console.log('content-lenght: ' + req.headers['content-lenght']);
  console.log('body', req.body);
  
  if (contentType.indexOf('application/json') === -1) {
    console.log('invalid content type received: ' + contentType);
    res.statusCode = 406;
    res.json({
      'message': 'content-type ' + contentType + ' not supported; supported content types are application/json'
    });
    return;
  }

  const file = sanitize(id);
  console.log('saving to ' + file);

  fs.writeFile('data/' + file + '.json', JSON.stringify(req.body, null, '  '), 'utf8', function(err) {
    if (err) {
      console.log('failed to write file ' + file + '.json; error = ' + err);
      res.statusCode = 500;
      res.json(err);
    } else {
      res.json({ message: 'upload of ' + id + ' successful!' });
    }
  });
  
};
