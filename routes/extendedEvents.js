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

module.exports = function(req, res) {
  var year = parseInt(req.query.year) || new Date().getFullYear();
  request({
    url:'http://o-l.ch/cgi-bin/fixtures',
    encoding: 'binary',
    qs: {
      year: year,
      csv: 1
    }
  }, function(error, response, body) {
    if (response.statusCode !== 200) {
      res.status(500);
      res.json({ error: 'backend server reported a problem' });
      return;
    }

    var buffer = new Buffer(body, 'binary');
    var conv = new iconv.Iconv('windows-1252', 'utf8');
    var converted = conv.convert(body).toString();

    var lines = body.split("\n");
    var titles  = null;
    var events = [];
    for(var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if(i === 0) {
            titles = line.split(";");
        }
        else {
            if(line.trim()) {
                events.push(parseLine(line, titles));
            }
        }

    }

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

      var possibleResults = json['ResultLists'].filter(function(entry) {
        return entry['EventMap'];
      }).filter(function(entry) {
        return entry['ResultType'] === 0;
      });

      for(var i in events) {
        var event = events[i];
        var result = possibleResults.filter(function(entry){
          return event.idSource == entry.UniqueID;
        })
        if(result.length > 0) {
          event.resultsId = result[0].ResultListID;
          var modification = result[0].ResultModTime;
          var year = modification.substring(0,4);
          var month = modification.substring(4,6) / 1 - 1;
          var day = modification.substring(6,8);
          var hours = modification.substring(9,11);
          var minutes = modification.substring(11,13) / 1 + 1;
          event.lastModification = new Date(year, month, day, hours, minutes, 0, 0).getTime();
        }
      }

      if(req.query.lastModification) {
          events = events.filter(function(e) {
              return e.lastModification > req.query.lastModification / 1;
          });
      }

      res.set('Access-Control-Allow-Origin', '*');
      res.set('Cache-Control', 'max-age=60');
      res.json({ events:events });
    })

  });
}

function parseLine(line, titles) {
    var values = line.split(";");
    var object = {};
    for(var j = 0; j < values.length; j++) {
        object[titles[j]] = values[j];
    }

    var map = {
        event_name: "name",
        unique_id: "idSource",
        event_link: "url",
        club: "organiser",
        location: "eventCenter"

    }

    for(var k in map){
        object[map[k]] = object[k];
        delete object[k];
    }
    object.source = 'solv'

    if(object.date) {
        object.date = Date.parse(object.date);
    }
    if(object.type) {
        var type = object.type;
        if(["NOM","LOM", "MOM", "SPM", "SOM", "TOM"].indexOf(object.type) >= 0) {
            // Championship
            object.classification = 1;
        }
        if(type == "**A") {
            // National
            object.classification = 2
        }

        if(!object.classification){
            // Default regional
            //TODO could be special event e.g. SOW
            object.classification = 3;
        }
    }
    if( object.coord_x && object.coord_y) {
        object.eventCenterLatitude = CHtoWGSlat( object.coord_x, object.coord_y);
        object.eventCenterLongitude = CHtoWGSlng(object.coord_x,object.coord_y);
        delete object.coord_x;
        delete object.coord_y;
    }

    object.day = object.day_night == "day";
    object.night = object.day_night == "night";
    delete object.day_night;

    if(object.last_modification) {
        object.lastModification = Date.parse(object.last_modification);
    }
    delete object.last_modification;

    return object;
}

// Convert CH y/x to WGS lat
function CHtoWGSlat(y, x) {

  // Converts militar to civil and  to unit = 1000km
  // Axiliary values (% Bern)
  var y_aux = (y - 600000)/1000000;
  var x_aux = (x - 200000)/1000000;

  // Process lat
  lat = 16.9023892
       +  3.238272 * x_aux
       -  0.270978 * Math.pow(y_aux,2)
       -  0.002528 * Math.pow(x_aux,2)
       -  0.0447   * Math.pow(y_aux,2) * x_aux
       -  0.0140   * Math.pow(x_aux,3);

  // Unit 10000" to 1 " and converts seconds to degrees (dec)
  lat = lat * 100/36;

  return lat;

}

// Convert CH y/x to WGS long
function CHtoWGSlng(y, x) {

  // Converts militar to civil and  to unit = 1000km
  // Axiliary values (% Bern)
  var y_aux = (y - 600000)/1000000;
  var x_aux = (x - 200000)/1000000;

  // Process long
  lng = 2.6779094
        + 4.728982 * y_aux
        + 0.791484 * y_aux * x_aux
        + 0.1306   * y_aux * Math.pow(x_aux,2)
        - 0.0436   * Math.pow(y_aux,3);

  // Unit 10000" to 1 " and converts seconds to degrees (dec)
  lng = lng * 100/36;

  return lng;

}
