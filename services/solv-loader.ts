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
import { reformatTime, parseTime } from './time.ts';
import { Event, Category, Runner, LoaderCallback, ErrorCallback } from '../types/index.ts';

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
    
    // convert CSV to JSON
    const categories: { [key: string]: Category } = {};
    const result: Event = {
      categories: []
    };
    
    const lines = body.split('\n');
    const header = lines.splice(0, 1)[0].split(';');
    
    lines.forEach((line: string, idx: number) => {
      const tokens = line.split(';');
      if (tokens.length < 11) {
        return;
      }
      
      const name = tokens[0];
      let category = categories[name];
      if (!category) {
        category = {
          name: name,
          distance: Math.round(parseFloat(tokens[1]) * 1000),
          ascent: tokens[2],
          controls: parseInt(tokens[3]),
          runners: []
        } as any;
        categories[name] = category;
        result.categories.push(category);
      }
      
      const runner: Runner = {
        id: String(idx + 1),
        fullName: tokens[5],
        yearOfBirth: parseInt(tokens[6]) || undefined,
        city: tokens[7] || undefined,
        club: tokens[8] || undefined,
        time: reformatTime(tokens[9]),
        starttime: tokens[10],
        splits: []
      };

      if ((tokens.length - 12) < (category as any).controls * 2) {
        // some crappy SOLV data...
        console.log('fix crappy data from SOLV - not enough tokens on line for runner ' + runner.fullName);
        for (let i = tokens.length; i < (category as any).controls * 2 + 12; i++) {
          if (i % 2 === 0) {
            tokens[i] = category.runners.length === 0 ? '???' : category.runners[0].splits![(i - 12) / 2].code;
          } else {
            tokens[i] = '-';
          }
        }
      }
      
      for (let i = 12; i < tokens.length - 1; i += 2) {
        let time = reformatTime(tokens[i + 1]);
        if (runner.splits && runner.splits.length > 0 && parseTime(time)) {
          const prev = parseTime(runner.splits[runner.splits.length - 1].time);
          if (time === String(prev) || tokens[i + 1] === '0.00' || (parseTime(tokens[i + 1]) ?? 0) > 180 * 60) {
            // normalize valid manual punches
            time = 's';
          }
        }
        runner.splits!.push({ code: tokens[i], time: time });
      }
      
      category.runners.push(runner);
    });
    
    callback(result);
  });
};

export default solvLoader;
