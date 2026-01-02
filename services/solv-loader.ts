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
    
    callback(competition);
  });
};

export default solvLoader;
