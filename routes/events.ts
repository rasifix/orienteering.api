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
import { Request, Response } from 'express';
import axios from 'axios';
import picoEvents from '../services/picoevents.ts';

interface SolvEvent {
  ResultListID: string;
  EventName: string;
  EventDate: string;
  EventMap: string;
  EventClub: string;
  SubTitle?: string;
  ResultType: number;
}

interface SolvResponse {
  ResultLists: SolvEvent[];
}

function solvEvents(year: number) {
  return axios
    .get<SolvResponse>("https://o-l.ch/cgi-bin/fixtures", {
      params: {
        mode: "results",
        year: year,
        json: 1,
      },
    })
    .then((response) => {
      if (response.status !== 200) {
        throw new Error('backend server reported a problem');
      }

      const json = response.data;
      return json["ResultLists"]
        .filter((entry) => {
          return entry["EventMap"];
        })
        .filter((entry) => {
          return entry["ResultType"] === 0;
        })
        .map((entry) => {
          const row: any = {
            id: entry["ResultListID"],
            name: entry["EventName"],
            date: entry["EventDate"],
            map: entry["EventMap"],
            club: entry["EventClub"],
            source: "solv",
            _link:
              "http://ol.zimaa.ch/api/events/solv/" + entry["ResultListID"],
          };
          if (entry["SubTitle"]) {
            row.subtitle = entry["SubTitle"];
          }
          return row;
        });
    });
}

export default function (req: Request, res: Response) {
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  Promise.all([solvEvents(year), picoEvents()]).then((resolved) => {
    const events = [].concat(resolved[0] as any).concat(resolved[1] as any);
    events.sort((e1: any, e2: any) => {
      return e2.date.localeCompare(e1.date);
    });

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Cache-Control", "max-age=60");
    res.json({ events: events });
  });
}
