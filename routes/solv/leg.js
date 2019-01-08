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
var parseTime = require('../../services/time').parseTime;
var formatTime = require('../../services/time').formatTime;

module.exports = function(loader) {
  return function(req, res) {
    var id = req.params.id;
    var legId = req.params.legId;
  
    loader(id, function(event) {      
      var legs = defineLegs(event.categories);
    
      var leg = legs.find(function(leg) {
        return leg.id === legId;
      });
        
      if (!leg) {
        res.status(404);
        res.json({ message: 'leg ' + legId + ' does not exist!' });
      } else {
        res.json(leg);
      }    
    });
  };
};

function defineLegs(categories) {
  // helper function to create ranking entry for runner
  var createRankingEntry = function(runner, category, splitTime) {
    return {
      id: runner.id,
      fullName: runner.fullName,
      yearOfBirth: runner.yearOfBirth,
      city: runner.city,
      club: runner.club,
      split: formatTime(splitTime),
      category: category
    };
  };
  
  var legs = { };
  var lastSplit = null;
  categories.forEach(function(category) {        
    category.runners.forEach(function(runner) {
      var lastTime = null;
      var lastControl = 'St';
      runner.splits.forEach(function(split) {
        var control = split.code;
        var time = split.time;
        var code = lastControl + '-' + control;
        if (!legs[code]) {
          legs[code] = {
            id: code,
            from: lastControl,
            to: control,
            categories: { },
            runners: []
          };
        }
        if (isValid(time) && (lastTime == null || isValid(lastTime))) {
          var splitTime = lastTime !== null ? parseTime(time) - parseTime(lastTime) : parseTime(time);
          legs[code].runners.push(createRankingEntry(runner, category.name, splitTime));
          legs[code].categories[category.name] = true;
          lastSplit = split;
        }
      
        lastControl = control;
        lastTime = time;
      });
    });
  });
  
  // convert legs hash into array
  var result = [];
  Object.keys(legs).forEach(function(code) {
    var leg = legs[code];
    leg.runners.sort(function(s1, s2) {
      return parseTime(s1.split) - parseTime(s2.split);
    });
    leg.categories = Object.keys(leg.categories);
    leg.errorFrequency = Math.round(100 * 10 / leg.runners.length);    
    result.push(leg);
  });
  result.sort(legSort);
  
  var runners = { };
  categories.forEach(function(c) {
    var category = parseRanking(JSON.parse(JSON.stringify(c)));
    category.runners.forEach(function(runner) {
      runners[runner.id] = runner;
    });
  });
  
  result.forEach(function(leg) {
    var timeLosses = 0;
    
    // TODO: avoid defining legs without runners?!
    var fastest = leg.runners.length > 0 ? parseTime(leg.runners[0].split) : 0;
    
    leg.runners.forEach(function(runner, idx) {
      var r = runners[runner.id];
      var s = r.splits.find(function(split) { return leg.id === split.leg; });
      if (s && s.timeLoss) {
        timeLosses += 1;
        runner.timeLoss = s.timeLoss;
      }
      
      if (idx > 0) {
        runner.splitBehind = '+' + formatTime(parseTime(runner.split) - fastest);
      }
      
      if (idx === 0) {
        runner.splitRank = 1;
      } else {
        var prev = leg.runners[idx - 1];
        if (prev.split === runner.split) {
          runner.splitRank = prev.splitRank;
        } else {
          runner.splitRank = idx + 1;
        }
      }
    });
    
    if (leg.runners.length > 0) {
      leg.errorFrequency = Math.round(100 * timeLosses / leg.runners.length);
    }
  });
      
  result.sort(function(l1, l2) {
    return l2.errorFrequency - l1.errorFrequency;
  });
  
  return result;
}

function isValid(value) {
  return value !== '-' && value !== 's' && parseTime(value) !== null;
}

function legOrdinal(id) {
  var split = id.split('-');
  return controlOrdinal(split[0]) * 1000 + controlOrdinal(split[1]);
} 

function controlOrdinal(id) {
  if (id === 'St') {
    return -1000;
  } else if (id === 'Zi') {
    return 1000;
  } else {
    return parseInt(id, 10);
  }
}

function legSort(l1, l2) {
  return legOrdinal(l1.id) - legOrdinal(l2.id);
}
