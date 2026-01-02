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
import { parseTime } from '../services/time.ts';
import { EventLoader } from '../types/index.ts';
import categories from './categories.ts';

interface Category {
  name: string;
  runners: DataPoint[];
}

interface DataPoint {
  id: string;
  startTime: string;
  time: string;
  rank: number;
  fullName: string;
}

export default function(loader: EventLoader) {
  return (req: Request, res: Response) => {
    const id = req.params.id;
  
    loader(id, (event) => {      
      const result: Category[] = [];

      event.categories.forEach((category) => {
        const cat: Category = { name: category.name, runners: [] };
        result.push(cat);

        let last: number | null = null;
        let pos = 1;
        const filtered = category.runners.filter((runner) => parseTime(runner.time) !== null);
        filtered.forEach((runner, idx) => {
          if (last != null) {
            if ((parseTime(runner.time) ?? 0) > last) {
              pos = idx + 1;
            }
          }
          const point = {
            id: runner.id,
            startTime: runner.starttime!,
            time: runner.time!,
            rank: pos,
            fullName: runner.fullName,
            sex: runner.sex,
            category: category.name
          };
          cat.runners.push(point);
          last = parseTime(runner.time);
        });
      });
    
      res.json({ categories: result });
    }, (error) => {
      res.status(error.statusCode);
      res.json(error);
    });
  };
}
