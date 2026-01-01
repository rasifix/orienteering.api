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

module.exports = function(loader) {
  return function(req, res) {
    var id = req.params.id;
  
    loader(id, function(event) {      
      var result = defineRunners(event.categories);
    
      res.json(result);
    }, function(error) {
      res.status(error.statusCode);
      res.json(error);
    });
  };
};

function defineRunners(categories) {
  var arrayOfArray = categories.map(function(category) {
    return category.runners.map(function(runner) {
      return {
        id: runner.id,
        fullName: runner.fullName,
        club: runner.club,
        city: runner.city,
        yearOfBirth: runner.yearOfBirth,
        category: category.name
      };
    });
  });
   
  var runners = [];
  return runners.concat.apply(runners, arrayOfArray).sort(function(r1, r2) {
    return r1.fullName.localeCompare(r2.fullName);
  });
}
