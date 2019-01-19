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
var iconv = require('iconv');
var reformatTime = require('./time').reformatTime;
var parseTime = require('./time').parseTime;

module.exports = function(id, callback, errorCallback) {
  request({
    url: 'http://localhost:3000/api/events/' + id
  }, function(error, response, body) {
    if (response.statusCode === 404) {
      errorCallback({ 
        statusCode: 404,
        message: 'event with id ' + id + ' does not exist'
      })
      return;
    }
    
    var sequence = 1;
    var json = JSON.parse(body);
    json.categories.forEach(function(category) {
      category.runners.forEach(function(runner) {
        runner.id = runner.id || sequence++;
      });
    });
    callback(json);
  });
}