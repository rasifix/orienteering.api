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
import { Split } from '@rasifix/orienteering-utils/lib/model/split';
import runners from './runners.ts';

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

interface Control {
  code: string;
  runners: number;
  errors: number;
  categories: {[name: string]: { name: string; runners: number }};
  from: { [code: string]: RelatedControl };
  to: { [code: string]: RelatedControl };
}

interface RelatedControl {
  code: string;
  from?: string;
  to?: string;
  categories: string[];
  runners: number;
  errors: number;
}

function defineControl(categories: Category[], id: string) {
  const control: Control = { 
    code: id,
    runners: 0,
    errors: 0,
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
    splits.forEach((split: Split, idx: number) => {  
      if (split.code !== id) {
        return;
      }
      
      const prevId = idx === 0 ? 'St' : splits[idx - 1].code;
      let prev = control.from[prevId];
      if (!prev) {
        prev = control.from[prevId] = { 
          code: prevId, 
          categories: [],
          runners: 0,
          errors: 0
        };
      }
      prev.categories.push(cat.name);
      prev.runners += categoryParsed.runners.length;
      prev.errors += categoryParsed.runners.map((runner) => { 
        return runner.splits[idx];
      }).filter((split) => split.timeLoss).length;

      const nextId = idx + 1 < splits.length ? splits[idx + 1].code : 'Zi';
      let next = control.to[nextId];
      if (!next) {
        next = control.to[nextId] = {
          code: nextId,
          from: id,
          to: nextId,
          categories: [],
          runners: 0,
          errors: 0
        };
      }
      next.categories.push(cat.name);
      next.runners += categoryParsed.runners.length;
      next.errors += categoryParsed.runners.map((runner) => { 
        return runner.splits[idx];
      }).filter((split) => split.timeLoss).length;
    });    
  });
    
  return {
    code: control.code,
    categories: Object.keys(control.categories).map((name) => control.categories[name]),
    from: Object.values(control.from).map((from) => ({
      code: from.code,
      leg: from.code + "-" + control.code,
      from: from.code,
      to: control.code,
      categories: from.categories.sort((c1, c2) => c1.localeCompare(c2)),
      errorFrequency: Math.round(100 * from.errors / from.runners),
      runners: from.runners
    })),
    to: Object.values(control.to).map((to) => ({
      code: to.code,
      leg: control.code + "-" + to.code,
      from: control.code,
      to: to.code,
      categories: to.categories.sort((c1, c2) => c1.localeCompare(c2)),
      errorFrequency: Math.round(100 * to.errors / to.runners),
      runners: to.runners
    }))
  };
}
