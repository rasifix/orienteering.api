/*
 * Copyright 2015-2026 Simon Raess
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
import { Request, Response } from "express";
import solvEvents, { Event } from "../services/solv-events.js";
import picoEvents from "../services/picoevents.js";

export default function (req: Request, res: Response) {
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  Promise.all([solvEvents(year), picoEvents(year)]).then((resolved) => {
    const events: Event[] = [...resolved[0], ...resolved[1]];
    events.sort((e1: Event, e2: Event) => {
      return e2.date.localeCompare(e1.date);
    });

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Cache-Control", "max-age=60");
    res.json({ events: events });
  }).catch((error) => {
    res.status(500);
    res.json({
      statusCode: 500,
      message: error.message || 'Failed to load events'
    });
  });
}
