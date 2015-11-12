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
var solv = require('../../services/solv-loader');
var parseTime = require('../../services/time').parseTime;
var formatTime = require('../../services/time').formatTime;
var parseRanking = require('../../services/ranking').parseRanking;

module.exports = function(req, res) {
  var id = req.params.id;
  solv(id, function(event) {
    var legs = defineControls(event.categories);
    
    res.set('Access-Control-Allow-Origin', '*');
    res.json(legs);
  });
};

function defineControls(categories) {
  var legs = { };
  var all = { };

  categories.filter(function(cat) { return cat.runners.length > 0; }).forEach(function(cat) {
    var category = parseRanking(JSON.parse(JSON.stringify(cat)));
    
    category.runners[0].splits.forEach(function(split, idx) {
      if (idx === 0) {
        legs['St-' + split.code] = { source: 'St', target: split.code };
      } else if (idx <= category.runners[0].splits.length - 1) {
        var prev = category.runners[0].splits[idx - 1];
        legs[prev.code + '-' + split.code] = { source: prev.code, target: split.code };
      }         
    });
    
    category.runners.forEach(function(runner) {
      runner.splits.forEach(function(split, idx) {
        if (!all[split.code]) {
          all[split.code] = { 
            code: split.code,
            categories: { }
          };
        }
                  
        // prepare the value
        var control = all[split.code];
        
        if (!control.categories[category.name]) {
          control.categories[category.name] = {
            name: category.name,
            from: idx === 0 ? 'St' : runner.splits[idx - 1].code,
            to: runner.splits[idx].code,
            runners: [ ]
          };
        }
        
        var cat = control.categories[category.name];
        
        if (idx === 0 && parseTime(split.time)) {  
          cat.runners.push({
            fullName: runner.fullName,
            splitTime: split.time,
            timeLoss: split.timeLoss
          });
        } else if (idx > 0 && parseTime(split.time) && parseTime(runner.splits[idx - 1].time)) {
          cat.runners.push({
            fullName: runner.fullName,
            splitTime: formatTime(parseTime(split.time) - parseTime(runner.splits[idx - 1].time)),
            timeLoss: split.timeLoss
          });
        }
      });
    });      
  });
  
  var result = [ ];
  Object.keys(all).forEach(function(code) {
    var control = all[code];
    control.categories = Object.keys(control.categories).map(function(name) {
      return control.categories[name];
    });
    var errors = 0;
    var total = 0;
    control.categories.forEach(function(category) {
      category.runners.sort(function(r1, r2) {
        return parseTime(r1.splitTime) - parseTime(r2.splitTime);
      });
      total += category.runners.length;
      category.runners.forEach(function(runner) {
        if (runner.timeLoss) {
          errors += 1;
        }
      });
    });
    control.runners = control.categories.map(function(category) { return category.runners.length; }).reduce(function(r1, r2) { return r1 + r2; });
    control.errorFrequency = Math.round(errors / total * 100);
    control.cats = control.categories.map(function(cat) { return cat.name; }).join(',');
    result.push(control);
  });
  result = result.filter(function(c) { return c.errorFrequency > 0; }).sort(function(c1, c2) {
    return c2.errorFrequency - c1.errorFrequency;
  });
  
  return result.map(function(control) {
    return {
      code: control.code,
      errorFrequency: control.errorFrequency,
      categories: control.categories.map(function(category) { return category.name; }),
      runners: control.categories.reduce(function(acc, current) { return acc + current.runners.length; }, 0)
    }
  });
}
