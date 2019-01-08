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
var parseTime = require('../../services/time').parseTime;

module.exports = function(loader) {
  return function(req, res) {
    var id = req.params.id;
  
    loader(id, function(event) {      
      var result = { categories: [ ] };

      event.categories.forEach(function(category) {
        var cat = { name: category.name, runners: [] };
        result.categories.push(cat);

        var last = null;
        var pos = 1;
        var filtered = category.runners.filter(function(runner) { return parseTime(runner.time) !== null; });
        filtered.forEach(function(runner, idx) {
          if (last != null) {
            if (parseTime(runner.time) > last) {
              pos = idx + 1;
            }
          }
          var point = {
            id: runner.id,
            startTime: runner.startTime,
            time: runner.time,
            rank: pos,
            fullName: runner.fullName,
            sex: runner.sex,
            category: category.name
          };
          cat.runners.push(point);
          last = parseTime(runner.time);
        });
      });
    
      res.json(result);
    });
  };
};
