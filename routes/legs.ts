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
import { formatTime, ranking, parseTime } from '@rasifix/orienteering-utils';
import { EventLoader, Category } from '../types/index.ts';

export default function(loader: EventLoader) {
  return (req: Request, res: Response) => {
    const id = req.params.id;
    loader(id, (event) => {
      const legs = defineLegs(event.categories);
    
      res.json(legs);
    }, (error) => {
      res.status(error.statusCode);
      res.json(error);
    });
  };
}

function defineLegs(categories: Category[]) {
  // helper function to create ranking entry for runner
  const createRankingEntry = (runner: any, category: string, splitTime: number) => {
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
  
  const legs: any = {};
  let lastSplit = null;
  categories.forEach((category) => {        
    category.runners.forEach((runner) => {
      let lastTime: string | null = null;
      let lastControl = 'St';
      runner.splits!.forEach((split) => {
        const control = split.code;
        const time = split.time;
        const code = lastControl + '-' + control;
        if (!legs[code]) {
          legs[code] = {
            id: code,
            from: lastControl,
            to: control,
            categories: {},
            runners: []
          };
        }
        if (isValid(time) && (lastTime == null || isValid(lastTime))) {
          const splitTime = lastTime !== null ? (parseTime(time) ?? 0) - (parseTime(lastTime) ?? 0) : (parseTime(time) ?? 0);
          legs[code].runners.push(createRankingEntry(runner, category.name, splitTime));
          legs[code].categories[category.name] = true;
          lastSplit = split;
        }
      
        lastControl = control;
        lastTime = time;
      });
    });
  });
  
  // convert legs hash into array
  const result: any[] = [];
  Object.keys(legs).forEach((code) => {
    const leg = legs[code];
    leg.runners.sort((s1: any, s2: any) => {
      return (parseTime(s1.split) ?? 0) - (parseTime(s2.split) ?? 0);
    });
    leg.categories = Object.keys(leg.categories);
    leg.errorFrequency = 0;
    if (leg.runners.length > 0) {
      result.push(leg);
    }
  });
  result.sort(legSort);
  
  const runners: any = {};
  categories.forEach((c) => {
    const runnersFormatted = c.runners.map(r => ({
      ...r,
      id: String(r.id),
      category: c.name,
      startTime: r.starttime || '',
      yearOfBirth: r.yearOfBirth?.toString(),
      splits: r.splits || []
    }));
    const categoryParsed = ranking.parseRanking(runnersFormatted);
    categoryParsed.runners.forEach((runner: any) => {
      runners[runner.id] = runner;
    });
  });
  
  result.forEach((leg) => {
    let timeLosses = 0;
    const fastest = leg.runners.length > 0 ? (parseTime(leg.runners[0].split) ?? 0) : 0;
    
    leg.runners.forEach((runner: any, idx: number) => {
      const r = runners[runner.id];
      const s = r.splits.find((split: any) => leg.id === split.leg);
      if (s && s.timeLoss) {
        timeLosses += 1;
        runner.timeLoss = s.timeLoss;
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
      if (leg.errorFrequency === 100) {
        console.log("leg " + leg.id + " has high error frequency: " + leg.errorFrequency + "%", timeLosses, leg.runners.length); 
      }
    }
  });
      
  result.sort((l1, l2) => {
    return l2.errorFrequency - l1.errorFrequency;
  });
  
  return result.map((leg) => {
    return {
      id: leg.id,
      from: leg.from,
      to: leg.to,
      categories: leg.categories,
      runners: leg.runners.length,
      errorFrequency: leg.errorFrequency
    };
  });
}

function isValid(value: string): boolean {
  return value !== '-' && value !== 's' && parseTime(value) !== null;
}

function legOrdinal(id: string): number {
  const split = id.split('-');
  return controlOrdinal(split[0]) * 1000 + controlOrdinal(split[1]);
} 

function controlOrdinal(id: string): number {
  if (id === 'St') {
    return -1000;
  } else if (id === 'Zi') {
    return 1000;
  } else {
    return parseInt(id, 10);
  }
}

function legSort(l1: any, l2: any): number {
  return legOrdinal(l1.id) - legOrdinal(l2.id);
}
