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
import { formatTime, ranking, parseTime } from '@rasifix/orienteering-utils';
import { Category, Runner } from '../types/index';
import { RankingRunner } from '@rasifix/orienteering-utils/lib/utils/ranking';

export interface Leg {
  id: string;
  from: string;
  to: string;
  categories: { [name: string]: boolean };
  runners: LegRunner[];
  errorFrequency: number;
}

export interface LegRunner {
  id: string;
  fullName: string;
  yearOfBirth?: number | string;
  city?: string;
  club?: string;
  split: string;
  splitBehind?: string;
  splitRank?: number;
  category: string;
  timeLoss?: string;
}

export interface LegSummary {
  id: string;
  from: string;
  to: string;
  categories: string[];
  runners: number;
  errorFrequency: number;
}

export function buildLegs(categories: Category[]): LegSummary[] {
  const legs = buildDetailedLegs(categories);
  
  return legs.map((leg) => ({
    id: leg.id,
    from: leg.from,
    to: leg.to,
    categories: Object.keys(leg.categories),
    runners: leg.runners.length,
    errorFrequency: leg.errorFrequency
  }));
}

export function buildDetailedLegs(categories: Category[]) {
  const createRankingEntry = (runner: Runner, category: string, splitTime: number): LegRunner => {
    return {
      id: runner.id,
      fullName: runner.fullName,
      yearOfBirth: runner.yearOfBirth,
      city: runner.city,
      club: runner.club,
      split: formatTime(splitTime),
      category: category
    };
  };
  
  const legs: { [key: string]: Leg } = {};
  
  categories.forEach((category) => {        
    category.runners.forEach((runner) => {
      let lastTime: string | null = null;
      let lastControl = 'St';
      runner.splits!.forEach((split) => {
        const control = split.code;
        const time = split.time || '';
        const code = lastControl + '-' + control;
        if (!legs[code]) {
          legs[code] = {
            id: code,
            from: lastControl,
            to: control,
            categories: {},
            errorFrequency: 0,
            runners: []
          };
        }
        if (isValid(time) && (lastTime === null || isValid(lastTime))) {
          const splitTime = lastTime !== null 
            ? (parseTime(time) ?? 0) - (parseTime(lastTime) ?? 0) 
            : (parseTime(time) ?? 0);
          legs[code].runners.push(createRankingEntry(runner, category.name, splitTime));
          legs[code].categories[category.name] = true;
        }
      
        lastControl = control;
        lastTime = time;
      });
    });
  });
  
  const result: Leg[] = [];
  Object.keys(legs).forEach((code) => {
    const leg = legs[code];
    leg.runners.sort((s1: LegRunner, s2: LegRunner) => {
      return (parseTime(s1.split) ?? 0) - (parseTime(s2.split) ?? 0);
    });
    leg.errorFrequency = 0;
    if (leg.runners.length > 0) {
      result.push(leg);
    }
  });
  
  const runners: { [id: string]: RankingRunner } = {};
  categories.forEach((c) => {
    const runnersFormatted = c.runners.map(r => ({
      ...r,
      id: String(r.id),
      category: c.name,
      startTime: r.startTime || '',
      yearOfBirth: r.yearOfBirth?.toString(),
      splits: r.splits || []
    }));
    const categoryParsed = ranking.parseRanking(runnersFormatted);
    categoryParsed.runners.forEach((runner) => {
      runners[runner.id] = runner;
    });
  });
  
  result.forEach((leg) => {
    let timeLosses = 0;
    const fastest = leg.runners.length > 0 ? (parseTime(leg.runners[0].split) ?? 0) : 0;
    
    leg.runners.forEach((runner, idx: number) => {
      const r = runners[runner.id];
      const s = r.splits.find((split) => leg.id === split.legCode);
      if (s && s.timeLoss) {
        timeLosses += 1;
        runner.timeLoss = formatTime(s.timeLoss);
      }
      
      if (idx > 0) {
        runner.splitBehind = '+' + formatTime((parseTime(runner.split) ?? 0) - fastest);
      }
      
      if (idx === 0) {
        runner.splitRank = 1;
      } else {
        const prev = leg.runners[idx - 1];
        if (prev.split === runner.split) {
          runner.splitRank = prev.splitRank;
        } else {
          runner.splitRank = idx + 1;
        }
      }
    });
    
    if (leg.runners.length > 0) {
      leg.errorFrequency = Math.round(100 * timeLosses / leg.runners.length);
    }
  });
      
  result.sort((l1, l2) => {
    return l2.errorFrequency - l1.errorFrequency;
  });
  
  return result.map((leg) => ({
    id: leg.id,
    from: leg.from,
    to: leg.to,
    categories: Object.keys(leg.categories),
    runners: leg.runners,
    errorFrequency: leg.errorFrequency
  }));
}

function isValid(value: string): boolean {
  return value !== '-' && value !== 's' && parseTime(value) !== null;
}
