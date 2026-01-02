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
import { Category, EventLoader, Runner } from '../types/index.ts';

interface Control {
  code: string;
  errorFrequency: number;
  categories: { [name: string]: ControlCategory };
  runners: { [id: string]: Runner }[];
}

interface ControlCategory {
  name: string;
  runners: ControlRunner[];
  from: string;
  to: string;
}

interface ControlRunner {
  fullName: string;
  splitTime: string;
  timeLoss?: string;
}

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
  const legs: { [key: string]: { source: string; target: string } } = {};
  const all: {[code: string]: Control} = {};

  categories.filter((cat) => cat.runners.length > 0).forEach((cat) => {
    const runnersFormatted = cat.runners.map(r => ({
      ...r,
      id: String(r.id),
      category: cat.name,
      startTime: r.startTime || '',
      yearOfBirth: r.yearOfBirth?.toString(),
      splits: r.splits || []
    }));
    const categoryParsed = ranking.parseRanking(runnersFormatted);
    
    categoryParsed.runners[0].splits.forEach((split, idx: number) => {
      if (idx === 0) {
        legs['St-' + split.code] = { source: 'St', target: split.code };
      } else if (idx <= categoryParsed.runners[0].splits.length - 1) {
        const prev = categoryParsed.runners[0].splits[idx - 1];
        legs[prev.code + '-' + split.code] = { source: prev.code, target: split.code };
      }         
    });
    
    categoryParsed.runners.forEach((runner) => {
      runner.splits.forEach((split, idx) => {
        if (!all[split.code]) {
          all[split.code] = { 
            code: split.code,
            categories: {},
            errorFrequency: 0,
            runners: []
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
        
        if (idx === 0 && split.time) {  
          catObj.runners.push({
            fullName: runner.fullName,
            splitTime: formatTime(split.time),
            timeLoss: split.timeLoss ? formatTime(split.timeLoss) : undefined
          });
        } else if (idx > 0 && split.time && runner.splits[idx - 1].time) {
          catObj.runners.push({
            fullName: runner.fullName,
            splitTime: formatTime((split.time ?? 0) - (runner.splits[idx - 1].time ?? 0)),
            timeLoss: split.timeLoss ? formatTime(split.timeLoss) : undefined
          });
        }
      });
    });      
  });
  
  const result: Control[] = [];
  Object.keys(all).forEach((code) => {
    const control = all[code];
    let errors = 0;
    let total = 0;
    const cats = Object.values(control.categories);
    cats.forEach((category) => {
      category.runners.sort((r1, r2) => {
        return (parseTime(r1.splitTime) ?? 0) - (parseTime(r2.splitTime) ?? 0);
      });
      total += category.runners.length;
      category.runners.forEach((runner) => {
        if (runner.timeLoss) {
          errors += 1;
        }
      });
    });
    control.errorFrequency = Math.round(errors / total * 100);
    result.push(control);
  });
  result.sort((c1, c2) => {
    return c2.errorFrequency - c1.errorFrequency;
  });
  return result.map((control) => {
    return {
      code: control.code,
      errorFrequency: control.errorFrequency,
      categories: Object.values(control.categories).map((category) => category.name),
      runners: Object.values(control.categories).reduce((acc, current) => acc + current.runners.length, 0)
    };
  });
}
