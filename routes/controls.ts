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
import { formatTime, parseTime, ranking } from '@rasifix/orienteering-utils';
import { EventLoader, Category } from '../types/index.ts';

export default function(loader: EventLoader) {
  return (req: Request, res: Response) => {
    const id = req.params.id;
    loader(id, (event) => {
      const legs = defineControls(event.categories);
      res.json(legs);
    }, (error) => {
      res.status(error.statusCode);
      res.json(error);
    });
  };
}

function defineControls(categories: Category[]) {
  const legs: any = {};
  const all: any = {};

  categories.filter((cat) => cat.runners.length > 0).forEach((cat) => {
    const runnersFormatted = cat.runners.map(r => ({
      ...r,
      id: String(r.id),
      category: cat.name,
      startTime: r.starttime || '',
      yearOfBirth: r.yearOfBirth?.toString(),
      splits: r.splits || []
    }));
    const categoryParsed = ranking.parseRanking(runnersFormatted);
    
    categoryParsed.runners[0].splits.forEach((split: any, idx: number) => {
      if (idx === 0) {
        legs['St-' + split.code] = { source: 'St', target: split.code };
      } else if (idx <= categoryParsed.runners[0].splits.length - 1) {
        const prev = categoryParsed.runners[0].splits[idx - 1];
        legs[prev.code + '-' + split.code] = { source: prev.code, target: split.code };
      }         
    });
    
    categoryParsed.runners.forEach((runner: any) => {
      runner.splits.forEach((split: any, idx: number) => {
        if (!all[split.code]) {
          all[split.code] = { 
            code: split.code,
            categories: {}
          };
        }
                  
        // prepare the value
        const control = all[split.code];
        
        if (!control.categories[cat.name]) {
          control.categories[cat.name] = {
            name: cat.name,
            from: idx === 0 ? 'St' : runner.splits[idx - 1].code,
            to: runner.splits[idx].code,
            runners: []
          };
        }
        
        const catObj = control.categories[cat.name];
        
        if (idx === 0 && parseTime(split.time)) {  
          catObj.runners.push({
            fullName: runner.fullName,
            splitTime: split.time,
            timeLoss: split.timeLoss
          });
        } else if (idx > 0 && parseTime(split.time) && parseTime(runner.splits[idx - 1].time)) {
          catObj.runners.push({
            fullName: runner.fullName,
            splitTime: formatTime((parseTime(split.time) ?? 0) - (parseTime(runner.splits[idx - 1].time) ?? 0)),
            timeLoss: split.timeLoss
          });
        }
      });
    });      
  });
  
  const result: any[] = [];
  Object.keys(all).forEach((code) => {
    const control = all[code];
    control.categories = Object.keys(control.categories).map((name) => {
      return control.categories[name];
    });
    let errors = 0;
    let total = 0;
    control.categories.forEach((category: any) => {
      category.runners.sort((r1: any, r2: any) => {
        return (parseTime(r1.splitTime) ?? 0) - (parseTime(r2.splitTime) ?? 0);
      });
      total += category.runners.length;
      category.runners.forEach((runner: any) => {
        if (runner.timeLoss) {
          errors += 1;
        }
      });
    });
    control.runners = control.categories.map((category: any) => category.runners.length).reduce((r1: number, r2: number) => r1 + r2);
    control.errorFrequency = Math.round(errors / total * 100);
    control.cats = control.categories.map((cat: any) => cat.name).join(',');
    result.push(control);
  });
  result.sort((c1, c2) => {
    return c2.errorFrequency - c1.errorFrequency;
  });
  
  return result.map((control) => {
    return {
      code: control.code,
      errorFrequency: control.errorFrequency,
      categories: control.categories.map((category: any) => category.name),
      runners: control.categories.reduce((acc: number, current: any) => acc + current.runners.length, 0)
    };
  });
}
