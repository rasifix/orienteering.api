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

interface PicoEvent {
  folder: string;
  name: string;
  date: string;
  map: string;
  organizer: string;
  laststart: string;
}

interface PicoEventsResponse {
  liveevents: PicoEvent[];
}

interface EventSummary {
  id: string;
  name: string;
  date: string;
  map: string;
  club: string;
  laststart: string;
  source: string;
  _link: string;
}

export default function picoEvents(): Promise<EventSummary[]> {
  return axios
    .get<PicoEventsResponse>("https://results.picoevents.ch/api/liveevents.php")
    .then((response) => {
      if (response.status !== 200) {
        throw new Error('backend server reported a problem');
      }

      const json = response.data;

      return json.liveevents.map((entry) => {
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
