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
var formatTime = require("./time").formatTime;
var picoEvents = require("./picoevents");

function clean(value) {
  if (value) {
    return value.startsWith('"') && value.endsWith('"')
      ? value.substring(1, value.length - 1)
      : value;
  }
  return value;
}

function parseCsv(body) {
  // convert CSV to JSON
  var categories = {};
  var result = {
    categories: [],
  };

  const lines = body.split(/\r?\n/);
  const eventHeader = lines.splice(0, 1);

  const header = lines.splice(0, 1)[0].split(",");

  const sortKeyIdx = header.indexOf("[SORTKEY]");
  const statusIdx = header.indexOf("[IOFRESSTATTEXT]");
  const startTimeIdx = header.indexOf("[STARTFULLPREC]");
  const noOfSplitsIdx = header.indexOf("[NOFSPLITS]");
  const termIdx = header.indexOf("[TERM]");
  const firstNameIdx = header.indexOf("[FIRSTNAME]");
  const familyNameIdx = header.indexOf("[FAMILYNAME]");
  const yobIdx = header.indexOf("[YOB]");
  const townIdx = header.indexOf("[TOWN]");
  const clubIdx = header.indexOf("[CLUB]");
  const runtimeNetIdx = header.indexOf("[RUNTIMENET]");

  lines.forEach(function (line, idx) {
    var tokens = line.split(",");
    if (tokens.length < 50) {
      return;
    }

    var name = tokens[9];

    if (name.indexOf("TW") !== -1 || name.indexOf("TM") !== -1) {
      return;
    }

    var category = categories[name];
    if (!category) {
      category = {
        name: name,
        distance: 0,
        ascent: 0,
        controls: parseInt(tokens[noOfSplitsIdx]),
        runners: [],
      };
      categories[name] = category;
      result.categories.push(category);
    }

    var status = tokens[statusIdx];
    if (status !== "OK") {
      return;
    }

    var startTime = parseInt(tokens[startTimeIdx]);
    var runner = {
      id: tokens[sortKeyIdx],
      fullName:
        clean(tokens[firstNameIdx]) + " " + clean(tokens[familyNameIdx]),
      yearOfBirth: tokens[yobIdx],
      city: clean(tokens[townIdx]),
      club: clean(tokens[clubIdx]),
      time: formatTime(parseInt(tokens[runtimeNetIdx])),
      startTime: formatTime(startTime),
      splits: [],
    };

    for (var i = termIdx + 3; i < tokens.length - 2; i += 2) {
      var time = tokens[i + 1]
        ? formatTime(parseInt(tokens[i + 1]) - startTime)
        : "";
      var code = tokens[i] === "9999" ? "Zi" : tokens[i];
      runner.splits.push({ code, time: time });
    }

    category.runners.push(runner);
  });

  return result;
}

module.exports.parseCsv = parseCsv;
module.exports.loadLiveEvents = function (id, callback, errorCallback) {
  picoEvents().then(function (events) {
    var event = events.find(function (ev) {
      return ev.id == id;
    });
    if (!event) {
      console.error("event with id " + id + " does not exist");
      console.log("the following events exist", events.map(e => e.id));
      errorCallback({
        statusCode: 404,
        message: "event with id " + id + " does not exist",
      });
      return;
    }
    if (new Date(event.date + "T" + event.laststart) > new Date()) {
      console.log("not all runners of event " + id + " have started yet: " + event.date + "T" + event.laststart, new Date());
      errorCallback({
        statusCode: 404,
        message: "not all runners of event " + id + " have started yet: " + event.date + "T" + event.laststart,
      });
      return;
    }

    axios
      .get("https://results.picoevents.ch/" + id + "/results.csv", {
        responseType: "arraybuffer",
        responseEncoding: "binary",
      })
      .then(function (response) {
        if (response.status === 404) {
          console.error("event with id " + id + " does not exist");
          errorCallback({
            statusCode: 404,
            message: "event with id " + id + " does not exist",
          });
          return;
        }
        callback(parseCsv(response.data.toString("latin1")));
      });
  });
};
