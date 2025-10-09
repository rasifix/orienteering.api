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
var axios = require("axios");

module.exports = function (id, callback, errorCallback) {
  axios
    .get("https://api.zimaa.ch/api/events/local/" + id)
    .then(function (error, response, body) {
      if (response.status === 404) {
        errorCallback({
          statusCode: 404,
          message: "event with id " + id + " does not exist",
        });
        return;
      }

      var sequence = 1;
      var json = JSON.parse(body);
      json.categories.forEach(function (category) {
        category.runners.forEach(function (runner) {
          runner.id = runner.id || sequence++;
        });
      });
      callback(json);
    });
};
