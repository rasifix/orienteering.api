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
import axios from 'axios';
import { formats } from '@rasifix/orienteering-utils';
import { Competition } from '@rasifix/orienteering-utils/lib/model/competition';
import picoEvents from './picoevents.ts';
import { LoaderCallback, ErrorCallback } from '../types/index.ts';

function parseCsv(body: string): Competition {
  // Use library's OwareFormat parser (PicoEvents uses Oware format)
  const parser = new formats.oware.OwareFormat();
  return parser.parse(body);
}

const loadLiveEvents = (id: string, callback: LoaderCallback, errorCallback: ErrorCallback): void => {
  picoEvents().then((events) => {
    const event = events.find((ev) => {
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
      .then((response) => {
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

export { parseCsv, loadLiveEvents };
