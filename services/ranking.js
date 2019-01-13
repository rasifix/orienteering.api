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

var parseTime = require('./time').parseTime;
var formatTime = require('./time').formatTime;

function invalidTime(time) {
  return time === '-' || time === 's';
}

function sum(a1, a2) {
  return a1 + a2;
}

module.exports.parseRanking = function(json) {
  var result = {
    name: json.name,
    distance: json.distance,
    ascent: json.ascent,
    controls: json.controls
  };

  // define the legs
  // note: this won't work if there are "unfair" courses
  result.legs = json.runners[0].splits.map(function(split, idx, splits) {
    var from = idx === 0 ? 'St' : splits[idx - 1].code;
    return {
      code: from + '-' + split.code,
      runners: []
    };
  });
    
  result.runners = json.runners.map(function(runner) {
    return {
      id: runner.id,
      // runners have only a fullname in the interface!
      fullName: runner.fullName,
      time: runner.time,
      yearOfBirth: runner.yearOfBirth,
      city: runner.city,
      club: runner.club,
      category: runner.category,
      splits: runner.splits.map(function(split, idx) {
        var splitTime = null;
        if (split.time === '-') {
          splitTime = '-';
        } else if (idx === 0) {
          splitTime = formatTime(parseTime(split.time));
        } else {
          if (parseTime(split.time) === null || parseTime(runner.splits[idx - 1].time) === null) {
            splitTime = '-';
          } else {
            splitTime = formatTime(parseTime(split.time) - parseTime(runner.splits[idx - 1].time));
          }
        }
        
        if (parseTime(splitTime) < 0) {
          console.log(runner.fullName + ' has invalid split time at index ' + idx);
        }
        
        return {
          number: idx + 1,
          code: split.code,
          time: split.time === 's' ? '-' : split.time,
          split: splitTime
        };
      })
    };
  });
  
  // add the runners
  result.runners.forEach(function(runner) {
    runner.splits.forEach(function(split, idx) {
      if (split.split !== '-') {
        if (result.legs.length <= idx) {
          console.log('more splits than legs on runner ' + runner.fullName + '! ' + result.legs.length + ' <= ' + idx);
          return;
        }

        // NOTE: this doesn't work on non reorganized data
        result.legs[idx].runners.push({
          id: runner.id,
          fullName: runner.fullName,
          yearOfBirth: runner.yearOfBirth,
          club: runner.club,
          city: runner.city,
          category: runner.category,
          split: split.split
        });
      }
    });
  });
  
  // sort the runners per leg
  result.legs.forEach(function(leg) {
    leg.runners.sort(function(r1, r2) {
      return parseTime(r1.split) - parseTime(r2.split);
    });
    
    // calculate the ideal time
    var selected = leg.runners.slice(0, Math.min(leg.runners.length, 5)).map(function(runner) { return parseTime(runner.split); });
    
    // only if there are valid splits for this leg
    if (selected.length > 0) {
      leg.idealSplit = Math.round(selected.reduce(sum) / selected.length);
    }
    
    // only if there are valid splits for this leg
    if (leg.runners.length > 0) {
      leg.fastestSplit = parseTime(leg.runners[0].split);
      leg.runners.slice(1).forEach(function(runner) {
        runner.splitBehind = '+' + formatTime(parseTime(runner.split) - leg.fastestSplit);
      });
      
      leg.runners[0].splitRank = 1;
      leg.runners.forEach(function(runner, idx, arr) {
        if (idx > 0) {
          if (runner.split === arr[idx - 1].split) {
            runner.splitRank = arr[idx - 1].splitRank;
          } else {
            runner.splitRank = idx + 1;
          }
        }
      });
    }    
  });

  // calculate the ideal time [s]
  if (result.legs.length > 0) {
    result.idealTime = result.legs.map(function(leg) { return leg.idealSplit; }).reduce(sum);
    
    // visualization property - leg.position [0..1), leg.weight[0..1)
    result.legs.forEach(function(leg, idx) {
      leg.weight = leg.idealSplit / result.idealTime;
      if (idx === 0) {
        leg.position = leg.weight;
      } else {
        leg.position = result.legs[idx - 1].position + leg.weight;
      }
    });
  }
  
  // calculate how much time a runner lost on a leg
  result.runners.forEach(function(runner) {
    runner.splits.forEach(function(split, idx) {
      if (idx >= result.legs.length) {
        // why would this happen?
        return;
      }
      
      // NOTE: index based access does not work for unfair legs
      split.splitBehind = split.split === '-' || split.split === 's' ? '-' : formatTime(parseTime(split.split) - result.legs[idx].fastestSplit);      
      
      // performance index for runner leg
      if (split.split !== '-' && split.split !== 's') {
        split.perfidx = Math.round(1.0 * result.legs[idx].idealSplit / parseTime(split.split) * 100);
      }
            
      // leg id
      split.leg = (idx > 0 ? runner.splits[idx - 1].code : 'St') + '-' + runner.splits[idx].code;
      
      // visualization property - split.position [0..1)
      split.position = result.legs[idx].position;
    });
  });
  
  // calculate the rank
  result.runners.forEach(function(runner, idx) {
    if (idx === 0) {
      runner.rank = 1;
    } else {
      var prev = result.runners[idx - 1];
      if (prev.time === runner.time) {
        runner.rank = prev.rank;
      } else if (parseTime(runner.time)) {
        runner.rank = idx + 1;
      }
    }
  });
  
  // extract the runner leg at index idx for each runner
  var extractLegs = function(idx) {
    var arr = [];
    result.runners.forEach(function(runner) {
      var split = runner.splits[idx];
      if (!split) {
        console.log('invalid split @ ' + idx + ' for runner ' + runner.fullName);
      }
      if (split.split !== '-') {
        arr.push({
          id: runner.id,
          split: split.split,
          time: split.time,
          code: split.code
        });
      }
    });
    return arr;
  };  
  
  result.legs.forEach(function(leg, idx) {
    // get all the splits for the current leg
    var runnerLegs = extractLegs(idx);
    
    // sort by split time
    runnerLegs.sort(function(l1, l2) {
      return parseTime(l1.split) - parseTime(l2.split);
    });
    
    // assign split rank
    var lastSplit = null;
    var lastRunner = null;
    runnerLegs.forEach(function(runnerLeg, pos) {
      var currentRunner = result.runners.find(function(runner) { return runner.id === runnerLeg.id; });
      if (lastSplit != null && parseTime(lastSplit) === parseTime(runnerLeg.split)) {
        currentRunner.splits[idx].splitRank = lastRunner.splits[idx].splitRank;
      } else {
        currentRunner.splits[idx].splitRank = pos + 1;
      }
      lastSplit = runnerLeg.split;
      lastRunner = currentRunner;
    });
    
    // resort by run time
    runnerLegs.sort(function(l1, l2) {
      return parseTime(l1.time) - parseTime(l2.time);
    });
        
    // assign overall rank
    var pos = 1;
    var lastTime = null;
    
    runnerLegs.forEach(function(runnerLeg) {
      var currentRunner = result.runners.find(function(runner) { return runner.id === runnerLeg.id; });
      if (lastTime == null || parseTime(lastTime) === parseTime(runnerLeg.time)) {
        currentRunner.splits[idx].overallRank = pos;
      } else {
        currentRunner.splits[idx].overallRank = ++pos;
      }
      lastTime = runnerLeg.time;
    });
  });
  
  result.legs.forEach(function(leg, idx) {
    if (idx === 0) {
      leg.fastestTime = formatTime(leg.fastestSplit);
      leg.idealTime = formatTime(leg.idealSplit);
    } else {
      leg.fastestTime = formatTime(parseTime(result.legs[idx - 1].fastestTime) + leg.fastestSplit);
      leg.idealTime = formatTime(parseTime(result.legs[idx - 1].idealTime) + leg.idealSplit);
    }
  });
  
  result.runners.forEach(function(runner) {
    // calculate overall time behind leader
    runner.splits.forEach(function(split, splitIdx) {
      if (splitIdx >= result.legs.length) {
        return;
      }
      
      if (!invalidTime(split.time)) {
        var leader = result.runners.map(function(r) {
          return {
            time: r.splits[splitIdx].time,
            rank: r.splits[splitIdx].overallRank
          };
        }).find(function(split) {
          return split.rank === 1;
        });
        
        // no leader for this leg?!
        if (leader) {
          var leaderTime = leader.time;
          if (parseTime(split.time) !== null) {
            var t = parseTime(split.time) - parseTime(leaderTime);
            if (t < 0) {
              console.log(split.time + ' < ' + leader.time);
              console.log(leader.rank);
            }
            split.overallBehind = formatTime(t);
            split.fastestBehind = formatTime(parseTime(split.time) - parseTime(result.legs[splitIdx].fastestTime));
            split.idealBehind = formatTime(parseTime(split.time) - parseTime(result.legs[splitIdx].idealTime));
          } else {
            split.overallBehind = '-';
            split.fastestBehind = '-';
            split.idealBehind = '-';
          }
        }
      }
    });
    
    var perfindices = runner.splits.map(function(split) { return split.perfidx; }).sort(function(s1, s2) { return s1 - s2; });
    var middle = null;
    if (perfindices.length % 2 === 1) {
      middle = perfindices[Math.floor(perfindices.length / 2)];
    } else {
      middle = (perfindices[perfindices.length / 2] + perfindices[perfindices.length / 2 + 1]) / 2;
    }
    
    runner.errorTime = 0;
    runner.splits.forEach(function(split) {
      var errorFreeTime = Math.round(parseTime(split.split) * (split.perfidx / middle));
      var errorThresholdPct = 1.2;
      var errorThreshold = 10;
      if (parseTime(split.split) / errorFreeTime > errorThresholdPct && (parseTime(split.split) - errorFreeTime) > errorThreshold) {        
        split.timeLoss = formatTime(parseTime(split.split) - errorFreeTime);
        runner.errorTime += parseTime(split.timeLoss);
      }
    });
    runner.errorTime = formatTime(runner.errorTime);
  });
  
  return result;
}

