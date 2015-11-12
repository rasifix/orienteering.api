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

module.exports = function(req, res) {
  var year = parseInt(req.query.year) || new Date().getFullYear();
  request({ 
    url:'http://o-l.ch/cgi-bin/fixtures', 
    qs: {
      mode: 'results',
      year: year,
      json: 1
    }
  }, function(error, response, body) {
    if (response.statusCode !== 200) {
      res.status(500);
      res.json({ error: 'backend server reported a problem' });
      return;
    }
    
    var json = JSON.parse(body.replace(/\t/g, ' '));    
    var events = json['ResultLists'].filter(function(entry) { 
      return entry['EventMap']; 
    }).filter(function(entry) { 
      return entry['ResultType'] === 0; 
    }).map(function(entry) {
      var row = {
        id: entry['ResultListID'],
        name: entry['EventName'],
        date: entry['EventDate'],
        map: entry['EventMap'],
        club: entry['EventClub'],
        source: 'solv',
        _link: 'http://ol.zimaa.ch/api/events/solv/' + entry['ResultListID']
      }
      if (entry['SubTitle']) {
        row.subtitle = entry['SubTitle'];
      }
      return row;
    });
    
    events.sort(function(e1, e2) {
      return e2.date.localeCompare(e1.date);
    });
    
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'max-age=60');
    res.json({ events:events });
  });
}
