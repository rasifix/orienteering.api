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
import { ranking, formatTime, parseTime } from '@rasifix/orienteering-utils';
import { Category, Runner } from '../types/index.ts';
import { Split } from '@rasifix/orienteering-utils/lib/model/split';

// Shared helper to format runners for ranking calculation
function formatRunnersForRanking(runners: Runner[], categoryName: string) {
  return runners.map(r => ({
    ...r,
    id: String(r.id),
    category: categoryName,
    startTime: r.startTime || '',
    yearOfBirth: r.yearOfBirth?.toString(),
    splits: r.splits || []
  }));
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

interface ControlList {
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

export default function defineControl(categories: Category[], id: string) {
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
    
    const runnersFormatted = formatRunnersForRanking(cat.runners, cat.name);
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


export function defineControls(categories: Category[]) {
  const legs: { [key: string]: { source: string; target: string } } = {};
  const all: {[code: string]: ControlList} = {};

  categories.filter((cat) => cat.runners.length > 0).forEach((cat) => {
    const runnersFormatted = formatRunnersForRanking(cat.runners, cat.name);
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
  
  const result: ControlList[] = [];
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