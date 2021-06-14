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
var parseRanking = require('../../services/ranking').parseRanking;

module.exports = function(loader) {
  return function(req, res) {  
    var id = req.params.id;
    var controlId = req.params.controlId;
    loader(id, function(event) {
      var control = defineControl(event.categories, controlId);
    
      if (!control) {
        res.status(404);
        res.json({ message: 'control ' + controlId + ' does not exist!' });
      } else {
        res.json(control);
      }
    });
  };
};

function defineControl(categories, id) {
  var legs = { };
  var all = { };
  
  var control = { 
    code: id,
    categories: { },
    from: { },
    to: { }
  };
  
  categories.filter(function(cat) { return cat.runners.length > 0; })
            .filter(function(cat) { return cat.runners[0].splits.find(function(split) { return split.code === id; }); })
            .forEach(function(cat) {
    
    var category = parseRanking(cat);
    
    control.categories[category.name] = { 
      name: category.name,
      runners: category.runners.length
    };
    
    var splits = category.runners[0].splits;
    splits.forEach(function(split, idx) {
      if (split.code !== id) {
        return;
      }
      
      var prevId = idx === 0 ? 'St' : splits[idx - 1].code;
      var prev = control.from[prevId];
      if (!prev) {
        prev = control.from[prevId] = { 
          code: prevId, 
          leg: prevId + '-' + id,
          categories: [ ],
          runners: 0,
          errors: 0
        };
      }
      prev.categories.push(category.name);
      prev.runners += category.runners.length;
      prev.errors += category.runners.map(function(runner) { 
        return runner.splits[idx];
      }).filter(function(split) { return split.timeLoss; }).reduce(function(prev, current) {
        return prev + 1;
      }, 0);

      var nextId = idx + 1 < splits.length ? splits[idx + 1].code : 'Zi';
      var next = control.to[nextId];
      if (!next) {
        next = control.to[nextId] = {
          code: nextId,
          leg: id + '-' + nextId,
          categories: [ ],
          runners: 0,
          errors: 0
        };
      }
      next.categories.push(category.name);
      next.runners += category.runners.length;
      next.errors += category.runners.map(function(runner) { 
        return runner.splits[idx];
      }).filter(function(split) { return split.timeLoss; }).reduce(function(prev, current) {
        return prev + 1;
      }, 0);
      
    });    
  });
    
  control.categories = Object.keys(control.categories).map(function(name) { return control.categories[name]; });
  
  control.from = Object.keys(control.from).map(function(code) { return control.from[code]; });
  control.from.forEach(function(from) {
    from.categories = from.categories.sort(function(c1, c2) { return c1.localeCompare(c2); }).join(',');
    from.errorFrequency = Math.round(100 * from.errors / from.runners);
  });
  
  control.to = Object.keys(control.to).map(function(code) { return control.to[code]; } );
  control.to.forEach(function(to) {
    to.categories = to.categories.sort(function(c1, c2) { return c1.localeCompare(c2); }).join(',');
    to.errorFrequency = Math.round(100 * to.errors / to.runners);
  });
  
  return control;
}
