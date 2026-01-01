/*
 * Copyright 2025 Simon Raess
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

module.exports = function () {
  return axios
    .get("https://results.picoevents.ch/api/liveevents.php")
    .then(function (response) {
      if (response.status !== 200) {
        res.status(500);
        res.json({ error: "backend server reported a problem" });
        return;
      }

      var json = response.data;

      return json.liveevents.map(function (entry) {
        return {
          id: entry.folder,
          name: entry.name,
          date: entry.date,
          map: entry.map,
          club: entry.organizer,
          laststart: entry.laststart,
          source: "picoevents",
          _link: "http://ol.zimaa.ch/api/events/picoevents/" + entry.folder,
        };
      });
    });
}
