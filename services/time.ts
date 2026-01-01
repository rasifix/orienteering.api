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

export function reformatTime(str: string): string {
  // normalize missing punch time
  if (str === '-' || str === '-----') {
    return '-';
  }
  
  // normalize not working control
  if (str === '0.00') {
    return 's';
  }
  
  // "special" total times (like wrong or missing control)
  if (str.indexOf(':') === -1) {
    return str;
  }
  
  const splits = str.split(':');
  let seconds: number;
  
  if (splits.length === 3) {
    seconds = parseInt(splits[0], 10) * 3600 + parseInt(splits[1], 10) * 60 + parseInt(sanitize(splits[2]), 10);
  } else if (splits.length === 2) {
    seconds = parseInt(splits[0], 10) * 60 + parseInt(sanitize(splits[1]), 10);
  } else {
    seconds = 0;
  }
  
  return formatTime(seconds);
}

const regex = /(-)?[0-9]?[0-9]:[0-9][0-9](:[0-9][0-9])?/;

export function parseTime(str: string | null | undefined): number | null {
  if (!str) {
    return null;
  } else if (typeof str !== 'string') {
    return null;
  } else if (!regex.test(str)) {
    return null;
  }

  const split = str.split(":");
  let result: number | null = null;
  if (split.length === 2) {
    const negative = split[0][0] === '-';
    const minutes = parseInt(split[0], 10);
    result = (negative ? -1 : 1) * (Math.abs(minutes) * 60 + parseInt(split[1], 10));
  } else if (split.length === 3) {
    result = parseInt(split[0], 10) * 3600 + parseInt(split[1], 10) * 60 + parseInt(split[2], 10);
  }
  
  return result !== null && isNaN(result) ? null : result;
}

export function formatTime(seconds: number | null | undefined): string {
  if (seconds === 0) {
    return "0:00";
  } else if (!seconds) {
    return "-";
  }

  if (seconds >= 0) {
    if (seconds >= 3600) {
      return Math.floor(seconds / 3600) + ":" + pad(Math.floor(seconds / 60) % 60) + ":" + pad(seconds % 60);
    }
    return Math.floor(seconds / 60) + ":" + pad(seconds % 60);
  } else {
    return "-" + Math.floor(-seconds / 60) + ":" + pad(-seconds % 60);
  }
}

function pad(value: number): string {
  return value < 10 ? '0' + value : '' + value;
}
    
function sanitize(value: string): string {
  const comma = value.indexOf(',');
  if (comma != -1) {
    return value.substring(0, comma);
  } else {
    return value;
  }
}
