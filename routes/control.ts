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
import { ranking } from '@rasifix/orienteering-utils';
import { EventLoader, Category } from '../types/index.ts';

export default function(loader: EventLoader) {
  return (req: Request, res: Response) => {  
    const id = req.params.id;
    const controlId = req.params.controlId;
    loader(id, (event) => {
      const control = defineControl(event.categories, controlId);
    
      if (!control) {
        res.status(404);
        res.json({ message: 'control ' + controlId + ' does not exist!' });
      } else {
        res.json(control);
      }
    }, (error) => {
      res.status(error.statusCode);
      res.json(error);
    });
  };
}

function defineControl(categories: Category[], id: string) {
  const legs: any = {};
  const all: any = {};
  
  const control: any = { 
    code: id,
    categories: {},
    from: {},
    to: {}
  };
  
  categories.filter((cat) => cat.runners.length > 0)
            .filter((cat) => cat.runners[0].splits!.find((split) => split.code === id))
            .forEach((cat) => {
    
    const runnersFormatted = cat.runners.map(r => ({
      ...r,
      id: String(r.id),
      category: cat.name,
      startTime: r.starttime || '',
      yearOfBirth: r.yearOfBirth?.toString(),
      splits: r.splits || []
    }));
    const categoryParsed = ranking.parseRanking(runnersFormatted);
    
    control.categories[cat.name] = { 
      name: cat.name,
      runners: categoryParsed.runners.length
    };
    
    const splits = cat.runners[0].splits!;
    splits.forEach((split: any, idx: number) => {
      if (split.code !== id) {
        return;
      }
      
      const prevId = idx === 0 ? 'St' : splits[idx - 1].code;
      let prev = control.from[prevId];
      if (!prev) {
        prev = control.from[prevId] = { 
          code: prevId, 
          leg: prevId + '-' + id,
          categories: [],
          runners: 0,
          errors: 0
        };
      }
      prev.categories.push(cat.name);
      prev.runners += categoryParsed.runners.length;
      prev.errors += categoryParsed.runners.map((runner: any) => { 
        return runner.splits[idx];
      }).filter((split: any) => split.timeLoss).reduce((prev: number, current: any) => {
        return prev + 1;
      }, 0);

      const nextId = idx + 1 < splits.length ? splits[idx + 1].code : 'Zi';
      let next = control.to[nextId];
      if (!next) {
        next = control.to[nextId] = {
          code: nextId,
          leg: id + '-' + nextId,
          categories: [],
          runners: 0,
          errors: 0
        };
      }
      next.categories.push(cat.name);
      next.runners += categoryParsed.runners.length;
      next.errors += categoryParsed.runners.map((runner: any) => { 
        return runner.splits[idx];
      }).filter((split: any) => split.timeLoss).reduce((prev: number, current: any) => {
        return prev + 1;
      }, 0);
      
    });    
  });
    
  control.categories = Object.keys(control.categories).map((name) => control.categories[name]);
  
  control.from = Object.keys(control.from).map((code) => control.from[code]);
  control.from.forEach((from: any) => {
    from.categories = from.categories.sort((c1: string, c2: string) => c1.localeCompare(c2)).join(',');
    from.errorFrequency = Math.round(100 * from.errors / from.runners);
  });
  
  control.to = Object.keys(control.to).map((code) => control.to[code]);
  control.to.forEach((to: any) => {
    to.categories = to.categories.sort((c1: string, c2: string) => c1.localeCompare(c2)).join(',');
    to.errorFrequency = Math.round(100 * to.errors / to.runners);
  });
  
  return control;
}
