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
import { LoaderCallback, ErrorCallback } from '../types/index.ts';
import solvEvents, { Event } from './solv-events.ts';

// Cache for SOLV events metadata
const eventsCache: { [year: number]: Event[] } = {};
let lastCacheUpdate: { [year: number]: number } = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const getEventMetadata = (id: string, callback: (event: Event | null) => void): void => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear + 1]; // Check current, previous, and next year
  const checkYear = (yearIndex: number): void => {
    if (yearIndex >= years.length) {
      callback(null);
      return;
    }
    
    const year = years[yearIndex];
    const now = Date.now();

    // Check if cache is valid
    if (eventsCache[year] && lastCacheUpdate[year] && (now - lastCacheUpdate[year] < CACHE_TTL)) {
      const event = eventsCache[year].find(e => e.id === id);
      if (event) {
        callback(event);
      } else {
        checkYear(yearIndex + 1);
      }
      return;
    }
    
    // Fetch events for this year
    solvEvents(year).then((events) => {
      eventsCache[year] = events;
      lastCacheUpdate[year] = now;
      
      const event = events.find(e => e.id === id);
      if (event) {
        callback(event);
      } else {
        checkYear(yearIndex + 1);
      }
    }).catch(() => {
      checkYear(yearIndex + 1);
    });
  };
  
  checkYear(0);
};

const solvLoader = (id: string, callback: LoaderCallback, errorCallback: ErrorCallback): void => {
  axios.get('http://o-l.ch/cgi-bin/results?type=rang&kind=all&zwizt=1&csv=1&rl_id=' + id, {
    responseType: 'arraybuffer',
    responseEncoding: 'binary'
  }).then((response) => {
    const body = response.data.toString('latin1');

    // interpret unknown event - SOLV does not properly do that for us...
    if (response.status === 404 || body.substring(0, 14) === '<!DOCTYPE html') {
      errorCallback({ 
        statusCode: 404,
        message: 'event with id ' + id + ' does not exist'
      });
      return;
    }
    
    // Use library's SolvFormat parser
    const parser = new formats.solv.SolvFormat();
    const competition = parser.parse(body);

    // load and cache solv events and use that to enrich the competition data
    getEventMetadata(id, (eventMetadata) => {
      if (eventMetadata) {
        // Enrich competition with metadata
        competition.name = eventMetadata.name;
        competition.date = eventMetadata.date;
        competition.startTime = eventMetadata.startTime;
        competition.map = eventMetadata.map;
      }
      
      callback(competition);
    });
  });
};

export default solvLoader;
