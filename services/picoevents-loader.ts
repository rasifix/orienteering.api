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
import { formatTime } from './time.ts';
import picoEvents from './picoevents.ts';
import { Event, Category, Runner, LoaderCallback, ErrorCallback } from '../types/index.ts';

function clean(value: string | undefined): string | undefined {
  if (value) {
    return value.startsWith('"') && value.endsWith('"')
      ? value.substring(1, value.length - 1)
      : value;
  }
  return value;
}

function parseCsv(body: string): Event {
  // convert CSV to JSON
  const categories: { [key: string]: Category } = {};
  const result: Event = {
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

  lines.forEach((line, idx) => {
    const tokens = line.split(",");
    if (tokens.length < 50) {
      return;
    }

    const name = tokens[9];

    if (name.indexOf("TW") !== -1 || name.indexOf("TM") !== -1) {
      return;
    }

    let category = categories[name];
    if (!category) {
      category = {
        name: name,
        distance: 0,
        ascent: 0,
        controls: parseInt(tokens[noOfSplitsIdx]),
        runners: [],
      } as any;
      categories[name] = category;
      result.categories.push(category);
    }

    const status = tokens[statusIdx];
    if (status !== "OK") {
      return;
    }

    const startTime = parseInt(tokens[startTimeIdx]);
    const runner: Runner = {
      id: parseInt(tokens[sortKeyIdx]) || 0,
      fullName:
        clean(tokens[firstNameIdx]) + " " + clean(tokens[familyNameIdx]),
      yearOfBirth: parseInt(tokens[yobIdx]) || undefined,
      city: clean(tokens[townIdx]),
      club: clean(tokens[clubIdx]),
      time: formatTime(parseInt(tokens[runtimeNetIdx])),
      starttime: formatTime(startTime),
      splits: [],
    };

    for (let i = termIdx + 3; i < tokens.length - 2; i += 2) {
      const time = tokens[i + 1]
        ? formatTime(parseInt(tokens[i + 1]) - startTime)
        : "";
      const code = tokens[i] === "9999" ? "Zi" : tokens[i];
      runner.splits!.push({ code, time: time });
    }

    category.runners.push(runner);
  });

  return result;
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
