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
require('array.prototype.find');

var parseRanking = require('../../services/ranking').parseRanking;

module.exports = function(loader) {
  return function(req, res) {
    var id = req.params.id;
    var categoryId = req.params.categoryId;
  
    loader(id, function(event) {      
      var category = event.categories.find(function(category) {
        return category.name === categoryId;
      });
        
      if (!category) {
        res.status(404);
        res.json({ message: 'category ' + categoryId + ' does not exist!' });
      } else {
        res.json({
          name: category.name,
          distance: category.distance,
          ascent: category.ascent,
          controls: category.controls,
          runners: parseRanking(category).runners
        });
      }    
    });
  };
};

